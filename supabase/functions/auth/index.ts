import { serve } from 'https://deno.land/std@0.203.0/http/server.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || Deno.env.get('VITE_SUPABASE_URL')
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const ORIGIN = Deno.env.get('AUTH_CORS_ORIGIN') || 'https://www.mallucupid.com'

if (!SUPABASE_URL || !SERVICE_KEY || !ANON_KEY) {
  throw new Error('Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or SUPABASE_ANON_KEY')
}

const buildCookie = (name: string, value: string, maxAge: number) =>
  `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${maxAge}`

const clearCookie = (name: string) =>
  `${name}=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0`

const jsonResponse = (
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
  cookies: string[] = [],
) => {
  const responseHeaders = new Headers({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': ORIGIN,
    'Access-Control-Allow-Credentials': 'true',
    ...headers,
  })

  for (const cookie of cookies) {
    responseHeaders.append('Set-Cookie', cookie)
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: responseHeaders,
  })
}

const authHeaders = (useService = false) => ({
  'Content-Type': 'application/json',
  apikey: useService ? SERVICE_KEY : ANON_KEY,
  Authorization: `Bearer ${useService ? SERVICE_KEY : ANON_KEY}`,
})

const parseJson = async (req: Request) => {
  try {
    return await req.json()
  } catch {
    return {}
  }
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

const refreshSession = async (refreshToken: string) => {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
  return res.json()
}

const signIn = async (email: string, password: string) => {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ email, password }),
  })
  return res.json()
}

const sendVerificationEmail = async (email: string, token: string) => {
  if (!RESEND_API_KEY) return
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'welcome@mallucupid.com',
      to: [email],
      subject: 'Your MalluCupid verification code',
      html: `<p>Your verification code: <strong>${token}</strong>. Expires in 20 minutes.</p>`,
    }),
  })
}

const handleLogin = async (req: Request) => {
  const { email, password } = await parseJson(req)
  if (!email || !password) return jsonResponse({ error: 'Missing credentials' }, 400)

  const signRes = await signIn(email, password)
  if (signRes.error) return jsonResponse({ error: signRes.error_description || signRes.error?.message || 'Login failed' }, 401)
  if (!signRes.access_token || !signRes.refresh_token) return jsonResponse({ error: 'Login did not return tokens' }, 500)

  const cookies = [
    buildCookie('sb-access-token', signRes.access_token, signRes.expires_in || 3600),
    buildCookie('sb-refresh-token', signRes.refresh_token, 60 * 60 * 24 * 30),
  ]

  return jsonResponse({ user: signRes.user }, 200, { 'Set-Cookie': cookies.join(', ') })
}

const handleLogout = async (req: Request) => {
  const cookies = Object.fromEntries((req.headers.get('cookie') || '').split(';').map((item) => {
    const [key, ...rest] = item.trim().split('=')
    return [key, rest.join('=')]
  }))
  const accessToken = cookies['sb-access-token']
  if (accessToken) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: 'POST',
      headers: {
        ...authHeaders(),
        Authorization: `Bearer ${accessToken}`,
      },
    })
  }

  return jsonResponse({ success: true }, 200, { 'Set-Cookie': [clearCookie('sb-access-token'), clearCookie('sb-refresh-token')].join(', ') })
}

const handleSession = async (req: Request) => {
  const cookies = Object.fromEntries((req.headers.get('cookie') || '').split(';').map((item) => {
    const [key, ...rest] = item.trim().split('=')
    return [key, rest.join('=')]
  }))
  const accessToken = cookies['sb-access-token']
  const refreshToken = cookies['sb-refresh-token']
  if (!accessToken && !refreshToken) return jsonResponse({ user: null }, 200)

  let user = null
  if (accessToken) {
    const userRes = await fetchUser(accessToken)
    if (!userRes.id && refreshToken) {
      const refreshRes = await refreshSession(refreshToken)
      if (refreshRes.error) return jsonResponse({ user: null }, 200)
      const cookies = [
        buildCookie('sb-access-token', refreshRes.access_token, refreshRes.expires_in || 3600),
        buildCookie('sb-refresh-token', refreshRes.refresh_token, 60 * 60 * 24 * 30),
      ]
      const newUser = await fetchUser(refreshRes.access_token)
      return jsonResponse({ user: newUser }, 200, { 'Set-Cookie': cookies.join(', ') })
    }
    user = userRes
  }

  return jsonResponse({ user }, 200)
}

const handleProfileUpdate = async (req: Request) => {
  const cookies = Object.fromEntries((req.headers.get('cookie') || '').split(';').map((item) => {
    const [key, ...rest] = item.trim().split('=')
    return [key, rest.join('=')]
  }))
  const accessToken = cookies['sb-access-token']
  if (!accessToken) return jsonResponse({ error: 'Not authenticated' }, 401)

  const userRes = await fetchUser(accessToken)
  if (!userRes.id) return jsonResponse({ error: 'Invalid session' }, 401)

  const { full_name, bio, avatar_url } = await parseJson(req)
  const updatePayload: Record<string, string> = {}
  if (full_name !== undefined) updatePayload.full_name = full_name
  if (bio !== undefined) updatePayload.bio = bio
  if (avatar_url !== undefined) updatePayload.avatar_url = avatar_url

  const profRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userRes.id}`, {
    method: 'PATCH',
    headers: {
      ...authHeaders(true),
      Prefer: 'return=representation',
    },
    body: JSON.stringify(updatePayload),
  })
  const prof = await profRes.json()
  if (!profRes.ok) return jsonResponse({ error: 'Failed to update profile' }, 500)

  return jsonResponse({ profile: prof?.[0] ?? null }, 200)
}

const handleSignup = async (req: Request) => {
  const { email, password, username } = await parseJson(req)
  if (!email || !password || !username) return jsonResponse({ error: 'Missing fields' }, 400)
  if (!/^[^\s]{6,25}$/.test(username)) return jsonResponse({ error: 'Invalid username format' }, 400)

  const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?username=eq.${encodeURIComponent(username)}&select=id&limit=1`, {
    headers: {
      ...authHeaders(true),
    },
  })
  const existing = await checkRes.json()
  if (!checkRes.ok) return jsonResponse({ error: 'DB check failed' }, 500)
  if (Array.isArray(existing) && existing.length > 0) return jsonResponse({ error: 'Username taken' }, 409)

  const token = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 20 * 60 * 1000).toISOString()
  const payload = { username, password }

  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/email_verifications`, {
    method: 'POST',
    headers: {
      ...authHeaders(true),
      Prefer: 'return=representation',
    },
    body: JSON.stringify([{ email, token, purpose: 'signup', payload, expires_at: expiresAt }]),
  })
  if (!insertRes.ok) return jsonResponse({ error: 'Failed to store verification' }, 500)

  await sendVerificationEmail(email, token)
  return jsonResponse({ status: 'verification_sent' }, 200)
}

const handleVerify = async (req: Request) => {
  const { token } = await parseJson(req)
  if (!token) return jsonResponse({ error: 'Missing token' }, 400)

  const lookupRes = await fetch(`${SUPABASE_URL}/rest/v1/email_verifications?token=eq.${token}&purpose=eq.signup&used=eq.false&select=*&limit=1`, {
    headers: {
      ...authHeaders(true),
    },
  })
  const rows = await lookupRes.json()
  if (!lookupRes.ok) return jsonResponse({ error: 'Lookup failed' }, 500)
  const row = Array.isArray(rows) ? rows[0] : null
  if (!row) return jsonResponse({ error: 'Invalid or used token' }, 400)
  if (new Date(row.expires_at) < new Date()) return jsonResponse({ error: 'Token expired' }, 400)

  const username = row.payload?.username
  const password = row.payload?.password
  const email = row.email
  if (!username || !password) return jsonResponse({ error: 'Invalid payload' }, 500)

  const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { username },
    }),
  })
  const created = await createRes.json()
  if (!createRes.ok) return jsonResponse({ error: created.message || 'Create user failed' }, 500)

  const profRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: 'POST',
    headers: {
      ...authHeaders(true),
      Prefer: 'return=representation',
    },
    body: JSON.stringify([{ id: created.id, username }]),
  })
  if (!profRes.ok) console.error('Profile create failed', await profRes.text())

  await fetch(`${SUPABASE_URL}/rest/v1/email_verifications?id=eq.${row.id}`, {
    method: 'PATCH',
    headers: {
      ...authHeaders(true),
      Prefer: 'return=representation',
    },
    body: JSON.stringify({ used: true }),
  })

  const signRes = await signIn(email, password)
  if (signRes.error) return jsonResponse({ status: 'user_created', user: { id: created.id, email: created.email } }, 200)

  const cookies = [
    buildCookie('sb-access-token', signRes.access_token, signRes.expires_in || 3600),
    buildCookie('sb-refresh-token', signRes.refresh_token, 60 * 60 * 24 * 30),
  ]

  return jsonResponse({ status: 'user_created', user: { id: created.id, email: created.email } }, 200, { 'Set-Cookie': cookies.join(', ') })
}

const handleForgot = async (req: Request) => {
  const { email } = await parseJson(req)
  if (!email) return jsonResponse({ error: 'Missing email' }, 400)

  const res = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ email }),
  })
  const body = await res.json()
  if (!res.ok) return jsonResponse({ error: body.error_description || body.error?.message || 'Reset failed' }, 400)
  return jsonResponse({ status: 'reset_sent' }, 200)
}

const handleReset = async (req: Request) => {
  const { token, password } = await parseJson(req)
  if (!token || !password) return jsonResponse({ error: 'Missing token or password' }, 400)

  const verifyRes = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ token, type: 'recovery' }),
  })
  const verifyBody = await verifyRes.json()
  if (!verifyRes.ok) return jsonResponse({ error: verifyBody.error_description || verifyBody.error?.message || 'Token verify failed' }, 400)

  const accessToken = verifyBody.access_token || verifyBody.session?.access_token
  if (!accessToken) return jsonResponse({ error: 'No access token returned' }, 500)

  const updateRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ password }),
  })
  const updateBody = await updateRes.json()
  if (!updateRes.ok) return jsonResponse({ error: updateBody.error_description || updateBody.error?.message || 'Password update failed' }, 400)

  return jsonResponse({ status: 'password_updated' }, 200)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': ORIGIN,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      },
    })
  }

  const url = new URL(req.url, `https://${req.headers.get('host') ?? 'localhost'}`)
  const path = url.pathname.replace(/\/+$/, '')

  if (path.endsWith('/auth/login') && req.method === 'POST') return handleLogin(req)
  if (path.endsWith('/auth/logout') && req.method === 'POST') return handleLogout(req)
  if (path.endsWith('/auth/session') && req.method === 'GET') return handleSession(req)
  if (path.endsWith('/auth/signup') && req.method === 'POST') return handleSignup(req)
  if (path.endsWith('/auth/verify') && req.method === 'POST') return handleVerify(req)
  if (path.endsWith('/auth/forgot') && req.method === 'POST') return handleForgot(req)
  if (path.endsWith('/auth/reset') && req.method === 'POST') return handleReset(req)
  if (path.endsWith('/auth/profile') && req.method === 'POST') return handleProfileUpdate(req)

  return jsonResponse({ error: 'Not Found' }, 404)
})
