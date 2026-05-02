'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db, auth, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import Link from 'next/link';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  coverPhotoURL?: string;
  phoneNumber?: string;
  location?: string;
  bio?: string;
  website?: string;
  skills?: string[];
  education?: string;
  occupation?: string;
  isVerified: boolean;
  role: 'user' | 'admin';
  joinDate: Date;
  postsCount?: number;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'info'>('posts');
  
  const photoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    displayName: '',
    phoneNumber: '',
    location: '',
    bio: '',
    website: '',
    skills: '',
    education: '',
    occupation: '',
  });

  useEffect(() => {
    if (user && userId) {
      setIsOwnProfile(user.uid === userId);
      fetchProfile();
      fetchUserPosts();
    }
  }, [user, userId]);

  const fetchProfile = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserProfile;
        setProfile(userData);
        
        setEditForm({
          displayName: userData.displayName || '',
          phoneNumber: userData.phoneNumber || '',
          location: userData.location || '',
          bio: userData.bio || '',
          website: userData.website || '',
          skills: userData.skills?.join(', ') || '',
          education: userData.education || '',
          occupation: userData.occupation || '',
        });
      } else {
        setError('User not found');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const postsQuery = query(
        collection(db, 'posts'),
        where('userId', '==', userId),
        where('status', '==', 'approved'),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const postsSnapshot = await getDocs(postsQuery);
      const posts: any[] = [];
      postsSnapshot.forEach((doc) => {
        posts.push({ id: doc.id, ...doc.data() });
      });
      setUserPosts(posts);
    } catch (err) {
      console.error('Error fetching user posts:', err);
    }
  };

  const handleImageUpload = async (file: File, type: 'photo' | 'cover') => {
    if (!user || !isOwnProfile) return;
    
    if (type === 'photo') setUploadingPhoto(true);
    else setUploadingCover(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.uid}/${type}_${Date.now()}.${fileExt}`;
      const storageRef = ref(storage, fileName);
      
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      // Update Firestore
      const updateData = type === 'photo' 
        ? { photoURL: downloadURL }
        : { coverPhotoURL: downloadURL };
      
      await updateDoc(doc(db, 'users', user.uid), updateData);
      
      // Update Auth profile for photo
      if (type === 'photo' && auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: downloadURL });
      }
      
      // Update local state
      setProfile(prev => prev ? { ...prev, ...updateData } : null);
      setSuccess(`${type === 'photo' ? 'Profile photo' : 'Cover photo'} updated!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image');
    } finally {
      if (type === 'photo') setUploadingPhoto(false);
      else setUploadingCover(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const userRef = doc(db, 'users', userId);
      const updateData = {
        displayName: editForm.displayName,
        phoneNumber: editForm.phoneNumber,
        location: editForm.location,
        bio: editForm.bio,
        website: editForm.website,
        skills: editForm.skills.split(',').map(s => s.trim()).filter(s => s),
        education: editForm.education,
        occupation: editForm.occupation,
        updatedAt: new Date(),
      };
      
      await updateDoc(userRef, updateData);

      if (isOwnProfile && auth.currentUser && editForm.displayName !== profile?.displayName) {
        await updateProfile(auth.currentUser, { displayName: editForm.displayName });
      }

      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      fetchProfile();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF8E7] to-[#FFE4B5] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A66C2]"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF8E7] to-[#FFE4B5] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-700 mb-2">User not found</h2>
          <Link href="/" className="text-[#0A66C2] hover:underline">Go back home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8E7] to-[#FFE4B5] py-12">
      <div className="container-custom max-w-5xl">
        {/* Profile Header Card */}
        <div className="card-glass overflow-hidden mb-8">
          {/* Cover Photo Area */}
          <div 
            className="h-40 bg-gradient-to-r from-[#0A66C2] to-[#054a91] relative cursor-pointer group"
            style={profile.coverPhotoURL ? { backgroundImage: `url(${profile.coverPhotoURL})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
            onClick={() => isOwnProfile && coverInputRef.current?.click()}
          >
            {isOwnProfile && (
              <>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">📷 Change Cover Photo</span>
                </div>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleImageUpload(e.target.files[0], 'cover');
                  }}
                />
              </>
            )}
            {uploadingCover && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}
          </div>
          
          {/* Profile Info */}
          <div className="px-8 pb-8 relative">
            {/* Avatar */}
            <div className="relative -mt-16 mb-4 inline-block">
              <div 
                className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden cursor-pointer group relative"
                onClick={() => isOwnProfile && photoInputRef.current?.click()}
              >
                {profile.photoURL ? (
                  <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-[#0A66C2] to-[#054a91] flex items-center justify-center text-white text-4xl font-bold">
                    {profile.displayName?.charAt(0) || 'U'}
                  </div>
                )}
                {isOwnProfile && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <span className="text-white text-xs">📷</span>
                  </div>
                )}
              </div>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleImageUpload(e.target.files[0], 'photo');
                }}
              />
              {uploadingPhoto && (
                <div className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              )}
            </div>

            {/* Name and Verification */}
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{profile.displayName}</h1>
              {profile.isVerified && (
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">✓ Verified</span>
              )}
              {profile.role === 'admin' && (
                <span className="bg-gold-100 text-gold-700 text-xs px-2 py-1 rounded-full">Admin</span>
              )}
            </div>

            {/* Email and Location */}
            <div className="flex flex-wrap gap-4 mb-4 text-gray-600 text-sm">
              <div className="flex items-center gap-1">✉️ {profile.email}</div>
              {profile.location && <div className="flex items-center gap-1">📍 {profile.location}</div>}
              {profile.phoneNumber && <div className="flex items-center gap-1">📱 {profile.phoneNumber}</div>}
              <div className="flex items-center gap-1">📅 Joined {new Date(profile.joinDate).toLocaleDateString()}</div>
            </div>

            {/* Bio */}
            {profile.bio && <p className="text-gray-700 mb-4">{profile.bio}</p>}

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {profile.skills.map((skill, index) => (
                  <span key={index} className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">{skill}</span>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            {isOwnProfile && !isEditing && (
              <button onClick={() => setIsEditing(true)} className="btn-primary text-sm">✏️ Edit Profile</button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button onClick={() => setActiveTab('posts')} className={`pb-3 px-4 font-semibold transition ${activeTab === 'posts' ? 'text-[#0A66C2] border-b-2 border-[#0A66C2]' : 'text-gray-500 hover:text-gray-700'}`}>
            📄 Posts ({userPosts.length})
          </button>
          <button onClick={() => setActiveTab('info')} className={`pb-3 px-4 font-semibold transition ${activeTab === 'info' ? 'text-[#0A66C2] border-b-2 border-[#0A66C2]' : 'text-gray-500 hover:text-gray-700'}`}>
            ℹ️ Personal Info
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'posts' && (
          <div>
            {userPosts.length === 0 ? (
              <div className="text-center py-12 bg-white/50 rounded-2xl">
                <p className="text-gray-500">No posts yet</p>
                {isOwnProfile && <Link href="/create-post" className="btn-primary mt-4 inline-block">Create Your First Post →</Link>}
              </div>
            ) : (
              <div className="space-y-6">
                {userPosts.map((post) => (
                  <div key={post.id} className="card-glass p-6">
                    <h3 className="text-xl font-bold mb-2">{post.title}</h3>
                    <p className="text-gray-600 mb-3">{post.content}</p>
                    {post.mediaURL && <img src={post.mediaURL} alt={post.title} className="rounded-lg max-h-64 w-auto mb-3" />}
                    <div className="flex gap-4 text-sm text-gray-500">
                      <span>❤️ {post.likes || 0}</span>
                      <span>💬 {post.comments || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'info' && (
          <div className="card-glass p-8">
            {isEditing ? (
              <form onSubmit={handleEditSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label><input type="text" value={editForm.displayName} onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })} className="input-field" required /></div>
                  <div><label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label><input type="tel" value={editForm.phoneNumber} onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })} className="input-field" placeholder="+254 XXX XXX XXX" /></div>
                  <div><label className="block text-sm font-semibold text-gray-700 mb-2">Location</label><input type="text" value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} className="input-field" placeholder="Nairobi, Kenya" /></div>
                  <div><label className="block text-sm font-semibold text-gray-700 mb-2">Website / Portfolio</label><input type="url" value={editForm.website} onChange={(e) => setEditForm({ ...editForm, website: e.target.value })} className="input-field" placeholder="https://..." /></div>
                  <div><label className="block text-sm font-semibold text-gray-700 mb-2">Occupation</label><input type="text" value={editForm.occupation} onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })} className="input-field" placeholder="Software Developer, Student, etc." /></div>
                  <div><label className="block text-sm font-semibold text-gray-700 mb-2">Education</label><input type="text" value={editForm.education} onChange={(e) => setEditForm({ ...editForm, education: e.target.value })} className="input-field" placeholder="University of Nairobi, etc." /></div>
                  <div className="md:col-span-2"><label className="block text-sm font-semibold text-gray-700 mb-2">Skills (comma-separated)</label><input type="text" value={editForm.skills} onChange={(e) => setEditForm({ ...editForm, skills: e.target.value })} className="input-field" placeholder="React, Python, UI/UX, Project Management" /></div>
                  <div className="md:col-span-2"><label className="block text-sm font-semibold text-gray-700 mb-2">Bio</label><textarea value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} className="input-field min-h-[100px]" placeholder="Tell us about yourself..." maxLength={300} /><div className="text-right text-xs text-gray-400 mt-1">{editForm.bio.length}/300</div></div>
                </div>
                {error && <div className="bg-red-50 border border-red-500 text-red-700 px-4 py-3 rounded-xl">{error}</div>}
                {success && <div className="bg-green-50 border border-green-500 text-green-700 px-4 py-3 rounded-xl">{success}</div>}
                <div className="flex gap-4"><button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Changes'}</button><button type="button" onClick={() => setIsEditing(false)} className="btn-outline">Cancel</button></div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><h3 className="text-sm font-semibold text-gray-500 mb-1">Full Name</h3><p className="text-gray-900">{profile.displayName}</p></div>
                  <div><h3 className="text-sm font-semibold text-gray-500 mb-1">Email</h3><p className="text-gray-900">{profile.email}</p></div>
                  <div><h3 className="text-sm font-semibold text-gray-500 mb-1">Phone Number</h3><p className="text-gray-900">{profile.phoneNumber || 'Not provided'}</p></div>
                  <div><h3 className="text-sm font-semibold text-gray-500 mb-1">Location</h3><p className="text-gray-900">{profile.location || 'Not provided'}</p></div>
                  <div><h3 className="text-sm font-semibold text-gray-500 mb-1">Occupation</h3><p className="text-gray-900">{profile.occupation || 'Not provided'}</p></div>
                  <div><h3 className="text-sm font-semibold text-gray-500 mb-1">Education</h3><p className="text-gray-900">{profile.education || 'Not provided'}</p></div>
                  <div className="md:col-span-2"><h3 className="text-sm font-semibold text-gray-500 mb-1">Website</h3>{profile.website ? <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-[#0A66C2] hover:underline">{profile.website}</a> : <p className="text-gray-900">Not provided</p>}</div>
                  <div className="md:col-span-2"><h3 className="text-sm font-semibold text-gray-500 mb-1">Skills</h3>{profile.skills && profile.skills.length > 0 ? <div className="flex flex-wrap gap-2">{profile.skills.map((skill, i) => (<span key={i} className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">{skill}</span>))}</div> : <p className="text-gray-900">No skills added yet</p>}</div>
                  <div className="md:col-span-2"><h3 className="text-sm font-semibold text-gray-500 mb-1">Bio</h3><p className="text-gray-900">{profile.bio || 'No bio yet'}</p></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}