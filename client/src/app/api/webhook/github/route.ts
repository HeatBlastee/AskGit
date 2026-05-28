import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { after } from "next/server";
import prisma from "@/lib/prisma";
import { processPrReview } from "@/lib/review";

export async function POST(req: NextRequest) {
    try {
        // --- STEP 1: SECURITY VERIFICATION ---
        // GitHub sends a cryptographic hash (HMAC) of the payload using our secret.
        // We calculate the hash ourselves and compare it. If they don't match, 
        // the request is rejected. This prevents bad actors from spoofing GitHub.
        console.log("[Webhook] Received request. Verifying signature...");
        const signature = req.headers.get("x-hub-signature-256");
        if (!signature) {
            return NextResponse.json({ error: "Missing signature" }, { status: 401 });
        }

        const rawBody = await req.text();
        const secret = process.env.GITHUB_WEBHOOK_SECRET;

        if (!secret) {
            console.error("GITHUB_WEBHOOK_SECRET is not configured");
            return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
        }

        const hmac = crypto.createHmac("sha256", secret);
        const digest = "sha256=" + hmac.update(rawBody).digest("hex");

        if (signature !== digest) {
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }

        // 2. Parse payload
        const payload = JSON.parse(rawBody);
        console.log(`[Webhook] Signature verified. Event: ${req.headers.get("x-github-event")}, Action: ${payload.action}`);

        // We only care about PR opened or synchronize
        const event = req.headers.get("x-github-event");
        if (event !== "pull_request") {
            return NextResponse.json({ message: "Ignored event" }, { status: 200 });
        }

        if (payload.action !== "opened" && payload.action !== "synchronize") {
            return NextResponse.json({ message: "Ignored action" }, { status: 200 });
        }

        const prNumber = payload.pull_request.number;
        const repoFullName = payload.repository.full_name;
        const headSha = payload.pull_request.head.sha;
        const installationId = payload.installation?.id;

        if (!installationId) {
            return NextResponse.json({ error: "No installation ID" }, { status: 400 });
        }

        // 3. Deduplication check
        // GitHub might retry webhooks. We check if we already processed this SHA for this PR.
        const existingReview = await prisma.prReview.findUnique({
            where: {
                repo_prNumber_headSha: {
                    repo: repoFullName,
                    prNumber,
                    headSha,
                },
            },
        });

        if (existingReview) {
            console.log(`[Webhook] Skipped: Already reviewed PR ${prNumber} at SHA ${headSha}`);
            return NextResponse.json({ message: "Already reviewed" }, { status: 200 });
        }

        console.log(`[Webhook] Marking PR ${prNumber} (SHA ${headSha}) as processing in database...`);
        // Mark as being processed
        await prisma.prReview.create({
            data: {
                repo: repoFullName,
                prNumber,
                headSha,
            },
        });

        // --- STEP 4: ASYNCHRONOUS PROCESSING ---
        // GitHub expects a 2xx response within 10 seconds or it marks the webhook as "timed out".
        // AI PR reviews take 30-60 seconds. To solve this, we use Next.js `after()`.
        // `after()` runs the code block in the background *after* the HTTP 200 response is sent back to GitHub!
        after(async () => {
            console.log(`[Background] Started PR review task for ${repoFullName}#${prNumber}`);
            try {
                await processPrReview({
                    repoFullName,
                    prNumber,
                    headSha,
                    installationId,
                    title: payload.pull_request.title,
                    description: payload.pull_request.body || "",
                });
            } catch (error) {
                console.error("Error in background PR review:", error);
            }
        });

        return NextResponse.json({ message: "Review started" }, { status: 200 });
    } catch (error) {
        console.error("Webhook processing error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
