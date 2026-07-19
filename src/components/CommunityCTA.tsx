import { motion } from "motion/react";
import { Users, Heart, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export function CommunityCTA() {
  return (
    <section className="py-24 bg-gradient-to-b from-white to-rose-50/30 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -right-32 w-[500px] h-[500px] bg-pink-200/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-rose-200/20 rounded-full blur-[120px] translate-y-1/3 -translate-x-1/4" />
      </div>

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          {/* Left Visual / Card */}
          <motion.div 
            initial={{ opacity: 0, x: -20, rotate: -2 }}
            whileInView={{ opacity: 1, x: 0, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative order-2 lg:order-1"
          >
            <div className="bg-white rounded-[2.5rem] p-10 md:p-12 shadow-2xl shadow-rose-100/60 border border-rose-100 relative overflow-hidden group">
              <div className="absolute -top-12 -right-12 p-6 opacity-5 group-hover:opacity-10 transition-opacity duration-700 transform group-hover:scale-110">
                <Users className="w-64 h-64 text-rose-600" />
              </div>
              
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 border border-rose-100 px-4 py-1.5 mb-8 shadow-sm">
                  <Sparkles className="h-4 w-4 text-rose-500" />
                  <span className="text-sm font-semibold text-rose-700">Global Audience</span>
                </div>
                
                <h3 className="text-6xl md:text-7xl font-display font-bold text-zinc-900 mb-4 tracking-tight">
                  10M<span className="text-rose-500">+</span>
                </h3>
                <p className="text-2xl font-bold text-zinc-800 mb-3">
                  Monthly Active Fans
                </p>
                <p className="text-zinc-600 text-lg leading-relaxed max-w-sm mb-10">
                  Tap into a rapidly growing network of supporters eager to discover and fund exclusive content.
                </p>
                
                <div className="flex items-center gap-4">
                   <div className="flex -space-x-4">
                     {[1,2,3,4].map((i) => (
                       <div key={i} className="w-14 h-14 rounded-full border-4 border-white bg-zinc-200 overflow-hidden shadow-sm">
                         <img src={`https://i.pravatar.cc/150?img=${i + 15}`} alt="User" className="w-full h-full object-cover" />
                       </div>
                     ))}
                     <div className="w-14 h-14 rounded-full border-4 border-white bg-rose-100 flex items-center justify-center shadow-sm">
                       <span className="text-sm font-bold text-rose-600">+5k</span>
                     </div>
                   </div>
                </div>
              </div>
            </div>
            
            {/* Floating Element */}
            <motion.div
               animate={{ y: [0, -15, 0] }}
               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
               className="absolute -bottom-6 -right-6 md:-right-10 bg-white p-5 rounded-2xl shadow-xl border border-rose-100 flex items-center gap-4 z-20"
            >
               <div className="w-14 h-14 rounded-full bg-rose-500 flex items-center justify-center shadow-md shadow-rose-500/20">
                 <Heart className="w-7 h-7 text-white fill-white" />
               </div>
               <div className="pr-2">
                 <p className="text-base font-bold text-zinc-900">High Engagement</p>
                 <p className="text-sm text-zinc-500">Industry-leading conversion</p>
               </div>
            </motion.div>
          </motion.div>

          {/* Right Content */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-center lg:text-left order-1 lg:order-2"
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-zinc-900 mb-6 leading-tight">
              Cultivate Your <br className="hidden lg:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500">True Community</span>
            </h2>
            <p className="text-lg md:text-xl text-zinc-600 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Transform casual followers into dedicated subscribers. Build meaningful relationships with the people who value your craft the most, while establishing a reliable stream of recurring income.
            </p>
            
            <Link to="/signup" className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-rose-500 px-8 text-base font-bold text-white transition-all hover:bg-rose-600 hover:scale-105 active:scale-95 shadow-lg shadow-rose-500/30 w-full sm:w-auto">
              Get Started Now
              <ArrowRight className="h-5 w-5" />
            </Link>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
