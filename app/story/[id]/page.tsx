'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, increment, collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Post {
  id: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  title: string;
  content: string;
  mediaURL?: string;
  mediaType?: string;
  type: 'story' | 'gig';
  location?: string;
  gigType?: string;
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

export default function PostDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;
  
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [filterType, setFilterType] = useState<'recent' | 'relevant'>('recent');

  useEffect(() => {
    if (postId) {
      fetchPost();
      fetchComments();
      fetchRelatedPosts();
    }
  }, [postId]);

  const fetchPost = async () => {
    try {
      const postDoc = await getDoc(doc(db, 'posts', postId));
      if (postDoc.exists()) {
        const postData = { id: postDoc.id, ...postDoc.data() } as Post;
        setPost(postData);
        setLikesCount(postData.likes || 0);
        
        if (user && postData.likesArray?.includes(user.uid)) {
          setLiked(true);
        }
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const commentsQuery = query(
        collection(db, 'comments'),
        where('postId', '==', postId),
        orderBy('createdAt', filterType === 'recent' ? 'desc' : 'asc')
      );
      const commentsSnapshot = await getDocs(commentsQuery);
      const commentsData: Comment[] = [];
      commentsSnapshot.forEach((doc) => {
        commentsData.push({ id: doc.id, ...doc.data() } as Comment);
      });
      setComments(commentsData);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const fetchRelatedPosts = async () => {
    try {
      const relatedQuery = query(
        collection(db, 'posts'),
        where('status', '==', 'approved'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const relatedSnapshot = await getDocs(relatedQuery);
      const related: Post[] = [];
      relatedSnapshot.forEach((doc) => {
        if (doc.id !== postId) {
          related.push({ id: doc.id, ...doc.data() } as Post);
        }
      });
      setRelatedPosts(related.slice(0, 3));
    } catch (error) {
      console.error('Error fetching related posts:', error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      alert('Please login to like posts');
      router.push('/login');
      return;
    }

    try {
      const postRef = doc(db, 'posts', postId);
      
      if (liked) {
        await updateDoc(postRef, {
          likes: increment(-1),
          likesArray: arrayRemove(user.uid)
        });
        setLiked(false);
        setLikesCount(prev => prev - 1);
      } else {
        await updateDoc(postRef, {
          likes: increment(1),
          likesArray: arrayUnion(user.uid)
        });
        setLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('Please login to comment');
      router.push('/login');
      return;
    }
    
    if (!newComment.trim()) return;
    
    setSubmitting(true);
    
    try {
      const commentData = {
        postId: postId,
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userPhotoURL: user.photoURL || '',
        content: newComment.trim(),
        createdAt: new Date(),
      };
      
      await addDoc(collection(db, 'comments'), commentData);
      
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        comments: increment(1)
      });
      
      await fetchComments();
      setNewComment('');
      
      setPost(prev => prev ? { ...prev, comments: (prev.comments || 0) + 1 } : null);
      
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/story/${postId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          text: post?.content,
          url: shareUrl,
        });
        return;
      } catch (err) {
        console.log('Share cancelled');
      }
    }
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareMessage('✅ Link copied to clipboard!');
      setTimeout(() => setShareMessage(''), 3000);
    } catch (err) {
      setShareMessage('❌ Failed to copy link');
      setTimeout(() => setShareMessage(''), 3000);
    }
  };

  // Function to highlight links and mentions in text
  const formatContent = (text: string) => {
    // Highlight URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    let formattedText = text.replace(urlRegex, (url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-[#0A66C2] hover:underline font-medium">${url}</a>`;
    });
    
    // Highlight mentions (@username)
    const mentionRegex = /@(\w+)/g;
    formattedText = formattedText.replace(mentionRegex, (match, username) => {
      return `<a href="/profile/${username}" class="text-[#0A66C2] hover:underline font-medium">${match}</a>`;
    });
    
    // Highlight hashtags
    const hashtagRegex = /#(\w+)/g;
    formattedText = formattedText.replace(hashtagRegex, (match, tag) => {
      return `<a href="/search?q=${tag}" class="text-[#FFD700] hover:underline font-medium">${match}</a>`;
    });
    
    return formattedText;
  };

  // Format comment with mentions
  const formatComment = (text: string) => {
    const mentionRegex = /@(\w+)/g;
    return text.replace(mentionRegex, (match, username) => {
      return `<a href="/profile/${username}" class="text-[#0A66C2] hover:underline font-medium">${match}</a>`;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF8E7] to-[#FFE4B5] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A66C2]"></div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8E7] to-[#FFE4B5] py-12">
      <div className="container-custom max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Post Card */}
            <div className="card-glass p-8 mb-8">
              <Link href="/" className="text-[#0A66C2] hover:underline mb-4 inline-block">
                ← Back to Home
              </Link>
              
              {/* User Info */}
              <div className="flex items-center gap-4 mb-6">
                <img
                  src={post.userPhotoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.userName)}&background=0A66C2&color=fff`}
                  alt={post.userName}
                  className="w-16 h-16 rounded-full object-cover ring-4 ring-[#FFD700]/30"
                />
                <div>
                  <h3 className="font-bold text-xl text-gray-900">{post.userName}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>📍 {post.location || 'Africa'}</span>
                    <span>•</span>
                    <span>{post.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}</span>
                  </div>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
              
              {/* Content with highlighted links and mentions */}
              <div 
                className="text-gray-700 text-lg leading-relaxed mb-6 prose max-w-none"
                dangerouslySetInnerHTML={{ __html: formatContent(post.content) }}
              />
              
              {/* Media */}
              {post.mediaURL && (
                <div className="rounded-2xl overflow-hidden mb-6">
                  <img
                    src={post.mediaURL}
                    alt={post.title}
                    className="w-full h-auto object-cover"
                  />
                </div>
              )}

              {/* Engagement Bar */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <div className="flex gap-6">
                  <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 transition group ${liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                  >
                    <span className="text-3xl group-hover:scale-110 transition">
                      {liked ? '❤️' : '🤍'}
                    </span>
                    <span className="font-semibold">{likesCount.toLocaleString()}</span>
                  </button>

                  <button className="flex items-center gap-2 text-gray-500 hover:text-[#0A66C2] transition group">
                    <span className="text-3xl group-hover:scale-110 transition">💬</span>
                    <span className="font-semibold">{post.comments || 0}</span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="flex items-center gap-2 text-gray-500 hover:text-green-500 transition group"
                  >
                    <span className="text-3xl group-hover:scale-110 transition">🔗</span>
                    <span className="font-semibold">Share</span>
                  </button>
                </div>
                {shareMessage && (
                  <div className="text-sm text-green-600">{shareMessage}</div>
                )}
              </div>
            </div>

            {/* Comments Section */}
            <div className="card-glass p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  💬 Comments <span className="text-sm text-gray-500">({comments.length})</span>
                </h2>
                
                {/* Filter dropdown */}
                <select
                  value={filterType}
                  onChange={(e) => {
                    setFilterType(e.target.value as 'recent' | 'relevant');
                    fetchComments();
                  }}
                  className="input-field text-sm w-32"
                >
                  <option value="recent">Most Recent</option>
                  <option value="relevant">Most Relevant</option>
                </select>
              </div>

              {/* Add Comment Form */}
              {user ? (
                <form onSubmit={handleAddComment} className="mb-8">
                  <div className="flex gap-4">
                    <img
                      src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=0A66C2&color=fff`}
                      alt={user.displayName || 'User'}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment... (Use @username to mention someone)"
                        className="input-field min-h-[80px]"
                        maxLength={500}
                      />
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-400">{newComment.length}/500</span>
                        <button
                          type="submit"
                          disabled={submitting || !newComment.trim()}
                          className="btn-primary text-sm disabled:opacity-50"
                        >
                          {submitting ? 'Posting...' : 'Post Comment →'}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="bg-blue-50 rounded-xl p-4 text-center mb-8">
                  <p className="text-gray-600">
                    <Link href="/login" className="text-[#0A66C2] font-semibold hover:underline">
                      Login
                    </Link> to join the conversation
                  </p>
                </div>
              )}

              {/* Comments List */}
              {comments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No comments yet. Be the first to comment!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-4">
                      <img
                        src={comment.userPhotoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.userName)}&background=0A66C2&color=fff`}
                        alt={comment.userName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="bg-gray-50 rounded-xl p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">{comment.userName}</span>
                            <span className="text-xs text-gray-400">
                              {comment.createdAt?.toDate?.()?.toLocaleDateString()}
                            </span>
                          </div>
                          <div 
                            className="text-gray-700"
                            dangerouslySetInnerHTML={{ __html: formatComment(comment.content) }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Related Posts */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <div className="card-glass p-6">
                <h3 className="text-xl font-bold mb-4">📚 Related Posts</h3>
                {relatedPosts.length === 0 ? (
                  <p className="text-gray-500 text-sm">No related posts found</p>
                ) : (
                  <div className="space-y-4">
                    {relatedPosts.map((related) => (
                      <Link key={related.id} href={`/story/${related.id}`}>
                        <div className="border-b border-gray-100 pb-4 last:border-0 cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition">
                          <h4 className="font-semibold text-[#0A66C2] mb-1 line-clamp-2">{related.title}</h4>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{related.content}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span>❤️ {related.likes || 0}</span>
                            <span>💬 {related.comments || 0}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Post Stats */}
              <div className="card-glass p-6">
                <h3 className="text-xl font-bold mb-4">📊 Post Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">👁️ Views</span>
                    <span className="font-semibold">1.2K</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">❤️ Likes</span>
                    <span className="font-semibold">{likesCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">💬 Comments</span>
                    <span className="font-semibold">{post.comments || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">🔗 Shares</span>
                    <span className="font-semibold">45</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}