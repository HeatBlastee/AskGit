import { Octokit } from "octokit";
import { createAppAuth } from "@octokit/auth-app";
import { GoogleGenerativeAI } from "@google/generative-ai";
import parseDiff from "parse-diff";

interface ReviewPayload {
    repoFullName: string;
    prNumber: number;
    headSha: string;
    installationId: number;
    title: string;
    description: string;
}

export async function processPrReview({ repoFullName, prNumber, headSha, installationId, title, description }: ReviewPayload) {
    const [owner, repo] = repoFullName.split("/");

    const octokit = new Octokit({
        authStrategy: createAppAuth,
        auth: {
            appId: process.env.GITHUB_APP_ID!,
            privateKey: process.env.GITHUB_PRIVATE_KEY!.replace(/\\n/g, "\n"),
            installationId,
        },
    });

    // 1. Fetch PR diff
    const diffResponse = await octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: prNumber,
        mediaType: {
            format: "diff",
        },
    });

    const diffContent = diffResponse.data as unknown as string;
    if (!diffContent || typeof diffContent !== "string") {
        console.log("No diff content found");
        return;
    }

    // Parse the diff
    const files = parseDiff(diffContent);
    const blocklist = [".png", ".jpg", ".jpeg", ".pdf", "package-lock.json", "yarn.lock", "pnpm-lock.yaml", ".min.js"];
    const filteredFiles = files.filter(file => {
        const name = file.to || file.from;
        if (!name) return false;
        if (name.includes("dist/") || name.includes("build/")) return false;
        if (blocklist.some(ext => name.endsWith(ext))) return false;
        return true;
    });

    if (filteredFiles.length === 0) {
        console.log("No reviewable files in diff.");
        return;
    }

    // 2. Fetch STANDARDS.md
    let standardsContext = "";
    try {
        const standardsResponse = await octokit.rest.repos.getContent({
            owner,
            repo,
            path: "STANDARDS.md",
        });

        if ("content" in standardsResponse.data) {
            standardsContext = Buffer.from(standardsResponse.data.content, "base64").toString("utf-8");
        }
    } catch (error) {
        // Ignored if STANDARDS.md doesn't exist
    }

    // 3. Prepare AI Prompt
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is missing");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Build diff text for AI
    let diffText = "";
    filteredFiles.forEach(file => {
        diffText += `\n--- File: ${file.to || file.from} ---\n`;
        file.chunks.forEach(chunk => {
            diffText += `\nChunk: ${chunk.content}\n`;
            chunk.changes.forEach(change => {
                if (change.type === "add") {
                    diffText += `+ ${change.ln}: ${change.content}\n`;
                } else if (change.type === "del") {
                    diffText += `- ${change.ln}: ${change.content}\n`;
                } else {
                    diffText += `  ${change.ln2}: ${change.content}\n`;
                }
            });
        });
    });

    // Truncate if too large to fit in basic reasonable limit (just safety)
    if (diffText.length > 500000) {
        diffText = diffText.substring(0, 500000) + "\n... [DIFF TRUNCATED]";
    }

    const prompt = `You are a best-in-class AI PR reviewer.
Review the following Pull Request diff across 5 dimensions: Security, Performance, Tests, Code Quality, Logic.

PR Title: ${title}
PR Description: ${description}

${standardsContext ? `TEAM STANDARDS:\nThe following rules must be enforced:\n${standardsContext}\n` : ""}

DIFF:
${diffText}

Return your response strictly in the following JSON format without Markdown formatting:
{
  "summary": "A high-level summary of the PR...",
  "dimensions": {
    "Security": { "score": 10, "findings": 0 },
    "Performance": { "score": 9, "findings": 0 },
    "Tests": { "score": 5, "findings": 2 },
    "Code Quality": { "score": 8, "findings": 1 },
    "Logic": { "score": 9, "findings": 0 }
  },
  "comments": [
    {
      "path": "file/path/here.js",
      "line": 42,
      "body": "What it is: ...\\n\\nWhy it matters: ...\\n\\nBefore/After code:\\n\`\`\`javascript\\n// Before\\n...\\n// After\\n...\\n\`\`\`",
      "severity": "Critical"
    }
  ]
}

Only return "Critical" or "High" severity issues as line comments. Medium/Low can be omitted or added to the summary.
Be extremely specific, reference exact lines, and follow the Team Standards strictly if provided. Ensure paths and line numbers exactly match the "to" file paths and added/modified line numbers in the diff.
`;

    // 4. Call Gemini
    const result = await model.generateContent(prompt);
    let rawText = result.response.text();
    // Clean up potential markdown formatting around JSON
    if (rawText.startsWith("\`\`\`json")) {
        rawText = rawText.replace(/^\`\`\`json/, "").replace(/\`\`\`$/, "").trim();
    } else if (rawText.startsWith("\`\`\`")) {
        rawText = rawText.replace(/^\`\`\`/, "").replace(/\`\`\`$/, "").trim();
    }

    let reviewData;
    try {
        reviewData = JSON.parse(rawText);
    } catch (e) {
        console.error("Failed to parse Gemini output", rawText);
        return;
    }

    // 5. Construct Review Output
    const summaryMarkdown = `## 🔍 AskGit Review

**Summary:** ${reviewData.summary}

| Dimension   | Score | Findings |
|-------------|-------|----------|
| Security    | ${reviewData.dimensions.Security?.score ?? "N/A"}/10 | ${reviewData.dimensions.Security?.findings ?? 0} issues |
| Performance | ${reviewData.dimensions.Performance?.score ?? "N/A"}/10 | ${reviewData.dimensions.Performance?.findings ?? 0} issues |
| Tests       | ${reviewData.dimensions.Tests?.score ?? "N/A"}/10 | ${reviewData.dimensions.Tests?.findings ?? 0} gaps   |
| Code Quality| ${reviewData.dimensions["Code Quality"]?.score ?? "N/A"}/10 | ${reviewData.dimensions["Code Quality"]?.findings ?? 0} issues |
| Logic       | ${reviewData.dimensions.Logic?.score ?? "N/A"}/10 | ${reviewData.dimensions.Logic?.findings ?? 0} issues |

${reviewData.comments?.length > 0 ? "Inline comments below point to specific lines." : "No critical or high severity issues found."}`;

    // Filter valid comments (must be present in the diff and be "add" or "normal" lines)
    const validComments = [];
    if (Array.isArray(reviewData.comments)) {
        for (const comment of reviewData.comments) {
            // Find the file in the parsed diff
            const file = filteredFiles.find(f => (f.to === comment.path || f.from === comment.path));
            if (!file) continue;

            // Find if the line exists in the diff chunks
            let lineExists = false;
            for (const chunk of file.chunks) {
                for (const change of chunk.changes) {
                    if ((change.type === "add" && change.ln === comment.line) || (change.type === "normal" && change.ln2 === comment.line)) {
                        lineExists = true;
                        break;
                    }
                }
                if (lineExists) break;
            }

            if (lineExists) {
                validComments.push({
                    path: comment.path,
                    line: comment.line,
                    body: comment.body,
                });
            }
        }
    }

    // 6. Post Review to GitHub
    try {
        await octokit.rest.pulls.createReview({
            owner,
            repo,
            pull_number: prNumber,
            commit_id: headSha,
            body: summaryMarkdown,
            event: "COMMENT",
            comments: validComments,
        });
        console.log(`Successfully posted review to ${repoFullName}#${prNumber}`);
    } catch (error) {
        console.error("Failed to post GitHub review:", error);
    }
}
