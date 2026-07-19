import React, { useState, useRef } from "react";
import { motion } from "motion/react";
import { Camera, ArrowRight, User, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CreatorOnboardingPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");

  const mockUsername = "mallucupid_creator";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Simulate an upload & cropping process
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            const reader = new FileReader();
            reader.onloadend = () => {
              setImagePreview(reader.result as string);
              setIsUploading(false);
            };
            reader.readAsDataURL(file);
            return 100;
          }
          return prev + 20;
        });
      }, 300);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/dashboard");
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-lg bg-white rounded-3xl shadow-xl shadow-rose-100/50 border border-zinc-100 p-8 sm:p-10 my-8"
    >
      <div className="text-center mb-10">
        <h1 className="text-3xl font-display font-bold text-zinc-900 mb-2">Complete Profile</h1>
        <p className="text-zinc-500">Set up your creator page to start earning</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Profile Image Section */}
        <div className="flex flex-col items-center justify-center gap-4">
          <div 
            className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-zinc-50 border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center cursor-pointer overflow-hidden group hover:border-rose-300 transition-colors"
            onClick={!isUploading ? triggerFileInput : undefined}
          >
            {imagePreview ? (
              <>
                <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <RefreshCw className="w-8 h-8 text-white" />
                </div>
              </>
            ) : isUploading ? (
              <div className="flex flex-col items-center justify-center w-full h-full bg-rose-50">
                <div className="w-10 h-10 rounded-full border-4 border-rose-200 border-t-rose-500 animate-spin mb-2" />
                <span className="text-xs font-bold text-rose-600">{uploadProgress}%</span>
              </div>
            ) : (
              <div className="text-center p-4">
                <Camera className="w-8 h-8 text-zinc-400 mx-auto mb-2 group-hover:text-rose-400 transition-colors" />
                <span className="text-xs font-medium text-zinc-500">Upload Photo</span>
              </div>
            )}
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden"
          />
          {imagePreview && !isUploading && (
            <button 
              type="button" 
              onClick={triggerFileInput}
              className="text-sm font-medium text-rose-500 hover:text-rose-600"
            >
              Change Image
            </button>
          )}
        </div>

        {/* Username (Read Only) */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-700">Username</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input 
              type="text" 
              readOnly
              value={mockUsername}
              className="w-full h-12 pl-12 pr-4 rounded-xl border border-zinc-200 bg-zinc-100 text-zinc-500 cursor-not-allowed focus:outline-none"
            />
          </div>
        </div>

        {/* Display Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-700">Display Name</label>
          <input 
            type="text" 
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-12 px-4 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
            placeholder="E.g. Jane Doe"
          />
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-zinc-700">Bio</label>
            <span className={`text-xs font-medium ${bio.length > 400 ? 'text-red-500' : 'text-zinc-400'}`}>
              {bio.length}/400
            </span>
          </div>
          <textarea 
            required
            maxLength={400}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full p-4 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-none h-32"
            placeholder="Tell your fans about yourself and what exclusive content they can expect..."
          />
        </div>

        <button 
          type="submit"
          className="group relative mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-rose-500 text-sm font-bold text-white transition-all hover:bg-rose-600 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-rose-500/20"
        >
          Go to Dashboard
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </form>
    </motion.div>
  );
}
