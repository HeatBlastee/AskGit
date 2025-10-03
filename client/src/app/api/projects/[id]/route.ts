import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const GET = async (
    req: Request,
    { params }: { params: { id: string } }
) => {
    try {
        const session = await getSession();

        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const project = await prisma.project.findFirst({
            where: {
                id,
                userToProjects: {
                    some: {
                        userId: session.user.id, // check relation
                    },
                },
            },
            include: {
                userToProjects: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        return NextResponse.json(project, { status: 200 });
    } catch (error) {
        console.error("Error fetching project:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
};

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = await params;

        const deleted = await prisma.project.delete({
            where: { id },
        });
        return NextResponse.json(deleted);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
