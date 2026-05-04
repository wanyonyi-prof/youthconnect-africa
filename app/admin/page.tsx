'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { collection, getDocs, updateDoc, doc, deleteDoc, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Post {
  id: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  title: string;
  content: string;
  mediaURL?: string;
  type: 'story' | 'gig';
  location?: string;
  gigType?: string;
  status: 'pending' | 'approved' | 'rejected';
  likes: number;
  comments: number;
  createdAt: any;
}

export default function AdminDashboard() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/');
      return;
    }
    fetchAllPosts();
  }, [authLoading, isAdmin]);

  useEffect(() => {
    filterPosts();
  }, [allPosts, activeTab, searchTerm]);

  const fetchAllPosts = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const posts: Post[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        posts.push({ 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt,
          status: data.status || 'pending'
        } as Post);
      });
      
      setAllPosts(posts);
      
      // Calculate stats
      const pending = posts.filter(p => p.status === 'pending').length;
      const approved = posts.filter(p => p.status === 'approved').length;
      const rejected = posts.filter(p => p.status === 'rejected').length;
      setStats({ total: posts.length, pending, approved, rejected });
      
    } catch (error) {
      console.error('Error fetching posts:', error);
      alert('Failed to fetch posts. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const filterPosts = () => {
    let filtered = [...allPosts];
    
    // Filter by status
    if (activeTab !== 'all') {
      filtered = filtered.filter(post => post.status === activeTab);
    }
    
    // Filter by search
    if (searchTerm) {
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.userName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredPosts(filtered);
  };

  const handleStatusUpdate = async (postId: string, newStatus: 'approved' | 'rejected') => {
    setProcessing(postId);
    try {
      await updateDoc(doc(db, 'posts', postId), { 
        status: newStatus, 
        updatedAt: new Date() 
      });
      await fetchAllPosts();
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Failed to update post status');
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to permanently delete this post? This action cannot be undone.')) return;
    setProcessing(postId);
    try {
      await deleteDoc(doc(db, 'posts', postId));
      await fetchAllPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">✅ Approved</span>;
      case 'rejected': return <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">❌ Rejected</span>;
      default: return <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full">⏳ Pending</span>;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF8E7] to-[#FFE4B5] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A66C2] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF8E7] to-[#FFE4B5] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Access Denied</h2>
          <p className="text-gray-500 mb-4">You don't have permission to view this page.</p>
          <Link href="/" className="text-[#0A66C2] hover:underline">Go back home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8E7] to-[#FFE4B5] py-12">
      <div className="container-custom max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#0A66C2] to-[#054a91] bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">Manage all posts and content across the platform</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card-glass p-6 text-center cursor-pointer hover:scale-105 transition" onClick={() => setActiveTab('all')}>
            <div className="text-3xl font-bold text-[#0A66C2]">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Posts</div>
          </div>
          <div className="card-glass p-6 text-center cursor-pointer hover:scale-105 transition" onClick={() => setActiveTab('pending')}>
            <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="card-glass p-6 text-center cursor-pointer hover:scale-105 transition" onClick={() => setActiveTab('approved')}>
            <div className="text-3xl font-bold text-green-600">{stats.approved}</div>
            <div className="text-sm text-gray-600">Approved</div>
          </div>
          <div className="card-glass p-6 text-center cursor-pointer hover:scale-105 transition" onClick={() => setActiveTab('rejected')}>
            <div className="text-3xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-sm text-gray-600">Rejected</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="card-glass p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">🔍 Search Posts</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, content, or author..."
                className="input-field"
              />
            </div>
            <div className="md:w-48">
              <label className="block text-sm font-semibold text-gray-700 mb-2">📊 Filter by Status</label>
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value as any)}
                className="input-field"
              >
                <option value="all">All Posts</option>
                <option value="pending">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={fetchAllPosts} className="btn-outline">🔄 Refresh</button>
            </div>
          </div>
        </div>

        {/* Posts List */}
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12 bg-white/50 rounded-2xl">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">No posts found</h3>
            <p className="text-gray-500">Try adjusting your filters or check back later</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredPosts.map((post) => (
              <div key={post.id} className="card-glass p-6 hover:shadow-xl transition">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Post Content */}
                  <div className="flex-1">
                    {/* User Info */}
                    <div className="flex items-center gap-3 mb-3">
                      <img
                        src={post.userPhotoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.userName)}&background=0A66C2&color=fff`}
                        alt={post.userName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900">{post.userName}</h3>
                        <p className="text-xs text-gray-500">
                          {post.createdAt?.toDate?.()?.toLocaleString() || 'Unknown date'}
                        </p>
                      </div>
                    </div>

                    {/* Post Type Badge */}
                    <div className="flex gap-2 mb-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${post.type === 'gig' ? 'bg-gold-100 text-gold-700' : 'bg-blue-100 text-blue-700'}`}>
                        {post.type === 'gig' ? '💼 Gig' : '📖 Story'}
                      </span>
                      {getStatusBadge(post.status)}
                      {post.gigType && (
                        <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">
                          {post.gigType}
                        </span>
                      )}
                    </div>

                    {/* Title and Content */}
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h2>
                    <p className="text-gray-600 mb-3 line-clamp-3">{post.content}</p>

                    {/* Location */}
                    {post.location && (
                      <p className="text-sm text-gray-500 mb-2">📍 {post.location}</p>
                    )}

                    {/* Media Preview */}
                    {post.mediaURL && (
                      <div className="mt-3">
                        <img src={post.mediaURL} alt={post.title} className="rounded-lg max-h-48 w-auto object-cover" />
                      </div>
                    )}

                    {/* Engagement Stats */}
                    <div className="flex gap-6 mt-4 text-sm text-gray-500">
                      <span>❤️ {post.likes || 0} likes</span>
                      <span>💬 {post.comments || 0} comments</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-row lg:flex-col gap-2">
                    {post.status !== 'approved' && (
                      <button
                        onClick={() => handleStatusUpdate(post.id, 'approved')}
                        disabled={processing === post.id}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                      >
                        ✅ Approve
                      </button>
                    )}
                    {post.status !== 'rejected' && (
                      <button
                        onClick={() => handleStatusUpdate(post.id, 'rejected')}
                        disabled={processing === post.id}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition disabled:opacity-50"
                      >
                        ❌ Reject
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(post.id)}
                      disabled={processing === post.id}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition disabled:opacity-50"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Refresh Button at Bottom */}
        <div className="mt-8 text-center">
          <button onClick={fetchAllPosts} className="btn-primary">
            🔄 Refresh Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}