'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { collection, getDocs, doc, updateDoc, increment, arrayUnion, arrayRemove, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import HeroCarousel from '@/components/common/HeroCarousel';

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
  likes: number;
  likesArray?: string[];
  comments: number;
  status: string;
  createdAt: any;
}

interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  content: string;
  createdAt: any;
}

export default function HomePage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [featuredGigs, setFeaturedGigs] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [likingPostId, setLikingPostId] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [commentPreviews, setCommentPreviews] = useState<Map<string, Comment>>(new Map());

  // Fetch posts and comments
  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError('');
      
      const querySnapshot = await getDocs(collection(db, 'posts'));
      
      const allPosts: Post[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        allPosts.push({
          id: doc.id,
          ...data,
        } as Post);
      });
      
      // Filter approved posts
      const approvedPosts = allPosts.filter(post => post.status === 'approved');
      
      // Sort by createdAt (newest first)
      approvedPosts.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      
      setPosts(approvedPosts);
      
      // Get featured gigs
      const gigs = approvedPosts.filter(p => p.type === 'gig').slice(0, 3);
      setFeaturedGigs(gigs);
      
      // Fetch latest comment for each post
      await fetchCommentPreviews(approvedPosts);
      
    } catch (err: any) {
      console.error('❌ Error fetching posts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommentPreviews = async (posts: Post[]) => {
    const previews = new Map<string, Comment>();
    
    for (const post of posts) {
      try {
        const commentsQuery = query(
          collection(db, 'comments'),
          where('postId', '==', post.id),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
        const commentsSnapshot = await getDocs(commentsQuery);
        if (!commentsSnapshot.empty) {
          const commentData = commentsSnapshot.docs[0].data();
          previews.set(post.id, { id: commentsSnapshot.docs[0].id, ...commentData } as Comment);
        }
      } catch (error) {
        console.error('Error fetching comment preview:', error);
      }
    }
    
    setCommentPreviews(previews);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Handle Like
  const handleLike = async (e: React.MouseEvent, postId: string, currentLiked: boolean) => {
    e.preventDefault();
    
    if (!user) {
      alert('Please login to like posts');
      return;
    }

    setLikingPostId(postId);
    
    try {
      const postRef = doc(db, 'posts', postId);
      
      if (currentLiked) {
        await updateDoc(postRef, {
          likes: increment(-1),
          likesArray: arrayRemove(user.uid)
        });
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, likes: (post.likes || 1) - 1, likesArray: post.likesArray?.filter(id => id !== user.uid) }
            : post
        ));
      } else {
        await updateDoc(postRef, {
          likes: increment(1),
          likesArray: arrayUnion(user.uid)
        });
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, likes: (post.likes || 0) + 1, likesArray: [...(post.likesArray || []), user.uid] }
            : post
        ));
      }
    } catch (error) {
      console.error('Error liking post:', error);
    } finally {
      setLikingPostId(null);
    }
  };

  // Handle Share
  const handleShare = async (e: React.MouseEvent, postId: string, title: string) => {
    e.preventDefault();
    
    const shareUrl = `${window.location.origin}/story/${postId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: 'Check out this post on YouthConnect Africa!',
          url: shareUrl,
        });
        return;
      } catch (err) {
        console.log('Share cancelled');
      }
    }
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareMessage(postId);
      setTimeout(() => setShareMessage(null), 3000);
    } catch (err) {
      alert('Failed to copy link. Please copy manually.');
    }
  };

  // Toggle expand/collapse for long posts
  const toggleExpand = (e: React.MouseEvent, postId: string) => {
    e.preventDefault();
    setExpandedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  // Truncate text
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF8E7] to-[#FFE4B5] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A66C2] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading stories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Carousel Section */}
      <HeroCarousel />

      {/* Feed Section */}
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-[#0A66C2] to-[#054a91] bg-clip-text text-transparent">
                Latest Stories
              </h2>
              <div className="flex gap-3">
                {user && (
                  <Link href="/create-post" className="btn-primary text-sm">
                    + Share Your Story
                  </Link>
                )}
                <button onClick={fetchPosts} className="text-sm text-[#0A66C2] hover:underline">
                  🔄 Refresh
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-500 text-red-700 px-4 py-3 rounded-xl mb-6">
                ❌ Error: {error}
              </div>
            )}

            {posts.length === 0 ? (
              <div className="text-center py-12 bg-white/50 rounded-2xl">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No posts yet</h3>
                <p className="text-gray-500 mb-4">
                  {user ? "Be the first to share your story!" : "Sign up to join the community!"}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {posts.map((post) => {
                  const isLiked = user && post.likesArray?.includes(user.uid);
                  const isLiking = likingPostId === post.id;
                  const isExpanded = expandedPosts.has(post.id);
                  const commentPreview = commentPreviews.get(post.id);
                  const shouldTruncate = post.content.length > 200 && !isExpanded;
                  
                  return (
                    <div key={post.id} className="card-glass hover:shadow-xl transition overflow-hidden">
                      {/* Clickable area for post details */}
                      <Link href={`/story/${post.id}`}>
                        <div className="p-6 cursor-pointer">
                          {/* User Info */}
                          <div className="flex items-center gap-4 mb-4">
                            <div className="relative">
                              <img
                                src={post.userPhotoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.userName)}&background=0A66C2&color=fff`}
                                alt={post.userName}
                                className="w-14 h-14 rounded-full object-cover ring-4 ring-[#FFD700]/30"
                              />
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold text-lg text-gray-900">{post.userName}</h3>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>📍 {post.location || 'Africa'}</span>
                                <span>•</span>
                                <span>{post.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}</span>
                              </div>
                            </div>
                            {post.type === 'gig' && (
                              <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-xs px-3 py-1 rounded-full">
                                💼 GIG
                              </span>
                            )}
                          </div>

                          {/* Title */}
                          <h4 className="text-xl font-bold mb-3 text-gray-900 line-clamp-2">{post.title}</h4>
                          
                          {/* Content with See More */}
                          <div className="text-gray-700 mb-4 leading-relaxed">
                            {shouldTruncate ? (
                              <>
                                {truncateText(post.content, 200)}
                                {' '}
                                <button
                                  onClick={(e) => toggleExpand(e, post.id)}
                                  className="text-[#0A66C2] font-semibold hover:underline inline-block"
                                >
                                  ...see more
                                </button>
                              </>
                            ) : (
                              <>
                                {post.content}
                                {post.content.length > 200 && (
                                  <button
                                    onClick={(e) => toggleExpand(e, post.id)}
                                    className="text-[#0A66C2] font-semibold hover:underline ml-2 inline-block"
                                  >
                                    see less
                                  </button>
                                )}
                              </>
                            )}
                          </div>

                          {/* Media Preview */}
                          {post.mediaURL && (
                            <div className="rounded-2xl overflow-hidden mb-4">
                              <img
                                src={post.mediaURL}
                                alt={post.title}
                                className="w-full h-auto max-h-96 object-cover hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  console.error('Image failed to load:', post.mediaURL);
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                          )}

                          {/* Comment Preview */}
                          {commentPreview && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <div className="flex items-start gap-2">
                                <img
                                  src={commentPreview.userPhotoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(commentPreview.userName?.charAt(0) || 'U')}&background=0A66C2&color=fff`}
                                  alt=""
                                  className="w-6 h-6 rounded-full mt-0.5"
                                />
                                <div className="flex-1">
                                  <p className="text-sm text-gray-500">
                                    <span className="font-semibold text-gray-700">{commentPreview.userName}</span>
                                    {' '}
                                    <span className="line-clamp-1">{commentPreview.content}</span>
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    💬 View all {post.comments || 0} comments
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* Engagement Buttons - Outside Link to prevent navigation */}
                      <div className="px-6 pb-6 pt-2 border-t border-gray-100">
                        <div className="flex gap-8">
                          {/* Like Button */}
                          <button
                            onClick={(e) => handleLike(e, post.id, isLiked)}
                            disabled={isLiking}
                            className={`flex items-center gap-2 transition group ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                          >
                            <span className="text-2xl group-hover:scale-110 transition">
                              {isLiked ? '❤️' : '🤍'}
                            </span>
                            <span className="font-semibold">{post.likes?.toLocaleString() || 0}</span>
                          </button>

                          {/* Comment Button - Navigate to post */}
                          <Link
                            href={`/story/${post.id}`}
                            className="flex items-center gap-2 text-gray-500 hover:text-[#0A66C2] transition group"
                          >
                            <span className="text-2xl group-hover:scale-110 transition">💬</span>
                            <span className="font-semibold">{post.comments || 0}</span>
                          </Link>

                          {/* Share Button */}
                          <button
                            onClick={(e) => handleShare(e, post.id, post.title)}
                            className="flex items-center gap-2 text-gray-500 hover:text-green-500 transition group relative"
                          >
                            <span className="text-2xl group-hover:scale-110 transition">🔗</span>
                            <span className="font-semibold">Share</span>
                            {shareMessage === post.id && (
                              <span className="absolute -top-8 left-0 bg-green-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                ✅ Copied!
                              </span>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Stats Card */}
              <div className="card-glass p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-3xl">🌍</span> Community Impact
                </h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-gradient-to-br from-blue-50 to-white rounded-xl">
                    <div className="text-3xl font-bold text-[#0A66C2]">10K+</div>
                    <div className="text-sm text-gray-600">Active Youth</div>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-yellow-50 to-white rounded-xl">
                    <div className="text-3xl font-bold text-[#FFD700]">500+</div>
                    <div className="text-sm text-gray-600">Gigs Posted</div>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-green-50 to-white rounded-xl">
                    <div className="text-3xl font-bold text-green-600">47</div>
                    <div className="text-sm text-gray-600">Countries</div>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-purple-50 to-white rounded-xl">
                    <div className="text-3xl font-bold text-purple-600">{posts.length}</div>
                    <div className="text-sm text-gray-600">Live Stories</div>
                  </div>
                </div>
              </div>

              {/* Featured Gigs */}
              {featuredGigs.length > 0 && (
                <div className="card-glass p-6">
                  <h3 className="text-xl font-bold mb-4">🔥 Featured Gigs</h3>
                  <div className="space-y-4">
                    {featuredGigs.map((gig) => (
                      <Link key={gig.id} href={`/story/${gig.id}`}>
                        <div className="border-b border-gray-100 pb-4 last:border-0 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition">
                          <h4 className="font-semibold text-[#0A66C2] mb-1">{gig.title}</h4>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{gig.content}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">📍 {gig.location || 'Remote'}</span>
                            <span className="text-xs text-[#0A66C2] font-semibold">Apply →</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Link href="/gigs" className="block text-center mt-6 text-[#0A66C2] font-semibold hover:underline">
                    View all gigs →
                  </Link>
                </div>
              )}

              {/* Trending Topics */}
              <div className="card-glass p-6">
                <h3 className="text-xl font-bold mb-4">📈 Trending Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {['#CampusLife', '#TechGigs', '#RemoteWork', '#YouthEmpowerment', '#StudyAbroad', '#KenyaJobs', '#Freelancing', '#StartupLife'].map((topic, i) => (
                    <Link
                      key={i}
                      href={`/search?q=${topic}`}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm px-3 py-1 rounded-full transition"
                    >
                      {topic}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Call to Action */}
              {!user && (
                <div className="bg-gradient-to-br from-[#0A66C2] to-[#054a91] rounded-2xl p-6 text-white text-center">
                  <div className="text-4xl mb-3">🚀</div>
                  <h3 className="text-xl font-bold mb-2">Join the Movement</h3>
                  <p className="text-sm mb-4">Be part of Africa's fastest growing youth community</p>
                  <Link href="/signup" className="bg-[#FFD700] text-[#0A66C2] px-6 py-2 rounded-full font-semibold inline-block hover:scale-105 transition">
                    Sign Up Free
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}