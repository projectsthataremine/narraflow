'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Box, Flex, Heading, Text, Button } from '@radix-ui/themes';

export default function FinalCTA() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-25%' });

  return (
    <Box asChild ref={ref}>
      <section id="download" style={{
        padding: '5rem 1rem',
        background: 'linear-gradient(135deg, var(--accent-9) 0%, var(--accent-10) 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animated background gradient */}
        <motion.div
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.3,
            background: 'linear-gradient(45deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
            backgroundSize: '200% 200%',
          }}
        />

        <Box className="container" style={{ maxWidth: '900px', position: 'relative', zIndex: 10 }}>
          <Flex direction="column" gap="6" align="center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.6 }}
            >
              <Heading size="9" weight="bold" align="center" style={{ color: 'white', lineHeight: '1.2' }}>
                Ready to ditch typing?
              </Heading>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Text size="6" align="center" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                Start your 7-day free trial today.
              </Text>
            </motion.div>

            {/* Download Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              style={{ paddingTop: '1rem' }}
            >
              <Flex gap="4" justify="center" align="center" wrap="wrap">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button asChild size="4" variant="solid" style={{ background: 'white', color: 'var(--accent-9)' }}>
                    <a href="/login">Get Started</a>
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button asChild size="4" variant="outline" style={{ borderColor: 'white', color: 'white' }}>
                    <a href="#pricing">View Pricing</a>
                  </Button>
                </motion.div>
              </Flex>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              style={{ paddingTop: '1rem' }}
            >
              <Text size="2" align="center" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                macOS Big Sur 11.0 or later • Apple Silicon & Intel
              </Text>
            </motion.div>
          </Flex>
        </Box>
      </section>
    </Box>
  );
}
