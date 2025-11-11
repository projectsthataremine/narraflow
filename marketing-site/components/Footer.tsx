'use client';

import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Box, Flex, Heading, Text, Grid } from '@radix-ui/themes';

export default function Footer() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-25%' });

  const sections = [
    {
      title: 'Product',
      links: [
        { name: 'Features', href: '#features' },
        { name: 'Pricing', href: '#pricing' },
        { name: 'Download', href: '#download' },
        { name: 'Documentation', href: '/docs' },
      ],
    },
    {
      title: 'Company',
      links: [
        { name: 'Account', href: '/login' },
        { name: 'Contact', href: 'mailto:support@narraflow.com' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { name: 'Terms of Service', href: '/legal/terms' },
        { name: 'Privacy Policy', href: '/legal/privacy' },
      ],
    },
  ];

  return (
    <Box asChild ref={ref}>
      <footer style={{ padding: '3rem 1rem', background: 'var(--gray-1)', borderTop: '1px solid var(--gray-6)' }}>
        <Box className="container">
          <Grid columns={{ initial: '1', md: '4' }} gap="8" mb="6">
            {/* Brand */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5 }}
            >
              <Flex direction="column" gap="3">
                <Heading size="6" weight="bold">NarraFlow</Heading>
                <Text size="2" color="gray">
                  Simple speech-to-text for Mac at an honest price.
                </Text>
              </Flex>
            </motion.div>

            {/* Links Sections */}
            {sections.map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 0.1 * (index + 1) }}
              >
                <Heading size="3" weight="bold" mb="3">{section.title}</Heading>
                <Flex direction="column" gap="2">
                  {section.links.map((link) => (
                    <Link
                      key={link.name}
                      href={link.href}
                      style={{
                        color: 'var(--gray-11)',
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                        transition: 'color 0.2s'
                      }}
                    >
                      {link.name}
                    </Link>
                  ))}
                </Flex>
              </motion.div>
            ))}
          </Grid>

          {/* Bottom Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            style={{ paddingTop: '2rem', borderTop: '1px solid var(--gray-6)' }}
          >
            <Flex justify="between" align="center" gap="4" wrap="wrap">
              <Text size="2" color="gray">
                &copy; {new Date().getFullYear()} NarraFlow. All rights reserved.
              </Text>
              <Text size="2" color="gray">
                Made with care for Mac users
              </Text>
            </Flex>
          </motion.div>
        </Box>
      </footer>
    </Box>
  );
}
