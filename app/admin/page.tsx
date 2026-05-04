'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// This is where you'll edit carousel content
const carouselItems = [
  {
    id: 1,
    title: "Connect. Discover. Grow.",
    subtitle: "YouthConnect Africa",
    description: "Join Africa's largest youth community for campus stories, gigs, and life-changing opportunities.",
    buttonText: "Join Now →",
    buttonLink: "/signup",
    bgImage: "/images/carousel/students-collaborating.jpg",
    icon: "🚀"
  },
  {
    id: 2,
    title: "Exclusive Partnerships",
    subtitle: "Featured Organizations",
    description: "Partnerships with Safaricom, Andela, Equity Bank, and 50+ leading companies.",
    buttonText: "Explore Partners →",
    buttonLink: "/partners",
    bgImage: "/images/carousel/partnership-handshake.jpg",
    icon: "🤝"
  },
  // Add/Edit/Remove slides here
];

export default function CarouselAdminPage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();

  if (!user || !isAdmin) {
    router.push('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8E7] to-[#FFE4B5] py-12">
      <div className="container-custom max-w-4xl">
        <div className="card-glass p-8">
          <h1 className="text-3xl font-bold mb-4">🎠 Carousel Manager</h1>
          <p className="text-gray-600 mb-8">
            Edit the carousel content by updating the array in <code className="bg-gray-100 px-2 py-1 rounded">components/common/HeroCarousel.tsx</code>
          </p>

          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-xl">
              <h2 className="font-semibold mb-2">📝 How to Update Carousel:</h2>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Open <code>components/common/HeroCarousel.tsx</code></li>
                <li>Find the <code>carouselItems</code> array</li>
                <li>Add, edit, or remove items</li>
                <li>For images, add them to <code>public/images/carousel/</code></li>
                <li>Save and refresh the homepage</li>
              </ol>
            </div>

            <h2 className="text-xl font-bold mt-8 mb-4">Current Carousel Slides:</h2>
            <div className="space-y-4">
              {carouselItems.map((item) => (
                <div key={item.id} className="border rounded-xl p-4">
                  <div className="flex gap-4">
                    <div className="text-4xl">{item.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{item.title}</h3>
                      <p className="text-sm text-gray-600">{item.description}</p>
                      <p className="text-xs text-gray-400 mt-1">Image: {item.bgImage}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-yellow-50 p-4 rounded-xl mt-8">
              <h2 className="font-semibold mb-2">🖼️ Adding Background Images:</h2>
              <p className="text-sm">Place your images in: <code className="bg-gray-100 px-2 py-1 rounded">public/images/carousel/</code></p>
              <p className="text-sm mt-2">Recommended image size: 1920x1080px (16:9 ratio)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}