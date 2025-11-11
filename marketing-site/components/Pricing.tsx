'use client';

import { Check } from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Box, Flex, Heading, Text, Card, Button } from '@radix-ui/themes';

export default function Pricing() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-25%' });

  const features = [
    'Unlimited transcriptions',
    'Auto-formatting & cleanup',
    'Works in all apps',
    'Transcription history',
    'Custom hotkey',
    'Priority support',
  ];

  return (
    <Box asChild ref={ref}>
      <section id="pricing" className="section" style={{ background: 'var(--gray-2)' }}>
        <Box className="container">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
          >
            <Flex direction="column" gap="4" align="center" mb="8">
              <Heading size="8" weight="bold" align="center">
                <Text color="blue">$5/month.</Text> Cancel anytime.
              </Heading>
              <Text size="5" color="gray" align="center">
                Simple pricing. No hidden fees. Ever.
              </Text>
            </Flex>
          </motion.div>

          {/* Pricing Card */}
          <Flex justify="center">
            <Box style={{ maxWidth: '500px', width: '100%' }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card size="4" variant="classic" style={{
                  borderWidth: '2px',
                  borderColor: 'var(--accent-6)',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 12px 40px rgba(0, 112, 243, 0.2), 0 2px 8px rgba(0, 0, 0, 0.1)'
                }}>
                  {/* Shimmer effect */}
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={isInView ? { x: '200%' } : { x: '-100%' }}
                    transition={{ duration: 1.5, delay: 0.5, ease: 'easeInOut' }}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.15), transparent)',
                      transform: 'skewX(-20deg)',
                      pointerEvents: 'none',
                      zIndex: 1
                    }}
                  />

                  {/* Card Header */}
                  <Box style={{
                    background: 'linear-gradient(135deg, var(--accent-9) 0%, var(--accent-11) 100%)',
                    padding: '3rem 2rem',
                    marginTop: '-1.5rem',
                    marginLeft: '-1.5rem',
                    marginRight: '-1.5rem',
                    marginBottom: '2rem',
                    color: 'white',
                    textAlign: 'center',
                    position: 'relative',
                    boxShadow: '0 4px 12px rgba(0, 112, 243, 0.3)'
                  }}>
                    {/* Decorative gradient overlay */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.15), transparent 60%)',
                      pointerEvents: 'none'
                    }} />

                    <Heading size="5" weight="medium" mb="4" style={{ color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.875rem' }}>
                      Pro
                    </Heading>
                    <Flex align="baseline" justify="center" gap="1">
                      <Text size="9" weight="bold" style={{ color: 'white', fontSize: '4rem', lineHeight: '1' }}>$5</Text>
                      <Text size="5" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.5rem' }}>/month</Text>
                    </Flex>
                    <Text size="2" mt="3" style={{ color: 'rgba(255,255,255,0.85)' }}>
                      or $50/year (save $10)
                    </Text>
                  </Box>

                  {/* Features List */}
                  <Flex direction="column" gap="3" mb="6">
                    {features.map((feature, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                        transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                      >
                        <Flex align="start" gap="3">
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={isInView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
                            transition={{ duration: 0.4, delay: 0.5 + index * 0.1, type: 'spring', stiffness: 200 }}
                          >
                            <Flex
                              align="center"
                              justify="center"
                              style={{
                                width: '20px',
                                height: '20px',
                                background: 'var(--accent-3)',
                                borderRadius: '50%',
                                flexShrink: 0,
                                marginTop: '2px'
                              }}
                            >
                              <Check size={14} color="var(--accent-9)" />
                            </Flex>
                          </motion.div>
                          <Text size="3" color="gray">{feature}</Text>
                        </Flex>
                      </motion.div>
                    ))}
                  </Flex>

                  {/* CTA Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.5, delay: 1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button asChild size="4" variant="solid" style={{ width: '100%' }}>
                      <a href="/login">Get Started</a>
                    </Button>
                  </motion.div>

                  {/* Fine Print */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ duration: 0.5, delay: 1.2 }}
                  >
                    <Text size="2" color="gray" align="center" mt="4" asChild>
                      <p>No credit card required for trial</p>
                    </Text>
                  </motion.div>
                </Card>
              </motion.div>

              {/* Bottom Note */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.6, delay: 1.4 }}
              >
                <Text size="3" color="gray" align="center" mt="6" asChild>
                  <p>Updates and improvements included</p>
                </Text>
              </motion.div>
            </Box>
          </Flex>
        </Box>
      </section>
    </Box>
  );
}
