import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyPassword, createSessionForUser } from '@/lib/auth'
import { cookies } from 'next/headers'


export async function POST(req: Request) {
    try {
        const { email, password } = await req.json()
        if (!email || !password) return NextResponse.json({ error: 'Missing email or password' }, { status: 400 })


        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })


        const ok = await verifyPassword(password, user.password)
        if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })


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