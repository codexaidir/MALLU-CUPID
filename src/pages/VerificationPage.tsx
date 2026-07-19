import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, LayoutDashboard, Bell, ShieldCheck, Wallet, Inbox, ArrowLeft, Camera, UploadCloud, CheckCircle2, AlertCircle, Building2, Smartphone, Check, Loader2 } from "lucide-react";
import { MobileHeader } from "../components/MobileHeader";
import { MobileNavbar } from "../components/MobileNavbar";

export default function VerificationPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  
  // Verification states
  const [mobileNumber, setMobileNumber] = useState("");
  const [isMobileVerified, setIsMobileVerified] = useState(false);
  const [isMobileLoading, setIsMobileLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  
  const [isSelfieUploaded, setIsSelfieUploaded] = useState(false);
  const [isSelfieLoading, setIsSelfieLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Bank details states
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [isBankAdded, setIsBankAdded] = useState(false);
  const [isBankLoading, setIsBankLoading] = useState(false);

  const navigate = useNavigate();

  const handleSignOut = () => {
    setIsSignOutModalOpen(false);
    navigate("/");
  };
  
  const handleMobileVerification = () => {
    if (mobileNumber.length < 10) return;
    setIsMobileLoading(true);
    setTimeout(() => {
      setIsMobileLoading(false);
      setOtpSent(true);
    }, 1500);
  };
  
  const handleVerifyOtp = () => {
    if (otp.length !== 6) return;
    setIsMobileLoading(true);
    setTimeout(() => {
      setIsMobileLoading(false);
      setIsMobileVerified(true);
      setOtpSent(false);
    }, 1500);
  };

  const handleSelfieUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsSelfieLoading(true);
      setTimeout(() => {
        setIsSelfieLoading(false);
        setIsSelfieUploaded(true);
      }, 2000);
    }
  };

  const handleBankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsBankLoading(true);
    setTimeout(() => {
      setIsBankLoading(false);
      setIsBankAdded(true);
    }, 1500);
  };

  const SidebarContent = ({ isExpanded = false }: { isExpanded?: boolean }) => (
    <div className={`flex flex-col h-full bg-white border-r border-zinc-200 py-6 w-full ${isExpanded ? 'px-6 items-start' : 'items-center'}`}>
      <div className={`mb-8 ${isExpanded ? 'flex items-center gap-3 w-full' : ''}`}>
        <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        {isExpanded && <span className="font-display font-bold text-lg text-zinc-900">Verification</span>}
      </div>
      <div className={`flex-grow flex flex-col space-y-4 w-full ${isExpanded ? 'items-stretch' : 'items-center'}`}>
        <Link to="/dashboard" className={`p-3 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 rounded-xl transition-colors group relative ${isExpanded ? 'flex items-center gap-3' : ''}`}>
          <LayoutDashboard className="w-6 h-6 shrink-0" />
          {isExpanded ? <span className="font-semibold">Dashboard</span> : <span className="absolute left-full ml-4 px-2 py-1 bg-zinc-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">Dashboard</span>}
        </Link>
        <a href="#" className={`p-3 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 rounded-xl transition-colors group relative ${isExpanded ? 'flex items-center gap-3 w-full text-left' : ''}`}>
          <div className="relative shrink-0">
            <Inbox className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white"></span>
          </div>
          {isExpanded ? <span className="font-semibold">Inbox</span> : <span className="absolute left-full ml-4 px-2 py-1 bg-zinc-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">Inbox</span>}
        </a>
        <a href="#" className={`p-3 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 rounded-xl transition-colors group relative ${isExpanded ? 'flex items-center gap-3 w-full text-left' : ''}`}>
          <Bell className="w-6 h-6 shrink-0" />
          {isExpanded ? <span className="font-semibold">Notifications</span> : <span className="absolute left-full ml-4 px-2 py-1 bg-zinc-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">Notifications</span>}
        </a>
        <a href="#" className={`p-3 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 rounded-xl transition-colors group relative ${isExpanded ? 'flex items-center gap-3 w-full text-left' : ''}`}>
          <Wallet className="w-6 h-6 shrink-0" />
          {isExpanded ? <span className="font-semibold">Wallet</span> : <span className="absolute left-full ml-4 px-2 py-1 bg-zinc-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">Wallet</span>}
        </a>
        <Link to="/verification" className={`p-3 bg-rose-50 text-rose-600 rounded-xl transition-colors group relative ${isExpanded ? 'flex items-center gap-3' : ''}`}>
          <ShieldCheck className="w-6 h-6 shrink-0" />
          {isExpanded ? <span className="font-semibold">Verification</span> : <span className="absolute left-full ml-4 px-2 py-1 bg-zinc-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">Verification</span>}
        </Link>
      </div>
      <div className={`mt-auto pb-4 w-full ${isExpanded ? 'flex flex-col items-stretch' : 'flex flex-col items-center'}`}>
        <button 
          onClick={() => setIsSignOutModalOpen(true)}
          className={`p-3 text-zinc-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-colors group relative ${isExpanded ? 'flex items-center gap-3 w-full text-left' : ''}`}
        >
          <LogOut className="w-6 h-6 shrink-0" />
          {isExpanded ? <span className="font-semibold">Sign out</span> : <span className="absolute left-full ml-4 px-2 py-1 bg-zinc-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      <MobileHeader />
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-20 fixed inset-y-0 z-50">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-64 bg-white z-50 md:hidden shadow-2xl"
            >
              <SidebarContent isExpanded={true} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 md:ml-20 flex flex-col min-h-screen pt-14 pb-14 md:pt-0 md:pb-0">
        {/* Header */}
        <header className="bg-white border-b border-zinc-200 sticky top-0 z-30 h-16 hidden md:flex items-center px-6">
          <div className="flex-1 md:flex-none flex items-center">
             <Link to="/dashboard" className="hidden md:inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
          </div>
        </header>

        <main className="flex-grow container mx-auto px-4 sm:px-8 py-8 max-w-3xl">
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-zinc-900 mb-2">Account Verification</h1>
            <p className="text-zinc-500">Complete these steps to verify your identity and enable payouts.</p>
          </div>

          <div className="space-y-6">
            {/* Mobile Number Verification */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl border border-zinc-200 p-6 sm:p-8 shadow-sm"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${isMobileVerified ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900">Mobile Number</h3>
                  <p className="text-zinc-500 text-sm">Add your phone number for secure account recovery and updates.</p>
                </div>
              </div>

              {!isMobileVerified ? (
                otpSent ? (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input 
                      type="text" 
                      placeholder="Enter 6-digit OTP" 
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      disabled={isMobileLoading}
                      className="flex-1 h-12 px-4 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-mono tracking-widest disabled:opacity-50"
                    />
                    <button 
                      onClick={handleVerifyOtp}
                      disabled={isMobileLoading || otp.length !== 6}
                      className="h-12 w-[140px] flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
                    >
                      {isMobileLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify OTP"}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input 
                      type="tel" 
                      placeholder="+1 (555) 000-0000" 
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      disabled={isMobileLoading}
                      className="flex-1 h-12 px-4 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all disabled:opacity-50"
                    />
                    <button 
                      onClick={handleMobileVerification}
                      disabled={isMobileLoading || mobileNumber.length < 10}
                      className="h-12 w-[140px] flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
                    >
                      {isMobileLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send OTP"}
                    </button>
                  </div>
                )
              ) : (
                <div className="flex items-center justify-between bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span className="font-medium text-zinc-900">{mobileNumber || "+1 (555) 123-4567"}</span>
                  </div>
                  <span className="text-emerald-600 text-sm font-semibold bg-emerald-100 px-3 py-1 rounded-full">Verified</span>
                </div>
              )}
            </motion.div>

            {/* Selfie Upload */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-3xl border border-zinc-200 p-6 sm:p-8 shadow-sm"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${isSelfieUploaded ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900">Live Selfie Verification</h3>
                  <p className="text-zinc-500 text-sm">Upload a clear photo of your face to verify your identity.</p>
                </div>
              </div>

              {!isSelfieUploaded ? (
                <div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="user"
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleSelfieUpload}
                  />
                  <div 
                    onClick={() => !isSelfieLoading && fileInputRef.current?.click()}
                    className={`border-2 border-dashed border-zinc-200 rounded-2xl p-8 text-center bg-zinc-50 hover:bg-zinc-100 transition-colors ${isSelfieLoading ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer group'}`}
                  >
                    {isSelfieLoading ? (
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
                        <p className="font-medium text-zinc-900">Uploading selfie...</p>
                      </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                          <UploadCloud className="w-8 h-8 text-rose-500" />
                        </div>
                        <p className="font-medium text-zinc-900 mb-1">Click to capture or upload selfie</p>
                        <p className="text-sm text-zinc-500">Must be well-lit and clearly show your face</p>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span className="font-medium text-zinc-900">Selfie uploaded successfully</span>
                  </div>
                  <button onClick={() => setIsSelfieUploaded(false)} className="text-sm font-semibold text-rose-500 hover:text-rose-600">Retake</button>
                </div>
              )}
            </motion.div>

            {/* Bank Account Details */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-3xl border border-zinc-200 p-6 sm:p-8 shadow-sm"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${isBankAdded ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900">Bank Account Details</h3>
                  <p className="text-zinc-500 text-sm">Add your bank account information to receive payouts.</p>
                </div>
              </div>

              {!isBankAdded ? (
                <form className="space-y-4" onSubmit={handleBankSubmit}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700">Account Holder Name</label>
                    <input 
                      type="text" 
                      required
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      disabled={isBankLoading}
                      className="w-full h-12 px-4 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all disabled:opacity-50"
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-700">Account Number</label>
                      <input 
                        type="text" 
                        required
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                        disabled={isBankLoading}
                        className="w-full h-12 px-4 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-mono disabled:opacity-50"
                        placeholder="000123456789"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-700">Routing Number</label>
                      <input 
                        type="text" 
                        required
                        value={routingNumber}
                        onChange={(e) => setRoutingNumber(e.target.value.replace(/\D/g, ''))}
                        disabled={isBankLoading}
                        className="w-full h-12 px-4 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-mono disabled:opacity-50"
                        placeholder="110000000"
                      />
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-zinc-100">
                    <button 
                      type="submit"
                      disabled={isBankLoading}
                      className="w-full h-12 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {isBankLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" /> Saving...
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5" /> Save Bank Details
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-zinc-50 p-5 rounded-xl border border-zinc-200 flex items-center justify-between">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-white rounded-lg border border-zinc-200 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-zinc-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-900">{accountName || "Jane Doe"}</h4>
                      <p className="text-zinc-500 text-sm font-mono flex items-center gap-2">
                        •••• •••• {accountNumber.slice(-4) || "6789"}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setIsBankAdded(false)} className="text-sm font-semibold text-rose-500 hover:text-rose-600 px-4 py-2 bg-rose-50 rounded-lg">Edit</button>
                </div>
              )}
            </motion.div>
          </div>

        </main>
      </div>

      {/* Sign Out Confirmation Modal */}
      <AnimatePresence>
        {isSignOutModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSignOutModalOpen(false)}
              className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-xl border border-zinc-100 p-6 sm:p-8 overflow-hidden"
            >
              <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mb-4 text-rose-500">
                <LogOut className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">Sign out of your account?</h3>
              <p className="text-zinc-500 mb-6">You will need to log back in to access your creator dashboard.</p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsSignOutModalOpen(false)}
                  className="flex-1 py-3 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSignOut}
                  className="flex-1 py-3 px-4 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-xl transition-colors shadow-md shadow-rose-500/20"
                >
                  Sign Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <MobileNavbar />
    </div>
  );
}
