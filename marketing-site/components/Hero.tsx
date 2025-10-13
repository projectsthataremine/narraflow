'use client';

import { useState } from 'react';
import Image from 'next/image';
import Logo from './Logo';
import { FORMATTED_PRICE } from '@/lib/constants';

export default function Hero() {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Left Side - Content */}
      <div className="bg-tan p-12 md:p-16 flex flex-col justify-between">
        {/* Header */}
        <div className="flex justify-between items-center mb-16">
          <Logo />
          <button className="text-sm font-medium hover:opacity-70 transition-opacity">
            Sign up
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col justify-center">
          {!showDetails ? (
            <>
              <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl leading-tight mb-8">
                Voice typing
                <br />
                that actually
                <br />
                works
              </h1>

              <div className="flex items-center gap-4 mb-8">
                <button
                  onClick={() => setShowDetails(true)}
                  className="bg-black text-white px-8 py-4 rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  Learn more
                </button>
                <button className="text-sm font-medium hover:opacity-70 transition-opacity">
                  Try platform for free
                </button>
              </div>

              {/* Small decorative graphic */}
              <div className="flex gap-2">
                <div className="w-12 h-12 bg-black rounded-tl-[24px]" />
                <div className="w-12 h-12 bg-gray-400 rounded-tr-[24px]" />
                <div className="grid grid-cols-2 gap-1 w-12 h-12">
                  <div className="bg-gray-600 rounded-tl-[12px]" />
                  <div className="bg-black rounded-tr-[12px]" />
                  <div className="bg-black rounded-bl-[12px]" />
                  <div className="bg-gray-400 rounded-br-[12px]" />
                </div>
              </div>
            </>
          ) : (
            <>
              <h2 className="font-heading text-4xl md:text-5xl leading-tight mb-6">
                It's that
                <br />
                simple
              </h2>
              <div className="space-y-4 text-lg leading-relaxed mb-8">
                <p>Press Shift+Option. Speak. That's it.</p>
                <p>Works in every app.</p>
                <p className="font-semibold">{FORMATTED_PRICE}/month. 7-day free trial.</p>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="bg-black text-white px-8 py-4 rounded-lg font-medium hover:opacity-90 transition-opacity w-fit"
              >
                Get started
              </button>
            </>
          )}
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="relative min-h-screen bg-black">
        <Image
          src="/side_image.png"
          alt="Geometric pattern"
          fill
          className="object-cover"
          priority
        />
      </div>
    </div>
  );
}
