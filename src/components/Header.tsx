import { motion } from "motion/react";
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";

export function Header() {
  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 lg:px-12 backdrop-blur-md bg-white/80 border-b border-black/5"
    >
      <div className="flex items-center gap-2">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-lg shadow-rose-500/20">
            <Heart className="h-5 w-5 text-white fill-white" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-zinc-900">
            MalluCupid
          </span>
        </Link>
      </div>
      
      <nav className="hidden md:flex items-center gap-8">
        <a href="/#features" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">Features</a>
        <a href="/#how-it-works" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">How it Works</a>
      </nav>

      <div className="flex items-center gap-4">
        <Link to="/login" className="rounded-full bg-rose-500 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-rose-600 hover:scale-105 active:scale-95 shadow-lg shadow-rose-500/20">
          Get Started
        </Link>
      </div>
    </motion.header>
  );
}

