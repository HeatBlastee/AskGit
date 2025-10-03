import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { deleteSessionByToken } from '@/lib/auth'


export async function POST() {
    const cookieStore = await cookies()
    const token = cookieStore.get('session')?.value
    if (token) {
        await deleteSessionByToken(token).catch(() => { })
        cookieStore.delete('session')
    }
    return NextResponse.json({ ok: true })
}