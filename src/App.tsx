import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { HowItWorks } from "./components/HowItWorks";
import { CommunityCTA } from "./components/CommunityCTA";
import { Footer } from "./components/Footer";

import { AuthProvider, ProtectedRoute, useAuth } from "./lib/useAuth";

import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import VerifyOtpPage from "./pages/VerifyOtpPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import DashboardPage from "./pages/DashboardPage";
import VerificationPage from "./pages/VerificationPage";
import EditProfilePage from "./pages/EditProfilePage";
import CreatorOnboardingPage from "./pages/CreatorOnboardingPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import RefundPolicyPage from "./pages/RefundPolicyPage";
import ContactUsPage from "./pages/ContactUsPage";

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
            
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/edit-profile" element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} />
            <Route path="/verification" element={<ProtectedRoute><VerificationPage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
