import React from 'react';
import { LayoutDashboard, MessageCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

export function MobileHeader() {
  const navigate = useNavigate();
  const { username } = useParams<{ username: string }>();
  const base = username ? `/${username}` : '/dashboard';

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-zinc-200 z-[100] flex items-center justify-between px-4">
      <button onClick={() => navigate(base)} className="active:opacity-70 transition-opacity" aria-label="Home">
        <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center">
          <LayoutDashboard className="w-4 h-4 text-white" />
        </div>
      </button>
      <button
        onClick={() => navigate(`${base}/inbox`)}
        className="p-2 -mr-2 text-zinc-900 active:opacity-70 transition-opacity"
        aria-label="Messages"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    </header>
  );
}
