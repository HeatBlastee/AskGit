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

    // Helper function to estimate token count conservatively
    function estimateTokens(text: string): number {
        return Math.ceil(text.length / 2.5);
    }

    // 3. Prepare AI Prompt
    console.log(`[Review Pipeline] Preparing AI prompt and calling o4-mini for ${repoFullName}#${prNumber}...`);
    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error("GITHUB_TOKEN is missing. Required for GitHub Models.");

    const client = new OpenAI({
        baseURL: process.env.GITHUB_MODELS_ENDPOINT || "https://models.inference.ai.azure.com",
        apiKey: token,
    });

    const promptHeader = `You are a best-in-class AI PR reviewer.
Review the following Pull Request diff across 5 dimensions: Security, Performance, Tests, Code Quality, Logic.

PR Title: ${title}
PR Description: ${description}

${standardsContext ? `TEAM STANDARDS:\nThe following rules must be enforced:\n${standardsContext}\n` : ""}

DIFF:
`;

    const promptFooter = `

Return your response strictly in the following JSON format without Markdown formatting:
{
  "summary": "A high-level summary of the files in this batch...",
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

    const baseTokens = estimateTokens("You are a helpful and expert AI code reviewer." + promptHeader + promptFooter);
    const maxDiffTokens = Math.max(1000, 3000 - baseTokens); // Target safe total input tokens of 3000

    // Build diff text for each file
    const fileDiffs = filteredFiles.map(file => {
        let text = `\n--- File: ${file.to || file.from} ---\n`;
        file.chunks.forEach(chunk => {
            text += `\nChunk: ${chunk.content}\n`;
            chunk.changes.forEach(change => {
                if (change.type === "add") {
                    text += `+ ${change.ln}: ${change.content}\n`;
                } else if (change.type === "del") {
                    text += `- ${change.ln}: ${change.content}\n`;
                } else {
                    text += `  ${change.ln2}: ${change.content}\n`;
                }
            });
        });
        return {
            path: file.to || file.from || "unknown",
            text,
            tokens: estimateTokens(text),
        };
    });

    // Group files into batches
    const batches: (typeof fileDiffs)[] = [];
    let currentBatch: typeof fileDiffs = [];
    let currentBatchTokens = 0;

    for (const fileDiff of fileDiffs) {
        if (fileDiff.tokens > maxDiffTokens) {
            console.log(`[Review Pipeline] File ${fileDiff.path} diff is too large (${fileDiff.tokens} tokens). Truncating...`);
            const targetCharLimit = Math.floor(maxDiffTokens * 2.2);
            fileDiff.text = fileDiff.text.substring(0, targetCharLimit) + "\n... [FILE DIFF TRUNCATED]";
            fileDiff.tokens = estimateTokens(fileDiff.text);
        }

        if (currentBatch.length > 0 && currentBatchTokens + fileDiff.tokens > maxDiffTokens) {
            batches.push(currentBatch);
            currentBatch = [fileDiff];
            currentBatchTokens = fileDiff.tokens;
        } else {
            currentBatch.push(fileDiff);
            currentBatchTokens += fileDiff.tokens;
        }
    }
    if (currentBatch.length > 0) {
        batches.push(currentBatch);
    }

    console.log(`[Review Pipeline] Grouped files into ${batches.length} batches.`);

    interface RawComment {
        path: string;
        line: number;
        body: string;
        severity?: string;
    }

    const aggregatedComments: RawComment[] = [];
    const aggregatedDimensions: Record<string, { score: number; findings: number }> = {
        Security: { score: 10, findings: 0 },
        Performance: { score: 10, findings: 0 },
        Tests: { score: 10, findings: 0 },
        "Code Quality": { score: 10, findings: 0 },
        Logic: { score: 10, findings: 0 }
    };
    const batchSummaries: string[] = [];

    for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const batchDiffText = batch.map(f => f.text).join("\n");
        const prompt = `${promptHeader}${batchDiffText}${promptFooter}`;
        const totalEstimatedTokens = estimateTokens(prompt) + 10;

        console.log(`[Review Pipeline] Sending Batch ${i + 1}/${batches.length} to GitHub Models (o4-mini)... Estimated tokens: ${totalEstimatedTokens}`);

        try {
            const result = await client.chat.completions.create({
                model: "o4-mini",
                messages: [
                    { role: "system", content: "You are a helpful and expert AI code reviewer." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.1,
            });

            let rawText = result.choices[0]?.message?.content || "";
            console.log(`[Review Pipeline] Received response for Batch ${i + 1}. Parsing JSON...`);

            if (rawText.startsWith("```json")) {
                rawText = rawText.replace(/^```json/, "").replace(/```$/, "").trim();
            } else if (rawText.startsWith("```")) {
                rawText = rawText.replace(/^```/, "").replace(/```$/, "").trim();
            }

            const reviewData = JSON.parse(rawText);

            if (reviewData.summary) {
                batchSummaries.push(reviewData.summary);
            }

            if (Array.isArray(reviewData.comments)) {
                aggregatedComments.push(...reviewData.comments);
            }

            if (reviewData.dimensions) {
                for (const dim of ["Security", "Performance", "Tests", "Code Quality", "Logic"] as const) {
                    const batchDim = reviewData.dimensions[dim];
                    if (batchDim) {
                        const score = typeof batchDim.score === "number" ? batchDim.score : 10;
                        const findings = typeof batchDim.findings === "number" ? batchDim.findings : 0;
                        aggregatedDimensions[dim].score = Math.min(aggregatedDimensions[dim].score, score);
                        aggregatedDimensions[dim].findings += findings;
                    }
                }
            }
        } catch (e) {
            console.error(`[Review Pipeline] Error reviewing Batch ${i + 1}:`, e);
        }
    }

    if (batchSummaries.length === 0) {
        console.error(`[Review Pipeline] All review batches failed to return valid JSON results.`);
        return;
    }

    let finalSummary = "";
    if (batchSummaries.length === 1) {
        finalSummary = batchSummaries[0];
    } else {
        console.log(`[Review Pipeline] Generating final cohesive summary from ${batchSummaries.length} batch summaries...`);
        try {
            const summaryPrompt = `You are a best-in-class AI PR reviewer.
You have reviewed a PR in batches and generated the following summaries:
${batchSummaries.map((s, idx) => `Batch ${idx + 1}: ${s}`).join("\n")}

Write a single, cohesive, high-level summary (3-4 sentences) summarizing the overall PR review. Return only the summary text without any markdown or formatting.`;

            const summaryResult = await client.chat.completions.create({
                model: "o4-mini",
                messages: [
                    { role: "system", content: "You are a helpful assistant." },
                    { role: "user", content: summaryPrompt }
                ],
                temperature: 0.3,
            });
            finalSummary = summaryResult.choices[0]?.message?.content || batchSummaries.join("\n\n");
        } catch (err) {
            console.error(`[Review Pipeline] Failed to generate overall summary using AI, falling back to concatenation:`, err);
            finalSummary = batchSummaries.join("\n\n");
        }
    }

    console.log(`[Review Pipeline] Final summary generated. Found ${aggregatedComments.length} potential inline comments. Validating against diff...`);

    // 5. Construct Review Output
    const summaryMarkdown = `## 🔍 AskGit Review

**Summary:** ${finalSummary}

| Dimension   | Score | Findings |
|-------------|-------|----------|
| Security    | ${aggregatedDimensions.Security.score}/10 | ${aggregatedDimensions.Security.findings} issues |
| Performance | ${aggregatedDimensions.Performance.score}/10 | ${aggregatedDimensions.Performance.findings} issues |
| Tests       | ${aggregatedDimensions.Tests.score}/10 | ${aggregatedDimensions.Tests.findings} gaps   |
| Code Quality| ${aggregatedDimensions["Code Quality"].score}/10 | ${aggregatedDimensions["Code Quality"].findings} issues |
| Logic       | ${aggregatedDimensions.Logic.score}/10 | ${aggregatedDimensions.Logic.findings} issues |

${aggregatedComments.length > 0 ? "Inline comments below point to specific lines." : "No critical or high severity issues found."}`;

    // Filter valid comments (must be present in the diff and be "add" or "normal" lines)
    const validComments = [];
    if (Array.isArray(aggregatedComments)) {
        for (const comment of aggregatedComments) {
            if (!comment || !comment.path || typeof comment.line !== "number" || !comment.body) continue;

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
