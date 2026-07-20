const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

// Admin client (service role) for secure server-side operations
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Public client (anon) used to create sessions
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const buildCookie = (name, value, maxAge) => {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
};

const clearCookie = (name) => {
  return `${name}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
};

const parseCookies = (cookieHeader) => {
  if (!cookieHeader) return {};
  return cookieHeader.split(';').reduce((acc, item) => {
    const [key, ...rest] = item.trim().split('=');
    acc[key] = rest.join('=');
    return acc;
  }, {});
};

const jsonResponse = (body, status = 200, headers = {}) => ({
  statusCode: status,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': 'https://www.mallucupid.com',
    'Access-Control-Allow-Credentials': 'true',
    ...headers,
  },
  body: JSON.stringify(body),
});

const handleLogin = async (event) => {
  const { email, password } = JSON.parse(event.body || '{}');
  if (!email || !password) return jsonResponse({ error: 'Missing credentials' }, 400);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return jsonResponse({ error: error.message }, 401);
  const session = data.session;
  if (!session) return jsonResponse({ error: 'Login did not return a session' }, 500);
  const cookies = [
    buildCookie('sb-access-token', session.access_token, session.expires_in),
    buildCookie('sb-refresh-token', session.refresh_token, 60 * 60 * 24 * 30),
  ];
  return jsonResponse({ user: data.user }, 200, { 'Set-Cookie': cookies });
};

const handleLogout = async (event) => {
  const cookies = parseCookies(event.headers?.cookie);
  const refreshToken = cookies['sb-refresh-token'];
  if (refreshToken) {
    await supabase.auth.signOut({ refreshToken });
  }
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': 'https://www.mallucupid.com',
      'Access-Control-Allow-Credentials': 'true',
      'Set-Cookie': [clearCookie('sb-access-token'), clearCookie('sb-refresh-token')],
    },
    body: JSON.stringify({ success: true }),
  };
};

const handleSession = async (event) => {
  const cookies = parseCookies(event.headers?.cookie);
  const accessToken = cookies['sb-access-token'];
  const refreshToken = cookies['sb-refresh-token'];
  if (!accessToken && !refreshToken) return jsonResponse({ user: null }, 200);

  let userResponse = await supabase.auth.getUser(accessToken);
  if (userResponse.error && refreshToken) {
    const refreshResult = await supabase.auth.refreshSession({ refresh_token: refreshToken });
    if (refreshResult.error) return jsonResponse({ user: null }, 200);
    const session = refreshResult.data.session;
    const cookies = [
      buildCookie('sb-access-token', session.access_token, session.expires_in),
      buildCookie('sb-refresh-token', session.refresh_token, 60 * 60 * 24 * 30),
    ];
    userResponse = await supabase.auth.getUser(session.access_token);
    return jsonResponse({ user: userResponse.data.user }, 200, { 'Set-Cookie': cookies });
  }
  return jsonResponse({ user: userResponse.data.user }, 200);
};

const handleProfileUpdate = async (event) => {
  // Require session via cookies
  const cookies = parseCookies(event.headers?.cookie);
  const accessToken = cookies['sb-access-token'];
  if (!accessToken) return jsonResponse({ error: 'Not authenticated' }, 401);

  const userRes = await supabaseAdmin.auth.getUser(accessToken);
  if (userRes.error) return jsonResponse({ error: 'Invalid session' }, 401);
  const user = userRes.data.user;
  if (!user) return jsonResponse({ error: 'User not found' }, 401);

  const { full_name, bio, avatar_url } = JSON.parse(event.body || '{}');
  const update = {};
  if (full_name !== undefined) update.full_name = full_name;
  if (bio !== undefined) update.bio = bio;
  if (avatar_url !== undefined) update.avatar_url = avatar_url;

  const prof = await supabaseAdmin.from('profiles').update(update).eq('id', user.id);
  if (prof.error) return jsonResponse({ error: 'Failed to update profile' }, 500);
  return jsonResponse({ profile: prof.data && prof.data[0] }, 200);
};

const handleSignup = async (event) => {
  // Generate and store OTP; create user after verification
  const { email, password, username } = JSON.parse(event.body || '{}');
  if (!email || !password || !username) return jsonResponse({ error: 'Missing fields' }, 400);

  // Enforce username rules: 6-25 chars, no spaces
  if (!/^[^\s]{6,25}$/.test(username)) return jsonResponse({ error: 'Invalid username format' }, 400);

  // Ensure username uniqueness (check profiles)
  const { data: existing, error: exErr } = await supabaseAdmin.from('profiles').select('id').eq('username', username).limit(1);
  if (exErr) return jsonResponse({ error: 'DB check failed' }, 500);
  if (existing && existing.length > 0) return jsonResponse({ error: 'Username taken' }, 409);

  // Create 6-digit OTP
  const token = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 20).toISOString(); // 20 minutes

  const payload = { username, password };
  const insert = await supabaseAdmin.from('email_verifications').insert([{ email, token, purpose: 'signup', payload, expires_at: expiresAt }]);
  if (insert.error) return jsonResponse({ error: 'Failed to store verification' }, 500);

  // Send OTP via Resend
  if (RESEND_API_KEY) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'welcome@mallucupid.com',
          to: [email],
          subject: 'Your MalluCupid verification code',
          html: `<p>Your verification code: <strong>${token}</strong>. Expires in 20 minutes.</p>`,
        }),
      });
    } catch (e) {
      console.error('Resend send failed', e);
    }
  }

  return jsonResponse({ status: 'verification_sent' }, 200);
};

const handleVerify = async (event) => {
  const { token } = JSON.parse(event.body || '{}');
  if (!token) return jsonResponse({ error: 'Missing token' }, 400);

  const q = await supabaseAdmin.from('email_verifications').select('*').eq('token', token).eq('purpose', 'signup').eq('used', false).limit(1);
  if (q.error) return jsonResponse({ error: 'Lookup failed' }, 500);
  const row = q.data && q.data[0];
  if (!row) return jsonResponse({ error: 'Invalid or used token' }, 400);
  if (new Date(row.expires_at) < new Date()) return jsonResponse({ error: 'Token expired' }, 400);

  const { email } = row;
  const username = row.payload?.username;
  const password = row.payload?.password;

  if (!username || !password) return jsonResponse({ error: 'Invalid payload' }, 500);

  // Create user via admin
  const createRes = await supabaseAdmin.auth.admin.createUser({ email, password, user_metadata: { username } });
  if (createRes.error) return jsonResponse({ error: createRes.error.message || 'Create user failed' }, 500);
  const user = createRes.data.user;

  // Insert profile (id = auth user id)
  const prof = await supabaseAdmin.from('profiles').insert([{ id: user.id, username }]);
  if (prof.error) console.error('Profile create failed', prof.error);

  // Mark token used
  await supabaseAdmin.from('email_verifications').update({ used: true }).eq('id', row.id);

  // Sign in to get session tokens (using anon client)
  const signRes = await supabase.auth.signInWithPassword({ email, password });
  if (signRes.error) {
    // return success without cookie if sign-in fails
    return jsonResponse({ status: 'user_created', user: { id: user.id, email: user.email } }, 200);
  }
  const session = signRes.data.session;
  const cookies = [
    buildCookie('sb-access-token', session.access_token, session.expires_in),
    buildCookie('sb-refresh-token', session.refresh_token, 60 * 60 * 24 * 30),
  ];

  return jsonResponse({ status: 'user_created', user: { id: user.id, email: user.email } }, 200, { 'Set-Cookie': cookies });
};

const handleForgot = async (event) => {
  const { email } = JSON.parse(event.body || '{}');
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) return jsonResponse({ error: error.message }, 400);
  return jsonResponse({ status: 'reset_sent' }, 200);
};

const handleReset = async (event) => {
  const { token, password } = JSON.parse(event.body || '{}');
  const verifyResult = await supabase.auth.verifyOtp({ token, type: 'recovery' });
  if (verifyResult.error) return jsonResponse({ error: verifyResult.error.message }, 400);
  const updateResult = await supabase.auth.updateUser({ password });
  if (updateResult.error) return jsonResponse({ error: updateResult.error.message }, 400);
  return jsonResponse({ status: 'password_updated' }, 200);
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': 'https://www.mallucupid.com',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      },
      body: '',
    };
  }

  const path = event.rawPath || event.path || '';
  if (path.endsWith('/auth/login') && event.httpMethod === 'POST') return handleLogin(event);
  if (path.endsWith('/auth/logout') && event.httpMethod === 'POST') return handleLogout(event);
  if (path.endsWith('/auth/session') && event.httpMethod === 'GET') return handleSession(event);
  if (path.endsWith('/auth/signup') && event.httpMethod === 'POST') return handleSignup(event);
  if (path.endsWith('/auth/verify') && event.httpMethod === 'POST') return handleVerify(event);
  if (path.endsWith('/auth/forgot') && event.httpMethod === 'POST') return handleForgot(event);
  if (path.endsWith('/auth/reset') && event.httpMethod === 'POST') return handleReset(event);
  if (path.endsWith('/auth/profile') && event.httpMethod === 'POST') return handleProfileUpdate(event);

  return jsonResponse({ error: 'Not Found' }, 404);
};
