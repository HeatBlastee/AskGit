import { NextResponse } from "next/server";
import  prisma  from "@/lib/prisma"; // adjust path to your prisma instance

// POST /api/meetings
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { projectId, meetingUrl, name } = body;

        if (!projectId || !meetingUrl || !name) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }
        const meeting = await prisma.meeting.create({
            data: {
                projectId,
                meetingUrl: meetingUrl.url,
                name,
                status: "PROCESSING",
            },
        });

        return NextResponse.json(meeting, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}



// GET /api/meetings?projectId=123
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get("projectId");

        if (!projectId) {
            return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
        }

        const meetings = await prisma.meeting.findMany({
            where: { projectId },
            include: { issues: true },
        });

        return NextResponse.json(meetings);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
