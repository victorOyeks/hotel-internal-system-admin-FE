import 'server-only'
import { decodeJwt } from 'jose'
import { cookies } from 'next/headers'
import type { UserPayload } from './types'

export async function decrypt(session = '') {
  try {
    const { payload } = decodeJwt(session)
    return payload as UserPayload;
  } catch (error) {
    console.error('Failed to decode JWT:', error)
    return null;
  }
}

export async function createSession(session: string) {
  const expiresAt = new Date()
  const cookieStore = await cookies()

  cookieStore.set('session', session, {
    httpOnly: true,
    secure: true,
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
}
