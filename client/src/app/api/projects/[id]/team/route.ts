import { NextResponse } from "next/server";
import  prisma  from "@/lib/prisma";

// GET /api/projects/:id/team
export async function GET(_req: Request, { params }: { params: { id: string } }) {
    try {
        const members = await prisma.userToProject.findMany({
            where: { projectId: params.id },
            include: { user: true },
        });

        return NextResponse.json(members);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
