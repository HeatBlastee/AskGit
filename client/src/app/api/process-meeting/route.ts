
import { processMeeting } from "@/lib/assemblyAi";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";



export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const { meetingUrl, projectId, meetingId } = body;
        const { summaries } = await processMeeting(meetingUrl.url);

        await prisma.issue.createMany({
            data: summaries.map(summary => ({
                start: summary.start,
                end: summary.end,
                gist: summary.gist,
                headline: summary.headline,
                summary: summary.summary,
                meetingId,
            })),
        });

        await prisma.meeting.update({
            where: {
                id: meetingId,
            },
            data: {
                status: 'COMPLETED',
                name: summaries[0] ? summaries[0].headline : 'Default',
            },
        });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}