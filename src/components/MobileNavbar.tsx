import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Bell, Plus, Wallet, Grid } from 'lucide-react';

export function MobileNavbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Grid, label: 'Feed', path: '/dashboard' },
    { icon: Bell, label: 'Alerts', path: '/notifications', onClick: () => alert('Notifications coming soon') },
    { icon: Plus, label: 'Post', path: '/create-post', isPrimary: true },
    { icon: Wallet, label: 'Wallet', path: '/wallet', onClick: () => alert('Wallet coming soon') },
    { icon: LayoutDashboard, label: 'Profile', path: '/dashboard' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-zinc-200 z-[100] flex items-center justify-around px-2 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
      {navItems.map((item, index) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;

        if (item.isPrimary) {
          return (
            <button
              key={index}
              onClick={() => navigate(item.path)}
              className="relative -top-5 w-12 h-12 bg-zinc-900 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            >
              <Icon className="w-6 h-6" />
            </button>
          );
        }

        return (
          <button
            key={index}
            onClick={() => {
              if (item.onClick) {
                item.onClick();
              } else {
                navigate(item.path);
              }
            }}
            className={`flex flex-col items-center justify-center w-12 h-full transition-colors ${
              isActive ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <Icon className={`w-6 h-6 ${isActive ? 'fill-zinc-900/10' : ''}`} />
          </button>
        );
      })}
    </div>
  );
}
