import 'server-only'

import { cookies } from 'next/headers'
import { cache } from 'react'
import { getCookieData, tokenKey } from './server-fns'
import { decrypt } from './session'
import { redirect } from 'next/navigation'
import { $fetch } from './fetch'

export const verifySession = cache(async () => {
  const cookie = (await cookies()).get(tokenKey)?.value;

  if (!cookie) {
    redirect('/auth')
  }
  const session = decrypt(cookie)

  if (!session?.userId) {
    redirect('/login')
  }

  return {
    ...session,
    token: cookie,
  }
})


export const getUser = cache(async () => {
  const cookieData = await getCookieData();

  if (!cookieData) {
    return null;
  }

  const { data, error } = await $fetch("@get/api/users/me", {
    auth: {
      type: "Bearer",
      token: cookieData.token,
    },
  });

  if (error) {
    console.error(error)
    return null;
  }

  return data.data;
})
