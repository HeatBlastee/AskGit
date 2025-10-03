import { getSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { indexGithubRepo } from "@/lib/github-loader";
import { pollCommits } from "@/lib/github";
export async function createProject(req: NextRequest) {
    try {
        const { name, githubUrl,githubToken } = await req.json();
        if (!name || !githubUrl) {
            return NextResponse.json({ error: "Missing Fields" }, { status: 400 });
        }
        const session = await getSession();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        const project = await prisma.project.create({
            data: {
                name,
                githubUrl,
                userToProjects: {
                    create: {
                        userId,
                    },
                },
            },

            include: {
                userToProjects: {
                    include: { user: true },
                },
            },
        });
        await indexGithubRepo(project.id, githubUrl, githubToken);
        await pollCommits(project.id);
        return NextResponse.json(project, { status: 201 });
    } catch (error) {
        console.error("Error creating project:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

}