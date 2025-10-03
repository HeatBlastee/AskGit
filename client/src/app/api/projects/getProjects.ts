// app/api/projects/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function getProjects(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        const projects = await prisma.project.findMany({
            where: {
                userToProjects: {
                    some: {
                        userId: userId, 
                    },
                },
            },
            include: {
                userToProjects: {
                    include: { user: true }, 
                },
            },
        });

        return NextResponse.json(projects, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { error: error || "Failed to fetch projects" },
            { status: 500 }
        );
    }
}
