import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

/**
 * @description A full-width hero section component with a background video.
 * It displays a video that autoplays, loops, and is muted.
 * Content can be overlaid on top of the video.
 * @returns {JSX.Element} The HeroVideo component.
 */
const HeroVideo = () => {
  return (
    <section className="relative w-full overflow-hidden h-[40vh] md:h-[50vh] lg:h-[60vh]">
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster="/product.png"
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        {/* High-res MP4 first for quality */}
        <source src="/hero-optimized.mp4" type="video/mp4" />
        {/* WebM fallback */}
        <source src="/hero.webm" type="video/webm" />
        {/* Compressed MP4 fallback */}
        <source src="/hero-optimized.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      {/* Stronger gradient overlay for text readability */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/60 via-black/30 to-transparent" />
      {/* Content container above gradient */}
      <div className="relative z-20 flex flex-col items-center justify-center h-full text-center p-4 md:px-8">
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white drop-shadow-lg">
          Precision Microfluidics, Simplified.
        </h1>
        <p className="mt-4 text-base md:text-lg lg:text-2xl text-white drop-shadow-md max-w-2xl">
          Explore our innovative modular components or design your custom microfluidic circuits with ease.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Button asChild variant="ghost" size="lg" className="text-white hover:bg-white/20">
            <Link href="/products">Explore Products</Link>
          </Button>
          <Button asChild size="lg">
            <Link href="/canvas">Start Designing</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroVideo; 