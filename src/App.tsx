import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { HowItWorks } from "./components/HowItWorks";
import { CommunityCTA } from "./components/CommunityCTA";
import { Footer } from "./components/Footer";

import { AuthProvider, useAuth } from "./lib/useAuth";
import CreatorLayout from "./components/CreatorLayout";

import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import VerifyOtpPage from "./pages/VerifyOtpPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import DashboardPage from "./pages/DashboardPage";
import VerificationPage from "./pages/VerificationPage";
import EditProfilePage from "./pages/EditProfilePage";
import CreatorOnboardingPage from "./pages/CreatorOnboardingPage";
import CreatePostPage from "./pages/CreatePostPage";
import MediaViewerPage from "./pages/MediaViewerPage";
import EditPostPage from "./pages/EditPostPage";
import ReportPostPage from "./pages/ReportPostPage";
import WalletPage from "./pages/WalletPage";
import HelpPage from "./pages/HelpPage";
import NotificationsPage from "./pages/NotificationsPage";
import InboxPage from "./pages/InboxPage";
import ChatPage from "./pages/ChatPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import RefundPolicyPage from "./pages/RefundPolicyPage";
import ContactUsPage from "./pages/ContactUsPage";
import PublicProfilePage from "./pages/PublicProfilePage";

function LandingPage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <HowItWorks />
        <CommunityCTA />
      </main>
      <Footer />
    </>
  );
}

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 pb-12 bg-zinc-50 flex items-start sm:items-center justify-center p-6">
        {children}
      </main>
    </>
  );
}

/** Redirects legacy paths like /dashboard to the username-based URL /<username>/<page>. */
function LegacyRedirect({ page = "" }: { page?: string }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="rounded-3xl bg-white p-8 shadow-lg border border-zinc-200 text-center">
          <p className="text-zinc-700 font-medium">Loading your session…</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const username = user.user_metadata?.username;
  if (!username) return <Navigate to="/login" replace />;

  return <Navigate to={`/${username}${page ? `/${page}` : ""}${location.search}`} replace />;
}

/**
 * Distinguishes public creator pages (/<username><5-digit serial>, e.g.
 * /founder00151) from the logged-in creator app (/<username>). A slug ending
 * in exactly 5 digits routes to the public page — unless it is the logged-in
 * user's own username, which keeps their dashboard working even if their
 * username happens to end in digits.
 */
function UsernameRouteSwitch() {
  const { username: slug } = useParams<{ username: string }>();
  const { user } = useAuth();
  const ownUsername = user?.user_metadata?.username;
  const isPublicSlug = /^.+\d{5}$/.test(slug || "") && slug !== ownUsername;
  if (isPublicSlug) return <PublicProfilePage />;
  return <CreatorLayout />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-white font-sans text-zinc-900 antialiased selection:bg-rose-500/30">
          <Routes>
            <Route path="/" element={<LandingPage />} />

            <Route path="/login" element={<AuthLayout><LoginPage /></AuthLayout>} />
            <Route path="/signup" element={<AuthLayout><SignupPage /></AuthLayout>} />
            <Route path="/verify-otp" element={<AuthLayout><VerifyOtpPage /></AuthLayout>} />
            <Route path="/forgot-password" element={<AuthLayout><ForgotPasswordPage /></AuthLayout>} />
            <Route path="/onboarding" element={<AuthLayout><CreatorOnboardingPage /></AuthLayout>} />
            <Route path="/terms-and-conditions" element={<AuthLayout><TermsPage /></AuthLayout>} />
            <Route path="/privacy-policy" element={<AuthLayout><PrivacyPolicyPage /></AuthLayout>} />
            <Route path="/refund-policy" element={<AuthLayout><RefundPolicyPage /></AuthLayout>} />
            <Route path="/contact-us" element={<AuthLayout><ContactUsPage /></AuthLayout>} />

            {/* Legacy paths redirect to /<username>/... */}
            <Route path="/dashboard" element={<LegacyRedirect />} />
            <Route path="/edit-profile" element={<LegacyRedirect page="edit-profile" />} />
            <Route path="/create-post" element={<LegacyRedirect page="create-post" />} />
            <Route path="/verification" element={<LegacyRedirect page="verification" />} />

            {/* Username-based creator routes with persistent mobile header + navbar.
                Slugs ending in a 5-digit serial render the public creator page instead. */}
            <Route path="/:username" element={<UsernameRouteSwitch />}>
              <Route index element={<DashboardPage />} />
              <Route path="edit-profile" element={<EditProfilePage />} />
              <Route path="create-post" element={<CreatePostPage />} />
              <Route path="post/:postId" element={<MediaViewerPage />} />
              <Route path="post/:postId/edit" element={<EditPostPage />} />
              <Route path="post/:postId/report" element={<ReportPostPage />} />
              <Route path="verification" element={<VerificationPage />} />
              <Route path="wallet" element={<WalletPage />} />
              <Route path="help" element={<HelpPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="inbox" element={<InboxPage />} />
              <Route path="chat/:conversationId" element={<ChatPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
