import { apiGet, apiPost } from "./auth";

export type AdminTab = "overview" | "users" | "posts" | "help" | "reports" | "withdrawals";

export interface AdminStats {
  users: number;
  creators: number;
  posts: number;
  open_tickets: number;
  post_reports: number;
  user_reports: number;
  pending_withdrawals: number;
}

export interface AdminUserRow {
  id: string;
  role: string;
  name: string;
  email: string;
  username: string;
  created_at: string;
}

export interface AdminPostRow {
  id: string;
  public_id: string;
  caption: string;
  media_type: string;
  is_paid: boolean;
  price: number;
  creator_id: string;
  creator_username: string;
  like_count: number;
  view_count: number;
  created_at: string;
}

export interface AdminTicketRow {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "resolved";
  admin_reply: string;
  created_at: string;
  updated_at: string;
}

export interface AdminPostReportRow {
  id: string;
  post_public_id: string;
  owner_username: string;
  reporter_username: string;
  reason: string;
  details: string;
  created_at: string;
}

export interface AdminUserReportRow {
  id: string;
  reporter_username: string;
  reported_username: string;
  reason: string;
  details: string;
  created_at: string;
}

export interface AdminWithdrawalRow {
  id: string;
  creator_id: string;
  creator_name: string;
  creator_email: string;
  amount_paise: number;
  amount: number;
  status: string;
  account_holder: string;
  account_number_last4: string;
  ifsc: string;
  upi_id: string;
  note: string;
  created_at: string;
  processed_at: string | null;
}

export async function adminLogin(email: string, password: string) {
  return apiPost("/admin-login", { email, password });
}

export async function getAdminStats(): Promise<{ stats?: AdminStats; error?: string }> {
  return apiGet("/admin/stats");
}

export async function getAdminUsers(): Promise<{ users?: AdminUserRow[]; error?: string }> {
  return apiGet("/admin/users");
}

export async function getAdminPosts(): Promise<{ posts?: AdminPostRow[]; error?: string }> {
  return apiGet("/admin/posts");
}

export async function adminDeletePost(publicId: string) {
  return apiPost("/admin/posts/delete", { public_id: publicId });
}

export async function getAdminTickets(): Promise<{ tickets?: AdminTicketRow[]; error?: string }> {
  return apiGet("/admin/support-tickets");
}

export async function adminUpdateTicket(
  id: string,
  status: AdminTicketRow["status"],
  adminReply: string,
) {
  return apiPost("/admin/support-tickets/update", { id, status, admin_reply: adminReply });
}

export async function getAdminPostReports(): Promise<{ reports?: AdminPostReportRow[]; error?: string }> {
  return apiGet("/admin/reports/posts");
}

export async function getAdminUserReports(): Promise<{ reports?: AdminUserReportRow[]; error?: string }> {
  return apiGet("/admin/reports/users");
}

export async function getAdminWithdrawals(): Promise<{ withdrawals?: AdminWithdrawalRow[]; error?: string }> {
  return apiGet("/admin/withdrawals");
}

export async function adminProcessWithdrawal(
  withdrawalId: string,
  status: "paid" | "rejected",
  note = "",
) {
  return apiPost("/admin-wallet-withdraw", { withdrawal_id: withdrawalId, status, note });
}
