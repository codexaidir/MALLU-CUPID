import { motion } from "motion/react";
import { UserPlus, Smartphone, Share2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function HowItWorks() {
  const steps = [
    {
      icon: <UserPlus className="w-10 h-10 text-rose-500" />,
      title: "Sign Up",
      description: "Register with us and set up your free personal fan app."
    },
    {
      icon: <Smartphone className="w-10 h-10 text-rose-500" />,
      title: "Create your own app in less than 30 seconds",
      description: "Complete your basic info, create your memberships, start posting content, and get your personalised app link."
    },
    {
      icon: <Share2 className="w-10 h-10 text-rose-500" />,
      title: "Share your app & start earning",
      description: "Most creators start earning in minutes of launching their app."
    }
  ];

  return (
    <section id="how-it-works" className="py-24 bg-white relative overflow-hidden">
      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-display font-light text-zinc-900 tracking-wide uppercase mb-6"
          >
            How it works
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <Link 
              to="/signup"
              className="inline-flex items-center gap-2 rounded-full border-2 border-rose-500 px-8 py-2.5 text-base font-semibold text-rose-500 transition-all hover:bg-rose-500 hover:text-white hover:scale-105 active:scale-95"
            >
              Register Now <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="flex flex-col items-center text-center group"
            >
              <div className="relative mb-10 w-full flex justify-center">
                {/* Decorative blob/background for icon */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-rose-50 rounded-full scale-100 transition-transform duration-500 group-hover:scale-125" />
                <div className="relative w-28 h-28 bg-white border border-rose-100 rounded-full shadow-xl shadow-rose-100/50 flex items-center justify-center z-10 transition-transform duration-500 group-hover:-translate-y-2">
                  {step.icon}
                </div>
              </div>
              <h3 className="text-xl font-bold font-display text-zinc-900 mb-4 max-w-[280px]">
                {step.title}
              </h3>
              <p className="text-zinc-600 text-sm md:text-base leading-relaxed max-w-[320px]">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
