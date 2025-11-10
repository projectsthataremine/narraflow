'use client';

import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

export default function ComparisonTable() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-25%' });

  const features = [
    { name: 'Speech-to-text transcription' },
    { name: 'Auto-formatting & grammar fixes' },
    { name: 'Works in any app' },
    { name: 'Custom hotkey (Fn by default)' },
    { name: 'Transcription history' },
    { name: '100% local processing (privacy)', highlight: true },
    { name: 'Silence detection & trimming' },
    { name: 'Automatic clipboard copy' },
    { name: 'Visual feedback pill' },
    { name: 'Language support', value: 'English' },
    { name: 'Apple Silicon & Intel support' },
    { name: 'macOS Big Sur 11.0+' },
  ];

  return (
    <section ref={ref} id="features-list" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 space-y-4"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900">
            Everything you need. <span className="text-blue-600">Nothing you don't.</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Professional speech-to-text at an honest price.
          </p>
        </motion.div>

        {/* Features Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-br from-blue-600 to-blue-700">
                  <th className="text-left py-6 px-8 text-white font-semibold text-lg">
                    What's Included
                  </th>
                  <th className="text-center py-6 px-8 w-32">
                    <div className="text-3xl">✓</div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {features.map((feature, index) => (
                  <FeatureRow
                    key={index}
                    feature={feature.name}
                    value={feature.value}
                    highlight={feature.highlight}
                    index={index}
                    isInView={isInView}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Bottom Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-8 text-center"
        >
          <p className="text-gray-600">
            <span className="font-semibold text-gray-900">$5/month</span> for everything above. No hidden tiers.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

interface FeatureRowProps {
  feature: string;
  value?: string;
  highlight?: boolean;
  index: number;
  isInView: boolean;
}

function FeatureRow({ feature, value, highlight, index, isInView }: FeatureRowProps) {
  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
      transition={{ duration: 0.4, delay: 0.3 + index * 0.05 }}
      className={highlight ? 'bg-blue-50/30' : ''}
    >
      <td className="py-4 px-8 text-gray-900 font-medium">
        {feature}
        {highlight && (
          <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
            Key
          </span>
        )}
      </td>
      <td className="py-4 px-8 text-center">
        {value ? (
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.3, delay: 0.3 + index * 0.05 + 0.1 }}
            className="text-sm font-semibold text-blue-600"
          >
            {value}
          </motion.span>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0, rotate: -180 }}
            animate={isInView ? { opacity: 1, scale: 1, rotate: 0 } : { opacity: 0, scale: 0, rotate: -180 }}
            transition={{ duration: 0.4, delay: 0.3 + index * 0.05 + 0.1, type: 'spring', stiffness: 200 }}
          >
            <Check size={24} className="text-blue-600 mx-auto" />
          </motion.div>
        )}
      </td>
    </motion.tr>
  );
}
