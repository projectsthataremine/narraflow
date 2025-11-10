'use client';

import { motion } from 'framer-motion';
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';

export default function DownloadPage() {
  useEffect(() => {
    // Auto-trigger download after 1 second
    const timer = setTimeout(() => {
      // This will be replaced with actual download URL
      console.log('Triggering download...');
      // window.location.href = '/path/to/NarraFlow.dmg';
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-4">
              Thanks for downloading!
              <br />
              Just a few steps left.
            </h1>
            <p className="text-lg text-gray-600">
              Your download will begin automatically. If it didn't,{' '}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  console.log('Manual download triggered');
                  // window.location.href = '/path/to/NarraFlow.dmg';
                }}
                className="text-blue-600 hover:text-blue-700 underline font-medium"
              >
                download NarraFlow manually
              </a>
              .
            </p>
          </motion.div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            {/* Step 1: Open */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center"
            >
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-lg">1</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Open</h2>
              </div>

              <div className="bg-gradient-to-br from-teal-700 to-teal-800 rounded-2xl p-8 mb-6 aspect-[4/3] flex items-center justify-center relative overflow-hidden">
                {/* Downloads folder illustration */}
                <div className="relative">
                  <div className="bg-gray-300/80 px-6 py-2 rounded-lg mb-8">
                    <span className="text-gray-800 font-medium">Downloads</span>
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    <div className="w-16 h-16 bg-yellow-100 rounded-lg"></div>
                    <div className="w-16 h-16 bg-red-100 rounded-lg"></div>
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl ring-4 ring-orange-400 flex items-center justify-center">
                      <div className="w-8 h-8 bg-white/30 rounded"></div>
                    </div>
                    <div className="w-16 h-16 bg-gray-100 rounded-lg"></div>
                  </div>
                </div>
              </div>

              <p className="text-gray-700">
                Open the <span className="font-semibold">NarraFlow.dmg</span> file from your{' '}
                <span className="font-semibold">Downloads</span> folder
              </p>
            </motion.div>

            {/* Step 2: Install */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center"
            >
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-lg">2</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Install</h2>
              </div>

              <div className="bg-gray-200 rounded-2xl p-8 mb-6 aspect-[4/3] flex items-center justify-center relative">
                {/* Drag to Applications illustration */}
                <div className="flex items-center justify-center gap-6">
                  <div className="w-24 h-24 bg-gray-900 rounded-2xl flex items-center justify-center">
                    <div className="w-12 h-12 bg-white/30 rounded"></div>
                  </div>
                  <div className="text-gray-400">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="w-24 h-24 bg-blue-500 rounded-2xl flex items-center justify-center">
                    <div className="w-12 h-12 bg-white/30 rounded"></div>
                  </div>
                </div>
              </div>

              <p className="text-gray-700">
                Drag the <span className="font-semibold">NarraFlow icon</span> into your{' '}
                <span className="font-semibold">Applications</span> folder
              </p>
            </motion.div>

            {/* Step 3: Launch */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center"
            >
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-lg">3</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Launch</h2>
              </div>

              <div className="bg-gray-200 rounded-2xl p-8 mb-6 aspect-[4/3] flex items-center justify-center relative">
                {/* Applications list illustration */}
                <div className="w-full max-w-xs bg-white rounded-xl p-4 space-y-2">
                  <div className="text-left font-medium text-gray-900 mb-3">Applications</div>
                  <div className="flex items-center gap-3 p-2 rounded-lg">
                    <div className="w-8 h-8 bg-gray-900 rounded-lg"></div>
                    <span className="text-gray-600 text-sm">Superhuman.app</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-blue-600">
                    <div className="w-8 h-8 bg-gray-900 rounded-lg"></div>
                    <span className="text-white text-sm font-medium">NarraFlow.app</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-lg">
                    <div className="w-8 h-8 bg-gray-900 rounded-lg"></div>
                    <span className="text-gray-600 text-sm">Notion.app</span>
                  </div>
                </div>
              </div>

              <p className="text-gray-700">
                Open the <span className="font-semibold">NarraFlow</span> app from your{' '}
                <span className="font-semibold">Applications</span> folder
              </p>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
