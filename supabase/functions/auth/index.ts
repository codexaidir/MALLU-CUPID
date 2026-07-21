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
  if (username && !/^[^\s]{6,25}$/.test(username)) {
    return jsonResponse({ error: 'Username must be 6-25 characters without spaces' }, 400, {}, [], origin)
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
    const usernameCheck = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?username=eq.${encodeURIComponent(username)}&id=neq.${user.id}&select=id&limit=1`,
      { headers: { ...authHeaders(true) } },
    )
    if (!usernameCheck.ok) return jsonResponse({ error: 'Failed to validate username' }, 500, {}, [], origin)
    const existing = await usernameCheck.json().catch(() => [])
    if (Array.isArray(existing) && existing.length) {
      return jsonResponse({ error: 'Username is already taken' }, 409, {}, [], origin)
    }
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
  if (isRoute('profile') && req.method === 'GET') return handleGetProfile(req)
  if (isRoute('profile') && req.method === 'POST') return handleProfile(req)
  if (isRoute('post-upload-urls') && req.method === 'POST') return handlePostUploadUrls(req)
  if (isRoute('posts') && req.method === 'POST') return handleCreatePost(req)
  if (isRoute('payout-account') && req.method === 'GET') return handleGetPayoutAccount(req)
  if (isRoute('payout-account') && req.method === 'POST') return handleSavePayoutAccount(req)
  if (isRoute('support-tickets') && req.method === 'GET') return handleGetSupportTickets(req)
  if (isRoute('support-tickets') && req.method === 'POST') return handleCreateSupportTicket(req)

  return jsonResponse({ error: 'Not Found' }, 404, {}, [], req.headers.get('origin'))
})
