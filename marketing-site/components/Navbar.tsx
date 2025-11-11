'use client';

import Link from 'next/link';
import { Download } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Box, Flex, Button, Text } from '@radix-ui/themes';

export default function Navbar() {
  const { scrollY } = useScroll();
  const backgroundColor = useTransform(
    scrollY,
    [0, 100],
    ['rgba(9, 9, 11, 0.6)', 'rgba(9, 9, 11, 0.85)']
  );
  const boxShadow = useTransform(
    scrollY,
    [0, 100],
    ['0 0 0 0 rgba(0, 0, 0, 0)', '0 1px 3px 0 rgba(0, 0, 0, 0.3)']
  );

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      style={{
        backgroundColor,
        boxShadow,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}
    >
      <Box className="container">
        <Flex justify="between" align="center" style={{ height: '72px' }}>
          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <motion.img
              whileHover={{ scale: 1.05 }}
              src="/logo-small.svg"
              alt="NarraFlow"
              style={{ height: '32px' }}
            />
          </Link>

          {/* Nav Links */}
          <Flex gap="8" align="center" className="desktop-nav">
            <Link
              href="#features"
              style={{
                color: 'rgba(255, 255, 255, 0.85)',
                transition: 'color 0.2s ease',
                textDecoration: 'none',
                fontSize: '0.9375rem',
                fontWeight: '500',
                letterSpacing: '-0.01em'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.85)'}
            >
              Features
            </Link>
            <Link
              href="#pricing"
              style={{
                color: 'rgba(255, 255, 255, 0.85)',
                transition: 'color 0.2s ease',
                textDecoration: 'none',
                fontSize: '0.9375rem',
                fontWeight: '500',
                letterSpacing: '-0.01em'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.85)'}
            >
              Pricing
            </Link>
            <Link
              href="/docs"
              style={{
                color: 'rgba(255, 255, 255, 0.85)',
                transition: 'color 0.2s ease',
                textDecoration: 'none',
                fontSize: '0.9375rem',
                fontWeight: '500',
                letterSpacing: '-0.01em'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.85)'}
            >
              Docs
            </Link>
            <Link
              href="/login"
              style={{
                color: 'rgba(255, 255, 255, 0.85)',
                transition: 'color 0.2s ease',
                textDecoration: 'none',
                fontSize: '0.9375rem',
                fontWeight: '500',
                letterSpacing: '-0.01em'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.85)'}
            >
              Account
            </Link>
          </Flex>

          {/* CTA Button */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              asChild
              size="3"
              style={{
                cursor: 'pointer',
                borderRadius: '12px',
                fontWeight: '600',
                letterSpacing: '-0.01em',
                paddingLeft: '20px',
                paddingRight: '20px',
                background: 'linear-gradient(135deg, rgba(0, 112, 243, 0.9) 0%, rgba(0, 92, 203, 0.9) 100%)',
                border: 'none',
                color: 'white',
                boxShadow: '0 2px 8px rgba(0, 112, 243, 0.15)'
              }}
            >
              <Link href="/download" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'white' }}>
                <Download size={16} strokeWidth={2.5} />
                Download
              </Link>
            </Button>
          </motion.div>
        </Flex>
      </Box>
    </motion.nav>
  );
}
