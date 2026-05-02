'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface CarouselItem {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  bgImage: string;
  icon: string;
}

// You can easily edit these items - add/remove/update as you want!
const carouselItems: CarouselItem[] = [
  {
    id: 1,
    title: "Connect. Discover. Grow.",
    subtitle: "YouthConnect Africa",
    description: "Join Africa's largest youth community for campus stories, gigs, and life-changing opportunities. Connect with like-minded individuals and unlock your potential.",
    buttonText: "Join Now →",
    buttonLink: "/signup",
    bgImage: "/images/carousel/students-collaborating.jpg",
    icon: "🚀"
  },
  {
    id: 2,
    title: "Exclusive Partnerships",
    subtitle: "Featured Organizations",
    description: "We've partnered with Safaricom, Andela, Equity Bank, and 50+ leading companies to bring you exclusive job opportunities, internships, and training programs.",
    buttonText: "Explore Partners →",
    buttonLink: "/partners",
    bgImage: "/images/carousel/partnership-handshake.jpg",
    icon: "🤝"
  },
  {
    id: 3,
    title: "County Government Opportunities",
    subtitle: "Nairobi, Kisumu, Mombasa & More",
    description: "Access thousands of internships, apprenticeships, and job openings from county governments across Kenya. Your dream career starts here!",
    buttonText: "View Opportunities →",
    buttonLink: "/gigs?source=government",
    bgImage: "/images/carousel/county-office.jpg",
    icon: "🏛️"
  },
  {
    id: 4,
    title: "Upcoming Events & Webinars",
    subtitle: "Don't Miss Out!",
    description: "Tech meetups, career fairs, networking events, and skill-building workshops happening near you. Connect with industry leaders and peers.",
    buttonText: "See Events →",
    buttonLink: "/events",
    bgImage: "/images/carousel/event-crowd.jpg",
    icon: "📅"
  },
  {
    id: 5,
    title: "Success Stories",
    subtitle: "Inspiring Journeys",
    description: "Read how young Africans are landing dream jobs, starting businesses, and making impact. Your story could be next! Share your journey with us.",
    buttonText: "Read Stories →",
    buttonLink: "/stories",
    bgImage: "/images/carousel/success-graduation.jpg",
    icon: "⭐"
  }
];

export default function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle scroll - stop autoplay when user scrolls
  useEffect(() => {
    const handleScroll = () => {
      if (isAutoPlaying) {
        setIsAutoPlaying(false);
        
        // Clear existing timeout
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        
        // Resume autoplay after 10 seconds of no scrolling
        scrollTimeoutRef.current = setTimeout(() => {
          setIsAutoPlaying(true);
        }, 10000);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [isAutoPlaying]);

  // Autoplay logic
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
    
    autoPlayRef.current = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % carouselItems.length);
    }, 6000);
    
    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying]);

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    // Resume autoplay after 10 seconds
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const nextSlide = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % carouselItems.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + carouselItems.length) % carouselItems.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0
    })
  };

  return (
    <div className="relative overflow-hidden rounded-3xl shadow-2xl mx-4 md:mx-0">
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          className="relative h-[500px] md:h-[600px] overflow-hidden"
        >
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ 
              backgroundImage: `url(${carouselItems[currentIndex].bgImage})`,
              backgroundColor: '#0A66C2'
            }}
          >
            {/* Dark Overlay for better text readability */}
            <div className="absolute inset-0 bg-black/50"></div>
          </div>
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent"></div>
          
          {/* Content */}
          <div className="relative z-10 h-full flex items-center px-6 md:px-12 lg:px-20">
            <div className="max-w-2xl">
              <div className="text-6xl md:text-7xl mb-4 animate-bounce">{carouselItems[currentIndex].icon}</div>
              <p className="text-yellow-400 text-sm md:text-base uppercase tracking-wider mb-2 font-semibold">
                {carouselItems[currentIndex].subtitle}
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
                {carouselItems[currentIndex].title}
              </h1>
              <p className="text-base md:text-lg text-gray-200 mb-6 leading-relaxed">
                {carouselItems[currentIndex].description}
              </p>
              <Link
                href={carouselItems[currentIndex].buttonLink}
                className="inline-flex items-center gap-2 bg-[#FFD700] text-gray-900 px-6 md:px-8 py-3 rounded-full font-semibold hover:scale-105 transition transform shadow-lg"
              >
                {carouselItems[currentIndex].buttonText}
              </Link>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition z-20 backdrop-blur-sm"
        aria-label="Previous slide"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition z-20 backdrop-blur-sm"
        aria-label="Next slide"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Dots Navigation */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-20">
        {carouselItems.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all rounded-full ${
              index === currentIndex
                ? 'w-8 h-2 bg-[#FFD700]'
                : 'w-2 h-2 bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Autoplay Indicator */}
      {isAutoPlaying && (
        <div className="absolute bottom-6 right-6 bg-black/50 text-white text-xs px-2 py-1 rounded-full z-20 backdrop-blur-sm">
          Auto-playing
        </div>
      )}
    </div>
  );
}