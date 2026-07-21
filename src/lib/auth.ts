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
  location: string;
  instagram_url: string;
  facebook_url: string;
  gender: 'Prefer not to say' | 'Male' | 'Female' | 'Transgender';
  is_private: boolean;
}

export interface ProfileStats {
  posts: number;
  followers: number;
  following: number;
}

export interface CreatorPost {
  id: string;
  public_id: string;
  caption: string;
  media_type: 'image' | 'video';
  media_url: string;
  media_urls: string[];
  media_count: number;
  is_paid: boolean;
  price: number;
  created_at: string;
}

export interface PostUpload {
  path: string;
  upload_url: string;
  content_type: string;
}

export async function createPostUploadUrls(
  mediaType: 'image' | 'video',
  files: { content_type: string; size: number }[],
): Promise<{ post_public_id?: string; uploads?: PostUpload[]; error?: string }> {
  return apiPost('/post-upload-urls', { media_type: mediaType, files });
}

export async function createPost(data: {
  public_id: string;
  caption: string;
  media_type: 'image' | 'video';
  media_paths: string[];
  is_paid: boolean;
  price: number;
}): Promise<{ status?: string; post?: CreatorPost; error?: string }> {
  return apiPost('/posts', data);
}

export function uploadFileWithProgress(
  uploadUrl: string,
  file: Blob,
  contentType: string,
  onProgress: (loaded: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.setRequestHeader('x-upsert', 'true');
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(file.size);
        resolve();
      } else {
        reject(new Error(`Upload failed (${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error('Upload failed'));
    xhr.send(file);
  });
}

export async function getProfile(): Promise<{
  profile?: Profile;
  stats?: ProfileStats;
  posts?: CreatorPost[];
  error?: string;
}> {
  return apiGet('/profile');
}

export async function updateProfile(data: {
  username?: string;
  full_name?: string;
  bio?: string;
  location?: string;
  instagram_url?: string;
  facebook_url?: string;
  gender?: Profile['gender'];
  is_private?: boolean;
  avatar_url?: string;
  avatar_base64?: string;
  avatar_content_type?: string;
}) {
  return apiPost('/profile', data);
}