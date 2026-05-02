'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Gig {
  id: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  title: string;
  content: string;
  mediaURL?: string;
  location?: string;
  gigType: 'full-time' | 'part-time' | 'remote' | 'contract';
  type: 'gig';
  status: string;
  likes: number;
  comments: number;
  createdAt: any;
}

export default function GigsPage() {
  const { user } = useAuth();
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [filteredGigs, setFilteredGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');

  // Extract unique locations from gigs
  const locations = ['all', 'Remote', 'Nairobi', 'Mombasa', 'Kisumu', 'Other'];

  useEffect(() => {
    fetchGigs();
  }, []);

  useEffect(() => {
    filterGigs();
  }, [gigs, selectedType, searchTerm, selectedLocation]);

  const fetchGigs = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'posts'),
        where('type', '==', 'gig'),
        where('status', '==', 'approved'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const gigsData: Gig[] = [];
      querySnapshot.forEach((doc) => {
        gigsData.push({ id: doc.id, ...doc.data() } as Gig);
      });
      
      setGigs(gigsData);
      setFilteredGigs(gigsData);
    } catch (error) {
      console.error('Error fetching gigs:', error);
      // If orderBy fails (missing index), try without orderBy
      try {
        const q2 = query(
          collection(db, 'posts'),
          where('type', '==', 'gig'),
          where('status', '==', 'approved')
        );
        const querySnapshot2 = await getDocs(q2);
        const gigsData2: Gig[] = [];
        querySnapshot2.forEach((doc) => {
          gigsData2.push({ id: doc.id, ...doc.data() } as Gig);
        });
        setGigs(gigsData2);
        setFilteredGigs(gigsData2);
      } catch (error2) {
        console.error('Error fetching gigs without order:', error2);
      }
    } finally {
      setLoading(false);
    }
  };

  const filterGigs = () => {
    let filtered = [...gigs];

    // Filter by gig type
    if (selectedType !== 'all') {
      filtered = filtered.filter(gig => gig.gigType === selectedType);
    }

    // Filter by location
    if (selectedLocation !== 'all') {
      if (selectedLocation === 'Remote') {
        filtered = filtered.filter(gig => 
          gig.location?.toLowerCase().includes('remote')
        );
      } else {
        filtered = filtered.filter(gig => 
          gig.location?.toLowerCase().includes(selectedLocation.toLowerCase())
        );
      }
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(gig =>
        gig.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gig.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gig.userName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredGigs(filtered);
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'remote':
        return 'bg-green-100 text-green-700';
      case 'full-time':
        return 'bg-blue-100 text-blue-700';
      case 'part-time':
        return 'bg-purple-100 text-purple-700';
      case 'contract':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8E7] to-[#FFE4B5] py-12">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#0A66C2] to-[#054a91] bg-clip-text text-transparent mb-4">
            💼 Gigs & Opportunities
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Discover the best opportunities across Africa. From remote work to full-time positions.
          </p>
        </div>

        {/* Filters Section */}
        <div className="card-glass p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🔍 Search Gigs
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, company, or description..."
                className="input-field"
              />
            </div>

            {/* Gig Type Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📋 Job Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="input-field"
              >
                <option value="all">All Types</option>
                <option value="remote">Remote</option>
                <option value="full-time">Full-Time</option>
                <option value="part-time">Part-Time</option>
                <option value="contract">Contract</option>
              </select>
            </div>

            {/* Location Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📍 Location
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="input-field"
              >
                {locations.map(loc => (
                  <option key={loc} value={loc}>
                    {loc === 'all' ? 'All Locations' : loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters Display */}
          {(selectedType !== 'all' || selectedLocation !== 'all' || searchTerm) && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm text-gray-600">Active filters:</span>
              {selectedType !== 'all' && (
                <span className="badge-blue flex items-center gap-1">
                  {selectedType}
                  <button
                    onClick={() => setSelectedType('all')}
                    className="ml-1 hover:text-gray-300"
                  >
                    ✕
                  </button>
                </span>
              )}
              {selectedLocation !== 'all' && (
                <span className="badge-blue flex items-center gap-1">
                  {selectedLocation}
                  <button
                    onClick={() => setSelectedLocation('all')}
                    className="ml-1 hover:text-gray-300"
                  >
                    ✕
                  </button>
                </span>
              )}
              {searchTerm && (
                <span className="badge-blue flex items-center gap-1">
                  Search: {searchTerm}
                  <button
                    onClick={() => setSearchTerm('')}
                    className="ml-1 hover:text-gray-300"
                  >
                    ✕
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Found <span className="font-bold text-[#0A66C2]">{filteredGigs.length}</span> opportunities
          </p>
        </div>

        {/* Gigs Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card-glass p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                <div className="flex gap-2">
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredGigs.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">No gigs found</h3>
            <p className="text-gray-500">
              Try adjusting your filters or check back later for new opportunities
            </p>
            {(selectedType !== 'all' || selectedLocation !== 'all' || searchTerm) && (
              <button
                onClick={() => {
                  setSelectedType('all');
                  setSelectedLocation('all');
                  setSearchTerm('');
                }}
                className="btn-primary mt-6"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGigs.map((gig) => (
              <div
                key={gig.id}
                className="card-glass p-6 hover:transform hover:-translate-y-1 transition-all duration-300"
              >
                {/* Company/User Info */}
                <div className="flex items-center gap-3 mb-4">
                  {gig.userPhotoURL ? (
                    <img
                      src={gig.userPhotoURL}
                      alt={gig.userName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#0A66C2] to-[#054a91] flex items-center justify-center text-white font-bold">
                      {gig.userName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">{gig.userName}</h3>
                    <p className="text-xs text-gray-500">
                      Posted {gig.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                    </p>
                  </div>
                </div>

                {/* Gig Title */}
                <h2 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                  {gig.title}
                </h2>

                {/* Description */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {gig.content}
                </p>

                {/* Tags/Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`badge-gold text-xs ${getTypeBadgeColor(gig.gigType)}`}>
                    {gig.gigType?.toUpperCase()}
                  </span>
                  {gig.location && (
                    <span className="badge-blue text-xs">
                      📍 {gig.location}
                    </span>
                  )}
                </div>

                {/* Engagement Stats */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>❤️ {gig.likes || 0}</span>
                    <span>💬 {gig.comments || 0}</span>
                  </div>
                  <button className="text-[#0A66C2] font-semibold text-sm hover:underline">
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Call to Action for Logged Out Users */}
        {!user && (
          <div className="mt-12 bg-gradient-to-r from-[#0A66C2] to-[#054a91] rounded-2xl p-8 text-center text-white">
            <h3 className="text-2xl font-bold mb-2">Want to post a gig?</h3>
            <p className="mb-4">Sign up to share opportunities with thousands of talented youth across Africa</p>
            <Link href="/signup" className="bg-[#FFD700] text-[#0A66C2] px-8 py-3 rounded-full font-semibold hover:scale-105 transition inline-block">
              Create Free Account
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}