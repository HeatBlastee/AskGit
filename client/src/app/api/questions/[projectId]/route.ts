
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type Params = {
    params: { projectId: string }
}

export async function GET(req: NextRequest, { params }: Params) {
    try {
        const { projectId } = await params;

        if (!projectId) {
            return NextResponse.json(
                { error: "Project ID is required" },
                { status: 400 }
            );
        }

        const questions = await prisma.question.findMany({
            where: { projectId },
            orderBy: { createdAt: "desc" }, // latest first
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        return NextResponse.json(questions, { status: 200 });
    } catch (error) {
        console.error("Error fetching questions:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
