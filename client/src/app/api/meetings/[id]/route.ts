import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";


// DELETE /api/meetings/:id
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = await params;
        const deleted = await prisma.meeting.delete({
            where: { id },
        });
        return NextResponse.json(deleted);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


// GET /api/meetings/:id
export async function GET(_req: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = await params;
        const meeting = await prisma.meeting.findUnique({
            where: { id },
            include: { issues: true },
        });

        if (!meeting) {
            return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
        }

        return NextResponse.json(meeting);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}