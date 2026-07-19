export const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || '';

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
