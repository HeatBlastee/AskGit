import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
    const token = req.cookies.get("session")?.value;

    const protectedPaths = ["/"];
    if (!protectedPaths.some((p) => req.nextUrl.pathname.startsWith(p))) {
        return NextResponse.next();
    }

    if (!token) {
        return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/"],
};
