import { motion } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { BrandLogo } from "./BrandMark";

export function CommunityCTA() {
  return (
    <section className="py-24 bg-gradient-to-b from-white to-rose-50/30 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -right-32 w-[500px] h-[500px] bg-pink-200/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-rose-200/20 rounded-full blur-[120px] translate-y-1/3 -translate-x-1/4" />
      </div>

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative order-2 lg:order-1"
          >
            <div className="bg-white rounded-[2.5rem] p-10 md:p-12 shadow-2xl shadow-rose-100/60 border border-rose-100 relative overflow-hidden">
              <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 border border-rose-100 px-4 py-1.5 mb-8 shadow-sm">
                <Sparkles className="h-4 w-4 text-rose-500" />
                <span className="text-sm font-semibold text-rose-700">For Mallu creators</span>
              </div>
              <BrandLogo size="lg" className="mb-6" />
              <h3 className="text-3xl md:text-4xl font-display font-bold text-zinc-900 mb-4 tracking-tight">
                Sell exclusive content. Chat. Get paid.
              </h3>
              <p className="text-zinc-600 text-lg leading-relaxed max-w-sm mb-8">
                Share free and paid posts, unlock with Razorpay, and withdraw earnings to your bank — all in one place.
              </p>
              <p className="text-rose-600 font-semibold">
                Built for creators and fans in Kerala and beyond
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-center lg:text-left order-1 lg:order-2"
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-zinc-900 mb-6 leading-tight">
              Build your <br className="hidden lg:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500">creator page</span>
            </h2>
            <p className="text-lg md:text-xl text-zinc-600 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Publish photos and videos, follow fans who unlock your paid posts, and message them securely — without leaving MalluCupid.
            </p>
            <Link to="/signup" className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-rose-500 px-8 text-base font-bold text-white transition-all hover:bg-rose-600 hover:scale-105 active:scale-95 shadow-lg shadow-rose-500/30 w-full sm:w-auto">
              Start creating
              <ArrowRight className="h-5 w-5" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
