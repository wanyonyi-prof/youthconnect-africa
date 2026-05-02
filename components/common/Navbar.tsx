'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/gigs', label: 'Gigs' },
  ];

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container-custom py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
  <img 
    src="/images/logo/logo.png" 
    alt="YouthConnect Africa" 
    className="h-10 w-auto"
    onError={(e) => {
      // Fallback if image doesn't exist
      e.currentTarget.style.display = 'none';
    }}
  />
  <span className="text-xl font-bold text-[#0A66C2]">
    YouthConnect<span className="text-[#FFD700]">Africa</span>
  </span>
</Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`hover:text-[#0A66C2] transition-colors ${
                  pathname === link.href ? 'text-[#0A66C2] font-semibold' : 'text-gray-600'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {user && (
              <>
                <Link
                  href="/create-post"
                  className="text-gray-600 hover:text-[#0A66C2] transition-colors"
                >
                  Create Post
                </Link>
                <Link
                  href={`/profile/${user.uid}`}
                  className="text-gray-600 hover:text-[#0A66C2] transition-colors"
                >
                  Profile
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="text-[#FFD700] hover:text-[#FFD700]/80 transition-colors font-semibold"
                  >
                    Admin Panel
                  </Link>
                )}
              </>
            )}

            {!user ? (
              <div className="flex items-center space-x-4">
                <Link href="/login" className="btn-outline">
                  Login
                </Link>
                <Link href="/signup" className="btn-primary">
                  Sign Up
                </Link>
              </div>
            ) : (
              <button onClick={handleLogout} className="text-gray-600 hover:text-red-500 transition-colors">
                Logout
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-600"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block hover:text-[#0A66C2] transition-colors ${
                  pathname === link.href ? 'text-[#0A66C2] font-semibold' : 'text-gray-600'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {user && (
              <>
                <Link
                  href="/create-post"
                  className="block text-gray-600 hover:text-[#0A66C2] transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Create Post
                </Link>
                <Link
                  href={`/profile/${user.uid}`}
                  className="block text-gray-600 hover:text-[#0A66C2] transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="block text-[#FFD700] hover:text-[#FFD700]/80 transition-colors font-semibold"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Admin Panel
                  </Link>
                )}
              </>
            )}

            {!user ? (
              <div className="space-y-3 pt-2">
                <Link
                  href="/login"
                  className="block btn-outline text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="block btn-primary text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            ) : (
              <button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left text-gray-600 hover:text-red-500 transition-colors"
              >
                Logout
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}