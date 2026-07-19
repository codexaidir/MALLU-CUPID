import { motion } from "motion/react";
import { Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-white">
      {/* Background gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-rose-100/50 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-100/50 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display text-5xl md:text-7xl font-bold tracking-tight text-zinc-900 mb-6 leading-tight"
          >
            Turn Your Passion Into Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-purple-600">Profession</span>
          </motion.h1>
          

          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/signup" className="group relative flex h-14 items-center justify-center gap-3 rounded-full bg-[#E5164B] px-10 text-sm font-bold tracking-wider uppercase text-white transition-all hover:bg-[#D41040] hover:scale-105 active:scale-95 w-full sm:w-auto shadow-lg shadow-rose-500/20">
              JOIN AS CREATOR
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
