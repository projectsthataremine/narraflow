'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function DocsPage() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-25%' });

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Main Content */}
      <main ref={ref} className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <h1 className="text-5xl font-bold text-gray-900 mb-4">Documentation</h1>
            <p className="text-xl text-gray-600">
              Everything you need to know about using NarraFlow
            </p>
          </motion.div>

          {/* Docs Content */}
          <div className="space-y-16">
            {/* System Requirements */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-4">System Requirements</h2>
              <p className="text-lg text-gray-700 mb-2">
                <span className="font-semibold text-blue-600">macOS Big Sur (11.0) or later</span>
              </p>
              <p className="text-sm text-gray-500">
                Released November 2020. Older versions not supported - use at your own risk.
              </p>
            </motion.section>

            {/* Quick Start */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Quick Start</h2>
              <p className="text-lg text-gray-700">
                Hold down <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-semibold">Fn</span> (or your custom hotkey), speak, release.
                Your text appears wherever your cursor is and gets copied to your clipboard.
              </p>
            </motion.section>

            {/* Interface */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Interface</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  When you first download and run the app, you'll see the settings window.
                  This is your main interface for controlling everything.
                </p>
                <p>
                  You don't need to keep this open - close it and the app keeps running in the background.
                  Your hotkey will still work.
                </p>
                <p>
                  While recording, you'll see a small visualizer appear on screen.
                  That's the only other UI element - minimal and non-intrusive.
                </p>
              </div>
            </motion.section>

            {/* Settings Tabs */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Settings Tabs</h2>
              <div className="space-y-6">
                <div className="border-l-4 border-blue-600 pl-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">General</h3>
                  <ul className="space-y-1 text-gray-700">
                    <li>• Change your hotkey (Fn, Shift+Option, etc.)</li>
                    <li>• Pick your microphone</li>
                    <li>• Toggle dock visibility (show or hide app in dock)</li>
                    <li>• Reset the app if things get weird (only if advised - it's more of a dev thing)</li>
                  </ul>
                </div>

                <div className="border-l-4 border-blue-600 pl-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Recording Pill</h3>
                  <p className="text-gray-700">
                    Customize the little visualizer that shows up when you're recording.
                    Colors, size, glow intensity - make it yours.
                  </p>
                </div>

                <div className="border-l-4 border-blue-600 pl-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">History</h3>
                  <p className="text-gray-700">
                    Your last 10 transcriptions live here.
                    Click to copy, or delete transcriptions you don't need anymore.
                  </p>
                </div>

                <div className="border-l-4 border-blue-600 pl-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Account</h3>
                  <p className="text-gray-700">
                    Sign in with Google to manage your subscription.
                    Manage machines and view your trial status.
                  </p>
                </div>
              </div>
            </motion.section>

            {/* Licensing */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Licensing</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  We use Stripe for checkout. When you purchase your subscription,
                  we'll send you to Stripe to complete payment.
                </p>
                <p>
                  After subscribing, open the app on your computer. Go to settings → account tab
                  and sign in with Google. Once signed in, you'll see your available licenses listed.
                  Click "Use on this machine" to activate that license on your machine.
                </p>
                <p>
                  Cancel? You can do it through the app or online. You'll be redirected to Stripe
                  where you'll confirm cancellation. Then your key becomes invalid and the app stops working.
                  But the Electron app stays on your machine - reactivate anytime.
                </p>
                <p className="text-sm text-gray-500">
                  One key = one device. Simple as that.
                </p>
              </div>
            </motion.section>

            {/* Updates */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Updates</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Bottom left of settings, you'll see the version and a little cloud icon.
                </p>
                <p>
                  <span className="text-gray-600">Gray?</span> You're up to date.
                  <span className="text-red-500 ml-4">Red?</span> Update available.
                </p>
                <p>
                  Hover over the cloud to check. Click it to update.
                </p>
              </div>
            </motion.section>

            {/* Closing/Quitting */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Closing vs Quitting</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Hitting <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded font-semibold">X</span> just closes the settings window.
                  The app keeps running in the background so your hotkey still works.
                </p>
                <p>
                  Want to actually quit? Press <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded font-semibold">Cmd+Q</span>.
                  That's the only way to fully quit the app.
                </p>
              </div>
            </motion.section>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="pt-8 border-t border-gray-200 text-sm text-gray-500"
            >
              <p>
                Feedback on these docs?{' '}
                <Link href="mailto:support@narraflow.com" className="text-blue-600 hover:text-blue-700 font-semibold">
                  Contact us here
                </Link>
              </p>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
