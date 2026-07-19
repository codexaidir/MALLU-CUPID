import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { HowItWorks } from "./components/HowItWorks";
import { CommunityCTA } from "./components/CommunityCTA";
import { Footer } from "./components/Footer";

// We'll import these as we create them
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import VerifyOtpPage from "./pages/VerifyOtpPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import DashboardPage from "./pages/DashboardPage";
import VerificationPage from "./pages/VerificationPage";
import CreatePostPage from "./pages/CreatePostPage";

import EditProfilePage from "./pages/EditProfilePage";

import CreatorOnboardingPage from "./pages/CreatorOnboardingPage";

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

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white font-sans text-zinc-900 antialiased selection:bg-rose-500/30">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          
          <Route path="/login" element={<AuthLayout><LoginPage /></AuthLayout>} />
          <Route path="/signup" element={<AuthLayout><SignupPage /></AuthLayout>} />
          <Route path="/verify-otp" element={<AuthLayout><VerifyOtpPage /></AuthLayout>} />
          <Route path="/forgot-password" element={<AuthLayout><ForgotPasswordPage /></AuthLayout>} />
          <Route path="/onboarding" element={<AuthLayout><CreatorOnboardingPage /></AuthLayout>} />
          
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/edit-profile" element={<EditProfilePage />} />
          <Route path="/create-post" element={<CreatePostPage />} />
          <Route path="/verification" element={<VerificationPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
