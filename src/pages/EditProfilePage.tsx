import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { MobileHeader } from "../components/MobileHeader";
import { MobileNavbar } from "../components/MobileNavbar";

export default function EditProfilePage() {
  const navigate = useNavigate();
  const [editForm, setEditForm] = useState({
    name: 'Jane Doe',
    username: 'mallucupid_creator',
    bio: 'Exclusive content creator ✨\nSharing my journey and behind-the-scenes.\nSubscribe to my channel for daily updates! 👇',
    location: 'New York, USA',
    instagram: '',
    facebook: '',
    isPrivate: false,
    gender: 'Prefer not to say'
  });
  const [usernameError, setUsernameError] = useState('');

  const handleEditProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editForm.username.length < 3) {
      setUsernameError('Username must be at least 3 characters long');
      return;
    }
    
    // Simulate saving data globally
    localStorage.setItem('profileData', JSON.stringify(editForm));
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col md:items-center md:justify-center md:p-8 pt-14 pb-14 md:pt-8 md:pb-8">
      <MobileHeader />
      <div className="w-full max-w-xl bg-white md:rounded-3xl shadow-none md:shadow-xl border-x-0 border-y-0 md:border border-zinc-100 p-6 sm:p-8 flex-grow md:flex-grow-0">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 rounded-full hover:bg-zinc-100 transition-colors">
            <ArrowLeft className="w-6 h-6 text-zinc-900" />
          </button>
          <h2 className="text-2xl font-bold text-zinc-900">Edit Profile</h2>
        </div>

        <form id="edit-profile-form" onSubmit={handleEditProfileSubmit} className="space-y-6">
          {/* Profile Photo */}
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 border border-zinc-200">
              <img src="https://i.pravatar.cc/300?img=47" alt="Profile" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <div className="mb-2">
                <h4 className="font-bold text-zinc-900 text-sm">{editForm.username}</h4>
                <p className="text-zinc-500 text-sm">{editForm.name}</p>
              </div>
              <button type="button" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-colors">
                Change photo
              </button>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-900">Name</label>
            <input 
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm({...editForm, name: e.target.value})}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-colors"
              placeholder="Your name"
              required
            />
          </div>

          {/* Username */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-900">Username</label>
            <input 
              type="text"
              value={editForm.username}
              onChange={(e) => {
                setEditForm({...editForm, username: e.target.value});
                setUsernameError('');
              }}
              className={`w-full px-4 py-3 bg-zinc-50 border ${usernameError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-zinc-200 focus:border-rose-500 focus:ring-rose-500/20'} rounded-xl focus:outline-none focus:ring-2 transition-colors`}
              placeholder="Username"
              required
            />
            {usernameError && <p className="text-xs text-red-500 mt-1">{usernameError}</p>}
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-900">Bio</label>
            <textarea 
              value={editForm.bio}
              onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-colors resize-none h-24"
              placeholder="Write something about yourself..."
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-900">Location</label>
            <input 
              type="text"
              value={editForm.location}
              onChange={(e) => setEditForm({...editForm, location: e.target.value})}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-colors"
              placeholder="City, Country"
            />
          </div>

          {/* Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-2">Social Links</h4>
            <div className="space-y-3 flex flex-col sm:flex-row gap-0 sm:gap-4">
              <input 
                type="url"
                value={editForm.instagram}
                onChange={(e) => setEditForm({...editForm, instagram: e.target.value})}
                className="w-full sm:flex-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-colors mb-3 sm:mb-0"
                placeholder="Instagram URL"
              />
              <input 
                type="url"
                value={editForm.facebook}
                onChange={(e) => setEditForm({...editForm, facebook: e.target.value})}
                className="w-full sm:flex-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-colors"
                placeholder="Facebook URL"
              />
            </div>
          </div>

          {/* Gender & Privacy */}
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="space-y-2 flex-1">
              <label className="text-sm font-bold text-zinc-900">Gender</label>
              <select
                value={editForm.gender}
                onChange={(e) => setEditForm({...editForm, gender: e.target.value})}
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-colors appearance-none"
              >
                <option value="Prefer not to say">Prefer not to say</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Transgender">Transgender</option>
              </select>
            </div>

            <div className="space-y-2 flex-1 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 sm:border-none flex flex-col justify-center">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-bold text-zinc-900">Private account</label>
                </div>
                <button 
                  type="button"
                  onClick={() => setEditForm({...editForm, isPrivate: !editForm.isPrivate})}
                  className={`w-11 h-6 rounded-full transition-colors relative ${editForm.isPrivate ? 'bg-zinc-900' : 'bg-zinc-200'}`}
                >
                  <span className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white transition-all ${editForm.isPrivate ? 'left-[calc(100%-20px)]' : 'left-1'}`} />
                </button>
              </div>
              <p className="text-xs text-zinc-500 mt-1">Profile and posts hidden when private.</p>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-200">
            <button 
              type="submit"
              className="w-full py-4 px-4 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-xl transition-colors text-lg shadow-sm"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
      <MobileNavbar />
    </div>
  );
}
