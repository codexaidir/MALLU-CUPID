const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase URL or anon key');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
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

const handleSignup = async (event) => {
  const { email, password, username } = JSON.parse(event.body || '{}');
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
    },
  });
  if (error) return jsonResponse({ error: error.message }, 400);
  if (RESEND_API_KEY) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'welcome@mallucupid.com',
        to: [email],
        subject: 'Welcome to MalluCupid',
        html: `<p>Welcome to MalluCupid. Please verify your email to continue.</p>`,
      }),
    });
  }
  return jsonResponse({ user: data.user, status: 'signup_pending' }, 200);
};

const handleVerify = async (event) => {
  const { token } = JSON.parse(event.body || '{}');
  const { data, error } = await supabase.auth.verifyOtp({ token, type: 'signup' });
  if (error) return jsonResponse({ error: error.message }, 400);
  return jsonResponse({ status: 'verified' }, 200);
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

  return jsonResponse({ error: 'Not Found' }, 404);
};
