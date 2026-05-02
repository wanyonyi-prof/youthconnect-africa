'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function CreatePostPage() {
  // ✅ ALL HOOKS MUST BE AT THE TOP (before any conditional returns)
  const { user } = useAuth();
  const router = useRouter();
  
  // State hooks
  const [mounted, setMounted] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<'story' | 'gig'>('story');
  const [location, setLocation] = useState('');
  const [gigType, setGigType] = useState<'full-time' | 'part-time' | 'remote' | 'contract'>('remote');
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('url');
  const [imageUrl, setImageUrl] = useState('');
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // ✅ useCallback hook - must be declared at top level
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      setError('Only images and videos are allowed');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB');
      return;
    }

    if (isVideo) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        if (video.duration > 60) {
          setError('Video must be less than 60 seconds');
          return;
        }
        setMediaPreview(URL.createObjectURL(file));
        setImageUrl('');
        setPreviewError(false);
      };
      video.src = URL.createObjectURL(file);
    } else {
      setMediaPreview(URL.createObjectURL(file));
      setImageUrl('');
      setPreviewError(false);
    }
    setError('');
  }, []);

  // ✅ useEffect hooks - must be at top level
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !user) {
      router.push('/login');
    }
  }, [user, router, mounted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.mov', '.avi', '.webm']
    },
    maxFiles: 1,
  });

  const handleUrlChange = (url: string) => {
    setImageUrl(url);
    setPreviewError(false);
    setIsImageLoading(true);
    setMediaPreview(null);
    
    if (url && url.match(/^https?:\/\/.+\..+/)) {
      const img = new Image();
      img.onload = () => {
        setMediaPreview(url);
        setIsImageLoading(false);
        setPreviewError(false);
        setError('');
      };
      img.onerror = () => {
        setPreviewError(true);
        setIsImageLoading(false);
        setMediaPreview(null);
        setError('Cannot load image from this URL. Please check the link or try a different image host.');
      };
      img.src = url;
    } else if (url) {
      setPreviewError(true);
      setIsImageLoading(false);
      setError('Please enter a valid URL starting with http:// or https://');
    } else {
      setMediaPreview(null);
      setIsImageLoading(false);
      setPreviewError(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }
    
    if (!content.trim()) {
      setError('Please enter content');
      return;
    }

    setUploading(true);
    setError('');

    try {
      let finalMediaURL = '';
      
      if (uploadMethod === 'url' && imageUrl) {
        if (!imageUrl.match(/^https?:\/\/.+\..+/)) {
          throw new Error('Please enter a valid image URL');
        }
        finalMediaURL = imageUrl;
      }

      const postData = {
        userId: user!.uid,
        userName: user!.displayName || 'Anonymous',
        userPhotoURL: user!.photoURL || '',
        title: title.trim(),
        content: content.trim(),
        mediaURL: finalMediaURL,
        mediaType: finalMediaURL ? 'image' : null,
        type: postType,
        location: location.trim() || null,
        gigType: postType === 'gig' ? gigType : null,
        status: 'pending',
        likes: 0,
        comments: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      console.log('Saving to Firestore:', postData);
      const docRef = await addDoc(collection(db, 'posts'), postData);
      console.log('✅ Post saved with ID:', docRef.id);
      
      alert('✅ Post submitted for admin approval!');
      router.push('/');
      
    } catch (err: any) {
      console.error('❌ Error:', err);
      setError(err.message || 'Failed to create post. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const clearMedia = () => {
    setMediaPreview(null);
    setImageUrl('');
    setPreviewError(false);
    setIsImageLoading(false);
    setError('');
  };

  // ✅ Conditional return AFTER all hooks
  if (!mounted || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF8E7] to-[#FFE4B5] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A66C2]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8E7] to-[#FFE4B5] py-12">
      <div className="container-custom max-w-3xl">
        <div className="card-glass p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#0A66C2] to-[#054a91] bg-clip-text text-transparent">
              Share Your Story
            </h1>
            <p className="text-gray-600 mt-2">
              Share campus experiences, opportunities, or gigs with the community
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Post Type Selection */}
            <div className="flex gap-4 p-1 bg-gray-100 rounded-xl">
              <button
                type="button"
                onClick={() => setPostType('story')}
                className={`flex-1 py-2 rounded-lg font-semibold transition ${
                  postType === 'story'
                    ? 'bg-[#0A66C2] text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                📖 Story
              </button>
              <button
                type="button"
                onClick={() => setPostType('gig')}
                className={`flex-1 py-2 rounded-lg font-semibold transition ${
                  postType === 'gig'
                    ? 'bg-[#0A66C2] text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                💼 Gig Opportunity
              </button>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
                placeholder="e.g., My amazing campus experience"
                maxLength={100}
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Content *
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="input-field min-h-[150px]"
                placeholder="Share your story or gig details..."
                maxLength={2000}
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="input-field"
                placeholder="e.g., Nairobi, Kenya or Remote"
              />
            </div>

            {/* Gig-specific fields */}
            {postType === 'gig' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Gig Type
                </label>
                <select
                  value={gigType}
                  onChange={(e) => setGigType(e.target.value as any)}
                  className="input-field"
                >
                  <option value="remote">Remote</option>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                </select>
              </div>
            )}

            {/* Upload Method Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Add Image (Optional)
              </label>
              
              <div className="flex gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setUploadMethod('url');
                    clearMedia();
                  }}
                  className={`flex-1 py-2 rounded-lg font-semibold transition ${
                    uploadMethod === 'url'
                      ? 'bg-[#0A66C2] text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  🔗 Paste Image URL
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUploadMethod('file');
                    clearMedia();
                  }}
                  className={`flex-1 py-2 rounded-lg font-semibold transition ${
                    uploadMethod === 'file'
                      ? 'bg-[#0A66C2] text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  📁 Upload File
                </button>
              </div>

              {uploadMethod === 'url' ? (
                <div>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    className="input-field"
                    placeholder="https://i.imgur.com/your-image.jpg"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Tip: Upload your image to Imgur or GitHub, then paste the direct link here
                  </p>
                </div>
              ) : (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
                    isDragActive
                      ? 'border-[#0A66C2] bg-blue-50'
                      : 'border-gray-300 hover:border-[#0A66C2]'
                  }`}
                >
                  <input {...getInputProps()} />
                  <div>
                    <div className="text-5xl mb-3">📸</div>
                    <p className="text-gray-600">
                      {isDragActive
                        ? 'Drop your file here'
                        : 'Drag & drop or click to upload'}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      JPG, PNG, GIF, MP4 (Max 50MB)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Media Preview Section */}
            {(mediaPreview || isImageLoading || previewError) && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Preview:</p>
                <div className="relative bg-gray-100 rounded-xl p-4">
                  {isImageLoading && (
                    <div className="flex items-center justify-center min-h-[200px]">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A66C2] mx-auto mb-3"></div>
                        <p className="text-gray-500">Loading image...</p>
                      </div>
                    </div>
                  )}
                  
                  {previewError && (
                    <div className="flex items-center justify-center min-h-[200px]">
                      <div className="text-center">
                        <div className="text-5xl mb-3">⚠️</div>
                        <p className="text-red-600 font-semibold mb-2">Cannot load image</p>
                        <p className="text-sm text-gray-500">
                          The URL might be invalid or the image is not accessible
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {mediaPreview && !previewError && !isImageLoading && (
                    <div className="relative">
                      <img
                        src={mediaPreview}
                        alt="Preview"
                        className="max-h-96 mx-auto rounded-lg border-2 border-gray-200 object-contain"
                        onError={() => {
                          setPreviewError(true);
                          setMediaPreview(null);
                        }}
                      />
                      <button
                        type="button"
                        onClick={clearMedia}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition shadow-lg"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-2 border-red-500 text-red-700 px-4 py-3 rounded-xl text-sm">
                <span className="font-bold">❌ Error:</span> {error}
              </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 border-2 border-blue-500 text-blue-700 px-4 py-3 rounded-xl text-sm">
              <p className="font-semibold mb-2">📷 How to add an image:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Upload your image to Imgur (free, no account) - <a href="https://imgur.com/upload" target="_blank" rel="noopener noreferrer" className="underline">Click here to upload</a></li>
                <li>Right-click on the uploaded image and select "Copy image address"</li>
                <li>Paste the link in the field above</li>
                <li>The preview will appear automatically</li>
              </ol>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Submitting...
                </span>
              ) : (
                'Submit for Review →'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}