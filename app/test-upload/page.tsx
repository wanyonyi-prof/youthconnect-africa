'use client';

import { useState } from 'react';
import { uploadMedia } from '@/utils/upload';
import { useAuth } from '@/contexts/AuthContext';

export default function TestUploadPage() {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState('');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
      setResult('Please login first');
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setResult('Uploading...');

    const type = file.type.startsWith('image/') ? 'image' : 'video';
    const { url, error } = await uploadMedia(file, user.uid, type);

    if (error) {
      setResult(`Error: ${error}`);
    } else {
      setResult(`Success! URL: ${url}`);
    }
    setUploading(false);
  };

  return (
    <div className="container-custom py-10">
      <h1 className="text-2xl font-bold mb-4">Test Supabase Upload</h1>
      {!user && <p className="text-red-500">Please login first</p>}
      <input type="file" accept="image/*,video/*" onChange={handleUpload} disabled={!user} />
      {uploading && <p>Uploading...</p>}
      {result && <p className="mt-4">{result}</p>}
    </div>
  );
}