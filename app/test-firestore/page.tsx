'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';

export default function TestFirestorePage() {
  const { user } = useAuth();
  const [status, setStatus] = useState('Testing...');
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    async function testFirestore() {
      if (!user) {
        setStatus('❌ Please login first');
        return;
      }

      try {
        setStatus('📝 Testing Firestore connection...');
        
        // Try to add a test post
        const testPost = {
          userId: user.uid,
          userName: user.displayName || 'Test User',
          title: 'Test Post',
          content: 'This is a test',
          type: 'story',
          status: 'pending',
          createdAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, 'test_posts'), testPost);
        setStatus(`✅ Success! Test post created with ID: ${docRef.id}`);
        
        // Try to read posts
        const querySnapshot = await getDocs(collection(db, 'test_posts'));
        const fetchedPosts: any[] = [];
        querySnapshot.forEach((doc) => {
          fetchedPosts.push({ id: doc.id, ...doc.data() });
        });
        setPosts(fetchedPosts);
        
      } catch (error: any) {
        console.error('Firestore error:', error);
        setStatus(`❌ Error: ${error.message}`);
      }
    }

    testFirestore();
  }, [user]);

  if (!user) {
    return (
      <div className="container-custom py-10">
        <div className="card-glass p-6">
          <h1 className="text-2xl font-bold mb-4">Firestore Test</h1>
          <p className="text-red-600">Please login first</p>
          <a href="/login" className="btn-primary mt-4 inline-block">Go to Login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-10">
      <div className="card-glass p-6">
        <h1 className="text-2xl font-bold mb-4">Firestore Connection Test</h1>
        <div className="mb-4 p-3 bg-gray-100 rounded-lg">
          <p className="font-semibold">Status:</p>
          <p className={status.includes('✅') ? 'text-green-600' : 'text-blue-600'}>
            {status}
          </p>
        </div>
        
        <div className="mb-4">
          <p className="font-semibold mb-2">User Info:</p>
          <p>UID: {user.uid}</p>
          <p>Name: {user.displayName}</p>
          <p>Email: {user.email}</p>
        </div>

        {posts.length > 0 && (
          <div>
            <p className="font-semibold mb-2">Test Posts in Database:</p>
            <pre className="bg-gray-100 p-3 rounded-lg overflow-auto text-xs">
              {JSON.stringify(posts, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-4">
          <a href="/create-post" className="btn-primary inline-block">
            Go to Create Post Page
          </a>
        </div>
      </div>
    </div>
  );
}