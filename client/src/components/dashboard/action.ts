"use server"

import { streamText } from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateEmbedding } from "@/lib/gemini"
import prisma from "@/lib/prisma"

const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY!,
})

export async function askQuestion(question: string, projectId: string) {
    const queryVector = await generateEmbedding(question)
    const vectorQuery = `[${queryVector.join(",")}]`

    const result = await prisma.$queryRaw`
    SELECT "fileName", "sourceCode", "summary",
    1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) AS "similarity"
    FROM "SourceCodeEmbedding"
    WHERE 1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) > 0.5
    AND "projectId" = ${projectId}
    ORDER BY "similarity" DESC 
    LIMIT 10
  ` as {
        fileName: string
        sourceCode: string
        summary: string
        }[]

    let context = ""
    for (const doc of result) {
        context += `source: ${doc.fileName}\n code content: ${doc.sourceCode}\n summary of file: ${doc.summary}\n\n`
    }

    const { textStream } = await streamText({
        model: google("gemini-2.0-flash"),
        prompt: `
You are an AI code assistant who answers questions about the codebase. Your target audience is a technical intern who is new to the codebase.

AI assistant is a brand new, powerful, human-like artificial intelligence.
The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.
AI is always friendly, kind, and inspiring, and eager to provide vivid and thoughtful responses.

START CONTEXT BLOCK
${context}
END OF CONTEXT BLOCK

START QUESTION
${question}
END OF QUESTION

If the context does not provide the answer, reply with: "I'm sorry, but I don't know the answer to that question".
Never invent information outside the context.
Answer in markdown syntax, with inline code snippets if needed, but no fenced code blocks.
    `,
    })
    let output = "";
    for await (const delta of textStream) {
        output += delta;
    }

    return {
        output,
        filesRefrences: result,
    }
}
