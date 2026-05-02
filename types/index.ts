export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  location?: string;
  bio?: string;
  website?: string;
  skills?: string[];
  education?: string;
  occupation?: string;
  isVerified: boolean;
  joinDate: Date;
  createdAt: Date;
  role: 'user' | 'admin';
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  title: string;
  content: string;
  mediaURL?: string;
  mediaType?: 'image' | 'video';
  status: 'pending' | 'approved' | 'rejected';
  type: 'story' | 'gig';
  location?: string;
  gigType?: 'full-time' | 'part-time' | 'remote' | 'contract';
  createdAt: Date;
  updatedAt: Date;
  likes: number;
  comments: number;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  content: string;
  createdAt: Date;
}

export interface UploadResponse {
  url: string;
  path: string;
  error?: string;
}