import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ImagePlus, Plus, X, ArrowLeft, Video } from "lucide-react";
import { MobileHeader } from "../components/MobileHeader";
import { MobileNavbar } from "../components/MobileNavbar";

export default function CreatePostPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedType = (searchParams.get('type') as 'photo' | 'video') || 'photo';

  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [postCaption, setPostCaption] = useState('');
  const [isPostPaid, setIsPostPaid] = useState(false);
  const [postPrice, setPostPrice] = useState('');
  const [uploadStep, setUploadStep] = useState<'select' | 'details'>('select');
  const [uploadError, setUploadError] = useState('');

  const handlePostFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files: File[] = Array.from(e.target.files);
      
      if (requestedType === 'video') {
        const isVideo = files.every(f => f.type.startsWith('video/'));
        if (!isVideo) {
          setUploadError('Please select only video files.');
          return;
        }
        if (files.length > 1) {
          setUploadError('You can only upload 1 video.');
          return;
        }
        if (files[0].size > 500 * 1024 * 1024) {
          setUploadError('Video size must be less than 500MB.');
          return;
        }
        setUploadFiles(files);
      } else {
        const isPhoto = files.every(f => f.type.startsWith('image/') && (f.type === 'image/jpeg' || f.type === 'image/jpg' || f.type === 'image/png'));
        if (!isPhoto) {
          setUploadError('Please select only JPG or PNG photos. MP4 or other files are not allowed.');
          return;
        }
        if (files.length > 15) {
          setUploadError('You can only upload up to 15 photos.');
          return;
        }
        const largeFile = files.find(f => f.size > 50 * 1024 * 1024);
        if (largeFile) {
          setUploadError('Each photo must be less than 50MB.');
          return;
        }
        setUploadFiles(files);
      }
      setUploadError('');
      setUploadStep('details');
    }
  };

  const handleCreatePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPostPaid && (!postPrice || isNaN(Number(postPrice)) || Number(postPrice) <= 0)) {
      setUploadError('Please enter a valid price in INR for the paid post.');
      return;
    }

    // In a real app, this would be an API call to save the post to the database
    // For now, we simulate saving to DB and returning to dashboard
    const newPost = {
      id: Date.now(),
      img: requestedType === 'video' 
        ? "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80" 
        : URL.createObjectURL(uploadFiles[0]), 
      type: requestedType === 'video' ? 'video' : 'image',
      caption: postCaption,
      isPaid: isPostPaid,
      price: isPostPaid ? Number(postPrice) : 0
    };

    // Store temporarily in local storage to simulate DB persistence across navigation
    const existingPosts = JSON.parse(localStorage.getItem('temp_posts') || '[]');
    localStorage.setItem('temp_posts', JSON.stringify([newPost, ...existingPosts]));

    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col md:items-center md:justify-center md:p-4 pt-14 pb-14 md:pt-4 md:pb-4">
      <MobileHeader />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-[800px] bg-white md:rounded-3xl shadow-none md:shadow-xl border-x-0 border-y-0 md:border border-zinc-200 overflow-hidden flex flex-col flex-grow md:flex-grow-0 md:min-h-[500px]"
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-200 shrink-0 bg-white z-10">
          {uploadStep === 'details' ? (
            <button onClick={() => setUploadStep('select')} className="text-zinc-600 hover:text-zinc-900 text-sm font-semibold flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <button onClick={() => navigate('/dashboard')} className="text-zinc-600 hover:text-zinc-900 text-sm font-semibold flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Cancel
            </button>
          )}
          <h3 className="text-lg font-bold text-zinc-900">Create new {requestedType === 'video' ? 'video' : 'photo'} post</h3>
          {uploadStep === 'details' ? (
            <button onClick={handleCreatePostSubmit} className="text-blue-600 hover:text-blue-700 text-sm font-bold bg-blue-50 px-4 py-2 rounded-lg">
              Post
            </button>
          ) : (
            <div className="w-20" /> /* placeholder to center title */
          )}
        </div>
        
        <div className="flex-1 flex flex-col overflow-y-auto">
          {uploadStep === 'select' && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-zinc-50">
              <div className="flex items-center justify-center mb-6 text-zinc-400">
                {requestedType === 'video' ? <Video className="w-20 h-20 stroke-[1]" /> : <ImagePlus className="w-20 h-20 stroke-[1]" />}
              </div>
              <h2 className="text-2xl text-zinc-800 font-medium mb-2">Select your {requestedType === 'video' ? 'video' : 'photos'}</h2>
              <p className="text-zinc-500 mb-8">
                {requestedType === 'video' 
                  ? 'Maximum size: 500MB. Duration up to 15 mins.'
                  : 'Maximum size: 50MB per photo. Up to 15 photos. JPG/PNG only.'
                }
              </p>
              {uploadError && <p className="text-rose-500 text-sm mb-6 bg-rose-50 px-4 py-2 rounded-lg">{uploadError}</p>}
              <label className="cursor-pointer px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors inline-block text-lg shadow-sm">
                Select from computer
                <input 
                  type="file" 
                  accept={requestedType === 'video' ? 'video/*' : 'image/jpeg,image/png,image/jpg'} 
                  multiple={requestedType === 'photo'} 
                  className="hidden" 
                  onChange={handlePostFileSelect} 
                />
              </label>
            </div>
          )}
          
          {uploadStep === 'details' && (
            <div className="flex flex-col md:flex-row flex-1 bg-white">
              <div className="flex-1 bg-zinc-100 flex flex-col relative min-h-[300px]">
                {/* Preview Area */}
                <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-zinc-100">
                  {requestedType === 'photo' && uploadFiles.length > 0 && (
                    <div className="w-full h-full p-4 flex items-center justify-center">
                      <div className="relative aspect-[4/5] w-full max-w-lg bg-black rounded-xl overflow-hidden shadow-md">
                        <img src={URL.createObjectURL(uploadFiles[0])} alt="Preview" className="w-full h-full object-contain" />
                      </div>
                    </div>
                  )}
                  {requestedType === 'video' && uploadFiles.length > 0 && (
                    <div className="w-full h-full p-4 flex items-center justify-center">
                      <div className="relative aspect-[9/16] h-full max-h-[500px] bg-black rounded-xl overflow-hidden shadow-md">
                        <video src={URL.createObjectURL(uploadFiles[0])} className="w-full h-full object-cover" controls />
                      </div>
                    </div>
                  )}
                  
                  {requestedType === 'photo' && (
                    <div className="absolute bottom-6 right-6 flex items-center gap-2">
                      <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm text-sm font-semibold text-zinc-700">
                        {uploadFiles.length} / 15
                      </div>
                      {uploadFiles.length < 15 && (
                        <label className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center cursor-pointer hover:bg-blue-700 shadow-lg transition-transform hover:scale-105">
                          <Plus className="w-5 h-5" />
                          <input type="file" accept="image/jpeg,image/png,image/jpg" multiple className="hidden" onChange={(e) => {
                            if (e.target.files) {
                              const newFiles: File[] = Array.from(e.target.files);
                              const validFiles = newFiles.filter((f: File) => f.type.startsWith('image/') && (f.type === 'image/jpeg' || f.type === 'image/jpg' || f.type === 'image/png'));
                              
                              if (validFiles.length !== newFiles.length) {
                                setUploadError('Some files were ignored because they are not JPG/PNG.');
                              } else {
                                setUploadError('');
                              }

                              if (uploadFiles.length + validFiles.length > 15) {
                                setUploadError('Maximum 15 photos allowed.');
                              } else {
                                setUploadFiles([...uploadFiles, ...validFiles]);
                              }
                            }
                          }} />
                        </label>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="w-full md:w-[350px] bg-white border-l border-zinc-200 flex flex-col shrink-0">
                <div className="p-4 border-b border-zinc-200 flex items-center gap-3 bg-zinc-50">
                  <img src="https://i.pravatar.cc/300?img=47" className="w-10 h-10 rounded-full border border-zinc-200 shadow-sm" alt="Profile" />
                  <span className="font-bold text-zinc-900">mallucupid_creator</span>
                </div>
                
                <div className="p-4 flex-1">
                  <label className="block text-sm font-bold text-zinc-900 mb-2">Caption</label>
                  <textarea 
                    value={postCaption}
                    onChange={(e) => setPostCaption(e.target.value)}
                    placeholder="Write a caption..."
                    maxLength={250}
                    className="w-full h-32 resize-none border border-zinc-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 p-3 text-sm text-zinc-900 bg-white placeholder-zinc-400 transition-colors"
                  />
                  <div className="text-right text-xs text-zinc-500 mt-2 font-medium">
                    {postCaption.length} / 250
                  </div>
                </div>
                
                <div className="p-6 border-t border-zinc-200 bg-zinc-50 space-y-5">
                   <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-zinc-900">Post Type</span>
                    <select 
                      value={isPostPaid ? 'paid' : 'free'}
                      onChange={(e) => {
                        setIsPostPaid(e.target.value === 'paid');
                        if (e.target.value === 'free') setPostPrice('');
                      }}
                      className="text-sm border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer font-medium px-3 py-2 text-zinc-900 bg-white shadow-sm outline-none"
                    >
                      <option value="free">Free</option>
                      <option value="paid">Paid</option>
                    </select>
                   </div>
                   
                   {isPostPaid && (
                     <div className="space-y-2">
                       <label className="text-sm font-bold text-zinc-900 block">Price (INR)</label>
                       <div className="relative">
                         <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">₹</span>
                         <input 
                           type="number"
                           min="1"
                           value={postPrice}
                           onChange={(e) => setPostPrice(e.target.value)}
                           className="w-full pl-8 pr-3 py-2 border border-zinc-300 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white shadow-sm outline-none"
                           placeholder="0.00"
                         />
                       </div>
                     </div>
                   )}
                   
                   {uploadError && <p className="text-rose-500 text-xs bg-rose-50 p-2 rounded-lg border border-rose-100">{uploadError}</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
      <MobileNavbar />
    </div>
  );
}
