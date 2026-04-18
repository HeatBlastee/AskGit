import { NextResponse } from "next/server";
import  prisma  from "@/lib/prisma";

// GET /api/projects/:id/team
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const members = await prisma.userToProject.findMany({
            where: { projectId: id },
            include: { user: true },
        });

        return NextResponse.json(members);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
