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

export async function userLogin(email: string, password: string) {
  return apiPost('/user-login', { email, password });
}

export async function userSignup(email: string, name: string, password: string, redirectSlug: string) {
  return apiPost('/user-signup', {
    email,
    name,
    password,
    redirect_slug: redirectSlug,
  });
}

export async function userVerify(email: string, token: string) {
  return apiPost('/user-verify', { email, token });
}

export async function userResend(email: string) {
  return apiPost('/user-resend', { email });
}

export async function userForgot(email: string, redirectSlug: string) {
  return apiPost('/user-forgot', { email, redirect_slug: redirectSlug });
}

export async function userReset(email: string, token: string, password: string) {
  return apiPost('/user-reset', { email, token, password });
}

export async function logout() {
  return apiPost('/logout', {});
}

export async function signup(email: string, password: string, username: string) {
  return apiPost('/signup', { email, password, username });
}

export const USERNAME_REGEX = /^[A-Za-z0-9._-]{6,25}$/;

export async function checkUsername(username: string): Promise<{
  available?: boolean;
  reason?: 'invalid' | 'taken';
  error?: string;
}> {
  return apiGet(`/username-check?u=${encodeURIComponent(username)}`);
}

export async function verifyOtp(email: string, token: string) {
  return apiPost('/verify', { email, token });
}

export async function resendOtp(email: string) {
  return apiPost('/resend', { email });
}

export async function forgotPassword(email: string) {
  return apiPost('/forgot', { email });
}

export async function resetPassword(email: string, token: string, password: string) {
  return apiPost('/reset', { email, token, password });
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
  public_serial: number;
}

/** Public creator page slug for a profile: <username><5-digit serial>. */
export function publicProfileSlug(profile: Pick<Profile, 'username' | 'public_serial'>): string {
  return `${profile.username}${String(profile.public_serial).padStart(5, '0')}`;
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
  like_count: number;
  view_count: number;
  created_at: string;
}

export interface PayoutAccount {
  account_holder: string;
  account_number_last4: string;
  account_number_masked: string;
  ifsc: string;
  upi_id: string;
  updated_at: string | null;
  has_account: boolean;
}

export async function getPayoutAccount(): Promise<{ account?: PayoutAccount | null; error?: string }> {
  return apiGet('/payout-account');
}

export async function savePayoutAccount(data: {
  account_holder: string;
  account_number: string;
  ifsc: string;
  upi_id: string;
}): Promise<{ account?: PayoutAccount; error?: string }> {
  return apiPost('/payout-account', data);
}

export interface WalletSale {
  id: string;
  amount: number;
  amount_paise: number;
  paid_at: string;
  post_public_id: string;
  caption: string;
}

export interface WalletWithdrawal {
  id: string;
  amount: number;
  amount_paise: number;
  status: 'pending' | 'paid' | 'rejected';
  account_holder: string;
  account_number_last4: string;
  ifsc: string;
  created_at: string;
  processed_at: string | null;
}

export interface WalletSummary {
  available_balance: number;
  lifetime_earnings: number;
  held_balance?: number;
  sales_count: number;
  min_withdraw: number;
  withdraw_hold_hours?: number;
  sales?: WalletSale[];
  withdrawals?: WalletWithdrawal[];
  account?: PayoutAccount | null;
  error?: string;
}

export async function getWallet(): Promise<WalletSummary> {
  return apiGet('/wallet');
}

export async function requestWithdraw(amount: number): Promise<{ status?: string; withdrawal?: WalletWithdrawal; error?: string }> {
  return apiPost('/wallet-withdraw', { amount });
}

export interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  admin_reply: string;
  created_at: string;
}

export async function getSupportTickets(): Promise<{ tickets?: SupportTicket[]; error?: string }> {
  return apiGet('/support-tickets');
}

export async function createSupportTicket(
  subject: string,
  message: string,
): Promise<{ ticket?: SupportTicket; error?: string }> {
  return apiPost('/support-tickets', { subject, message });
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

export const REPORT_REASONS = [
  'Nudity or sexual content',
  'Harassment or bullying',
  'Spam or scam',
  'Violence or dangerous content',
  'Hate speech',
  'Intellectual property violation',
  'Impersonation',
  'Other',
] as const;

export interface PostDetail {
  public_id: string;
  caption: string;
  media_type: 'image' | 'video';
  media_urls: string[];
  media_count: number;
  is_paid: boolean;
  price: number;
  created_at: string;
  is_owner: boolean;
  has_access: boolean;
  like_count: number;
  view_count: number;
  liked_by_me: boolean;
  owner: { username: string; full_name: string | null; avatar_url: string | null } | null;
}

export async function getPost(publicId: string): Promise<{ post?: PostDetail; error?: string }> {
  return apiGet(`/post?id=${encodeURIComponent(publicId)}`);
}

export async function togglePostLike(
  publicId: string,
): Promise<{ liked?: boolean; like_count?: number; error?: string }> {
  return apiPost('/post-like', { public_id: publicId });
}

export async function updatePost(data: {
  public_id: string;
  caption: string;
  is_paid: boolean;
  price: number;
}): Promise<{ status?: string; post?: CreatorPost; error?: string }> {
  return apiPost('/post-update', data);
}

export async function deletePost(publicId: string): Promise<{ status?: string; error?: string }> {
  return apiPost('/post-delete', { public_id: publicId });
}

export async function reportPost(
  publicId: string,
  reason: string,
  details: string,
): Promise<{ status?: string; error?: string }> {
  return apiPost('/post-report', { public_id: publicId, reason, details });
}

export interface PostCheckout {
  key_id?: string;
  order_id?: string;
  amount?: number;
  currency?: string;
  post_public_id?: string;
  already_unlocked?: boolean;
  error?: string;
}

export async function checkoutPost(publicId: string): Promise<PostCheckout> {
  return apiPost('/post-checkout', { public_id: publicId });
}

export async function verifyPostPayment(data: {
  public_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<{ status?: string; error?: string }> {
  return apiPost('/post-verify-payment', data);
}

export async function getPostPaymentStatus(
  publicId: string,
  orderId = '',
): Promise<{ status?: 'paid' | 'processing' | 'unpaid'; has_access?: boolean; error?: string }> {
  const query = new URLSearchParams({ public_id: publicId });
  if (orderId) query.set('order_id', orderId);
  return apiGet(`/post-payment-status?${query.toString()}`);
}

export interface ConversationItem {
  id: string;
  status: 'pending' | 'accepted';
  is_request: boolean;
  other: { username: string; full_name: string; avatar_url: string };
  last_message: { preview: string; created_at: string };
  unread: number;
  last_message_at: string;
}

export interface ChatMessage {
  id: string;
  sender_is_me: boolean;
  body: string;
  media_type: '' | 'image' | 'video';
  media_url: string;
  is_once: boolean;
  once_state: 'none' | 'available' | 'opened' | 'sent';
  seen_at: string | null;
  created_at: string;
}

export interface ChatConversation {
  id: string;
  status: 'pending' | 'accepted';
  is_request: boolean;
  blocked_by_me: boolean;
  can_send: boolean;
  other: { username: string; full_name: string | null; avatar_url: string | null };
}

export async function getConversations(): Promise<{ conversations?: ConversationItem[]; error?: string }> {
  return apiGet('/conversations');
}

export interface PublicProfilePost {
  public_id: string;
  media_type: 'image' | 'video';
  is_paid: boolean;
  price: number;
  media_url: string;
  media_count: number;
  like_count: number;
  view_count: number;
}

export interface PublicProfileData {
  profile: {
    username: string;
    full_name: string;
    avatar_url: string;
    bio: string;
    serial: string;
  };
  stats: { posts: number; followers: number };
  viewer: {
    authenticated: boolean;
    role: 'creator' | 'user' | '';
    is_following: boolean;
  };
  posts: PublicProfilePost[];
}

/** Guest endpoint: no auth required. Slug is <username><5-digit serial>. */
export async function getPublicProfile(slug: string): Promise<Partial<PublicProfileData> & { error?: string }> {
  return apiGet(`/public-profile?slug=${encodeURIComponent(slug)}`);
}

export async function togglePublicFollow(slug: string): Promise<{ following?: boolean; error?: string }> {
  return apiPost('/public-follow', { slug });
}

export interface NotificationItem {
  id: string;
  type: 'like' | 'purchase' | 'request' | 'accept' | 'follow';
  read: boolean;
  created_at: string;
  actor: { username: string; full_name: string | null; avatar_url: string | null };
  post_public_id: string | null;
  post_caption: string | null;
  conversation_id: string | null;
}

export async function getNotifications(): Promise<{
  notifications?: NotificationItem[];
  unread_count?: number;
  error?: string;
}> {
  return apiGet('/notifications');
}

export async function markNotificationsRead(): Promise<{ status?: string; error?: string }> {
  return apiPost('/notifications-read', {});
}

export async function searchUsers(q: string): Promise<{ users?: { username: string; full_name: string; avatar_url: string }[]; error?: string }> {
  return apiGet(`/user-search?q=${encodeURIComponent(q)}`);
}

export async function startConversation(username: string): Promise<{ conversation_id?: string; existing?: boolean; error?: string }> {
  return apiPost('/conversations', { username });
}

export async function acceptConversation(conversationId: string): Promise<{ status?: string; error?: string }> {
  return apiPost('/conversation-accept', { conversation_id: conversationId });
}

export async function getMessages(conversationId: string): Promise<{
  conversation?: ChatConversation;
  messages?: ChatMessage[];
  error?: string;
}> {
  return apiGet(`/messages?conversation_id=${encodeURIComponent(conversationId)}`);
}

export async function sendMessage(data: {
  conversation_id: string;
  body: string;
  media_path?: string;
  media_type?: 'image' | 'video' | '';
  is_once?: boolean;
}): Promise<{ status?: string; message?: ChatMessage; error?: string }> {
  return apiPost('/messages', data);
}

export async function getChatUploadUrl(
  conversationId: string,
  contentType: string,
  size: number,
): Promise<{ path?: string; upload_url?: string; media_type?: 'image' | 'video'; error?: string }> {
  return apiPost('/chat-upload-url', { conversation_id: conversationId, content_type: contentType, size });
}

export async function viewOnceMessage(messageId: string): Promise<{ media_url?: string; media_type?: string; error?: string }> {
  return apiPost('/message-view-once', { message_id: messageId });
}

export async function deleteMessages(
  conversationId: string,
  messageIds: string[],
  mode: 'me' | 'both',
): Promise<{ status?: string; error?: string }> {
  return apiPost('/message-delete', { conversation_id: conversationId, message_ids: messageIds, mode });
}

export async function deleteChat(conversationId: string, mode: 'me' | 'both'): Promise<{ status?: string; error?: string }> {
  return apiPost('/chat-delete', { conversation_id: conversationId, mode });
}

export async function blockChatUser(conversationId: string, block: boolean): Promise<{ status?: string; error?: string }> {
  return apiPost('/chat-block', { conversation_id: conversationId, block });
}

export async function reportChatUser(
  conversationId: string,
  reason: string,
  details: string,
): Promise<{ status?: string; error?: string }> {
  return apiPost('/chat-report', { conversation_id: conversationId, reason, details });
}

export async function getProfile(): Promise<{
  profile?: Profile;
  stats?: ProfileStats;
  posts?: CreatorPost[];
  error?: string;
}> {
  return apiGet('/profile');
}

// Note: username is intentionally not accepted — it is permanent after signup
export async function updateProfile(data: {
  full_name?: string;
  bio?: string;
  location?: string;
  instagram_url?: string;
  facebook_url?: string;
  gender?: Profile['gender'];
  avatar_url?: string;
  avatar_base64?: string;
  avatar_content_type?: string;
}) {
  return apiPost('/profile', data);
}