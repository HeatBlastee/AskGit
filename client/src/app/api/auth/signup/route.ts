import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hashPassword, createSessionForUser } from '@/lib/auth'
import { cookies } from 'next/headers'


export async function POST(req: Request) {
    try {
        const { email, password, name } = await req.json()
        if (!email || !password) return NextResponse.json({ error: 'Missing email or password' }, { status: 400 })


        const existing = await prisma.user.findUnique({ where: { email } })
        if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 409 })


        const hashed = await hashPassword(password)
        const user = await prisma.user.create({ data: { email, password: hashed, name } })


        const session = await createSessionForUser(user.id)

        const cookieStore = await cookies();
        cookieStore.set({
            name: 'session',
            value: session.token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            expires: session.expiresAt
        })


        return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } })
    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}