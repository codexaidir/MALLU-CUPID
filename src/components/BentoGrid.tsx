import { motion } from "motion/react";
import { Lock, ShieldCheck, MessageCircleHeart, Users, Zap } from "lucide-react";

export function BentoGrid() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <section className="py-20 px-6 lg:px-12 max-w-7xl mx-auto bg-white" id="features">
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-3 gap-4 md:gap-6"
      >
        {/* Large Feature Card */}
        <motion.div 
          variants={item}
          className="col-span-1 md:col-span-2 md:row-span-2 relative overflow-hidden rounded-[2rem] bg-zinc-50 border border-zinc-100 p-8 md:p-12 group flex flex-col justify-end min-h-[400px] shadow-sm"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-100/80 via-zinc-50/20 to-transparent z-10" />
          
          {/* Abstract Graphic inside */}
          <div className="absolute inset-0 opacity-40 transition-transform duration-700 group-hover:scale-105">
             <div className="absolute top-10 right-10 w-64 h-64 bg-rose-200/50 blur-[80px] rounded-full" />
             <div className="absolute bottom-10 left-10 w-64 h-64 bg-purple-200/50 blur-[80px] rounded-full" />
             {/* Simulating some UI elements */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] border border-zinc-200/50 rounded-2xl flex items-center justify-center backdrop-blur-sm bg-white/40 shadow-sm">
               <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-500 to-purple-500 flex items-center justify-center animate-pulse shadow-md">
                 <Lock className="h-8 w-8 text-white" />
               </div>
             </div>
          </div>

          <div className="relative z-20 mt-auto">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 mb-6 backdrop-blur-md border border-rose-200">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="font-display text-3xl font-bold text-zinc-900 mb-4">Exclusive Content Subscriptions</h3>
            <p className="text-zinc-600 text-lg max-w-md">
              Give your most loyal fans access to premium, behind-the-scenes content through flexible monthly subscription tiers tailored to your audience.
            </p>
          </div>
        </motion.div>

        {/* Small Feature Card 1 */}
        <motion.div 
          variants={item}
          className="col-span-1 md:col-span-1 md:row-span-1 relative overflow-hidden rounded-[2rem] bg-zinc-50 border border-zinc-100 p-8 group shadow-sm"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-600 mb-6 border border-purple-200">
            <MessageCircleHeart className="h-6 w-6" />
          </div>
          <h3 className="font-display text-xl font-bold text-zinc-900 mb-3">Direct Fan Engagement</h3>
          <p className="text-zinc-600 text-sm">
            Connect directly with your audience through private messaging, custom paid requests, and exclusive live streams.
          </p>
        </motion.div>

        {/* Highlight Card */}
        <motion.div 
          variants={item}
          className="col-span-1 md:col-span-1 md:row-span-1 relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-rose-500 to-pink-600 p-8 text-white group shadow-md"
        >
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md mb-6 border border-white/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold mb-2">Creator Protection</h3>
              <p className="text-rose-100 text-sm">
                Advanced content watermarking, anti-screenshot tech, and zero-tolerance piracy policies keep your work safe.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Small Feature Card 2 */}
        <motion.div 
          variants={item}
          className="col-span-1 md:col-span-1 md:row-span-1 relative overflow-hidden rounded-[2rem] bg-zinc-50 border border-zinc-100 p-8 group shadow-sm"
        >
           <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 mb-6 border border-blue-200">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="font-display text-xl font-bold text-zinc-900 mb-3">Keep What You Earn</h3>
          <p className="text-zinc-600 text-sm">
            Creators take home up to 90% of their earnings. We provide the tools you need to build a sustainable, long-term business.
          </p>
        </motion.div>

        {/* Wide Feature Card */}
        <motion.div 
          variants={item}
          className="col-span-1 md:col-span-2 md:row-span-1 relative overflow-hidden rounded-[2rem] bg-zinc-50 border border-zinc-100 p-8 group flex flex-col sm:flex-row items-start sm:items-center gap-8 shadow-sm"
        >
          <div className="flex-1">
            <h3 className="font-display text-2xl font-bold text-zinc-900 mb-3">Deep Audience Analytics</h3>
            <p className="text-zinc-600">
              Understand your fan base better. Track subscription growth, analyze audience demographics, and optimize your content strategy with our insights dashboard.
            </p>
          </div>
          <div className="w-full sm:w-1/3 flex justify-center">
            {/* Visual element */}
            <div className="relative w-32 h-32">
              <div className="absolute inset-0 rounded-full border-4 border-zinc-200" />
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle 
                  cx="50" cy="50" r="46" 
                  fill="none" stroke="url(#rose-gradient)" strokeWidth="8"
                  strokeDasharray="289" strokeDashoffset="40"
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="rose-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f43f5e" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-xl font-bold text-zinc-900">$4.2<span className="text-sm">k</span></span>
                <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">MRR</span>
              </div>
            </div>
          </div>
        </motion.div>

      </motion.div>
    </section>
  );
}
