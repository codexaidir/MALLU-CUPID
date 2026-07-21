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

// Username rules: 6-25 chars; letters, numbers, underscore, dot, hyphen; no spaces.
const USERNAME_REGEX = /^[A-Za-z0-9._-]{6,25}$/
const USERNAME_TAKEN_ERROR = 'Username already taken. Choose a different one.'

const validateUsernameFormat = (username: string): string | null => {
  if (!username) return 'Username is required'
  if (/\s/.test(username)) return 'Username cannot contain spaces'
  if (username.length < 6) return 'Username must be at least 6 characters'
  if (username.length > 25) return 'Username must be 25 characters or fewer'
  if (!USERNAME_REGEX.test(username)) return 'Username can only contain letters, numbers, and _ . -'
  return null
}

// Escape LIKE wildcards so ilike behaves as case-insensitive equality
const escapeLike = (value: string) => value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')

/** Case-insensitive uniqueness check against profiles AND pending (unverified) signups. */
const isUsernameTaken = async (
  username: string,
  opts: { excludeUserId?: string; includePending?: boolean; excludeEmail?: string } = {},
): Promise<boolean | null> => {
  const { excludeUserId = '', includePending = true, excludeEmail = '' } = opts
  const pattern = encodeURIComponent(escapeLike(username))
  const exclude = excludeUserId ? `&id=neq.${excludeUserId}` : ''
  const profileRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?username=ilike.${pattern}${exclude}&select=id&limit=1`,
    { headers: { ...authHeaders(true) } },
  )
  if (!profileRes.ok) return null
  const profiles = await profileRes.json().catch(() => null)
  if (!Array.isArray(profiles)) return null
  if (profiles.length > 0) return true

  if (!includePending) return false
  const emailFilter = excludeEmail ? `&email=neq.${encodeURIComponent(excludeEmail)}` : ''
  const pendingRes = await fetch(
    `${SUPABASE_URL}/rest/v1/email_verifications?purpose=eq.signup&used=eq.false&expires_at=gt.${encodeURIComponent(new Date().toISOString())}${emailFilter}&payload->>username=ilike.${pattern}&select=id&limit=1`,
    { headers: { ...authHeaders(true) } },
  )
  if (!pendingRes.ok) return false
  const pending = await pendingRes.json().catch(() => [])
  return Array.isArray(pending) && pending.length > 0
}

const handleUsernameCheck = async (req: Request, url: URL) => {
  const origin = req.headers.get('origin')
  const username = (url.searchParams.get('u') || '').trim()

  const formatError = validateUsernameFormat(username)
  if (formatError) {
    return jsonResponse({ available: false, reason: 'invalid', error: formatError }, 200, {}, [], origin)
  }

  const taken = await isUsernameTaken(username)
  if (taken === null) return jsonResponse({ error: 'Failed to check username' }, 500, {}, [], origin)
  if (taken) {
    return jsonResponse({ available: false, reason: 'taken', error: USERNAME_TAKEN_ERROR }, 200, {}, [], origin)
  }
  return jsonResponse({ available: true }, 200, {}, [], origin)
}

const handleSignup = async (req: Request) => {
  const origin = req.headers.get('origin')
  const body = await parseJson(req)
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : ''
  if (!email || !password || !username) return jsonResponse({ error: 'Missing fields' }, 400, {}, [], origin)

  const formatError = validateUsernameFormat(username)
  if (formatError) return jsonResponse({ error: formatError }, 400, {}, [], origin)

  // Re-signup with the same email keeps the same username reserved for that email
  const taken = await isUsernameTaken(username, { excludeEmail: email })
  if (taken === null) return jsonResponse({ error: 'Failed to validate username' }, 500, {}, [], origin)
  if (taken) return jsonResponse({ error: USERNAME_TAKEN_ERROR }, 409, {}, [], origin)

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

  // Final backend check before account creation: the username may have been
  // claimed while this signup was waiting for OTP verification.
  const formatError = validateUsernameFormat(username)
  if (formatError) return jsonResponse({ error: formatError }, 400, {}, [], origin)
  const takenNow = await isUsernameTaken(username, { includePending: false })
  if (takenNow === null) return jsonResponse({ error: 'Failed to validate username' }, 500, {}, [], origin)
  if (takenNow) return jsonResponse({ error: USERNAME_TAKEN_ERROR }, 409, {}, [], origin)

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
    // DB-level unique index is the last line of defense against duplicate usernames.
    // Roll back the auth user so the email is not left orphaned.
    await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { ...authHeaders(true) },
    }).catch(() => {})
    if (profileErr.includes('23505') || profileErr.toLowerCase().includes('duplicate')) {
      return jsonResponse({ error: USERNAME_TAKEN_ERROR }, 409, {}, [], origin)
    }
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

const AVATAR_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

const uploadAvatar = async (
  userId: string,
  base64: string,
  contentType: string,
): Promise<{ ok: boolean; url?: string; error?: string }> => {
  const ext = AVATAR_EXT[contentType]
  if (!ext) return { ok: false, error: 'Unsupported image type' }

  const cleaned = base64.includes(',') ? base64.split(',').pop() as string : base64
  let bytes: Uint8Array
  try {
    const binary = atob(cleaned)
    bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  } catch {
    return { ok: false, error: 'Invalid image data' }
  }

  if (bytes.byteLength > 5 * 1024 * 1024) return { ok: false, error: 'Image exceeds 5MB limit' }

  const path = `${userId}/avatar.${ext}`
  const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/avatars/${path}`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': contentType,
      'x-upsert': 'true',
      'Cache-Control': '3600',
    },
    body: bytes,
  })

  if (!uploadRes.ok) {
    const err = await uploadRes.text().catch(() => '')
    console.error('Avatar upload failed:', err)
    return { ok: false, error: 'Failed to upload avatar' }
  }

  const url = `${SUPABASE_URL}/storage/v1/object/public/avatars/${path}?v=${Date.now()}`
  return { ok: true, url }
}

const requireUser = async (req: Request) => {
  const cookies = serializeCookies(req.headers.get('cookie') || '')
  const accessToken = cookies['sb-access-token'] ? decodeURIComponent(cookies['sb-access-token']) : ''
  if (!accessToken) return null
  const user = await fetchUser(accessToken)
  return user?.id ? user : null
}

const POST_MEDIA_BUCKET = 'post-media'
const POST_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png']
const MAX_IMAGE_SIZE = 50 * 1024 * 1024
const MAX_VIDEO_SIZE = 500 * 1024 * 1024
const MAX_IMAGES_PER_POST = 15

const generatePostPublicId = () => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const random = new Uint8Array(12)
  crypto.getRandomValues(random)
  return Array.from(random, (byte) => alphabet[byte % alphabet.length]).join('')
}

const mediaExtension = (contentType: string) => {
  if (contentType === 'image/png') return 'png'
  if (contentType === 'image/jpeg' || contentType === 'image/jpg') return 'jpg'
  const subtype = contentType.split('/')[1] || 'bin'
  return subtype.split(';')[0].replace(/[^a-z0-9]/gi, '').slice(0, 8) || 'bin'
}

const signMediaPaths = async (paths: string[]): Promise<Record<string, string>> => {
  if (!paths.length) return {}
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/${POST_MEDIA_BUCKET}`, {
    method: 'POST',
    headers: { ...authHeaders(true) },
    body: JSON.stringify({ expiresIn: 3600, paths }),
  })
  if (!res.ok) {
    console.error('Failed to sign media paths:', await res.text().catch(() => ''))
    return {}
  }
  const rows = await res.json().catch(() => [])
  const map: Record<string, string> = {}
  for (const row of Array.isArray(rows) ? rows : []) {
    if (row?.signedURL && row?.path) map[row.path] = `${SUPABASE_URL}/storage/v1${row.signedURL}`
  }
  return map
}

const decoratePosts = async (posts: Array<Record<string, unknown>>) => {
  const allPaths = posts.flatMap((post) => (Array.isArray(post.media_paths) ? post.media_paths as string[] : []))
  const signed = await signMediaPaths(allPaths)
  return posts.map((post) => {
    const paths = Array.isArray(post.media_paths) ? post.media_paths as string[] : []
    const mediaUrls = paths.map((path) => signed[path]).filter(Boolean)
    return {
      id: post.id,
      public_id: post.public_id,
      caption: post.caption,
      media_type: post.media_type,
      media_urls: mediaUrls,
      media_url: mediaUrls[0] || '',
      media_count: paths.length,
      is_paid: post.is_paid,
      price: post.price,
      created_at: post.created_at,
    }
  })
}

const handlePostUploadUrls = async (req: Request) => {
  const origin = req.headers.get('origin')
  const user = await requireUser(req)
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, {}, [], origin)

  const body = await parseJson(req)
  const mediaType = body.media_type === 'video' ? 'video' : body.media_type === 'image' ? 'image' : null
  const files = Array.isArray(body.files) ? body.files : []
  if (!mediaType) return jsonResponse({ error: 'media_type must be image or video' }, 400, {}, [], origin)
  if (!files.length) return jsonResponse({ error: 'No files provided' }, 400, {}, [], origin)

  if (mediaType === 'image') {
    if (files.length > MAX_IMAGES_PER_POST) return jsonResponse({ error: `Maximum ${MAX_IMAGES_PER_POST} images per post` }, 400, {}, [], origin)
    for (const file of files) {
      if (!POST_IMAGE_TYPES.includes(file?.content_type)) return jsonResponse({ error: 'Only JPG, JPEG, or PNG images are allowed' }, 400, {}, [], origin)
      if (typeof file?.size !== 'number' || file.size <= 0 || file.size > MAX_IMAGE_SIZE) {
        return jsonResponse({ error: 'Each image must be 50MB or smaller' }, 400, {}, [], origin)
      }
    }
  } else {
    if (files.length !== 1) return jsonResponse({ error: 'Exactly one video per post' }, 400, {}, [], origin)
    const file = files[0]
    if (typeof file?.content_type !== 'string' || !file.content_type.startsWith('video/')) {
      return jsonResponse({ error: 'Only video files are allowed' }, 400, {}, [], origin)
    }
    if (typeof file?.size !== 'number' || file.size <= 0 || file.size > MAX_VIDEO_SIZE) {
      return jsonResponse({ error: 'Video must be 500MB or smaller' }, 400, {}, [], origin)
    }
  }

  const publicId = generatePostPublicId()
  const uploads: Array<{ path: string; upload_url: string; content_type: string }> = []

  for (let i = 0; i < files.length; i++) {
    const contentType = files[i].content_type as string
    const path = `${user.id}/${publicId}/${i}.${mediaExtension(contentType)}`
    const signRes = await fetch(`${SUPABASE_URL}/storage/v1/object/upload/sign/${POST_MEDIA_BUCKET}/${path}`, {
      method: 'POST',
      headers: { ...authHeaders(true) },
      body: JSON.stringify({}),
    })
    if (!signRes.ok) {
      console.error('Failed to create signed upload URL:', await signRes.text().catch(() => ''))
      return jsonResponse({ error: 'Failed to prepare upload' }, 500, {}, [], origin)
    }
    const signBody = await signRes.json().catch(() => ({}))
    if (!signBody?.url) return jsonResponse({ error: 'Failed to prepare upload' }, 500, {}, [], origin)
    uploads.push({ path, upload_url: `${SUPABASE_URL}/storage/v1${signBody.url}`, content_type: contentType })
  }

  return jsonResponse({ post_public_id: publicId, uploads }, 200, {}, [], origin)
}

const handleCreatePost = async (req: Request) => {
  const origin = req.headers.get('origin')
  const user = await requireUser(req)
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, {}, [], origin)

  const body = await parseJson(req)
  const publicId = typeof body.public_id === 'string' ? body.public_id : ''
  const caption = typeof body.caption === 'string' ? body.caption.trim() : ''
  const mediaType = body.media_type === 'video' ? 'video' : body.media_type === 'image' ? 'image' : null
  const mediaPaths = Array.isArray(body.media_paths) ? body.media_paths.filter((p: unknown) => typeof p === 'string') : []
  const isPaid = body.is_paid === true
  const price = isPaid ? Number(body.price) : 0

  if (!/^[A-Za-z0-9]{12}$/.test(publicId)) return jsonResponse({ error: 'Invalid post id' }, 400, {}, [], origin)
  if (!mediaType) return jsonResponse({ error: 'media_type must be image or video' }, 400, {}, [], origin)
  if (caption.length > 200) return jsonResponse({ error: 'Caption must be 200 characters or fewer' }, 400, {}, [], origin)
  if (isPaid && (!Number.isFinite(price) || price < 10)) return jsonResponse({ error: 'Minimum price is ₹10 for paid posts' }, 400, {}, [], origin)
  if (mediaType === 'image' && (mediaPaths.length < 1 || mediaPaths.length > MAX_IMAGES_PER_POST)) {
    return jsonResponse({ error: `Post must contain 1-${MAX_IMAGES_PER_POST} images` }, 400, {}, [], origin)
  }
  if (mediaType === 'video' && mediaPaths.length !== 1) return jsonResponse({ error: 'Post must contain exactly one video' }, 400, {}, [], origin)

  const prefix = `${user.id}/${publicId}/`
  if (!mediaPaths.every((path: string) => path.startsWith(prefix))) {
    return jsonResponse({ error: 'Invalid media paths' }, 400, {}, [], origin)
  }

  // Confirm the files actually landed in storage before creating the post row
  const listRes = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${POST_MEDIA_BUCKET}`, {
    method: 'POST',
    headers: { ...authHeaders(true) },
    body: JSON.stringify({ prefix: `${user.id}/${publicId}`, limit: 100 }),
  })
  if (!listRes.ok) return jsonResponse({ error: 'Failed to verify uploads' }, 500, {}, [], origin)
  const objects = await listRes.json().catch(() => [])
  const uploadedNames = new Set((Array.isArray(objects) ? objects : []).map((obj: { name?: string }) => `${prefix}${obj?.name}`))
  if (!mediaPaths.every((path: string) => uploadedNames.has(path))) {
    return jsonResponse({ error: 'Some media files were not uploaded' }, 400, {}, [], origin)
  }

  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/posts`, {
    method: 'POST',
    headers: {
      ...authHeaders(true),
      Prefer: 'return=representation',
    },
    body: JSON.stringify([{
      creator_id: user.id,
      public_id: publicId,
      caption,
      media_type: mediaType,
      media_url: '',
      media_paths: mediaPaths,
      is_paid: isPaid,
      price: isPaid ? price : 0,
    }]),
  })

  if (!insertRes.ok) {
    const err = await insertRes.text().catch(() => '')
    console.error('Failed to create post:', err)
    return jsonResponse({ error: 'Failed to create post' }, 500, {}, [], origin)
  }

  const rows = await insertRes.json().catch(() => [])
  const decorated = await decoratePosts(Array.isArray(rows) ? rows : [])
  return jsonResponse({ status: 'post_created', post: decorated[0] || null }, 200, {}, [], origin)
}

const handleGetProfile = async (req: Request) => {
  const origin = req.headers.get('origin')
  const user = await requireUser(req)
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, {}, [], origin)

  const [res, postsCountRes, followersCountRes, followingCountRes, postsRes] = await Promise.all([
    fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=id,username,full_name,bio,avatar_url,location,instagram_url,facebook_url,gender,is_private&limit=1`,
      { headers: { ...authHeaders(true) } },
    ),
    fetch(`${SUPABASE_URL}/rest/v1/posts?creator_id=eq.${user.id}&select=id`, {
      method: 'HEAD',
      headers: { ...authHeaders(true), Prefer: 'count=exact', Range: '0-0' },
    }),
    fetch(`${SUPABASE_URL}/rest/v1/follows?following_id=eq.${user.id}&select=follower_id`, {
      method: 'HEAD',
      headers: { ...authHeaders(true), Prefer: 'count=exact', Range: '0-0' },
    }),
    fetch(`${SUPABASE_URL}/rest/v1/follows?follower_id=eq.${user.id}&select=following_id`, {
      method: 'HEAD',
      headers: { ...authHeaders(true), Prefer: 'count=exact', Range: '0-0' },
    }),
    fetch(
      `${SUPABASE_URL}/rest/v1/posts?creator_id=eq.${user.id}&select=id,public_id,caption,media_type,media_paths,is_paid,price,created_at&order=created_at.desc&limit=50`,
      { headers: { ...authHeaders(true) } },
    ),
  ])

  if (!res.ok) return jsonResponse({ error: 'Failed to load profile' }, 500, {}, [], origin)

  const rows = await res.json().catch(() => [])
  const profile = Array.isArray(rows) && rows.length ? rows[0] : null
  if (!profile) return jsonResponse({ error: 'Profile not found' }, 404, {}, [], origin)

  const readCount = (response: Response) => {
    const range = response.headers.get('content-range') || ''
    const total = range.split('/')[1]
    return total && total !== '*' ? Number(total) || 0 : 0
  }
  const rawPosts = postsRes.ok ? await postsRes.json().catch(() => []) : []
  const posts = await decoratePosts(Array.isArray(rawPosts) ? rawPosts : [])
  const stats = {
    posts: postsCountRes.ok ? readCount(postsCountRes) : 0,
    followers: followersCountRes.ok ? readCount(followersCountRes) : 0,
    following: followingCountRes.ok ? readCount(followingCountRes) : 0,
  }

  return jsonResponse({ profile, stats, posts }, 200, {}, [], origin)
}

const handleProfile = async (req: Request) => {
  const origin = req.headers.get('origin')
  const cookies = serializeCookies(req.headers.get('cookie') || '')
  const accessToken = cookies['sb-access-token'] ? decodeURIComponent(cookies['sb-access-token']) : ''
  if (!accessToken) return jsonResponse({ error: 'Unauthorized' }, 401, {}, [], origin)

  const user = await fetchUser(accessToken)
  if (!user?.id) return jsonResponse({ error: 'Unauthorized' }, 401, {}, [], origin)

  const body = await parseJson(req)

  const fullName = typeof body.full_name === 'string' ? body.full_name.trim() : ''
  const bio = typeof body.bio === 'string' ? body.bio.trim() : ''
  const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : ''
  const location = typeof body.location === 'string' ? body.location.trim() : ''
  const instagramUrl = typeof body.instagram_url === 'string' ? body.instagram_url.trim() : ''
  const facebookUrl = typeof body.facebook_url === 'string' ? body.facebook_url.trim() : ''
  const gender = typeof body.gender === 'string' ? body.gender : 'Prefer not to say'
  const isPrivate = body.is_private === true
  if (!fullName) return jsonResponse({ error: 'Display name is required' }, 400, {}, [], origin)
  if (!bio) return jsonResponse({ error: 'Bio is required' }, 400, {}, [], origin)
  if (fullName.length > 100) return jsonResponse({ error: 'Display name must be 100 characters or fewer' }, 400, {}, [], origin)
  if (bio.length > 400) return jsonResponse({ error: 'Bio must be 400 characters or fewer' }, 400, {}, [], origin)
  if (username) {
    const usernameFormatError = validateUsernameFormat(username)
    if (usernameFormatError) return jsonResponse({ error: usernameFormatError }, 400, {}, [], origin)
  }
  if (location.length > 100) return jsonResponse({ error: 'Location must be 100 characters or fewer' }, 400, {}, [], origin)
  if (!['Prefer not to say', 'Male', 'Female', 'Transgender'].includes(gender)) {
    return jsonResponse({ error: 'Invalid gender' }, 400, {}, [], origin)
  }
  for (const [label, value] of [['Instagram', instagramUrl], ['Facebook', facebookUrl]]) {
    if (!value) continue
    try {
      const parsed = new URL(value)
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error()
    } catch {
      return jsonResponse({ error: `${label} URL is invalid` }, 400, {}, [], origin)
    }
  }

  if (username) {
    const taken = await isUsernameTaken(username, { excludeUserId: user.id })
    if (taken === null) return jsonResponse({ error: 'Failed to validate username' }, 500, {}, [], origin)
    if (taken) return jsonResponse({ error: USERNAME_TAKEN_ERROR }, 409, {}, [], origin)
  }

  const patch: Record<string, unknown> = {
    full_name: fullName,
    bio,
    location,
    instagram_url: instagramUrl,
    facebook_url: facebookUrl,
    gender,
    is_private: isPrivate,
    updated_at: new Date().toISOString(),
  }
  if (username) patch.username = username

  if (typeof body.avatar_base64 === 'string' && body.avatar_base64) {
    const contentType = typeof body.avatar_content_type === 'string' ? body.avatar_content_type : 'image/jpeg'
    const uploaded = await uploadAvatar(user.id, body.avatar_base64, contentType)
    if (!uploaded.ok) return jsonResponse({ error: uploaded.error || 'Failed to upload avatar' }, 400, {}, [], origin)
    patch.avatar_url = uploaded.url
  } else if (typeof body.avatar_url === 'string' && body.avatar_url) {
    patch.avatar_url = body.avatar_url
  }

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
    if (err.includes('23505') || err.toLowerCase().includes('duplicate')) {
      return jsonResponse({ error: USERNAME_TAKEN_ERROR }, 409, {}, [], origin)
    }
    return jsonResponse({ error: 'Failed to update profile' }, 500, {}, [], origin)
  }

  // Keep auth user metadata in sync so the frontend can build /<username> URLs from the session
  if (username && username !== user.user_metadata?.username) {
    await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
      method: 'PUT',
      headers: { ...authHeaders(true) },
      body: JSON.stringify({ user_metadata: { ...(user.user_metadata || {}), username } }),
    }).catch((err) => console.error('Failed to sync username metadata:', err))
  }

  const rows = await res.json().catch(() => [])
  return jsonResponse({ profile: Array.isArray(rows) ? rows[0] : rows }, 200, {}, [], origin)
}

const handleGetPayoutAccount = async (req: Request) => {
  const origin = req.headers.get('origin')
  const user = await requireUser(req)
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, {}, [], origin)

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/payout_accounts?user_id=eq.${user.id}&select=account_holder,account_number,ifsc,upi_id,updated_at&limit=1`,
    { headers: { ...authHeaders(true) } },
  )
  if (!res.ok) return jsonResponse({ error: 'Failed to load payout account' }, 500, {}, [], origin)
  const rows = await res.json().catch(() => [])
  return jsonResponse({ account: Array.isArray(rows) && rows.length ? rows[0] : null }, 200, {}, [], origin)
}

const handleSavePayoutAccount = async (req: Request) => {
  const origin = req.headers.get('origin')
  const user = await requireUser(req)
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, {}, [], origin)

  const body = await parseJson(req)
  const accountHolder = typeof body.account_holder === 'string' ? body.account_holder.trim() : ''
  const accountNumber = typeof body.account_number === 'string' ? body.account_number.trim() : ''
  const ifsc = typeof body.ifsc === 'string' ? body.ifsc.trim().toUpperCase() : ''
  const upiId = typeof body.upi_id === 'string' ? body.upi_id.trim() : ''

  if (accountHolder.length < 2 || accountHolder.length > 100) {
    return jsonResponse({ error: 'Account holder name must be 2-100 characters' }, 400, {}, [], origin)
  }
  if (!/^\d{9,18}$/.test(accountNumber)) {
    return jsonResponse({ error: 'Account number must be 9-18 digits' }, 400, {}, [], origin)
  }
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
    return jsonResponse({ error: 'Enter a valid IFSC code (e.g. SBIN0001234)' }, 400, {}, [], origin)
  }
  if (upiId && !/^[\w.\-]{2,}@[A-Za-z]{2,}$/.test(upiId)) {
    return jsonResponse({ error: 'Enter a valid UPI ID (e.g. name@bank)' }, 400, {}, [], origin)
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/payout_accounts?on_conflict=user_id`, {
    method: 'POST',
    headers: {
      ...authHeaders(true),
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify([{
      user_id: user.id,
      account_holder: accountHolder,
      account_number: accountNumber,
      ifsc,
      upi_id: upiId,
      updated_at: new Date().toISOString(),
    }]),
  })

  if (!res.ok) {
    console.error('Payout account save failed:', await res.text().catch(() => ''))
    return jsonResponse({ error: 'Failed to save bank details' }, 500, {}, [], origin)
  }
  const rows = await res.json().catch(() => [])
  return jsonResponse({ account: Array.isArray(rows) ? rows[0] : rows }, 200, {}, [], origin)
}

const handleGetSupportTickets = async (req: Request) => {
  const origin = req.headers.get('origin')
  const user = await requireUser(req)
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, {}, [], origin)

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/support_tickets?user_id=eq.${user.id}&select=id,subject,message,status,admin_reply,created_at&order=created_at.desc&limit=50`,
    { headers: { ...authHeaders(true) } },
  )
  if (!res.ok) return jsonResponse({ error: 'Failed to load support tokens' }, 500, {}, [], origin)
  const rows = await res.json().catch(() => [])
  return jsonResponse({ tickets: Array.isArray(rows) ? rows : [] }, 200, {}, [], origin)
}

const handleCreateSupportTicket = async (req: Request) => {
  const origin = req.headers.get('origin')
  const user = await requireUser(req)
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, {}, [], origin)

  const body = await parseJson(req)
  const subject = typeof body.subject === 'string' ? body.subject.trim() : ''
  const message = typeof body.message === 'string' ? body.message.trim() : ''
  if (subject.length < 3 || subject.length > 120) {
    return jsonResponse({ error: 'Subject must be 3-120 characters' }, 400, {}, [], origin)
  }
  if (message.length < 10 || message.length > 1000) {
    return jsonResponse({ error: 'Message must be 10-1000 characters' }, 400, {}, [], origin)
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/support_tickets`, {
    method: 'POST',
    headers: {
      ...authHeaders(true),
      Prefer: 'return=representation',
    },
    body: JSON.stringify([{ user_id: user.id, subject, message }]),
  })

  if (!res.ok) {
    console.error('Support ticket create failed:', await res.text().catch(() => ''))
    return jsonResponse({ error: 'Failed to create support token' }, 500, {}, [], origin)
  }
  const rows = await res.json().catch(() => [])
  return jsonResponse({ ticket: Array.isArray(rows) ? rows[0] : rows }, 200, {}, [], origin)
}

const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID') || ''
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET') || ''

const REPORT_REASONS = [
  'Nudity or sexual content',
  'Harassment or bullying',
  'Spam or scam',
  'Violence or dangerous content',
  'Hate speech',
  'Intellectual property violation',
  'Impersonation',
  'Other',
]

const fetchPostByPublicId = async (publicId: string) => {
  if (!/^[A-Za-z0-9]{12}$/.test(publicId)) return null
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/posts?public_id=eq.${encodeURIComponent(publicId)}&select=id,creator_id,public_id,caption,media_type,media_paths,is_paid,price,created_at&limit=1`,
    { headers: { ...authHeaders(true) } },
  )
  if (!res.ok) return null
  const rows = await res.json().catch(() => [])
  return Array.isArray(rows) && rows.length ? rows[0] : null
}

// Fire-and-forget notification insert. Never notifies the actor about their
// own action; duplicate "like" notifications are ignored via the unique index.
const createNotification = async (n: {
  user_id: string
  actor_id: string
  type: 'like' | 'purchase' | 'request' | 'accept'
  post_id?: string
  post_public_id?: string
  conversation_id?: string
}) => {
  if (!n.user_id || !n.actor_id || n.user_id === n.actor_id) return
  await fetch(`${SUPABASE_URL}/rest/v1/notifications`, {
    method: 'POST',
    headers: { ...authHeaders(true), Prefer: 'return=minimal,resolution=ignore-duplicates' },
    body: JSON.stringify([n]),
  }).catch(() => {})
}

const handleGetNotifications = async (req: Request) => {
  const origin = req.headers.get('origin')
  const user = await requireUser(req)
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, {}, [], origin)

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/notifications?user_id=eq.${user.id}&select=*&order=created_at.desc&limit=100`,
    { headers: { ...authHeaders(true) } },
  )
  if (!res.ok) return jsonResponse({ error: 'Failed to load notifications' }, 500, {}, [], origin)
  const rows = await res.json().catch(() => [])
  const list = Array.isArray(rows) ? rows : []

  // Resolve actor profiles and post captions in two batched queries
  const actorIds = [...new Set(list.map((n) => n.actor_id).filter(Boolean))]
  const postIds = [...new Set(list.map((n) => n.post_id).filter(Boolean))]

  const [actorsRes, postsRes] = await Promise.all([
    actorIds.length
      ? fetch(
          `${SUPABASE_URL}/rest/v1/profiles?id=in.(${actorIds.join(',')})&select=id,username,full_name,avatar_url`,
          { headers: { ...authHeaders(true) } },
        )
      : null,
    postIds.length
      ? fetch(
          `${SUPABASE_URL}/rest/v1/posts?id=in.(${postIds.join(',')})&select=id,caption`,
          { headers: { ...authHeaders(true) } },
        )
      : null,
  ])

  const actors: Record<string, Record<string, unknown>> = {}
  if (actorsRes?.ok) {
    for (const p of await actorsRes.json().catch(() => [])) actors[p.id] = p
  }
  const captions: Record<string, string> = {}
  if (postsRes?.ok) {
    for (const p of await postsRes.json().catch(() => [])) captions[p.id] = p.caption || ''
  }

  const notifications = list.map((n) => {
    const actor = actors[n.actor_id] || {}
    return {
      id: n.id,
      type: n.type,
      read: n.read,
      created_at: n.created_at,
      actor: {
        username: actor.username || '',
        full_name: actor.full_name || '',
        avatar_url: actor.avatar_url || '',
      },
      post_public_id: n.post_public_id || null,
      post_caption: n.post_id ? captions[n.post_id] || null : null,
      conversation_id: n.conversation_id || null,
    }
  })

  const unreadCount = list.filter((n) => !n.read).length
  return jsonResponse({ notifications, unread_count: unreadCount }, 200, {}, [], origin)
}

const handleMarkNotificationsRead = async (req: Request) => {
  const origin = req.headers.get('origin')
  const user = await requireUser(req)
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, {}, [], origin)

  const res = await fetch(`${SUPABASE_URL}/rest/v1/notifications?user_id=eq.${user.id}&read=eq.false`, {
    method: 'PATCH',
    headers: { ...authHeaders(true), Prefer: 'return=minimal' },
    body: JSON.stringify({ read: true }),
  })
  if (!res.ok) return jsonResponse({ error: 'Failed to update notifications' }, 500, {}, [], origin)
  return jsonResponse({ status: 'read' }, 200, {}, [], origin)
}

const fetchProfileBrief = async (userId: string) => {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=id,username,full_name,avatar_url&limit=1`,
    { headers: { ...authHeaders(true) } },
  )
  if (!res.ok) return null
  const rows = await res.json().catch(() => [])
  return Array.isArray(rows) && rows.length ? rows[0] : null
}

const hasPaidForPost = async (postId: string, userId: string) => {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/post_purchases?post_id=eq.${postId}&user_id=eq.${userId}&status=eq.paid&select=id&limit=1`,
    { headers: { ...authHeaders(true) } },
  )
  if (!res.ok) return false
  const rows = await res.json().catch(() => [])
  return Array.isArray(rows) && rows.length > 0
}

const countLikes = async (postId: string) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/post_likes?post_id=eq.${postId}&select=user_id`, {
    method: 'HEAD',
    headers: { ...authHeaders(true), Prefer: 'count=exact', Range: '0-0' },
  })
  if (!res.ok) return 0
  const range = res.headers.get('content-range') || ''
  const total = range.split('/')[1]
  return total && total !== '*' ? Number(total) || 0 : 0
}

const handleGetPost = async (req: Request, url: URL) => {
  const origin = req.headers.get('origin')
  const user = await requireUser(req)
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, {}, [], origin)

  const publicId = url.searchParams.get('id') || ''
  const post = await fetchPostByPublicId(publicId)
  if (!post) return jsonResponse({ error: 'Post not found' }, 404, {}, [], origin)

  const isOwner = post.creator_id === user.id
  // Access is decided server-side only: owner, free post, or a recorded paid purchase.
  const hasAccess = isOwner || post.is_paid !== true || (await hasPaidForPost(post.id, user.id))

  const [owner, likeCount, likedRes] = await Promise.all([
    fetchProfileBrief(post.creator_id),
    countLikes(post.id),
    fetch(`${SUPABASE_URL}/rest/v1/post_likes?post_id=eq.${post.id}&user_id=eq.${user.id}&select=user_id&limit=1`, {
      headers: { ...authHeaders(true) },
    }),
  ])

  const likedRows = likedRes.ok ? await likedRes.json().catch(() => []) : []
  const likedByMe = Array.isArray(likedRows) && likedRows.length > 0

  const paths = Array.isArray(post.media_paths) ? post.media_paths as string[] : []
  let mediaUrls: string[] = []
  if (hasAccess) {
    const signed = await signMediaPaths(paths)
    mediaUrls = paths.map((path) => signed[path]).filter(Boolean)
  }

  return jsonResponse({
    post: {
      public_id: post.public_id,
      caption: post.caption,
      media_type: post.media_type,
      media_urls: mediaUrls,
      media_count: paths.length,
      is_paid: post.is_paid,
      price: post.price,
      created_at: post.created_at,
      is_owner: isOwner,
      has_access: hasAccess,
      like_count: likeCount,
      liked_by_me: likedByMe,
      owner: owner
        ? { username: owner.username, full_name: owner.full_name, avatar_url: owner.avatar_url }
        : null,
    },
  }, 200, {}, [], origin)
}

const handleTogglePostLike = async (req: Request) => {
  const origin = req.headers.get('origin')
  const user = await requireUser(req)
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, {}, [], origin)

  const body = await parseJson(req)
  const post = await fetchPostByPublicId(typeof body.public_id === 'string' ? body.public_id : '')
  if (!post) return jsonResponse({ error: 'Post not found' }, 404, {}, [], origin)

  const existingRes = await fetch(
    `${SUPABASE_URL}/rest/v1/post_likes?post_id=eq.${post.id}&user_id=eq.${user.id}&select=user_id&limit=1`,
    { headers: { ...authHeaders(true) } },
  )
  const existing = existingRes.ok ? await existingRes.json().catch(() => []) : []
  const alreadyLiked = Array.isArray(existing) && existing.length > 0

  if (alreadyLiked) {
    await fetch(`${SUPABASE_URL}/rest/v1/post_likes?post_id=eq.${post.id}&user_id=eq.${user.id}`, {
      method: 'DELETE',
      headers: { ...authHeaders(true) },
    })
    // Unlike also retracts the notification
    await fetch(
      `${SUPABASE_URL}/rest/v1/notifications?user_id=eq.${post.creator_id}&actor_id=eq.${user.id}&post_id=eq.${post.id}&type=eq.like`,
      { method: 'DELETE', headers: { ...authHeaders(true) } },
    ).catch(() => {})
  } else {
    await fetch(`${SUPABASE_URL}/rest/v1/post_likes`, {
      method: 'POST',
      headers: { ...authHeaders(true), Prefer: 'return=minimal,resolution=ignore-duplicates' },
      body: JSON.stringify([{ post_id: post.id, user_id: user.id }]),
    })
    await createNotification({
      user_id: post.creator_id,
      actor_id: user.id,
      type: 'like',
      post_id: post.id,
      post_public_id: post.public_id,
    })
  }

  const likeCount = await countLikes(post.id)
  return jsonResponse({ liked: !alreadyLiked, like_count: likeCount }, 200, {}, [], origin)
}

const handleUpdatePost = async (req: Request) => {
  const origin = req.headers.get('origin')
  const user = await requireUser(req)
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, {}, [], origin)

  const body = await parseJson(req)
  const post = await fetchPostByPublicId(typeof body.public_id === 'string' ? body.public_id : '')
  if (!post) return jsonResponse({ error: 'Post not found' }, 404, {}, [], origin)
  if (post.creator_id !== user.id) return jsonResponse({ error: 'You can only edit your own posts' }, 403, {}, [], origin)

  const caption = typeof body.caption === 'string' ? body.caption.trim() : ''
  const isPaid = body.is_paid === true
  const price = isPaid ? Number(body.price) : 0

  if (caption.length > 200) return jsonResponse({ error: 'Caption must be 200 characters or fewer' }, 400, {}, [], origin)
  if (isPaid && (!Number.isFinite(price) || price < 10)) {
    return jsonResponse({ error: 'Minimum price is ₹10 for paid posts' }, 400, {}, [], origin)
  }

  // Update in place; the existing post id / public_id never changes.
  const res = await fetch(`${SUPABASE_URL}/rest/v1/posts?id=eq.${post.id}`, {
    method: 'PATCH',
    headers: { ...authHeaders(true), Prefer: 'return=representation' },
    body: JSON.stringify({ caption, is_paid: isPaid, price: isPaid ? price : 0 }),
  })

  if (!res.ok) {
    console.error('Post update failed:', await res.text().catch(() => ''))
    return jsonResponse({ error: 'Failed to update post' }, 500, {}, [], origin)
  }

  const rows = await res.json().catch(() => [])
  const decorated = await decoratePosts(Array.isArray(rows) ? rows : [])
  return jsonResponse({ status: 'post_updated', post: decorated[0] || null }, 200, {}, [], origin)
}

const handleDeletePost = async (req: Request) => {
  const origin = req.headers.get('origin')
  const user = await requireUser(req)
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, {}, [], origin)

  const body = await parseJson(req)
  const post = await fetchPostByPublicId(typeof body.public_id === 'string' ? body.public_id : '')
  if (!post) return jsonResponse({ error: 'Post not found' }, 404, {}, [], origin)
  if (post.creator_id !== user.id) return jsonResponse({ error: 'You can only delete your own posts' }, 403, {}, [], origin)

  const paths = Array.isArray(post.media_paths) ? post.media_paths as string[] : []
  if (paths.length) {
    const removeRes = await fetch(`${SUPABASE_URL}/storage/v1/object/${POST_MEDIA_BUCKET}`, {
      method: 'DELETE',
      headers: { ...authHeaders(true) },
      body: JSON.stringify({ prefixes: paths }),
    })
    if (!removeRes.ok) console.error('Failed to remove post media:', await removeRes.text().catch(() => ''))
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/posts?id=eq.${post.id}`, {
    method: 'DELETE',
    headers: { ...authHeaders(true) },
  })

  if (!res.ok) {
    console.error('Post delete failed:', await res.text().catch(() => ''))
    return jsonResponse({ error: 'Failed to delete post' }, 500, {}, [], origin)
  }

  return jsonResponse({ status: 'post_deleted' }, 200, {}, [], origin)
}

const handleReportPost = async (req: Request) => {
  const origin = req.headers.get('origin')
  const user = await requireUser(req)
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, {}, [], origin)

  const body = await parseJson(req)
  const post = await fetchPostByPublicId(typeof body.public_id === 'string' ? body.public_id : '')
  if (!post) return jsonResponse({ error: 'Post not found' }, 404, {}, [], origin)
  if (post.creator_id === user.id) return jsonResponse({ error: 'You cannot report your own post' }, 400, {}, [], origin)

  const reason = typeof body.reason === 'string' ? body.reason : ''
  const details = typeof body.details === 'string' ? body.details.trim() : ''
  if (!REPORT_REASONS.includes(reason)) return jsonResponse({ error: 'Select a valid reason' }, 400, {}, [], origin)
  if (details.length > 750) return jsonResponse({ error: 'Additional details must be 750 characters or fewer' }, 400, {}, [], origin)

  const [reporter, owner] = await Promise.all([
    fetchProfileBrief(user.id),
    fetchProfileBrief(post.creator_id),
  ])

  const res = await fetch(`${SUPABASE_URL}/rest/v1/post_reports`, {
    method: 'POST',
    headers: { ...authHeaders(true), Prefer: 'return=representation' },
    body: JSON.stringify([{
      post_id: post.id,
      post_public_id: post.public_id,
      owner_id: post.creator_id,
      owner_username: owner?.username || '',
      reporter_id: user.id,
      reporter_username: reporter?.username || '',
      reason,
      details,
    }]),
  })

  if (!res.ok) {
    console.error('Post report failed:', await res.text().catch(() => ''))
    return jsonResponse({ error: 'Failed to submit report' }, 500, {}, [], origin)
  }

  return jsonResponse({ status: 'report_submitted' }, 200, {}, [], origin)
}

const handlePostCheckout = async (req: Request) => {
  const origin = req.headers.get('origin')
  const user = await requireUser(req)
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, {}, [], origin)

  const body = await parseJson(req)
  const post = await fetchPostByPublicId(typeof body.public_id === 'string' ? body.public_id : '')
  if (!post) return jsonResponse({ error: 'Post not found' }, 404, {}, [], origin)
  if (post.creator_id === user.id) return jsonResponse({ already_unlocked: true }, 200, {}, [], origin)
  if (post.is_paid !== true) return jsonResponse({ already_unlocked: true }, 200, {}, [], origin)
  if (await hasPaidForPost(post.id, user.id)) return jsonResponse({ already_unlocked: true }, 200, {}, [], origin)

  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    return jsonResponse({ error: 'Payments are not configured yet. Please try again later.' }, 503, {}, [], origin)
  }

  const amountPaise = Math.round(Number(post.price) * 100)
  if (!Number.isFinite(amountPaise) || amountPaise < 100) {
    return jsonResponse({ error: 'Invalid post price' }, 500, {}, [], origin)
  }

  const orderRes = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)}`,
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: 'INR',
      receipt: `${post.public_id}-${user.id.slice(0, 8)}`,
      notes: { post_public_id: post.public_id, buyer_id: user.id },
    }),
  })

  if (!orderRes.ok) {
    console.error('Razorpay order failed:', await orderRes.text().catch(() => ''))
    return jsonResponse({ error: 'Failed to start payment. Please try again.' }, 502, {}, [], origin)
  }

  const order = await orderRes.json().catch(() => ({}))
  if (!order?.id) return jsonResponse({ error: 'Failed to start payment. Please try again.' }, 502, {}, [], origin)

  // One row per (post, user); re-initiating checkout refreshes the pending order id
  const upsertRes = await fetch(`${SUPABASE_URL}/rest/v1/post_purchases?on_conflict=post_id,user_id`, {
    method: 'POST',
    headers: { ...authHeaders(true), Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify([{
      post_id: post.id,
      user_id: user.id,
      amount: post.price,
      currency: 'INR',
      razorpay_order_id: order.id,
      status: 'created',
    }]),
  })

  if (!upsertRes.ok) {
    console.error('Purchase record failed:', await upsertRes.text().catch(() => ''))
    return jsonResponse({ error: 'Failed to start payment. Please try again.' }, 500, {}, [], origin)
  }

  return jsonResponse({
    key_id: RAZORPAY_KEY_ID,
    order_id: order.id,
    amount: amountPaise,
    currency: 'INR',
    post_public_id: post.public_id,
  }, 200, {}, [], origin)
}

const hmacSha256Hex = async (secret: string, message: string) => {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  return Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

const handleVerifyPostPayment = async (req: Request) => {
  const origin = req.headers.get('origin')
  const user = await requireUser(req)
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, {}, [], origin)

  const body = await parseJson(req)
  const post = await fetchPostByPublicId(typeof body.public_id === 'string' ? body.public_id : '')
  if (!post) return jsonResponse({ error: 'Post not found' }, 404, {}, [], origin)

  const orderId = typeof body.razorpay_order_id === 'string' ? body.razorpay_order_id : ''
  const paymentId = typeof body.razorpay_payment_id === 'string' ? body.razorpay_payment_id : ''
  const signature = typeof body.razorpay_signature === 'string' ? body.razorpay_signature : ''
  if (!orderId || !paymentId || !signature) return jsonResponse({ error: 'Missing payment details' }, 400, {}, [], origin)
  if (!RAZORPAY_KEY_SECRET) return jsonResponse({ error: 'Payments are not configured yet' }, 503, {}, [], origin)

  // The pending purchase row must match this user, post, and order
  const purchaseRes = await fetch(
    `${SUPABASE_URL}/rest/v1/post_purchases?post_id=eq.${post.id}&user_id=eq.${user.id}&razorpay_order_id=eq.${encodeURIComponent(orderId)}&select=id,status&limit=1`,
    { headers: { ...authHeaders(true) } },
  )
  const purchaseRows = purchaseRes.ok ? await purchaseRes.json().catch(() => []) : []
  const purchase = Array.isArray(purchaseRows) && purchaseRows.length ? purchaseRows[0] : null
  if (!purchase) return jsonResponse({ error: 'No matching payment found' }, 404, {}, [], origin)
  if (purchase.status === 'paid') return jsonResponse({ status: 'paid' }, 200, {}, [], origin)

  const expected = await hmacSha256Hex(RAZORPAY_KEY_SECRET, `${orderId}|${paymentId}`)
  if (expected !== signature) return jsonResponse({ error: 'Payment verification failed' }, 400, {}, [], origin)

  const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/post_purchases?id=eq.${purchase.id}`, {
    method: 'PATCH',
    headers: { ...authHeaders(true), Prefer: 'return=minimal' },
    body: JSON.stringify({
      status: 'paid',
      razorpay_payment_id: paymentId,
      paid_at: new Date().toISOString(),
    }),
  })

  if (!updateRes.ok) {
    console.error('Purchase confirm failed:', await updateRes.text().catch(() => ''))
    return jsonResponse({ error: 'Failed to record payment' }, 500, {}, [], origin)
  }

  await createNotification({
    user_id: post.creator_id,
    actor_id: user.id,
    type: 'purchase',
    post_id: post.id,
    post_public_id: post.public_id,
  })

  return jsonResponse({ status: 'paid' }, 200, {}, [], origin)
}

// ---------------------------------------------------------------------------
// Messaging
// ---------------------------------------------------------------------------

const CHAT_MEDIA_BUCKET = 'chat-media'
const MAX_CHAT_MEDIA_SIZE = 100 * 1024 * 1024

const signChatPath = async (path: string, expiresIn = 3600): Promise<string> => {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/${CHAT_MEDIA_BUCKET}/${path}`, {
    method: 'POST',
    headers: { ...authHeaders(true) },
    body: JSON.stringify({ expiresIn }),
  })
  if (!res.ok) return ''
  const body = await res.json().catch(() => ({}))
  return body?.signedURL ? `${SUPABASE_URL}/storage/v1${body.signedURL}` : ''
}

const getConversationForUser = async (conversationId: string, userId: string) => {
  if (!/^[0-9a-f-]{36}$/i.test(conversationId)) return null
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/conversations?id=eq.${conversationId}&select=*&limit=1`,
    { headers: { ...authHeaders(true) } },
  )
  if (!res.ok) return null
  const rows = await res.json().catch(() => [])
  const convo = Array.isArray(rows) && rows.length ? rows[0] : null
  if (!convo) return null
  if (convo.user_a !== userId && convo.user_b !== userId) return null
  return convo
}

const conversationPeer = (convo: Record<string, unknown>, userId: string) =>
  convo.user_a === userId ? convo.user_b as string : convo.user_a as string

const clearedAtFor = (convo: Record<string, unknown>, userId: string) =>
  (convo.user_a === userId ? convo.cleared_a : convo.cleared_b) as string | null

const getBlockPair = async (userId: string, otherId: string) => {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/user_blocks?or=(and(blocker_id.eq.${userId},blocked_id.eq.${otherId}),and(blocker_id.eq.${otherId},blocked_id.eq.${userId}))&select=blocker_id`,
    { headers: { ...authHeaders(true) } },
  )
  const rows = res.ok ? await res.json().catch(() => []) : []
  const blockers = new Set((Array.isArray(rows) ? rows : []).map((r: { blocker_id: string }) => r.blocker_id))
  return { blockedByMe: blockers.has(userId), blockedMe: blockers.has(otherId) }
}

const messagePreview = (msg: Record<string, unknown>, isMine: boolean) => {
  if (msg.media_type === 'image') return `${isMine ? 'You: ' : ''}📷 Photo${msg.is_once ? ' (view once)' : ''}`
  if (msg.media_type === 'video') return `${isMine ? 'You: ' : ''}🎬 Video${msg.is_once ? ' (view once)' : ''}`
  const body = typeof msg.body === 'string' ? msg.body : ''
  return `${isMine ? 'You: ' : ''}${body}`
}

const handleGetConversations = async (req: Request) => {
  const origin = req.headers.get('origin')
  const user = await requireUser(req)
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, {}, [], origin)

  const convoRes = await fetch(
    `${SUPABASE_URL}/rest/v1/conversations?or=(user_a.eq.${user.id},user_b.eq.${user.id})&select=*&order=last_message_at.desc&limit=100`,
    { headers: { ...authHeaders(true) } },
  )
  if (!convoRes.ok) return jsonResponse({ error: 'Failed to load conversations' }, 500, {}, [], origin)
  const convos = await convoRes.json().catch(() => [])
  if (!Array.isArray(convos) || !convos.length) return jsonResponse({ conversations: [] }, 200, {}, [], origin)

  const convoIds = convos.map((c) => c.id).join(',')
  const peerIds = [...new Set(convos.map((c) => conversationPeer(c, user.id)))].join(',')
  const notDeletedForMe = `deleted_for=not.cs.${encodeURIComponent(`{${user.id}}`)}`

  const [profilesRes, messagesRes] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/profiles?id=in.(${peerIds})&select=id,username,full_name,avatar_url`, {
      headers: { ...authHeaders(true) },
    }),
    fetch(
      `${SUPABASE_URL}/rest/v1/messages?conversation_id=in.(${convoIds})&deleted_for_all=eq.false&${notDeletedForMe}&select=id,conversation_id,sender_id,body,media_type,is_once,seen_at,created_at&order=created_at.desc&limit=1000`,
      { headers: { ...authHeaders(true) } },
    ),
  ])

  const profiles = profilesRes.ok ? await profilesRes.json().catch(() => []) : []
  const profileMap = new Map((Array.isArray(profiles) ? profiles : []).map((p: { id: string }) => [p.id, p]))
  const allMessages = messagesRes.ok ? await messagesRes.json().catch(() => []) : []

  const items = []
  for (const convo of convos) {
    const peerId = conversationPeer(convo, user.id)
    const peer = profileMap.get(peerId) as { username?: string; full_name?: string; avatar_url?: string } | undefined
    const cleared = clearedAtFor(convo, user.id)
    const visible = (Array.isArray(allMessages) ? allMessages : []).filter((m: Record<string, unknown>) =>
      m.conversation_id === convo.id && (!cleared || String(m.created_at) > cleared))
    const last = visible[0] || null
    // A conversation the user cleared stays hidden until a new message arrives
    if (!last) continue

    const unread = visible.filter((m: Record<string, unknown>) => m.sender_id !== user.id && !m.seen_at).length
    items.push({
      id: convo.id,
      status: convo.status,
      is_request: convo.status === 'pending' && convo.created_by !== user.id,
      other: {
        username: peer?.username || '',
        full_name: peer?.full_name || '',
        avatar_url: peer?.avatar_url || '',
      },
      last_message: {
        preview: messagePreview(last, last.sender_id === user.id),
        created_at: last.created_at,
      },
      unread,
      last_message_at: convo.last_message_at,
    })
  }

  return jsonResponse({ conversations: items }, 200, {}, [], origin)
}

const handleUserSearch = async (req: Request, url: URL) => {
  const origin = req.headers.get('origin')
  const user = await requireUser(req)
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, {}, [], origin)

  const q = (url.searchParams.get('q') || '').trim().toLowerCase().replace(/[%_,()]/g, '')
  if (q.length < 2) return jsonResponse({ users: [] }, 200, {}, [], origin)

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?username=ilike.${encodeURIComponent(`${q}%`)}&id=neq.${user.id}&select=username,full_name,avatar_url&limit=5`,
    { headers: { ...authHeaders(true) } },
  )
  const rows = res.ok ? await res.json().catch(() => []) : []
  return jsonResponse({ users: Array.isArray(rows) ? rows : [] }, 200, {}, [], origin)
}

const handleCreateConversation = async (req: Request) => {
  const origin = req.headers.get('origin')
  const user = await requireUser(req)
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, {}, [], origin)

  const body = await parseJson(req)
  const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : ''
  if (!username) return jsonResponse({ error: 'Missing username' }, 400, {}, [], origin)

  const targetRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?username=eq.${encodeURIComponent(username)}&select=id,username&limit=1`,
    { headers: { ...authHeaders(true) } },
  )
  const targetRows = targetRes.ok ? await targetRes.json().catch(() => []) : []
  const target = Array.isArray(targetRows) && targetRows.length ? targetRows[0] : null
  if (!target) return jsonResponse({ error: 'User not found' }, 404, {}, [], origin)
  if (target.id === user.id) return jsonResponse({ error: 'You cannot message yourself' }, 400, {}, [], origin)

  const blocks = await getBlockPair(user.id, target.id)
  if (blocks.blockedByMe) return jsonResponse({ error: 'You have blocked this user. Unblock to message.' }, 403, {}, [], origin)
  if (blocks.blockedMe) return jsonResponse({ error: 'Unable to message this user' }, 403, {}, [], origin)

  const [userA, userB] = [user.id, target.id].sort()
  const existingRes = await fetch(
    `${SUPABASE_URL}/rest/v1/conversations?user_a=eq.${userA}&user_b=eq.${userB}&select=id&limit=1`,
    { headers: { ...authHeaders(true) } },
  )
  const existing = existingRes.ok ? await existingRes.json().catch(() => []) : []
  if (Array.isArray(existing) && existing.length) {
    return jsonResponse({ conversation_id: existing[0].id, existing: true }, 200, {}, [], origin)
  }

  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/conversations`, {
    method: 'POST',
    headers: { ...authHeaders(true), Prefer: 'return=representation' },
    body: JSON.stringify([{ user_a: userA, user_b: userB, created_by: user.id, status: 'pending' }]),
  })
  if (!insertRes.ok) {
    console.error('Conversation create failed:', await insertRes.text().catch(() => ''))
    return jsonResponse({ error: 'Failed to start conversation' }, 500, {}, [], origin)
  }
  const rows = await insertRes.json().catch(() => [])
  const conversationId = rows[0]?.id
  if (conversationId) {
    await createNotification({
      user_id: target.id,
      actor_id: user.id,
      type: 'request',
      conversation_id: conversationId,
    })
  }
  return jsonResponse({ conversation_id: conversationId, existing: false }, 200, {}, [], origin)
}

const handleAcceptConversation = async (req: Request) => {
  const origin = req.headers.get('origin')
  const user = await requireUser(req)
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, {}, [], origin)

  const body = await parseJson(req)
  const convo = await getConversationForUser(typeof body.conversation_id === 'string' ? body.conversation_id : '', user.id)
  if (!convo) return jsonResponse({ error: 'Conversation not found' }, 404, {}, [], origin)
  if (convo.created_by === user.id) return jsonResponse({ error: 'Only the recipient can accept a request' }, 403, {}, [], origin)

  await fetch(`${SUPABASE_URL}/rest/v1/conversations?id=eq.${convo.id}`, {
    method: 'PATCH',
    headers: { ...authHeaders(true), Prefer: 'return=minimal' },
    body: JSON.stringify({ status: 'accepted' }),
  })
  await createNotification({
    user_id: convo.created_by as string,
    actor_id: user.id,
    type: 'accept',
    conversation_id: convo.id as string,
  })
  return jsonResponse({ status: 'accepted' }, 200, {}, [], origin)
}

const decorateMessage = async (msg: Record<string, unknown>, userId: string) => {
  const isMine = msg.sender_id === userId
  let mediaUrl = ''
  let onceState: string = 'none'
  if (msg.media_type && msg.media_path) {
    if (msg.is_once) {
      // View-once media is never included inline; the recipient must call /message-view-once
      onceState = msg.viewed_at ? 'opened' : (isMine ? 'sent' : 'available')
    } else {
      mediaUrl = await signChatPath(msg.media_path as string)
    }
  }
  return {
    id: msg.id,
    sender_is_me: isMine,
    body: msg.body,
    media_type: msg.media_type,
    media_url: mediaUrl,
    is_once: msg.is_once,
    once_state: onceState,
    seen_at: msg.seen_at,
    created_at: msg.created_at,
  }
}

const handleGetMessages = async (req: Request, url: URL) => {
  const origin = req.headers.get('origin')
  const user = await requireUser(req)
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, {}, [], origin)

  const convo = await getConversationForUser(url.searchParams.get('conversation_id') || '', user.id)
  if (!convo) return jsonResponse({ error: 'Conversation not found' }, 404, {}, [], origin)

  const peerId = conversationPeer(convo, user.id)
  const cleared = clearedAtFor(convo, user.id)
  const notDeletedForMe = `deleted_for=not.cs.${encodeURIComponent(`{${user.id}}`)}`
  const clearedFilter = cleared ? `&created_at=gt.${encodeURIComponent(cleared)}` : ''

  const [messagesRes, peer, blocks] = await Promise.all([
    fetch(
      `${SUPABASE_URL}/rest/v1/messages?conversation_id=eq.${convo.id}&deleted_for_all=eq.false&${notDeletedForMe}${clearedFilter}&select=*&order=created_at.asc&limit=500`,
      { headers: { ...authHeaders(true) } },
    ),
    fetchProfileBrief(peerId),
    getBlockPair(user.id, peerId),
  ])

  const rows = messagesRes.ok ? await messagesRes.json().catch(() => []) : []
  const messages = await Promise.all((Array.isArray(rows) ? rows : []).map((m) => decorateMessage(m, user.id)))

  // Viewing the chat marks incoming messages as seen
  await fetch(
    `${SUPABASE_URL}/rest/v1/messages?conversation_id=eq.${convo.id}&sender_id=neq.${user.id}&seen_at=is.null`,
    {
      method: 'PATCH',
      headers: { ...authHeaders(true), Prefer: 'return=minimal' },
      body: JSON.stringify({ seen_at: new Date().toISOString() }),
    },
  ).catch(() => {})

  return jsonResponse({
    conversation: {
      id: convo.id,
      status: convo.status,
      is_request: convo.status === 'pending' && convo.created_by !== user.id,
      blocked_by_me: blocks.blockedByMe,
      can_send: !blocks.blockedByMe && !blocks.blockedMe,
      other: peer
        ? { username: peer.username, full_name: peer.full_name, avatar_url: peer.avatar_url }
        : { username: '', full_name: '', avatar_url: '' },
    },
    messages,
  }, 200, {}, [], origin)
}

const handleChatUploadUrl = async (req: Request) => {
  const origin = req.headers.get('origin')
  const user = await requireUser(req)
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, {}, [], origin)

  const body = await parseJson(req)
  const convo = await getConversationForUser(typeof body.conversation_id === 'string' ? body.conversation_id : '', user.id)
  if (!convo) return jsonResponse({ error: 'Conversation not found' }, 404, {}, [], origin)

  const contentType = typeof body.content_type === 'string' ? body.content_type : ''
  const size = Number(body.size)
  const isImage = contentType.startsWith('image/')
  const isVideo = contentType.startsWith('video/')
  if (!isImage && !isVideo) return jsonResponse({ error: 'Only photos and videos can be attached' }, 400, {}, [], origin)
  if (!Number.isFinite(size) || size <= 0 || size > MAX_CHAT_MEDIA_SIZE) {
    return jsonResponse({ error: 'Attachment must be 100MB or smaller' }, 400, {}, [], origin)
  }

  const path = `${convo.id}/${crypto.randomUUID()}.${mediaExtension(contentType)}`
  const signRes = await fetch(`${SUPABASE_URL}/storage/v1/object/upload/sign/${CHAT_MEDIA_BUCKET}/${path}`, {
    method: 'POST',
    headers: { ...authHeaders(true) },
    body: JSON.stringify({}),
  })
  if (!signRes.ok) {
    console.error('Chat upload sign failed:', await signRes.text().catch(() => ''))
    return jsonResponse({ error: 'Failed to prepare upload' }, 500, {}, [], origin)
  }
  const signBody = await signRes.json().catch(() => ({}))
  if (!signBody?.url) return jsonResponse({ error: 'Failed to prepare upload' }, 500, {}, [], origin)

  return jsonResponse({
    path,
    upload_url: `${SUPABASE_URL}/storage/v1${signBody.url}`,
    media_type: isVideo ? 'video' : 'image',
  }, 200, {}, [], origin)
}

const handleSendMessage = async (req: Request) => {
  const origin = req.headers.get('origin')
  const user = await requireUser(req)
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, {}, [], origin)

  const body = await parseJson(req)
  const convo = await getConversationForUser(typeof body.conversation_id === 'string' ? body.conversation_id : '', user.id)
  if (!convo) return jsonResponse({ error: 'Conversation not found' }, 404, {}, [], origin)

  const peerId = conversationPeer(convo, user.id)
  const blocks = await getBlockPair(user.id, peerId)
  if (blocks.blockedByMe) return jsonResponse({ error: 'You have blocked this user. Unblock to message.' }, 403, {}, [], origin)
  if (blocks.blockedMe) return jsonResponse({ error: 'Unable to message this user' }, 403, {}, [], origin)

  const text = typeof body.body === 'string' ? body.body.trim() : ''
  const mediaPath = typeof body.media_path === 'string' ? body.media_path : ''
  const mediaType = body.media_type === 'image' || body.media_type === 'video' ? body.media_type : ''
  const isOnce = body.is_once === true && Boolean(mediaPath)

  if (text.length > 2000) return jsonResponse({ error: 'Message must be 2000 characters or fewer' }, 400, {}, [], origin)
  if (!text && !mediaPath) return jsonResponse({ error: 'Message is empty' }, 400, {}, [], origin)
  if (mediaPath && (!mediaType || !mediaPath.startsWith(`${convo.id}/`))) {
    return jsonResponse({ error: 'Invalid attachment' }, 400, {}, [], origin)
  }

  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/messages`, {
    method: 'POST',
    headers: { ...authHeaders(true), Prefer: 'return=representation' },
    body: JSON.stringify([{
      conversation_id: convo.id,
      sender_id: user.id,
      body: text,
      media_path: mediaPath,
      media_type: mediaType,
      is_once: isOnce,
    }]),
  })
  if (!insertRes.ok) {
    console.error('Message send failed:', await insertRes.text().catch(() => ''))
    return jsonResponse({ error: 'Failed to send message' }, 500, {}, [], origin)
  }

  // Replying to a request accepts it; also bump conversation recency
  const patch: Record<string, unknown> = { last_message_at: new Date().toISOString() }
  if (convo.status === 'pending' && convo.created_by !== user.id) patch.status = 'accepted'
  await fetch(`${SUPABASE_URL}/rest/v1/conversations?id=eq.${convo.id}`, {
    method: 'PATCH',
    headers: { ...authHeaders(true), Prefer: 'return=minimal' },
    body: JSON.stringify(patch),
  }).catch(() => {})
  if (patch.status === 'accepted') {
    // Replying auto-accepts the request; tell the requester
    await createNotification({
      user_id: convo.created_by as string,
      actor_id: user.id,
      type: 'accept',
      conversation_id: convo.id as string,
    })
  }

  const rows = await insertRes.json().catch(() => [])
  const message = rows[0] ? await decorateMessage(rows[0], user.id) : null
  return jsonResponse({ status: 'sent', message }, 200, {}, [], origin)
}

const handleViewOnceMessage = async (req: Request) => {
  const origin = req.headers.get('origin')
  const user = await requireUser(req)
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, {}, [], origin)

  const body = await parseJson(req)
  const messageId = typeof body.message_id === 'string' ? body.message_id : ''
  if (!/^[0-9a-f-]{36}$/i.test(messageId)) return jsonResponse({ error: 'Message not found' }, 404, {}, [], origin)

  const res = await fetch(`${SUPABASE_URL}/rest/v1/messages?id=eq.${messageId}&select=*&limit=1`, {
    headers: { ...authHeaders(true) },
  })
  const rows = res.ok ? await res.json().catch(() => []) : []
  const msg = Array.isArray(rows) && rows.length ? rows[0] : null
  if (!msg) return jsonResponse({ error: 'Message not found' }, 404, {}, [], origin)

  const convo = await getConversationForUser(msg.conversation_id, user.id)
  if (!convo) return jsonResponse({ error: 'Message not found' }, 404, {}, [], origin)
  if (msg.sender_id === user.id) return jsonResponse({ error: 'View once media can only be opened by the recipient' }, 403, {}, [], origin)
  if (!msg.is_once || !msg.media_path) return jsonResponse({ error: 'Not a view once message' }, 400, {}, [], origin)
  if (msg.viewed_at) return jsonResponse({ error: 'This media has already been viewed' }, 410, {}, [], origin)

  // Mark viewed first so a second request can never get another URL
  const markRes = await fetch(`${SUPABASE_URL}/rest/v1/messages?id=eq.${messageId}&viewed_at=is.null`, {
    method: 'PATCH',
    headers: { ...authHeaders(true), Prefer: 'return=representation' },
    body: JSON.stringify({ viewed_at: new Date().toISOString() }),
  })
  const marked = markRes.ok ? await markRes.json().catch(() => []) : []
  if (!Array.isArray(marked) || !marked.length) {
    return jsonResponse({ error: 'This media has already been viewed' }, 410, {}, [], origin)
  }

  const url = await signChatPath(msg.media_path, 120)
  if (!url) return jsonResponse({ error: 'Failed to load media' }, 500, {}, [], origin)
  return jsonResponse({ media_url: url, media_type: msg.media_type }, 200, {}, [], origin)
}

const handleDeleteMessages = async (req: Request) => {
  const origin = req.headers.get('origin')
  const user = await requireUser(req)
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, {}, [], origin)

  const body = await parseJson(req)
  const convo = await getConversationForUser(typeof body.conversation_id === 'string' ? body.conversation_id : '', user.id)
  if (!convo) return jsonResponse({ error: 'Conversation not found' }, 404, {}, [], origin)

  const mode = body.mode === 'both' ? 'both' : 'me'
  const ids = (Array.isArray(body.message_ids) ? body.message_ids : [])
    .filter((id: unknown) => typeof id === 'string' && /^[0-9a-f-]{36}$/i.test(id as string))
    .slice(0, 100)
  if (!ids.length) return jsonResponse({ error: 'No messages selected' }, 400, {}, [], origin)

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/messages?id=in.(${ids.join(',')})&conversation_id=eq.${convo.id}&select=id,sender_id,media_path,deleted_for`,
    { headers: { ...authHeaders(true) } },
  )
  const rows = res.ok ? await res.json().catch(() => []) : []
  if (!Array.isArray(rows) || !rows.length) return jsonResponse({ error: 'Messages not found' }, 404, {}, [], origin)

  if (mode === 'both') {
    if (rows.some((m: { sender_id: string }) => m.sender_id !== user.id)) {
      return jsonResponse({ error: 'You can only delete your own messages for everyone' }, 403, {}, [], origin)
    }
    const mediaPaths = rows.map((m: { media_path: string }) => m.media_path).filter(Boolean)
    if (mediaPaths.length) {
      await fetch(`${SUPABASE_URL}/storage/v1/object/${CHAT_MEDIA_BUCKET}`, {
        method: 'DELETE',
        headers: { ...authHeaders(true) },
        body: JSON.stringify({ prefixes: mediaPaths }),
      }).catch(() => {})
    }
    await fetch(`${SUPABASE_URL}/rest/v1/messages?id=in.(${rows.map((m: { id: string }) => m.id).join(',')})`, {
      method: 'PATCH',
      headers: { ...authHeaders(true), Prefer: 'return=minimal' },
      body: JSON.stringify({ deleted_for_all: true, body: '', media_path: '', media_type: '' }),
    })
  } else {
    for (const msg of rows) {
      const deletedFor = Array.isArray(msg.deleted_for) ? msg.deleted_for : []
      if (deletedFor.includes(user.id)) continue
      await fetch(`${SUPABASE_URL}/rest/v1/messages?id=eq.${msg.id}`, {
        method: 'PATCH',
        headers: { ...authHeaders(true), Prefer: 'return=minimal' },
        body: JSON.stringify({ deleted_for: [...deletedFor, user.id] }),
      })
    }
  }

  return jsonResponse({ status: 'deleted', count: rows.length }, 200, {}, [], origin)
}

const handleDeleteChat = async (req: Request) => {
  const origin = req.headers.get('origin')
  const user = await requireUser(req)
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, {}, [], origin)

  const body = await parseJson(req)
  const convo = await getConversationForUser(typeof body.conversation_id === 'string' ? body.conversation_id : '', user.id)
  if (!convo) return jsonResponse({ error: 'Conversation not found' }, 404, {}, [], origin)

  if (body.mode === 'both') {
    // Remove all media under this conversation, then the row (messages cascade)
    const listRes = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${CHAT_MEDIA_BUCKET}`, {
      method: 'POST',
      headers: { ...authHeaders(true) },
      body: JSON.stringify({ prefix: convo.id, limit: 1000 }),
    })
    const objects = listRes.ok ? await listRes.json().catch(() => []) : []
    const prefixes = (Array.isArray(objects) ? objects : [])
      .map((obj: { name?: string }) => `${convo.id}/${obj?.name}`)
      .filter((p: string) => !p.endsWith('/undefined'))
    if (prefixes.length) {
      await fetch(`${SUPABASE_URL}/storage/v1/object/${CHAT_MEDIA_BUCKET}`, {
        method: 'DELETE',
        headers: { ...authHeaders(true) },
        body: JSON.stringify({ prefixes }),
      }).catch(() => {})
    }
    await fetch(`${SUPABASE_URL}/rest/v1/conversations?id=eq.${convo.id}`, {
      method: 'DELETE',
      headers: { ...authHeaders(true) },
    })
  } else {
    const field = convo.user_a === user.id ? 'cleared_a' : 'cleared_b'
    await fetch(`${SUPABASE_URL}/rest/v1/conversations?id=eq.${convo.id}`, {
      method: 'PATCH',
      headers: { ...authHeaders(true), Prefer: 'return=minimal' },
      body: JSON.stringify({ [field]: new Date().toISOString() }),
    })
  }

  return jsonResponse({ status: 'chat_deleted' }, 200, {}, [], origin)
}

const handleBlockUser = async (req: Request) => {
  const origin = req.headers.get('origin')
  const user = await requireUser(req)
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, {}, [], origin)

  const body = await parseJson(req)
  const convo = await getConversationForUser(typeof body.conversation_id === 'string' ? body.conversation_id : '', user.id)
  if (!convo) return jsonResponse({ error: 'Conversation not found' }, 404, {}, [], origin)
  const peerId = conversationPeer(convo, user.id)

  if (body.block === false) {
    await fetch(`${SUPABASE_URL}/rest/v1/user_blocks?blocker_id=eq.${user.id}&blocked_id=eq.${peerId}`, {
      method: 'DELETE',
      headers: { ...authHeaders(true) },
    })
    return jsonResponse({ status: 'unblocked' }, 200, {}, [], origin)
  }

  await fetch(`${SUPABASE_URL}/rest/v1/user_blocks?on_conflict=blocker_id,blocked_id`, {
    method: 'POST',
    headers: { ...authHeaders(true), Prefer: 'resolution=ignore-duplicates,return=minimal' },
    body: JSON.stringify([{ blocker_id: user.id, blocked_id: peerId }]),
  })
  return jsonResponse({ status: 'blocked' }, 200, {}, [], origin)
}

const handleReportUser = async (req: Request) => {
  const origin = req.headers.get('origin')
  const user = await requireUser(req)
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, {}, [], origin)

  const body = await parseJson(req)
  const convo = await getConversationForUser(typeof body.conversation_id === 'string' ? body.conversation_id : '', user.id)
  if (!convo) return jsonResponse({ error: 'Conversation not found' }, 404, {}, [], origin)
  const peerId = conversationPeer(convo, user.id)

  const reason = typeof body.reason === 'string' ? body.reason : ''
  const details = typeof body.details === 'string' ? body.details.trim() : ''
  if (!REPORT_REASONS.includes(reason)) return jsonResponse({ error: 'Select a valid reason' }, 400, {}, [], origin)
  if (details.length > 750) return jsonResponse({ error: 'Additional details must be 750 characters or fewer' }, 400, {}, [], origin)

  const [reporter, reported] = await Promise.all([fetchProfileBrief(user.id), fetchProfileBrief(peerId)])
  const res = await fetch(`${SUPABASE_URL}/rest/v1/user_reports`, {
    method: 'POST',
    headers: { ...authHeaders(true), Prefer: 'return=minimal' },
    body: JSON.stringify([{
      reporter_id: user.id,
      reporter_username: reporter?.username || '',
      reported_id: peerId,
      reported_username: reported?.username || '',
      conversation_id: convo.id,
      reason,
      details,
    }]),
  })
  if (!res.ok) {
    console.error('User report failed:', await res.text().catch(() => ''))
    return jsonResponse({ error: 'Failed to submit report' }, 500, {}, [], origin)
  }
  return jsonResponse({ status: 'report_submitted' }, 200, {}, [], origin)
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
  if (isRoute('username-check') && req.method === 'GET') return handleUsernameCheck(req, url)
  if (isRoute('resend') && req.method === 'POST') return handleResend(req)
  if (isRoute('verify') && req.method === 'POST') return handleVerify(req)
  if (isRoute('forgot') && req.method === 'POST') return handleForgot(req)
  if (isRoute('reset') && req.method === 'POST') return handleReset(req)
  if (isRoute('profile') && req.method === 'GET') return handleGetProfile(req)
  if (isRoute('profile') && req.method === 'POST') return handleProfile(req)
  if (isRoute('post-upload-urls') && req.method === 'POST') return handlePostUploadUrls(req)
  if (isRoute('posts') && req.method === 'POST') return handleCreatePost(req)
  if (isRoute('payout-account') && req.method === 'GET') return handleGetPayoutAccount(req)
  if (isRoute('payout-account') && req.method === 'POST') return handleSavePayoutAccount(req)
  if (isRoute('support-tickets') && req.method === 'GET') return handleGetSupportTickets(req)
  if (isRoute('support-tickets') && req.method === 'POST') return handleCreateSupportTicket(req)
  if (isRoute('post') && req.method === 'GET') return handleGetPost(req, url)
  if (isRoute('post-like') && req.method === 'POST') return handleTogglePostLike(req)
  if (isRoute('post-update') && req.method === 'POST') return handleUpdatePost(req)
  if (isRoute('post-delete') && req.method === 'POST') return handleDeletePost(req)
  if (isRoute('post-report') && req.method === 'POST') return handleReportPost(req)
  if (isRoute('post-checkout') && req.method === 'POST') return handlePostCheckout(req)
  if (isRoute('post-verify-payment') && req.method === 'POST') return handleVerifyPostPayment(req)
  if (isRoute('notifications') && req.method === 'GET') return handleGetNotifications(req)
  if (isRoute('notifications-read') && req.method === 'POST') return handleMarkNotificationsRead(req)
  if (isRoute('conversations') && req.method === 'GET') return handleGetConversations(req)
  if (isRoute('conversations') && req.method === 'POST') return handleCreateConversation(req)
  if (isRoute('conversation-accept') && req.method === 'POST') return handleAcceptConversation(req)
  if (isRoute('user-search') && req.method === 'GET') return handleUserSearch(req, url)
  if (isRoute('messages') && req.method === 'GET') return handleGetMessages(req, url)
  if (isRoute('messages') && req.method === 'POST') return handleSendMessage(req)
  if (isRoute('chat-upload-url') && req.method === 'POST') return handleChatUploadUrl(req)
  if (isRoute('message-view-once') && req.method === 'POST') return handleViewOnceMessage(req)
  if (isRoute('message-delete') && req.method === 'POST') return handleDeleteMessages(req)
  if (isRoute('chat-delete') && req.method === 'POST') return handleDeleteChat(req)
  if (isRoute('chat-block') && req.method === 'POST') return handleBlockUser(req)
  if (isRoute('chat-report') && req.method === 'POST') return handleReportUser(req)

  return jsonResponse({ error: 'Not Found' }, 404, {}, [], req.headers.get('origin'))
})
