'use client';

import { motion } from 'framer-motion';
import { Box, Flex, Heading, Text, Button } from '@radix-ui/themes';
import { Mic, Sparkles, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getMonthlyPrice, formatPrice } from '@/lib/config';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function Hero() {
  const [monthlyPrice, setMonthlyPrice] = useState(5);

  useEffect(() => {
    getMonthlyPrice().then(setMonthlyPrice);
  }, []);

  return (
    <Box asChild>
      <section style={{ paddingTop: '12rem', paddingBottom: '8rem', position: 'relative', overflow: 'hidden' }}>
        {/* Subtle background gradient */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '800px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(0, 112, 243, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
          filter: 'blur(60px)',
          zIndex: 0
        }} />

        <Box className="container" style={{ position: 'relative', zIndex: 1 }}>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{ textAlign: 'center' }}
          >
            {/* Badge */}
            <motion.div variants={itemVariants}>
              <Flex justify="center" mb="6">
                <Box style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '999px',
                  background: 'rgba(0, 112, 243, 0.1)',
                  border: '1px solid rgba(0, 112, 243, 0.2)',
                  color: 'var(--accent-11)'
                }}>
                  <Sparkles size={14} />
                  <Text size="1" weight="medium" style={{ letterSpacing: '0.02em' }}>
                    Simple, private, affordable
                  </Text>
                </Box>
              </Flex>
            </motion.div>

            {/* Main Headline */}
            <motion.div variants={itemVariants}>
              <Flex direction="column" gap="6" align="center" mb="8">
                <Heading
                  size="9"
                  weight="bold"
                  align="center"
                  style={{
                    maxWidth: '1000px',
                    lineHeight: '1.08',
                    letterSpacing: '-0.03em',
                    fontSize: 'clamp(2.5rem, 6vw, 4.5rem)'
                  }}
                >
                  Speech-to-text for Mac
                  <br />
                  <Text style={{
                    background: 'linear-gradient(135deg, var(--accent-9) 0%, var(--accent-11) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    display: 'inline-block',
                    paddingBottom: '0.15em'
                  }}>
                    at an honest price
                  </Text>
                </Heading>
                <Text
                  size="5"
                  align="center"
                  style={{
                    maxWidth: '680px',
                    lineHeight: '1.7',
                    fontSize: '1.25rem',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontWeight: '400'
                  }}
                >
                  Professional dictation software that respects your privacy. Hold Fn, speak naturally, and watch your words appear perfectly formatted. {formatPrice(monthlyPrice)}/month.
                </Text>
              </Flex>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div variants={itemVariants}>
              <Flex gap="5" justify="center" align="center" wrap="wrap" mb="8">
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button asChild size="4" variant="solid" style={{
                    boxShadow: '0 4px 16px rgba(0, 112, 243, 0.3)',
                    cursor: 'pointer',
                    borderRadius: '12px',
                    fontWeight: '600',
                    letterSpacing: '-0.01em',
                    paddingLeft: '2.5rem',
                    paddingRight: '2.5rem',
                    height: '56px',
                    minHeight: '56px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <a href="/download" style={{ display: 'flex', alignItems: 'center', height: '100%' }}>Start Free Trial</a>
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button asChild size="4" variant="ghost" style={{
                    cursor: 'pointer',
                    borderRadius: '12px',
                    fontWeight: '600',
                    letterSpacing: '-0.01em',
                    paddingLeft: '2.5rem',
                    paddingRight: '2.5rem',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    height: '56px',
                    minHeight: '56px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxSizing: 'border-box'
                  }}>
                    <a href="#pricing" style={{ display: 'flex', alignItems: 'center', height: '100%' }}>See Pricing →</a>
                  </Button>
                </motion.div>
              </Flex>
            </motion.div>

            {/* Subtext */}
            <motion.div variants={itemVariants}>
              <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.5)' }} align="center">
                7-day free trial • No credit card required • macOS 11.0+
              </Text>
            </motion.div>

            {/* Social Proof / Features Quick List */}
            <motion.div variants={itemVariants}>
              <Flex gap="8" justify="center" align="center" wrap="wrap" style={{ marginTop: '4rem' }}>
                <Flex align="center" gap="2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                  <Zap size={18} strokeWidth={2} />
                  <Text size="2" weight="medium">Instant transcription</Text>
                </Flex>
                <Flex align="center" gap="2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                  <Mic size={18} strokeWidth={2} />
                  <Text size="2" weight="medium">Works everywhere</Text>
                </Flex>
                <Flex align="center" gap="2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                  <Sparkles size={18} strokeWidth={2} />
                  <Text size="2" weight="medium">100% private</Text>
                </Flex>
              </Flex>
            </motion.div>
          </motion.div>
        </Box>
      </section>
    </Box>
  );
}
