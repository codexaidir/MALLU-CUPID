export const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL;
if (!AUTH_API_URL) throw new Error('Missing VITE_AUTH_API_URL');

const defaultHeaders = {
  'Content-Type': 'application/json',
};

export async function apiPost(path: string, body: unknown) {
  const res = await fetch(`${AUTH_API_URL}${path}`, {
    method: 'POST',
    headers: defaultHeaders,
    credentials: 'include',
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function apiGet(path: string) {
  const res = await fetch(`${AUTH_API_URL}${path}`, {
    method: 'GET',
    credentials: 'include',
  });
  return res.json();
}

export async function login(email: string, password: string) {
  return apiPost('/login', { email, password });
}

export async function logout() {
  return apiPost('/logout', {});
}

export async function signup(email: string, password: string, username: string) {
  return apiPost('/signup', { email, password, username });
}

export async function verifyOtp(token: string) {
  return apiPost('/verify', { token });
}

export async function resendOtp(email: string) {
  return apiPost('/resend', { email });
}

export async function forgotPassword(email: string) {
  return apiPost('/forgot', { email });
}

export async function resetPassword(token: string, password: string) {
  return apiPost('/reset', { token, password });
}

export async function getSession() {
  return apiGet('/session');
}

export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
}

export async function getProfile(): Promise<{ profile?: Profile; error?: string }> {
  return apiGet('/profile');
}

export async function updateProfile(data: {
  full_name?: string;
  bio?: string;
  avatar_url?: string;
  avatar_base64?: string;
  avatar_content_type?: string;
}) {
  return apiPost('/profile', data);
}