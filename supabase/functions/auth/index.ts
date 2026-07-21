import { serve } from 'https://deno.land/std@0.203.0/http/server.ts'

const SUPABASE_URL = Deno.env.get('AUTH_SUPABASE_URL') || Deno.env.get('SUPABASE_URL') || Deno.env.get('VITE_SUPABASE_URL')
const SERVICE_ROLE_KEY = Deno.env.get('AUTH_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const ANON_KEY = Deno.env.get('AUTH_ANON_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('AUTH_PUBLISHABLE_KEYS') || Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')
const RESEND_API_KEY = Deno.env.get('AUTH_RESEND_API_KEY') || Deno.env.get('RESEND_API_KEY')
const AUTH_EMAIL_FROM = Deno.env.get('AUTH_EMAIL_FROM') || 'welcome@mallucupid.com'
const AUTH_CORS_ORIGIN = Deno.env.get('AUTH_CORS_ORIGIN') || 'https://www.mallucupid.com'
const ALLOWED_CORS_ORIGINS = AUTH_CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !ANON_KEY) {
  throw new Error('Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or SUPABASE_ANON_KEY')
}

const defaultHeaders = {
  'Content-Type': 'application/json',
}

const buildCookie = (name: string, value: string, maxAge: number) =>
  `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${maxAge}`

const clearCookie = (name: string) =>
  `${name}=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0`

const getCorsHeaders = (origin: string | null) => {
  const allowedOrigin = origin && ALLOWED_CORS_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_CORS_ORIGINS[0]

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  }
}

const jsonResponse = (
  body: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
  cookies: string[] = [],
  origin: string | null = null,
) => {
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...getCorsHeaders(origin),
    ...extraHeaders,
  })

  for (const cookie of cookies) {
    headers.append('Set-Cookie', cookie)
  }

  return new Response(JSON.stringify(body), {
    status,
    headers,
  })
}

const authHeaders = (useService = false) => ({
  'Content-Type': 'application/json',
  apikey: useService ? SERVICE_ROLE_KEY : ANON_KEY,
  Authorization: `Bearer ${useService ? SERVICE_ROLE_KEY : ANON_KEY}`,
})

const serializeCookies = (cookieHeader: string): Record<string, string> =>
  Object.fromEntries(
    cookieHeader
      .split(';')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const [name, ...rest] = item.split('=')
        return [name, rest.join('=')]
      }),
  )

const parseJson = async (req: Request) => {
  try {
    return await req.json()
  } catch {
    return {}
  }
}

const sendVerificationEmail = async (email: string, token: string): Promise<{ ok: boolean; error?: string }> => {
  if (!RESEND_API_KEY) {
    console.error('sendVerificationEmail: RESEND_API_KEY is not configured')
    return { ok: false, error: 'Email service not configured' }
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: AUTH_EMAIL_FROM,
      to: [email],
      subject: 'Your MalluCupid verification code',
      html: `<p>Your verification code is <strong>${token}</strong>.</p><p>It expires in 20 minutes.</p>`,
    }),
  })

  if (!res.ok) {
    const errorBody = await res.text().catch(() => '')
    console.error(`sendVerificationEmail: Resend API error ${res.status}: ${errorBody}`)
    let detail = `Resend HTTP ${res.status}`
    try {
      const parsed = JSON.parse(errorBody)
      detail = parsed?.message || parsed?.error || detail
    } catch {
      if (errorBody) detail = errorBody.slice(0, 200)
    }
    return { ok: false, error: `Failed to send verification email: ${detail}` }
  }

  return { ok: true }
}

const authErrorMessage = (data: Record<string, unknown>, fallback: string) => {
  if (!data) return fallback
  if (typeof data.msg === 'string' && data.msg) return data.msg
  if (typeof data.error_description === 'string' && data.error_description) return data.error_description
  if (typeof data.message === 'string' && data.message) return data.message
  if (typeof data.error === 'string' && data.error) return data.error
  if (data.error && typeof data.error === 'object' && typeof (data.error as { message?: string }).message === 'string') {
    return (data.error as { message: string }).message
  }
  return fallback
}

const isAuthError = (data: Record<string, unknown>) =>
  Boolean(data?.error || data?.error_code || data?.msg) && !data?.access_token

const signIn = async (email: string, password: string) => {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ email, password }),
  })
  return res.json()
}

const refreshSession = async (refreshToken: string) => {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
  return res.json()
}

const fetchUser = async (accessToken: string) => {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      ...authHeaders(),
      Authorization: `Bearer ${accessToken}`,
    },
  })
  return res.json()
}

const handleLogin = async (req: Request) => {
  const origin = req.headers.get('origin')
  const { email, password } = await parseJson(req)
  if (!email || !password) return jsonResponse({ error: 'Missing credentials' }, 400, {}, [], origin)

  const data = await signIn(email, password)
  if (isAuthError(data)) return jsonResponse({ error: authErrorMessage(data, 'Login failed') }, 401, {}, [], origin)
  if (!data.access_token || !data.refresh_token) return jsonResponse({ error: 'Login did not return tokens' }, 500, {}, [], origin)

  const cookies = [
    buildCookie('sb-access-token', data.access_token, data.expires_in || 3600),
    buildCookie('sb-refresh-token', data.refresh_token, 60 * 60 * 24 * 30),
  ]

  return jsonResponse({ user: data.user }, 200, {}, cookies, origin)
}

const handleLogout = async (req: Request) => {
  const origin = req.headers.get('origin')
  const cookies = serializeCookies(req.headers.get('cookie') || '')
  const accessToken = cookies['sb-access-token'] ? decodeURIComponent(cookies['sb-access-token']) : ''

  if (accessToken) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: 'POST',
      headers: {
        ...authHeaders(),
        Authorization: `Bearer ${accessToken}`,
      },
    })
  }

  return jsonResponse({ success: true }, 200, {}, [clearCookie('sb-access-token'), clearCookie('sb-refresh-token')], origin)
}

const handleSession = async (req: Request) => {
  const origin = req.headers.get('origin')
  const cookies = serializeCookies(req.headers.get('cookie') || '')
  const accessToken = cookies['sb-access-token'] ? decodeURIComponent(cookies['sb-access-token']) : ''
  const refreshToken = cookies['sb-refresh-token'] ? decodeURIComponent(cookies['sb-refresh-token']) : ''

  if (!accessToken && !refreshToken) return jsonResponse({ user: null }, 200, {}, [], origin)

  if (accessToken) {
    const user = await fetchUser(accessToken)
    if (user?.id) return jsonResponse({ user }, 200, {}, [], origin)
  }

  if (!refreshToken) return jsonResponse({ user: null }, 200, {}, [], origin)

  const refreshData = await refreshSession(refreshToken)
  if (refreshData.error) return jsonResponse({ user: null }, 200, {}, [], origin)
  if (!refreshData.access_token) return jsonResponse({ user: null }, 200, {}, [], origin)

  const cookiesToSet = [
    buildCookie('sb-access-token', refreshData.access_token, refreshData.expires_in || 3600),
    buildCookie('sb-refresh-token', refreshData.refresh_token || refreshToken, 60 * 60 * 24 * 30),
  ]

  const user = await fetchUser(refreshData.access_token)
  return jsonResponse({ user }, 200, {}, cookiesToSet, origin)
}

const handleSignup = async (req: Request) => {
  const origin = req.headers.get('origin')
  const { email, password, username } = await parseJson(req)
  if (!email || !password || !username) return jsonResponse({ error: 'Missing fields' }, 400, {}, [], origin)
  if (!/^[^\s]{6,25}$/.test(username)) return jsonResponse({ error: 'Invalid username format' }, 400, {}, [], origin)

  const usernameCheck = await fetch(`${SUPABASE_URL}/rest/v1/profiles?username=eq.${encodeURIComponent(username)}&select=id&limit=1`, {
    headers: {
      ...authHeaders(true),
    },
  })

  if (!usernameCheck.ok) return jsonResponse({ error: 'Failed to validate username' }, 500, {}, [], origin)

  const existing = await usernameCheck.json()
  if (Array.isArray(existing) && existing.length > 0) return jsonResponse({ error: 'Username taken' }, 409, {}, [], origin)

  // Invalidate any prior unused signup OTPs for this email
  await fetch(
    `${SUPABASE_URL}/rest/v1/email_verifications?email=eq.${encodeURIComponent(email)}&purpose=eq.signup&used=eq.false`,
    {
      method: 'PATCH',
      headers: { ...authHeaders(true), Prefer: 'return=minimal' },
      body: JSON.stringify({ used: true }),
    },
  )

  const token = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 20 * 60 * 1000).toISOString()

  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/email_verifications`, {
    method: 'POST',
    headers: {
      ...authHeaders(true),
      Prefer: 'return=representation',
    },
    body: JSON.stringify([{ email, token, purpose: 'signup', payload: { username, password }, expires_at: expiresAt }]),
  })

  if (!insertRes.ok) return jsonResponse({ error: 'Failed to store verification' }, 500, {}, [], origin)

  const sendResult = await sendVerificationEmail(email, token)
  if (!sendResult.ok) {
    await fetch(`${SUPABASE_URL}/rest/v1/email_verifications?token=eq.${encodeURIComponent(token)}`, {
      method: 'DELETE',
      headers: { ...authHeaders(true) },
    })
    return jsonResponse({ error: sendResult.error || 'Failed to send verification email' }, 502, {}, [], origin)
  }

  return jsonResponse({ status: 'verification_sent' }, 200, {}, [], origin)
}

const handleResend = async (req: Request) => {
  const origin = req.headers.get('origin')
  const { email } = await parseJson(req)
  if (!email) return jsonResponse({ error: 'Missing email' }, 400, {}, [], origin)

  const lookupRes = await fetch(
    `${SUPABASE_URL}/rest/v1/email_verifications?email=eq.${encodeURIComponent(email)}&purpose=eq.signup&used=eq.false&select=*&order=created_at.desc&limit=1`,
    { headers: { ...authHeaders(true) } },
  )

  if (!lookupRes.ok) return jsonResponse({ error: 'Lookup failed' }, 500, {}, [], origin)

  const rows = await lookupRes.json()
  const row = Array.isArray(rows) && rows.length ? rows[0] : null
  if (!row) return jsonResponse({ error: 'No pending verification for this email' }, 404, {}, [], origin)

  const token = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 20 * 60 * 1000).toISOString()

  const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/email_verifications?id=eq.${row.id}`, {
    method: 'PATCH',
    headers: {
      ...authHeaders(true),
      Prefer: 'return=representation',
    },
    body: JSON.stringify({ token, expires_at: expiresAt, attempts: (row.attempts || 0) + 1 }),
  })

  if (!updateRes.ok) return jsonResponse({ error: 'Failed to refresh verification' }, 500, {}, [], origin)

  const sendResult = await sendVerificationEmail(email, token)
  if (!sendResult.ok) return jsonResponse({ error: sendResult.error || 'Failed to send verification email' }, 502, {}, [], origin)

  return jsonResponse({ status: 'verification_sent' }, 200, {}, [], origin)
}

const handleVerify = async (req: Request) => {
  const origin = req.headers.get('origin')
  const { token } = await parseJson(req)
  if (!token) return jsonResponse({ error: 'Missing token' }, 400, {}, [], origin)

  const lookupRes = await fetch(`${SUPABASE_URL}/rest/v1/email_verifications?token=eq.${encodeURIComponent(token)}&purpose=eq.signup&used=eq.false&select=*&limit=1`, {
    headers: {
      ...authHeaders(true),
    },
  })

  if (!lookupRes.ok) return jsonResponse({ error: 'Lookup failed' }, 500, {}, [], origin)

  const rows = await lookupRes.json()
  const row = Array.isArray(rows) && rows.length ? rows[0] : null
  if (!row) return jsonResponse({ error: 'Invalid or expired token' }, 400, {}, [], origin)
  if (new Date(row.expires_at) < new Date()) return jsonResponse({ error: 'Expired token' }, 400, {}, [], origin)

  const email = row.email
  const username = row.payload?.username
  const password = row.payload?.password

  if (!email || !username || !password) return jsonResponse({ error: 'Verification payload invalid' }, 500, {}, [], origin)

  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      ...authHeaders(true),
    },
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { username } }),
  })

  if (!userRes.ok) {
    const errorBody = await userRes.json().catch(() => ({}))
    return jsonResponse({ error: errorBody.message || 'Failed to create user' }, 500, {}, [], origin)
  }

  const created = await userRes.json()
  const userId = created.id || created.user?.id
  if (!userId) return jsonResponse({ error: 'User created but id missing' }, 500, {}, [], origin)

  const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: 'POST',
    headers: {
      ...authHeaders(true),
      Prefer: 'return=representation',
    },
    body: JSON.stringify([{ id: userId, username }]),
  })

  if (!profileRes.ok) {
    const profileErr = await profileRes.text().catch(() => '')
    console.error('Failed to create profile:', profileErr)
    return jsonResponse({ error: 'User created but profile failed' }, 500, {}, [], origin)
  }

  await fetch(`${SUPABASE_URL}/rest/v1/email_verifications?id=eq.${row.id}`, {
    method: 'PATCH',
    headers: {
      ...authHeaders(true),
      Prefer: 'return=representation',
    },
    body: JSON.stringify({ used: true }),
  })

  const signInData = await signIn(email, password)
  if (isAuthError(signInData) || !signInData.access_token) {
    return jsonResponse({ status: 'user_created', user: { id: userId, email } }, 200, {}, [], origin)
  }

  const cookies = [
    buildCookie('sb-access-token', signInData.access_token, signInData.expires_in || 3600),
    buildCookie('sb-refresh-token', signInData.refresh_token, 60 * 60 * 24 * 30),
  ]

  return jsonResponse({ status: 'user_created', user: { id: userId, email } }, 200, {}, cookies, origin)
}

const handleProfile = async (req: Request) => {
  const origin = req.headers.get('origin')
  const cookies = serializeCookies(req.headers.get('cookie') || '')
  const accessToken = cookies['sb-access-token'] ? decodeURIComponent(cookies['sb-access-token']) : ''
  if (!accessToken) return jsonResponse({ error: 'Unauthorized' }, 401, {}, [], origin)

  const user = await fetchUser(accessToken)
  if (!user?.id) return jsonResponse({ error: 'Unauthorized' }, 401, {}, [], origin)

  const body = await parseJson(req)
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (typeof body.full_name === 'string') patch.full_name = body.full_name
  if (typeof body.bio === 'string') patch.bio = body.bio
  if (typeof body.avatar_url === 'string') patch.avatar_url = body.avatar_url

  const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}`, {
    method: 'PATCH',
    headers: {
      ...authHeaders(true),
      Prefer: 'return=representation',
    },
    body: JSON.stringify(patch),
  })

  if (!res.ok) {
    const err = await res.text().catch(() => '')
    console.error('Profile update failed:', err)
    return jsonResponse({ error: 'Failed to update profile' }, 500, {}, [], origin)
  }

  const rows = await res.json().catch(() => [])
  return jsonResponse({ profile: Array.isArray(rows) ? rows[0] : rows }, 200, {}, [], origin)
}

const handleForgot = async (req: Request) => {
  const origin = req.headers.get('origin')
  const { email } = await parseJson(req)
  if (!email) return jsonResponse({ error: 'Missing email' }, 400, {}, [], origin)

  const res = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ email }),
  })

  const body = await res.json().catch(() => ({}))
  if (!res.ok) return jsonResponse({ error: authErrorMessage(body, 'Reset failed') }, 400, {}, [], origin)
  return jsonResponse({ status: 'reset_sent' }, 200, {}, [], origin)
}

const handleReset = async (req: Request) => {
  const origin = req.headers.get('origin')
  const { token, password } = await parseJson(req)
  if (!token || !password) return jsonResponse({ error: 'Missing token or password' }, 400, {}, [], origin)

  const verifyRes = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ token, type: 'recovery' }),
  })

  const verifyBody = await verifyRes.json().catch(() => ({}))
  if (!verifyRes.ok) return jsonResponse({ error: authErrorMessage(verifyBody, 'Token verify failed') }, 400, {}, [], origin)

  const accessToken = verifyBody.access_token || verifyBody.session?.access_token
  if (!accessToken) return jsonResponse({ error: 'No access token returned' }, 500, {}, [], origin)

  const updateRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      apikey: ANON_KEY,
    },
    body: JSON.stringify({ password }),
  })

  const updateBody = await updateRes.json().catch(() => ({}))
  if (!updateRes.ok) return jsonResponse({ error: authErrorMessage(updateBody, 'Password update failed') }, 400, {}, [], origin)
  return jsonResponse({ status: 'password_updated' }, 200, {}, [], origin)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: getCorsHeaders(req.headers.get('origin')) })
  }

  const url = new URL(req.url, `https://${req.headers.get('host') ?? 'localhost'}`)
  const path = url.pathname.replace(/\/+$|$/, '')
  const isRoute = (name: string) => path.endsWith(`/auth/${name}`) || path.endsWith(`/${name}`)

  if (isRoute('login') && req.method === 'POST') return handleLogin(req)
  if (isRoute('logout') && req.method === 'POST') return handleLogout(req)
  if (isRoute('session') && req.method === 'GET') return handleSession(req)
  if (isRoute('signup') && req.method === 'POST') return handleSignup(req)
  if (isRoute('resend') && req.method === 'POST') return handleResend(req)
  if (isRoute('verify') && req.method === 'POST') return handleVerify(req)
  if (isRoute('forgot') && req.method === 'POST') return handleForgot(req)
  if (isRoute('reset') && req.method === 'POST') return handleReset(req)
  if (isRoute('profile') && req.method === 'POST') return handleProfile(req)

  return jsonResponse({ error: 'Not Found' }, 404, {}, [], req.headers.get('origin'))
})
