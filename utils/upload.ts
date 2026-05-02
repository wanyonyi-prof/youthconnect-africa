import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function uploadMedia(
  file: File,
  userId: string,
  type: 'image' | 'video'
): Promise<{ url: string; error: string | null }> {
  try {
    // Validate
    if (!file) return { url: '', error: 'No file selected' };
    if (!userId) return { url: '', error: 'User not authenticated' };

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const fileName = `${userId}_${timestamp}_${randomId}.${fileExt}`;
    const folderPath = type === 'image' ? 'images' : 'videos';
    const filePath = `${folderPath}/${fileName}`;

    // Upload to Firebase Storage
    const storageRef = ref(storage, filePath);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    console.log('✅ Upload success:', downloadURL);
    return { url: downloadURL, error: null };
    
  } catch (error: any) {
    console.error('❌ Upload error:', error);
    return { url: '', error: error.message };
  }
}

export function getMediaUrl(path: string): string {
  // For Firebase Storage, we need to get the URL from the reference
  const storageRef = ref(storage, path);
  return `https://firebasestorage.googleapis.com/v0/b/${storageRef.bucket}/o/${encodeURIComponent(storageRef.fullPath)}?alt=media`;
}