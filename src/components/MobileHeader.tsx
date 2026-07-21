import React, { useState } from 'react';
import { LayoutDashboard, LogOut, MessageCircle, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { logout } from '../lib/auth';
import { useAuth } from '../lib/useAuth';

export function MobileHeader() {
  const navigate = useNavigate();
  const { username } = useParams<{ username: string }>();
  const { signOut } = useAuth();
  const base = username ? `/${username}` : '/dashboard';
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    await logout();
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-zinc-200 z-[100] flex items-center justify-between px-4">
      <button onClick={() => navigate(base)} className="active:opacity-70 transition-opacity" aria-label="Home">
        <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center">
          <LayoutDashboard className="w-4 h-4 text-white" />
        </div>
      </button>
      <div className="flex items-center gap-1">
        <button
          onClick={() => navigate(`${base}/inbox`)}
          className="p-2 text-zinc-900 active:opacity-70 transition-opacity"
          aria-label="Messages"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="p-2 -mr-2 text-zinc-900 active:opacity-70 transition-opacity disabled:opacity-50"
          aria-label="Sign out"
        >
          {signingOut ? <Loader2 className="w-6 h-6 animate-spin" /> : <LogOut className="w-6 h-6" />}
        </button>
      </div>
    </header>
  );
}
