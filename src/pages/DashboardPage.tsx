import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, LayoutDashboard, Users, CreditCard, Heart, Grid, PlaySquare, Play, Menu, X, Bell, ShieldCheck, BadgeCheck, Wallet, MoreVertical, Edit2, Trash2, Plus, Copy, Check, Inbox, Settings, Link2, ImagePlus, Radio, TrendingUp, Sparkles, UploadCloud, FileImage, FileVideo, Eye, LockKeyhole } from "lucide-react";
import { MobileHeader } from "../components/MobileHeader";
import { MobileNavbar } from "../components/MobileNavbar";

export default function DashboardPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [editForm, setEditForm] = useState(() => {
    const saved = localStorage.getItem('profileData');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      name: 'Jane Doe',
      username: 'mallucupid_creator',
      bio: 'Exclusive content creator ✨\nSharing my journey and behind-the-scenes.\nSubscribe to my channel for daily updates! 👇',
      location: 'New York, USA',
      instagram: '',
      facebook: '',
      isPrivate: false,
      gender: 'Prefer not to say'
    };
  });
  const [usernameError, setUsernameError] = useState('');
  const [copied, setCopied] = useState(false);
  const [activePostMenu, setActivePostMenu] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'grid' | 'video'>('grid');
  const [isNewPostMenuOpen, setIsNewPostMenuOpen] = useState(false);
  const navigate = useNavigate();

  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [posts, setPosts] = useState([
    { id: 1, img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&q=80", type: "image", caption: "Beautiful day! ☀️", isPaid: false, price: 0 },
    { id: 2, img: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80", type: "video", caption: "Workout routine part 1 💪 Check it out!", isPaid: true, price: 5 },
    { id: 3, img: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80", type: "image", caption: "Love this outfit 🔥", isPaid: false, price: 0 },
    { id: 4, img: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&q=80", type: "image", caption: "Coffee time ☕️", isPaid: false, price: 0 },
    { id: 5, img: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&q=80", type: "video", caption: "Behind the scenes 🎬", isPaid: true, price: 10 },
    { id: 6, img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80", type: "image", caption: "Throwback to summer 🏖️", isPaid: false, price: 0 },
    { id: 7, img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80", type: "video", caption: "Q&A answering your questions!", isPaid: false, price: 0 },
    { id: 8, img: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80", type: "image", caption: "Studio vibes ✨", isPaid: false, price: 0 },
    { id: 9, img: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&q=80", type: "image", caption: "Sunset views 🌅", isPaid: false, price: 0 },
  ]);

  const filteredPosts = posts.filter(post => activeTab === 'grid' ? post.type === 'image' : post.type === 'video');

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    // Load temporarily saved posts if any
    const temp = localStorage.getItem('temp_posts');
    if (temp) {
      try {
        const parsed = JSON.parse(temp);
        setPosts(prev => [...parsed, ...prev]);
        localStorage.removeItem('temp_posts'); // clear after reading
      } catch (e) {
        console.error(e);
      }
    }

    return () => clearTimeout(timer);
  }, []);

  const handleSignOut = () => {
    setIsSignOutModalOpen(false);
    navigate("/");
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/${editForm.username}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEditProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Rule: 6 to 30 characters, alphanumeric + special icons (like . and _)
    const usernameRegex = /^[\w.]{6,30}$/; 
    if (!usernameRegex.test(editForm.username)) {
      setUsernameError('Username must be 6-30 characters long and can contain alphanumeric characters and special icons (like . or _).');
      return;
    }
    
    // Simulate check with backend
    if (editForm.username.toLowerCase() === 'taken_username') {
      setUsernameError('This username is already taken.');
      return;
    }
    
    setUsernameError('');
    
    // Save username in lowercase
    const savedData = {
      ...editForm,
      username: editForm.username.toLowerCase()
    };
    
    setEditForm(savedData);
    setIsEditProfileModalOpen(false);
  };

  const SidebarContent = ({ isExpanded = false }: { isExpanded?: boolean }) => (
    <div className={`flex flex-col h-full bg-white border-r border-zinc-200 py-6 w-full ${isExpanded ? 'px-6 items-start' : 'items-center'}`}>
      <div className={`mb-8 ${isExpanded ? 'flex items-center gap-3 w-full' : ''}`}>
        <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center shrink-0">
          <LayoutDashboard className="w-5 h-5 text-white" />
        </div>
        {isExpanded && <span className="font-display font-bold text-lg text-zinc-900">Creator Hub</span>}
      </div>
      <div className={`flex-grow flex flex-col space-y-4 w-full ${isExpanded ? 'items-stretch' : 'items-center'}`}>
        <a href="#" className={`p-3 bg-zinc-100 text-zinc-900 rounded-xl transition-colors group relative ${isExpanded ? 'flex items-center gap-3' : ''}`}>
          <LayoutDashboard className="w-6 h-6 shrink-0" />
          {isExpanded ? <span className="font-semibold">Dashboard</span> : <span className="absolute left-full ml-4 px-2 py-1 bg-zinc-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">Dashboard</span>}
        </a>
        <a href="#" className={`p-3 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 rounded-xl transition-colors group relative ${isExpanded ? 'flex items-center gap-3' : ''}`}>
          <div className="relative shrink-0">
            <Inbox className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white"></span>
          </div>
          {isExpanded ? <span className="font-semibold">Inbox</span> : <span className="absolute left-full ml-4 px-2 py-1 bg-zinc-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">Inbox</span>}
        </a>
        <button 
          onClick={() => setIsNotificationsOpen(true)}
          className={`p-3 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 rounded-xl transition-colors group relative ${isExpanded ? 'flex items-center gap-3 w-full text-left' : ''}`}
        >
          <Bell className="w-6 h-6 shrink-0" />
          {isExpanded ? <span className="font-semibold">Notifications</span> : <span className="absolute left-full ml-4 px-2 py-1 bg-zinc-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">Notifications</span>}
        </button>
        <a href="#" className={`p-3 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 rounded-xl transition-colors group relative ${isExpanded ? 'flex items-center gap-3' : ''}`}>
          <Wallet className="w-6 h-6 shrink-0" />
          {isExpanded ? <span className="font-semibold">Wallet</span> : <span className="absolute left-full ml-4 px-2 py-1 bg-zinc-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">Wallet</span>}
        </a>
        <Link to="/verification" className={`p-3 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 rounded-xl transition-colors group relative ${isExpanded ? 'flex items-center gap-3' : ''}`}>
          <ShieldCheck className="w-6 h-6 shrink-0" />
          {isExpanded ? <span className="font-semibold">Verification</span> : <span className="absolute left-full ml-4 px-2 py-1 bg-zinc-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">Verification</span>}
        </Link>
      </div>
      <div className={`mt-auto pb-4 w-full ${isExpanded ? 'flex flex-col items-stretch' : 'flex flex-col items-center'}`}>
        <button 
          onClick={() => setIsSignOutModalOpen(true)}
          className={`p-3 text-zinc-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-colors group relative ${isExpanded ? 'flex items-center gap-3' : ''}`}
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
      <aside className="hidden md:block w-20 fixed inset-y-0 left-0 z-50">
        <SidebarContent />
      </aside>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-zinc-900/50 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="relative w-64 max-w-[80vw] h-full bg-white flex flex-col z-50 shadow-2xl"
            >
              <SidebarContent isExpanded={true} />
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="absolute top-4 -right-12 p-2 text-white bg-zinc-900/50 hover:bg-zinc-900 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 md:ml-20 flex flex-col min-h-screen pt-14 pb-14 md:pt-0 md:pb-0">
        <main className="flex-grow container mx-auto px-4 sm:px-8 py-8 max-w-4xl">
          {isLoading ? (
            // Skeleton Loading State
            <div className="animate-pulse">
              <div className="bg-white rounded-3xl border border-zinc-200 p-6 sm:p-10 mb-8 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-12">
                  <div className="w-24 h-24 sm:w-36 sm:h-36 rounded-full bg-zinc-200 flex-shrink-0" />
                  <div className="flex-grow w-full">
                    <div className="h-8 bg-zinc-200 rounded-lg w-48 mb-6" />
                    <div className="flex items-center gap-8 mb-6">
                      <div className="h-6 bg-zinc-200 rounded-lg w-20" />
                      <div className="h-6 bg-zinc-200 rounded-lg w-24" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-zinc-200 rounded-lg w-32" />
                      <div className="h-4 bg-zinc-200 rounded-lg w-full max-w-md" />
                      <div className="h-4 bg-zinc-200 rounded-lg w-3/4 max-w-sm" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-center gap-12 border-t border-zinc-200 pt-4 mb-6">
                <div className="h-6 w-6 bg-zinc-200 rounded" />
                <div className="h-6 w-6 bg-zinc-200 rounded" />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-4 p-4 sm:p-0">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="aspect-[4/5] bg-zinc-200 rounded-xl" />
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Instagram-style Profile Header */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 px-4 sm:px-0 max-w-[600px] mx-auto w-full pt-4"
              >
                <div className="flex items-center gap-6 sm:gap-12 mb-6">
                  {/* Profile Image */}
                  <div className="w-24 h-24 sm:w-36 sm:h-36 rounded-full overflow-hidden flex-shrink-0 relative border border-zinc-200">
                    <img src="https://i.pravatar.cc/300?img=47" alt="Profile" className="w-full h-full object-cover" />
                    {/* Note bubble */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-[10px] px-2 py-1 rounded-full whitespace-nowrap shadow-sm border border-zinc-700 hidden sm:block">
                      Note...
                    </div>
                  </div>
                  
                  <div className="flex flex-col flex-grow">
                    <div className="flex items-center gap-3 mb-4">
                      <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">{editForm.username}</h2>
                      <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-900 cursor-pointer hover:opacity-70" onClick={() => setIsEditProfileModalOpen(true)} />
                    </div>

                    {/* Stats Desktop */}
                    <div className="flex items-center gap-6 sm:gap-10">
                      <div className="flex flex-col items-center sm:items-start"><span className="font-bold text-zinc-900 text-lg">42</span> <span className="text-zinc-900 text-sm">posts</span></div>
                      <div className="flex flex-col items-center sm:items-start"><span className="font-bold text-zinc-900 text-lg">12.5k</span> <span className="text-zinc-900 text-sm">followers</span></div>
                      <div className="flex flex-col items-center sm:items-start"><span className="font-bold text-zinc-900 text-lg">340</span> <span className="text-zinc-900 text-sm">following</span></div>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div className="mb-6 text-sm">
                  <h3 className="font-bold text-zinc-900 mb-0.5 text-base">{editForm.name}</h3>
                  <p className="text-zinc-500 mb-1">Creator</p>
                  <p className="text-zinc-900 whitespace-pre-line leading-relaxed mb-1">
                    {editForm.bio}
                  </p>
                  <p className="text-zinc-600 mb-1">📍 {editForm.location}</p>
                  <a href="#" className="text-blue-900 font-semibold inline-flex items-center gap-1 flex-wrap break-all">
                    <Link2 className="w-4 h-4 shrink-0"/> <span className="break-all">{window.location.host}/{editForm.username}</span>
                  </a>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 w-full">
                  <button 
                    onClick={() => navigate('/edit-profile')}
                    className="flex-1 py-1.5 px-4 bg-zinc-200 hover:bg-zinc-300 text-zinc-900 font-semibold rounded-lg text-sm transition-colors text-center"
                  >
                    Edit profile
                  </button>
                  <button 
                    onClick={() => setIsShareModalOpen(true)}
                    className="flex-1 py-1.5 px-4 bg-zinc-200 hover:bg-zinc-300 text-zinc-900 font-semibold rounded-lg text-sm transition-colors text-center"
                  >
                    Share profile
                  </button>
                  <div className="flex-1 relative">
                    <button 
                      onClick={() => setIsNewPostMenuOpen(!isNewPostMenuOpen)}
                      className="w-full py-1.5 px-4 bg-zinc-200 hover:bg-zinc-300 text-zinc-900 font-semibold rounded-lg text-sm transition-colors text-center"
                    >
                      New post
                    </button>
                    {isNewPostMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsNewPostMenuOpen(false)} />
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 text-white rounded-xl shadow-xl overflow-hidden z-50 py-2"
                        >
                          <button 
                            onClick={() => { setIsNewPostMenuOpen(false); navigate('/create-post?type=photo'); }}
                            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-zinc-800 transition-colors"
                          >
                            <span className="font-semibold text-sm">Photo</span>
                            <ImagePlus className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => { setIsNewPostMenuOpen(false); navigate('/create-post?type=video'); }}
                            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-zinc-800 transition-colors"
                          >
                            <span className="font-semibold text-sm">Video</span>
                            <Radio className="w-5 h-5" />
                          </button>
                        </motion.div>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Content Tabs */}
              <div className="flex items-center justify-center gap-12 border-t border-zinc-200 pt-4 mb-6">
                <button 
                  onClick={() => setActiveTab('grid')}
                  className={`flex items-center justify-center p-2 -mt-[18px] transition-colors border-t-2 ${activeTab === 'grid' ? 'text-zinc-900 border-zinc-900' : 'text-zinc-400 hover:text-zinc-900 border-transparent'}`}
                >
                  <Grid className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => setActiveTab('video')}
                  className={`flex items-center justify-center p-2 -mt-[18px] transition-colors border-t-2 ${activeTab === 'video' ? 'text-zinc-900 border-zinc-900' : 'text-zinc-400 hover:text-zinc-900 border-transparent'}`}
                >
                  <PlaySquare className="w-6 h-6" />
                </button>
              </div>

              {/* Gallery Grid */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 gap-2 sm:gap-4 p-4 sm:p-0"
              >
                {filteredPosts.map((post) => (
                  <div key={post.id} className="relative bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm flex flex-col group">
                    <div className={`relative ${post.type === 'video' ? 'aspect-[9/16]' : 'aspect-[4/5]'} bg-zinc-200 overflow-hidden shrink-0`}>
                      <img src={post.img} alt={`Post ${post.id}`} className={`w-full h-full object-cover transition-transform duration-500 ${post.isPaid ? 'blur-[12px] scale-110' : 'group-hover:scale-105'}`} />
                      
                      {post.type === 'video' && !post.isPaid && (
                        <div className="absolute top-2 left-2 p-1 bg-black/40 backdrop-blur-md rounded-full text-white">
                          <Play className="w-4 h-4 fill-white" />
                        </div>
                      )}

                      {post.isPaid && (
                        <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center pointer-events-none z-10">
                          <div className="bg-white/90 backdrop-blur-sm p-3 rounded-full mb-2 shadow-lg">
                            <LockKeyhole className="w-6 h-6 text-zinc-900" />
                          </div>
                          <span className="text-white font-bold drop-shadow-md bg-black/40 px-3 py-1 rounded-full text-sm">Exclusive Content</span>
                        </div>
                      )}
                      
                      {/* Post Action Menu */}
                      <div className="absolute top-2 right-2 z-20">
                        <div className="relative">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActivePostMenu(activePostMenu === post.id ? null : post.id);
                            }}
                            className="p-1.5 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white transition-opacity shadow-sm"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          
                          {/* Dropdown Menu */}
                          <AnimatePresence>
                            {activePostMenu === post.id && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="absolute top-full right-0 mt-1 w-32 bg-white rounded-xl shadow-lg border border-zinc-200 py-1 overflow-hidden z-30"
                              >
                                <button className="w-full px-3 py-2 text-sm text-left text-zinc-700 hover:bg-zinc-50 flex items-center gap-2">
                                  <Edit2 className="w-4 h-4" /> Edit
                                </button>
                                <button 
                                  onClick={() => {
                                    setPosts(posts.filter(p => p.id !== post.id));
                                    setActivePostMenu(null);
                                  }}
                                  className="w-full px-3 py-2 text-sm text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                >
                                  <Trash2 className="w-4 h-4" /> Delete
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 flex flex-col flex-1 bg-white">
                      <p className="text-zinc-900 text-sm line-clamp-2 mb-4 leading-relaxed font-medium">
                        {post.caption || 'No caption provided.'}
                      </p>
                      
                      <div className="mt-auto flex items-center justify-between">
                        {post.isPaid ? (
                          <>
                            <span className="font-bold text-zinc-900 text-lg">₹{post.price}</span>
                            <button className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 shrink-0">
                              Pay & View
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-4 text-zinc-500">
                              <span className="flex items-center gap-1 text-sm font-medium"><Heart className="w-4 h-4" /> {Math.floor(Math.random() * 1000) + 100}</span>
                            </div>
                            <button className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 shrink-0">
                              <Eye className="w-4 h-4" /> View
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            </>
          )}
        </main>
      </div>

      {/* Share Profile Modal */}
      <AnimatePresence>
        {isShareModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsShareModalOpen(false)}
              className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-xl border border-zinc-100 p-6 sm:p-8 overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-zinc-900">Share Profile</h3>
                <button onClick={() => setIsShareModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex items-center justify-between gap-4">
                <span className="text-zinc-700 text-sm truncate flex-1 font-medium select-all">
                  {`${window.location.origin}/${editForm.username}`}
                </span>
                <button 
                  onClick={handleCopyLink}
                  className={`p-2 rounded-lg transition-colors flex-shrink-0 ${copied ? 'bg-emerald-100 text-emerald-600' : 'bg-zinc-200 hover:bg-zinc-300 text-zinc-700'}`}
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              {copied && <p className="text-emerald-500 text-sm mt-2 font-medium text-center">Link copied to clipboard!</p>}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

      {/* Notifications Drawer */}
      <AnimatePresence>
        {isNotificationsOpen && (
          <div className="fixed inset-0 z-[70] flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNotificationsOpen(false)}
              className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-sm h-full bg-white shadow-2xl flex flex-col"
            >
              <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-200 shrink-0">
                <h2 className="font-display font-bold text-lg text-zinc-900">Notifications</h2>
                <button 
                  onClick={() => setIsNotificationsOpen(false)} 
                  className="p-2 -mr-2 text-zinc-500 hover:text-zinc-900 transition-colors rounded-full hover:bg-zinc-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="flex gap-4 items-start p-3 bg-rose-50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <Heart className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-900"><span className="font-bold">alex_smith</span> subscribed to your premium tier.</p>
                    <span className="text-xs text-zinc-500 mt-1 block">2 minutes ago</span>
                  </div>
                </div>
                <div className="flex gap-4 items-start p-3 hover:bg-zinc-50 rounded-xl transition-colors border border-transparent hover:border-zinc-200">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <CreditCard className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-900">Your payout of <span className="font-bold">$450.00</span> has been processed.</p>
                    <span className="text-xs text-zinc-500 mt-1 block">2 hours ago</span>
                  </div>
                </div>
                <div className="flex gap-4 items-start p-3 hover:bg-zinc-50 rounded-xl transition-colors border border-transparent hover:border-zinc-200">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-900">You reached <span className="font-bold">12.5k followers</span>! Keep up the great work.</p>
                    <span className="text-xs text-zinc-500 mt-1 block">1 day ago</span>
                  </div>
                </div>
                <div className="flex gap-4 items-start p-3 hover:bg-zinc-50 rounded-xl transition-colors border border-transparent hover:border-zinc-200">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <ShieldCheck className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-900">Please complete your identity verification to enable higher payouts.</p>
                    <span className="text-xs text-zinc-500 mt-1 block">2 days ago</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <MobileNavbar />
    </div>
  );
}
