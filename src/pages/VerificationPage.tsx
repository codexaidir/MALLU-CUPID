import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import {
  LogOut, LayoutDashboard, Bell, ShieldCheck, Wallet, Inbox, ArrowLeft,
  AlertCircle, Building2, Check, Loader2, Clock3,
} from "lucide-react";
import { getPayoutAccount, savePayoutAccount, type PayoutAccount } from "../lib/auth";
import { useAuth } from "../lib/useAuth";

export default function VerificationPage() {
  const { username } = useParams<{ username: string }>();
  const base = `/${username}`;
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const [account, setAccount] = useState<PayoutAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ account_holder: "", account_number: "", ifsc: "", upi_id: "" });

  useEffect(() => {
    (async () => {
      const response = await getPayoutAccount();
      if (response.account) {
        setAccount(response.account);
        setForm({
          account_holder: response.account.account_holder,
          account_number: "",
          ifsc: response.account.ifsc,
          upi_id: response.account.upi_id,
        });
      }
      setIsLoading(false);
    })();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaved(false);
    setIsSaving(true);
    const response = await savePayoutAccount(form);
    setIsSaving(false);
    if (response.error) {
      setError(response.error);
      return;
    }
    if (response.account) {
      setAccount(response.account);
      setSaved(true);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 pt-14 pb-20 md:pt-0 md:pb-0 md:pl-20">
      <div className="hidden md:flex fixed left-0 top-0 bottom-0 w-20 bg-white border-r border-zinc-200 flex-col items-center py-6 z-40">
        <Link to={base} className="p-3 text-zinc-500 hover:bg-zinc-50 rounded-xl"><LayoutDashboard className="w-6 h-6" /></Link>
        <Link to={`${base}/inbox`} className="p-3 text-zinc-500 hover:bg-zinc-50 rounded-xl mt-2"><Inbox className="w-6 h-6" /></Link>
        <Link to={`${base}/notifications`} className="p-3 text-zinc-500 hover:bg-zinc-50 rounded-xl mt-2"><Bell className="w-6 h-6" /></Link>
        <Link to={`${base}/wallet`} className="p-3 text-zinc-500 hover:bg-zinc-50 rounded-xl mt-2"><Wallet className="w-6 h-6" /></Link>
        <Link to={`${base}/verification`} className="p-3 bg-zinc-100 text-zinc-900 rounded-xl mt-2"><ShieldCheck className="w-6 h-6" /></Link>
        <button onClick={handleSignOut} className="mt-auto p-3 text-zinc-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl"><LogOut className="w-6 h-6" /></button>
      </div>

      <main className="container mx-auto px-4 max-w-xl py-6 md:py-10">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(base)} className="p-2 -ml-2 rounded-full hover:bg-zinc-100 md:hidden" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-zinc-900">Verification</h1>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-6 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-zinc-900">Identity verification</h2>
              <p className="text-sm text-zinc-500 mt-1 leading-6">
                Mobile OTP and selfie KYC are not enabled yet. Payout bank details below are live and stored securely in the database.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-rose-500" />
            <h2 className="font-bold text-zinc-900">Payout bank details</h2>
          </div>

          {isLoading ? (
            <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-rose-500" /></div>
          ) : (
            <form onSubmit={handleSaveBank} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}
              {saved && (
                <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 rounded-xl p-3">
                  <Check className="w-4 h-4 shrink-0" /> Bank details saved.
                </div>
              )}
              {account?.has_account && !saved && (
                <p className="text-xs text-zinc-500">Current account on file {account.account_number_masked}.</p>
              )}
              <div>
                <label className="text-sm font-medium text-zinc-700">Account holder</label>
                <input required value={form.account_holder} onChange={(e) => setForm({ ...form, account_holder: e.target.value })}
                  className="mt-1 w-full h-11 px-3 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700">Account number</label>
                <input required value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value.replace(/\D/g, "") })}
                  placeholder={account?.has_account ? `Re-enter (saved ${account.account_number_masked})` : "9-18 digits"}
                  className="mt-1 w-full h-11 px-3 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700">IFSC</label>
                <input required value={form.ifsc} onChange={(e) => setForm({ ...form, ifsc: e.target.value.toUpperCase() })}
                  className="mt-1 w-full h-11 px-3 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700">UPI ID (optional)</label>
                <input value={form.upi_id} onChange={(e) => setForm({ ...form, upi_id: e.target.value })}
                  className="mt-1 w-full h-11 px-3 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500" />
              </div>
              <button type="submit" disabled={isSaving}
                className="w-full h-12 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 disabled:opacity-50 flex items-center justify-center gap-2">
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save payout details"}
              </button>
            </form>
          )}
        </motion.div>
      </main>
    </div>
  );
}
