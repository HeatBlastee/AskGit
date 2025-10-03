import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getUserBySessionToken } from '@/lib/auth'


export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value
    const user = await getUserBySessionToken(token)
    if (!user) return NextResponse.json({ user: null })
    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } })
}