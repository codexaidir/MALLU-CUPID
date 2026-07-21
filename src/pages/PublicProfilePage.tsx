import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Grid,
  Heart,
  LayoutDashboard,
  Loader2,
  LockKeyhole,
  MessageCircle,
  MonitorX,
  Play,
  PlaySquare,
  Sparkles,
  UserPlus,
  X,
} from "lucide-react";
import { getPublicProfile, type PublicProfileData } from "../lib/auth";

/**
 * Layered mobile-device detection. All signals are combined so spoofing a
 * single one (e.g. resizing a desktop window) is not enough:
 *  - user agent must identify a mobile OS/browser
 *  - the device must expose touch points
 *  - the primary pointer must be coarse (finger), per CSS media query
 */
const detectMobileDevice = (): boolean => {
  const ua = navigator.userAgent || "";
  const uaMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini|Mobile|Silk/i.test(ua);
  const iPadOs = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  const hasTouch = navigator.maxTouchPoints > 0 || "ontouchstart" in window;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  return (uaMobile || iPadOs) && hasTouch && coarsePointer;
};

function useIsMobileDevice() {
  const [isMobile, setIsMobile] = useState(detectMobileDevice);
  useEffect(() => {
    const recheck = () => setIsMobile(detectMobileDevice());
    window.addEventListener("resize", recheck);
    window.addEventListener("orientationchange", recheck);
    return () => {
      window.removeEventListener("resize", recheck);
      window.removeEventListener("orientationchange", recheck);
    };
  }, []);
  return isMobile;
}

function DesktopBlockScreen() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl border border-zinc-200 shadow-xl shadow-rose-100/50 p-10 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-5">
          <MonitorX className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-zinc-900 mb-2">Mobile only</h1>
        <p className="text-zinc-500 text-sm leading-relaxed">
          This creator page is available on mobile devices only. Open this link on
          your phone to view the profile.
        </p>
      </motion.div>
    </div>
  );
}

function LoginSheet({ open, onClose, title, message }: {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-zinc-900/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="relative w-full max-w-md bg-white rounded-t-3xl p-6 pb-10"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-zinc-900">{title}</h3>
              <button onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-zinc-100" aria-label="Close">
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>
            <p className="text-sm text-zinc-500 leading-relaxed mb-6">{message}</p>
            <button
              disabled
              className="w-full h-12 rounded-xl bg-rose-300 text-white font-bold text-sm cursor-not-allowed"
            >
              Login coming soon
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default function PublicProfilePage() {
  const isMobile = useIsMobileDevice();
  const navigate = useNavigate();
  const { username: slug } = useParams<{ username: string }>();

  const [data, setData] = useState<PublicProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"grid" | "video">("grid");
  const [sheet, setSheet] = useState<null | "login" | "follow" | "chat">(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      const response = await getPublicProfile(slug);
      if (cancelled) return;
      setIsLoading(false);
      if (response.error || !response.profile) {
        setError(response.error || "Creator not found");
        return;
      }
      setData(response as PublicProfileData);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const filteredPosts = useMemo(
    () =>
      (data?.posts || []).filter((p) =>
        activeTab === "grid" ? p.media_type === "image" : p.media_type === "video",
      ),
    [data, activeTab],
  );

  if (!isMobile) return <DesktopBlockScreen />;

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Fixed public header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-zinc-200 z-[100] flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center">
            <LayoutDashboard className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-zinc-900">MalluCupid</span>
        </div>
        <button
          onClick={() => setSheet("login")}
          className="h-9 px-5 rounded-full bg-rose-500 hover:bg-rose-600 active:scale-95 text-white text-sm font-bold transition-all"
        >
          Login
        </button>
      </header>

      <main className="flex-1 pt-14 w-full max-w-md mx-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-7 h-7 text-rose-500 animate-spin" />
          </div>
        )}

        {!isLoading && error && (
          <div className="px-6 py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-400 flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8" />
            </div>
            <p className="text-zinc-900 font-semibold mb-1">Creator not found</p>
            <p className="text-zinc-500 text-sm">{error}</p>
          </div>
        )}

        {!isLoading && data && (
          <>
            {/* Profile section */}
            <section className="bg-white px-4 pt-5 pb-5 border-b border-zinc-100">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-full overflow-hidden border border-zinc-200 shrink-0 bg-rose-50">
                  {data.profile.avatar_url ? (
                    <img
                      src={data.profile.avatar_url}
                      alt={data.profile.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-rose-400 font-bold text-2xl">
                      {(data.profile.full_name || data.profile.username).charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-base font-bold text-zinc-900 truncate">
                    {data.profile.username}
                  </h1>
                  <p className="text-sm text-zinc-500 truncate">{data.profile.full_name}</p>
                  <div className="flex items-center gap-6 mt-2.5">
                    <div className="text-center">
                      <p className="text-sm font-bold text-zinc-900 leading-none">{data.stats.posts}</p>
                      <p className="text-[11px] text-zinc-500 mt-1">posts</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-zinc-900 leading-none">{data.stats.followers}</p>
                      <p className="text-[11px] text-zinc-500 mt-1">followers</p>
                    </div>
                  </div>
                </div>
              </div>

              {data.profile.bio && (
                <p className="text-sm text-zinc-700 leading-relaxed mt-4 whitespace-pre-line">
                  {data.profile.bio}
                </p>
              )}

              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={() => setSheet("follow")}
                  className="flex-1 h-10 rounded-xl bg-rose-500 hover:bg-rose-600 active:scale-[0.98] text-white text-sm font-bold transition-all flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" /> Follow
                </button>
                <button
                  onClick={() => setSheet("chat")}
                  className="flex-1 h-10 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 active:scale-[0.98] text-zinc-900 text-sm font-bold transition-all flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" /> Chat
                </button>
              </div>
            </section>

            {/* Photo / video separator tabs */}
            <div className="bg-white sticky top-14 z-[90] border-b border-zinc-200 grid grid-cols-2">
              <button
                onClick={() => setActiveTab("grid")}
                className={`flex items-center justify-center py-3 border-b-2 transition-colors ${
                  activeTab === "grid"
                    ? "text-zinc-900 border-zinc-900"
                    : "text-zinc-400 border-transparent"
                }`}
                aria-label="Photos"
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActiveTab("video")}
                className={`flex items-center justify-center py-3 border-b-2 transition-colors ${
                  activeTab === "video"
                    ? "text-zinc-900 border-zinc-900"
                    : "text-zinc-400 border-transparent"
                }`}
                aria-label="Videos"
              >
                <PlaySquare className="w-5 h-5" />
              </button>
            </div>

            {/* Posts grid */}
            {filteredPosts.length > 0 ? (
              <div className="grid grid-cols-3 gap-[2px] bg-white">
                {filteredPosts.map((post) => (
                  <button
                    key={post.public_id}
                    onClick={() => setSheet("login")}
                    className="relative aspect-square overflow-hidden bg-zinc-100 group"
                  >
                    {post.is_paid || !post.media_url ? (
                      <div className="absolute inset-0 bg-gradient-to-br from-rose-100 via-rose-50 to-zinc-100 flex flex-col items-center justify-center">
                        <div className="p-2 bg-white/80 backdrop-blur rounded-full shadow-sm">
                          <LockKeyhole className="w-4 h-4 text-zinc-900" />
                        </div>
                        {post.is_paid && (
                          <span className="mt-1.5 text-[10px] font-bold text-zinc-700">₹{post.price}</span>
                        )}
                      </div>
                    ) : post.media_type === "video" ? (
                      <video
                        src={post.media_url}
                        className="w-full h-full object-cover pointer-events-none"
                        playsInline
                        muted
                        preload="metadata"
                      />
                    ) : (
                      <img
                        src={post.media_url}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                        draggable={false}
                      />
                    )}
                    {post.media_type === "video" && !post.is_paid && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="p-1.5 bg-black/40 backdrop-blur-sm rounded-full">
                          <Play className="w-3.5 h-3.5 text-white fill-white" />
                        </span>
                      </span>
                    )}
                    {post.media_count > 1 && (
                      <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-black/40 backdrop-blur-sm rounded-full text-white text-[9px] font-bold">
                        1/{post.media_count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-sm text-zinc-400">
                No {activeTab === "video" ? "video" : "photo"} posts yet.
              </div>
            )}

            {/* Be a creator CTA */}
            <section className="px-4 py-8 mt-auto">
              <div className="rounded-3xl bg-gradient-to-br from-rose-500 to-rose-400 p-6 text-white shadow-lg shadow-rose-200">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5" />
                  <h2 className="text-lg font-bold">Be a creator</h2>
                </div>
                <p className="text-sm text-rose-50 leading-relaxed mb-5">
                  Sell your exclusive content, grow your fans, and get paid directly.
                </p>
                <button
                  onClick={() => navigate("/signup")}
                  className="w-full h-11 rounded-xl bg-white text-rose-500 font-bold text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                >
                  <Heart className="w-4 h-4 fill-rose-500" /> Start Earning
                </button>
              </div>
              <p className="text-center text-[11px] text-zinc-400 mt-6">
                © {new Date().getFullYear()} MalluCupid
              </p>
            </section>
          </>
        )}
      </main>

      <LoginSheet
        open={sheet !== null}
        onClose={() => setSheet(null)}
        title={sheet === "follow" ? "Login to follow" : sheet === "chat" ? "Login to chat" : "Login"}
        message={
          sheet === "follow"
            ? `Create an account to follow ${data?.profile.username || "this creator"} and never miss a post.`
            : sheet === "chat"
            ? `Create an account to chat with ${data?.profile.username || "this creator"}.`
            : "Log in to unlock posts, follow creators, and chat."
        }
      />
    </div>
  );
}
