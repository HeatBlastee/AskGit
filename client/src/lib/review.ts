import { Octokit } from "octokit";
import { createAppAuth } from "@octokit/auth-app";
import OpenAI from "openai";
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

    // --- STEP 1: AUTHENTICATE WITH GITHUB ---
    // Instead of using a static Personal Access Token, we authenticate as a GitHub App.
    // We sign a JWT using our Private Key + App ID, then request an "Installation Token"
    // specific to the repository the PR belongs to. This token is temporary and very secure.
    const octokit = new Octokit({
        authStrategy: createAppAuth,
        auth: {
            appId: process.env.GITHUB_APP_ID!,
            privateKey: process.env.GITHUB_PRIVATE_KEY!.replace(/\\n/g, "\n"),
            installationId,
        },
    });

    // --- STEP 2: FETCH PR DIFF ---
    // We ask GitHub for the raw diff of the PR to see exactly what lines changed.
    console.log(`[Review Pipeline] Fetching PR diff for ${repoFullName}#${prNumber}...`);
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
        console.log(`[Review Pipeline] No reviewable files in diff for ${repoFullName}#${prNumber}.`);
        return;
    }
    console.log(`[Review Pipeline] Diff parsed successfully. Found ${filteredFiles.length} reviewable files.`);

    // 2. Fetch STANDARDS.md
    let standardsContext = "";
    try {
        console.log(`[Review Pipeline] Checking for STANDARDS.md in ${repoFullName}...`);
        const standardsResponse = await octokit.rest.repos.getContent({
            owner,
            repo,
            path: "STANDARDS.md",
        });

        if ("content" in standardsResponse.data) {
            standardsContext = Buffer.from(standardsResponse.data.content, "base64").toString("utf-8");
            console.log(`[Review Pipeline] Successfully loaded STANDARDS.md (${standardsContext.length} bytes).`);
        }
    } catch (error) {
        console.log(`[Review Pipeline] No STANDARDS.md found in ${repoFullName}. Skipping standards check.`);
        // Ignored if STANDARDS.md doesn't exist
    }

    // 3. Prepare AI Prompt
    console.log(`[Review Pipeline] Preparing AI prompt and calling Gemini for ${repoFullName}#${prNumber}...`);
    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error("GITHUB_TOKEN is missing. Required for GitHub Models.");

    const client = new OpenAI({
        baseURL: process.env.GITHUB_MODELS_ENDPOINT || "https://models.inference.ai.azure.com",
        apiKey: token,
    });

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

    // 4. Call GitHub Models via OpenAI SDK
    console.log(`[Review Pipeline] Sending prompt to GitHub Models (o4-mini)...`);
    const result = await client.chat.completions.create({
        model: "o4-mini",
        messages: [
            { role: "system", content: "You are a helpful and expert AI code reviewer." },
            { role: "user", content: prompt }
        ],
        temperature: 0.1,
    });
    
    let rawText = result.choices[0]?.message?.content || "";
    console.log(`[Review Pipeline] Received response from Gemini. Parsing JSON...`);
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
        console.error(`[Review Pipeline] Failed to parse Gemini output for ${repoFullName}#${prNumber}:`, rawText);
        return;
    }
    
    console.log(`[Review Pipeline] JSON parsed successfully. Review summary: "${reviewData.summary.substring(0, 50)}..."`);
    console.log(`[Review Pipeline] Found ${reviewData.comments?.length || 0} potential inline comments. Validating against diff...`);

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

    // --- STEP 6: POST REVIEW TO GITHUB ---
    // Finally, we take the generated markdown summary and the parsed inline comments
    // and submit them back to the PR using GitHub's Review API.
    console.log(`[Review Pipeline] Posting review to GitHub with ${validComments.length} inline comments...`);
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
        console.log(`[Review Pipeline] ✅ Successfully posted review to ${repoFullName}#${prNumber}`);
    } catch (error) {
        console.error(`[Review Pipeline] ❌ Failed to post GitHub review for ${repoFullName}#${prNumber}:`, error);
    }
}
