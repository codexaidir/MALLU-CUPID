import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, MessageCircle } from "lucide-react";

export default function InboxPage() {
  const navigate = useNavigate();
  const { username } = useParams<{ username: string }>();

  return (
    <div className="min-h-screen bg-zinc-50 pt-14 pb-16 md:py-10">
      <div className="max-w-xl mx-auto px-4 md:px-0 pt-3 md:pt-0">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(`/${username}`)} className="p-2 -ml-2 rounded-full hover:bg-zinc-100 transition-colors" aria-label="Back">
            <ArrowLeft className="w-5 h-5 text-zinc-900" />
          </button>
          <h1 className="text-xl font-bold text-zinc-900">Messages</h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-zinc-200 shadow-sm py-16 flex flex-col items-center text-center px-6"
        >
          <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mb-4 text-rose-400">
            <MessageCircle className="w-8 h-8" />
          </div>
          <p className="text-zinc-900 font-semibold mb-1">No messages yet</p>
          <p className="text-zinc-500 text-sm max-w-[260px]">
            Chats with your fans will appear here.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
