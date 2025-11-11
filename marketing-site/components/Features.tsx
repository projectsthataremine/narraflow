'use client';

import { Zap, Sparkles, Globe, Lock } from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Box, Flex, Heading, Text, Card, Grid } from '@radix-ui/themes';

export default function Features() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-25%' });

  const features = [
    {
      icon: <Zap size={32} />,
      title: 'Hold Fn, speak, done',
      description: 'Press your hotkey (Fn by default), speak naturally, release. Your text appears instantly wherever your cursor is.',
    },
    {
      icon: <Sparkles size={32} />,
      title: 'Clean, polished text',
      description: 'Automatically fixes grammar, adds punctuation, and removes filler words. No manual editing needed.',
    },
    {
      icon: <Globe size={32} />,
      title: 'Works in every app',
      description: 'Slack, Notes, Email, Notion—wherever you can type, NarraFlow works. No integrations needed.',
    },
    {
      icon: <Lock size={32} />,
      title: 'Your data stays on your Mac',
      description: '100% local processing. Your transcriptions never leave your device. Ever.',
    },
  ];

  return (
    <Box asChild ref={ref}>
      <section id="features" className="section">
        <Box className="container">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
          >
            <Heading size="8" weight="bold" align="center" mb="8">
              Key Features
            </Heading>
          </motion.div>

          {/* Features Grid */}
          <Grid columns={{ initial: '1', md: '2', lg: '4' }} gap="6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                whileHover={{
                  y: -8,
                  transition: { duration: 0.3, ease: 'easeOut' }
                }}
              >
                <Card
                  size="3"
                  variant="surface"
                  style={{
                    height: '100%',
                    border: '1px solid var(--gray-5)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                    transition: 'all 0.3s ease',
                    cursor: 'default',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-7)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 112, 243, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--gray-5)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
                  }}
                >
                  <Flex direction="column" gap="4">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={isInView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
                      transition={{ duration: 0.5, delay: 0.2 + 0.1 * index, type: 'spring', stiffness: 150 }}
                    >
                      <Flex
                        align="center"
                        justify="center"
                        style={{
                          width: '64px',
                          height: '64px',
                          background: 'linear-gradient(135deg, var(--accent-3) 0%, var(--accent-4) 100%)',
                          borderRadius: 'var(--radius-4)',
                          color: 'var(--accent-10)',
                          boxShadow: '0 4px 12px rgba(0, 112, 243, 0.15)'
                        }}
                      >
                        {feature.icon}
                      </Flex>
                    </motion.div>
                    <Heading size="4" weight="bold" style={{ lineHeight: '1.3' }}>
                      {feature.title}
                    </Heading>
                    <Text size="2" color="gray" style={{ lineHeight: '1.7' }}>
                      {feature.description}
                    </Text>
                  </Flex>
                </Card>
              </motion.div>
            ))}
          </Grid>
        </Box>
      </section>
    </Box>
  );
}
