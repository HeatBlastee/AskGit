// app/api/questions/save/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";


export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const { question, answer, filesRefrences, userId, projectId } = body;


        if (!question || !answer || !userId || !projectId) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const savedQuestion = await prisma.question.create({
            data: {
                question,
                answer,
                filesRefrences: filesRefrences ?? undefined,
                userId,
                projectId,
            },
        });

        return NextResponse.json(savedQuestion, { status: 201 });
    } catch (error) {
        console.error("Error saving answer:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
