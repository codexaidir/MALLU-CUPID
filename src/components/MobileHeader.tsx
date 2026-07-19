import React from 'react';
import { LayoutDashboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function MobileHeader() {
  const navigate = useNavigate();

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-zinc-200 z-[100] flex items-center justify-between px-4">
      <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2">
        <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center">
          <LayoutDashboard className="w-4 h-4 text-white" />
        </div>
        <span className="font-display font-bold text-lg text-zinc-900">Creator Hub</span>
      </button>
    </header>
  );
}
