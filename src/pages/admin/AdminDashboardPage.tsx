import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import {
  LayoutDashboard, Users, Image, LifeBuoy, Flag, Wallet, LogOut, Menu, X,
  Loader2, Trash2, CheckCircle2, XCircle, RefreshCw,
} from "lucide-react";
import { useAuth } from "../../lib/useAuth";
import {
  type AdminTab, type AdminStats, type AdminUserRow, type AdminPostRow,
  type AdminTicketRow, type AdminPostReportRow, type AdminUserReportRow,
  type AdminWithdrawalRow,
  getAdminStats, getAdminUsers, getAdminPosts, adminDeletePost,
  getAdminTickets, adminUpdateTicket, getAdminPostReports, getAdminUserReports,
  getAdminWithdrawals, adminProcessWithdrawal,
} from "../../lib/admin";
import { BrandLogo } from "../../components/BrandMark";

const TABS: { id: AdminTab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "posts", label: "Posts", icon: Image },
  { id: "help", label: "Help", icon: LifeBuoy },
  { id: "reports", label: "Reports", icon: Flag },
  { id: "withdrawals", label: "Withdrawals", icon: Wallet },
];

const fmtDate = (iso: string) => new Date(iso).toLocaleString(undefined, {
  day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
});

export default function AdminDashboardPage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();

  const adminId = username?.match(
    /^admin([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i,
  )?.[1] || "";

  const [tab, setTab] = useState<AdminTab>("overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [posts, setPosts] = useState<AdminPostRow[]>([]);
  const [tickets, setTickets] = useState<AdminTicketRow[]>([]);
  const [postReports, setPostReports] = useState<AdminPostReportRow[]>([]);
  const [userReports, setUserReports] = useState<AdminUserReportRow[]>([]);
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawalRow[]>([]);

  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [statusDrafts, setStatusDrafts] = useState<Record<string, AdminTicketRow["status"]>>({});

  const isAdmin = user?.user_metadata?.role === "admin";
  const idOk = Boolean(adminId && user?.id && adminId === user.id);

  const loadTab = useCallback(async (active: AdminTab) => {
    setError("");
    setBusy(true);
    try {
      if (active === "overview") {
        const r = await getAdminStats();
        if (r.error) setError(r.error);
        else setStats(r.stats || null);
      } else if (active === "users") {
        const r = await getAdminUsers();
        if (r.error) setError(r.error);
        else setUsers(r.users || []);
      } else if (active === "posts") {
        const r = await getAdminPosts();
        if (r.error) setError(r.error);
        else setPosts(r.posts || []);
      } else if (active === "help") {
        const r = await getAdminTickets();
        if (r.error) setError(r.error);
        else {
          const rows = r.tickets || [];
          setTickets(rows);
          const replies: Record<string, string> = {};
          const statuses: Record<string, AdminTicketRow["status"]> = {};
          for (const t of rows) {
            replies[t.id] = t.admin_reply || "";
            statuses[t.id] = t.status;
          }
          setReplyDrafts(replies);
          setStatusDrafts(statuses);
        }
      } else if (active === "reports") {
        const [pr, ur] = await Promise.all([getAdminPostReports(), getAdminUserReports()]);
        if (pr.error || ur.error) setError(pr.error || ur.error || "Failed to load reports");
        else {
          setPostReports(pr.reports || []);
          setUserReports(ur.reports || []);
        }
      } else if (active === "withdrawals") {
        const r = await getAdminWithdrawals();
        if (r.error) setError(r.error);
        else setWithdrawals(r.withdrawals || []);
      }
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && isAdmin && idOk) loadTab(tab);
  }, [loading, isAdmin, idOk, tab, loadTab]);

  const handleLogout = async () => {
    await signOut();
    navigate("/adminlogin", { replace: true });
  };

  const handleDeletePost = async (publicId: string) => {
    if (!window.confirm("Delete this post permanently?")) return;
    setBusy(true);
    const r = await adminDeletePost(publicId);
    setBusy(false);
    if (r.error) setError(r.error);
    else loadTab("posts");
  };

  const handleSaveTicket = async (ticket: AdminTicketRow) => {
    setBusy(true);
    const r = await adminUpdateTicket(
      ticket.id,
      statusDrafts[ticket.id] || ticket.status,
      replyDrafts[ticket.id] || "",
    );
    setBusy(false);
    if (r.error) setError(r.error);
    else loadTab("help");
  };

  const handleWithdrawal = async (id: string, status: "paid" | "rejected") => {
    if (!window.confirm(`Mark withdrawal as ${status}?`)) return;
    setBusy(true);
    const r = await adminProcessWithdrawal(id, status);
    setBusy(false);
    if (r.error) setError(r.error);
    else loadTab("withdrawals");
  };

  const activeLabel = useMemo(() => TABS.find((t) => t.id === tab)?.label || "Admin", [tab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin) return <Navigate to="/adminlogin" replace />;
  if (!idOk) return <Navigate to={`/admin${user.id}`} replace />;

  const StatCard = ({ label, value }: { label: string; value: number }) => (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
      <p className="text-zinc-400 text-xs font-medium uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-zinc-800 bg-zinc-900/50 p-4">
        <BrandLogo className="h-8 w-auto mb-8" />
        <nav className="space-y-1 flex-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  tab === t.id ? "bg-rose-500/15 text-rose-300" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 px-4 py-3 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-zinc-800"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-zinc-500">MalluCupid Admin</p>
            <h1 className="font-bold text-white truncate">{activeLabel}</h1>
          </div>
          <button
            type="button"
            onClick={() => loadTab(tab)}
            disabled={busy}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400"
            aria-label="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${busy ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="lg:hidden p-2 rounded-lg hover:bg-zinc-800 text-zinc-400"
            aria-label="Sign out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        {/* Mobile nav drawer */}
        {menuOpen && (
          <div className="lg:hidden fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black/60" onClick={() => setMenuOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-72 bg-zinc-900 border-r border-zinc-800 p-4 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <BrandLogo className="h-8 w-auto" />
                <button onClick={() => setMenuOpen(false)} className="p-2 rounded-lg hover:bg-zinc-800">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="space-y-1 flex-1">
                {TABS.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => { setTab(t.id); setMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold ${
                        tab === t.id ? "bg-rose-500/15 text-rose-300" : "text-zinc-400"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {t.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        <main className="flex-1 p-4 lg:p-6 max-w-6xl w-full mx-auto">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
              {error}
            </div>
          )}

          {busy && tab === "overview" && !stats ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
            </div>
          ) : null}

          {tab === "overview" && stats && (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              <StatCard label="Accounts" value={stats.users} />
              <StatCard label="Creators" value={stats.creators} />
              <StatCard label="Posts" value={stats.posts} />
              <StatCard label="Open tickets" value={stats.open_tickets} />
              <StatCard label="Post reports" value={stats.post_reports} />
              <StatCard label="User reports" value={stats.user_reports} />
              <StatCard label="Pending payouts" value={stats.pending_withdrawals} />
            </div>
          )}

          {tab === "users" && (
            <div className="space-y-3">
              {users.map((u) => (
                <div key={u.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-white">{u.name || u.email || u.id.slice(0, 8)}</p>
                      <p className="text-sm text-zinc-400">{u.email}</p>
                      {u.username ? <p className="text-xs text-zinc-500 mt-1">@{u.username}</p> : null}
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-zinc-800 text-zinc-300">
                      {u.role}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600 mt-2">{fmtDate(u.created_at)}</p>
                </div>
              ))}
              {!users.length && !busy && <p className="text-zinc-500 text-center py-12">No users yet.</p>}
            </div>
          )}

          {tab === "posts" && (
            <div className="space-y-3">
              {posts.map((p) => (
                <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white truncate">
                        {p.caption || "(no caption)"}
                      </p>
                      <p className="text-sm text-zinc-400">
                        @{p.creator_username || "unknown"} · {p.media_type}
                        {p.is_paid ? ` · ₹${p.price}` : " · free"}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {p.like_count} likes · {p.view_count} views · {fmtDate(p.created_at)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeletePost(p.public_id)}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 text-red-300 text-sm font-semibold hover:bg-red-500/20"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </div>
              ))}
              {!posts.length && !busy && <p className="text-zinc-500 text-center py-12">No posts yet.</p>}
            </div>
          )}

          {tab === "help" && (
            <div className="space-y-4">
              {tickets.map((t) => (
                <div key={t.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-white">{t.subject}</p>
                      <p className="text-sm text-zinc-400">{t.user_name || t.user_email}</p>
                    </div>
                    <select
                      value={statusDrafts[t.id] || t.status}
                      onChange={(e) => setStatusDrafts((s) => ({
                        ...s,
                        [t.id]: e.target.value as AdminTicketRow["status"],
                      }))}
                      className="bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">{t.message}</p>
                  <textarea
                    value={replyDrafts[t.id] ?? ""}
                    onChange={(e) => setReplyDrafts((d) => ({ ...d, [t.id]: e.target.value }))}
                    placeholder="Admin reply (visible to user)"
                    rows={3}
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveTicket(t)}
                    className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold"
                  >
                    Save reply
                  </button>
                </div>
              ))}
              {!tickets.length && !busy && <p className="text-zinc-500 text-center py-12">No support tickets.</p>}
            </div>
          )}

          {tab === "reports" && (
            <div className="space-y-6">
              <section>
                <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wide mb-3">Post reports</h2>
                <div className="space-y-3">
                  {postReports.map((r) => (
                    <div key={r.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                      <p className="font-semibold text-white">{r.reason}</p>
                      <p className="text-sm text-zinc-400">
                        Post {r.post_public_id} by @{r.owner_username} · reported by @{r.reporter_username}
                      </p>
                      {r.details ? <p className="text-sm text-zinc-300 mt-2">{r.details}</p> : null}
                      <p className="text-xs text-zinc-600 mt-2">{fmtDate(r.created_at)}</p>
                    </div>
                  ))}
                  {!postReports.length && <p className="text-zinc-500 text-sm">No post reports.</p>}
                </div>
              </section>
              <section>
                <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wide mb-3">User reports</h2>
                <div className="space-y-3">
                  {userReports.map((r) => (
                    <div key={r.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                      <p className="font-semibold text-white">{r.reason}</p>
                      <p className="text-sm text-zinc-400">
                        @{r.reporter_username} reported @{r.reported_username}
                      </p>
                      {r.details ? <p className="text-sm text-zinc-300 mt-2">{r.details}</p> : null}
                      <p className="text-xs text-zinc-600 mt-2">{fmtDate(r.created_at)}</p>
                    </div>
                  ))}
                  {!userReports.length && <p className="text-zinc-500 text-sm">No user reports.</p>}
                </div>
              </section>
            </div>
          )}

          {tab === "withdrawals" && (
            <div className="space-y-3">
              {withdrawals.map((w) => (
                <div key={w.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-white">₹{w.amount}</p>
                      <p className="text-sm text-zinc-400">{w.creator_name || w.creator_email}</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {w.account_holder} · ••••{w.account_number_last4} · {w.ifsc}
                      </p>
                      <p className="text-xs text-zinc-600 mt-1">{fmtDate(w.created_at)} · {w.status}</p>
                    </div>
                    {w.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleWithdrawal(w.id, "paid")}
                          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-500/15 text-emerald-300 text-sm font-semibold"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Paid
                        </button>
                        <button
                          type="button"
                          onClick={() => handleWithdrawal(w.id, "rejected")}
                          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-red-500/15 text-red-300 text-sm font-semibold"
                        >
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {!withdrawals.length && !busy && <p className="text-zinc-500 text-center py-12">No withdrawals.</p>}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
