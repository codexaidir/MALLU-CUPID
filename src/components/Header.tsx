import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { BrandLogo } from "./BrandMark";

export function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 lg:px-12 backdrop-blur-md bg-white/80 border-b border-black/5"
    >
      <div className="flex items-center gap-2">
        <Link to="/" className="flex items-center gap-2" aria-label="MalluCupid home">
          <BrandLogo size="xl" />
        </Link>
      </div>

      <nav className="hidden md:flex items-center gap-8">
        <a href="/#how-it-works" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">How it Works</a>
        <Link to="/signup" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">Become a creator</Link>
      </nav>

      <div className="flex items-center gap-4">
        <Link to="/login" className="rounded-full bg-rose-500 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-rose-600 hover:scale-105 active:scale-95 shadow-lg shadow-rose-500/20">
          Get Started
        </Link>
      </div>
    </motion.header>
  );
}
