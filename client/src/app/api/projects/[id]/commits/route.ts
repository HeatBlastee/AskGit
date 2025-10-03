import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; 
import { pollCommits } from "@/lib/github";
export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await params;
        await pollCommits(id);

        const commits = await prisma.commit.findMany({
            where: {
                projectId: id,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(commits);
    } catch (error) {
        console.error("Error fetching commits:", error);
        return NextResponse.json(
            { error: "Failed to fetch commits" },
            { status: 500 }
        );
    }
}
