'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { Box, Flex, Heading, Text, Card } from '@radix-ui/themes';
import { getMonthlyPrice, formatPrice } from '@/lib/config';

export default function FAQ() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-25%' });
  const [monthlyPrice, setMonthlyPrice] = useState(5);

  useEffect(() => {
    getMonthlyPrice().then(setMonthlyPrice);
  }, []);

  const faqs = [
    {
      question: 'How does NarraFlow compare to other dictation apps?',
      answer: `NarraFlow focuses on core dictation at an honest price. We don't add features you won't use. Just great transcription, auto-formatting, and privacy—all for ${formatPrice(monthlyPrice)}/month with no hidden tiers.`,
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
      answer: `Yes! 7-day free trial, no credit card required. Download and start using it immediately. After the trial, it's just ${formatPrice(monthlyPrice)}/month.`,
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
    <Box asChild ref={ref}>
      <section id="faq" className="section">
        <Box className="container" style={{ maxWidth: '900px' }}>
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
          >
            <Flex direction="column" gap="4" align="center" mb="8">
              <Heading size="8" weight="bold" align="center">
                Questions?
              </Heading>
              <Text size="5" color="gray" align="center">
                Everything you need to know
              </Text>
            </Flex>
          </motion.div>

          {/* FAQ List */}
          <Flex direction="column" gap="4">
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
          </Flex>

          {/* Contact Note */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Card size="3" variant="surface" mt="8" style={{ background: 'var(--accent-2)', borderColor: 'var(--accent-6)' }}>
              <Text size="3" color="gray" align="center" asChild>
                <p>
                  Still have questions?{' '}
                  <Text asChild>
                    <a href="mailto:support@narraflow.com" style={{ color: 'var(--accent-9)', fontWeight: '600' }}>
                      Get in touch
                    </a>
                  </Text>
                </p>
              </Text>
            </Card>
          </motion.div>
        </Box>
      </section>
    </Box>
  );
}

interface FAQItemProps {
  question: string;
  answer: string;
}

function FAQItem({ question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card
      size="2"
      variant="surface"
      style={{
        overflow: 'hidden',
        border: '1px solid var(--gray-5)',
        transition: 'all 0.3s ease',
        boxShadow: isHovered ? '0 4px 12px rgba(0, 0, 0, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ backgroundColor: 'var(--gray-2)' }}
        whileTap={{ scale: 0.99 }}
        style={{
          width: '100%',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          textAlign: 'left',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          transition: 'background-color 0.2s'
        }}
      >
        <Text size="3" weight="bold" style={{ lineHeight: '1.4', paddingRight: '1rem' }}>{question}</Text>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <ChevronDown
            size={20}
            color={isOpen ? 'var(--accent-9)' : 'var(--gray-9)'}
            style={{ transition: 'color 0.3s', display: 'block' }}
          />
        </motion.div>
      </motion.button>
      <motion.div
        initial={false}
        animate={{
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={{ overflow: 'hidden' }}
      >
        <Box style={{
          padding: '1.25rem 1.5rem',
          borderTop: '1px solid var(--gray-5)',
          background: 'var(--gray-2)'
        }}>
          <Text size="2" color="gray" style={{ lineHeight: '1.7' }}>{answer}</Text>
        </Box>
      </motion.div>
    </Card>
  );
}
