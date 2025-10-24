import 'server-only'
import { decodeJwt } from 'jose'
import { cookies } from 'next/headers'
import type { UserPayload } from './types'
import { tokenKey } from './server-fns'
import { env } from '@/env'

export function decrypt(session: string) {
  try {
    const payload = decodeJwt(session);
    return payload as UserPayload;
  } catch (error) {
    console.error('Failed to decode JWT:', error)
    return null;
  }
}

export async function createSession(session: string) {
  const payload = decrypt(session);

  if (!payload) {
    throw new Error('Invalid session token');
  }

  const expiresAt = new Date(payload.exp * 1000)
  const cookieStore = await cookies()

  cookieStore.set(tokenKey, session, {
    httpOnly: true,
    // secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
    domain:
      process.env.NODE_ENV === "production"
        ? env.DOMAIN_URL
        : undefined,
  })
}

export async function updateSession() {
  const session = (await cookies()).get('session')?.value

  if (!session) {
    return null
  }

  const payload = decrypt(session)

  if (!payload) {
    return null
  }

  const expires = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)

  const cookieStore = await cookies()
  cookieStore.set(tokenKey, session, {
    expires,
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    domain:
      process.env.NODE_ENV === "production"
        ? env.DOMAIN_URL
        : undefined,
  })
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.set(tokenKey, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(0),
    sameSite: 'lax',
    domain:
      process.env.NODE_ENV === "production"
        ? env.DOMAIN_URL
        : undefined,
  })
}
