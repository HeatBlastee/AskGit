import prisma from "./prisma";
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const hashPassword = async (text: string) => {
    const saltRounds = 10
    return bcrypt.hash(text, saltRounds);
}

export const verifyPassword = async (text: string, hashed: string) => {
    return bcrypt.compare(text, hashed);
}

export const createSessionForUser = async (userId: string, opts?: { expiresInDays?: number, userAgent?: string, ip?: string }) => {
    const token = crypto.randomBytes(48).toString('hex');
    const expiresInDays = opts?.expiresInDays ?? 7
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    const session = await prisma.session.create({
        data: {
            userId,
            token,
            expiresAt,
            userAgent: opts?.userAgent,
            ip: opts?.ip
        }
    })
    return session;
};

export const deleteSessionByToken = async (token: string) => {
    return prisma.session.deleteMany({ where: { token } });
};

export const getUserBySessionToken = async (token?: string) => {
    if (!token) return null;
    const session = await prisma.session.findUnique({ where: { token }, include: { user: true } })
    if (!session) return null
    if (session.expiresAt < new Date()) {
        await prisma.session.delete({ where: { id: session.id } }).catch(() => { })
        return null
    }
    return session.user
}

export async function getSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    if (!token) return null;

    const session = await prisma.session.findUnique({
        where: { token },
        include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) return null;
    return session;
}

export async function requireAuth() {
    const session = await getSession();
    if (!session) redirect("/sign-in");
    return session;
}
