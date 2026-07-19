import { Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-black/5 bg-white py-12 px-6 lg:px-12 mt-20">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-rose-500 fill-rose-500" />
          <span className="font-display text-lg font-bold text-zinc-900">MalluCupid</span>
        </div>
        
        <div className="flex gap-8 text-sm font-medium text-zinc-500">
          <a href="#" className="hover:text-zinc-900 transition-colors">Privacy</a>
          <a href="#" className="hover:text-zinc-900 transition-colors">Terms</a>
          <a href="#" className="hover:text-zinc-900 transition-colors">Contact</a>
        </div>
        
        <div className="text-sm text-zinc-500">
          &copy; {new Date().getFullYear()} MalluCupid. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
