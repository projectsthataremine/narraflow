'use client';

import { useState, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, useInView } from 'framer-motion';

export default function FAQ() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-25%' });

  const faqs = [
    {
      question: 'How does NarraFlow compare to other dictation apps?',
      answer: "NarraFlow focuses on core dictation at an honest price. We don't add features you won't use. Just great transcription, auto-formatting, and privacy—all for $5/month with no hidden tiers.",
    },
    {
      question: 'Does it work on Windows or iPhone?',
      answer: "Mac only for now (macOS Big Sur 11.0 or later). Windows and iPhone support coming in 2026.",
    },
    {
      question: 'What about privacy?',
      answer: "Everything happens on your Mac. Your transcriptions are never sent to our servers. Don't believe us? Turn off your Wi-Fi and the app still works perfectly.",
    },
    {
      question: 'Can I try before I pay?',
      answer: 'Yes! 7-day free trial, no credit card required. Download and start using it immediately. After the trial, it\'s just $5/month.',
    },
    {
      question: "What if I don't like it?",
      answer: "Cancel anytime with one click. No questions asked.",
    },
    {
      question: 'Which Macs are supported?',
      answer: 'Both Apple Silicon (M1/M2/M3/M4) and Intel Macs running macOS Big Sur 11.0 or later. We have separate downloads for each chip type.',
    },
  ];

  return (
    <section ref={ref} id="faq" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 space-y-4"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900">
            Questions?
          </h2>
          <p className="text-xl text-gray-600">
            Everything you need to know
          </p>
        </motion.div>

        {/* FAQ List */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
            >
              <FAQItem question={faq.question} answer={faq.answer} />
            </motion.div>
          ))}
        </div>

        {/* Contact Note */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 text-center p-6 bg-blue-50 rounded-xl border border-blue-100"
        >
          <p className="text-gray-700">
            Still have questions?{' '}
            <a href="mailto:support@narraflow.com" className="text-blue-600 hover:text-blue-700 font-semibold">
              Get in touch
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}

interface FAQItemProps {
  question: string;
  answer: string;
}

function FAQItem({ question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ backgroundColor: 'rgb(249, 250, 251)' }}
        className="w-full px-6 py-4 flex items-center justify-between text-left transition-colors"
      >
        <span className="font-semibold text-gray-900">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown size={20} className="text-gray-400" />
        </motion.div>
      </motion.button>
      <motion.div
        initial={false}
        animate={{
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="overflow-hidden"
      >
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <p className="text-gray-700 leading-relaxed">{answer}</p>
        </div>
      </motion.div>
    </div>
  );
}
