'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Box, Flex, Heading, Text, Button, Link } from '@radix-ui/themes';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AuthSuccessPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadSession() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session?.user?.email) {
          setError(true);
          setLoading(false);
          return;
        }

        setEmail(session.user.email);
        setLoading(false);
      } catch (err) {
        console.error('Error loading session:', err);
        setError(true);
        setLoading(false);
      }
    }

    loadSession();
  }, []);

  const handleSwitchAccount = async () => {
    try {
      // Sign out current user
      await supabase.auth.signOut();

      // Start new OAuth flow
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth-success',
        },
      });

      if (error) {
        console.error('Failed to start OAuth:', error);
        window.location.href = '/';
        return;
      }

      // Redirect to Google OAuth
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error switching account:', error);
      window.location.href = '/';
    }
  };

  if (loading) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: '100vh' }}>
        <Text size="4" color="gray">Loading...</Text>
      </Flex>
    );
  }

  if (error || !email) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: '100vh' }}>
        <Box style={{ textAlign: 'center', padding: '2rem', maxWidth: '28rem' }}>
          <Heading size="8" mb="4">Sign in failed</Heading>
          <Text size="3" color="gray" mb="6">Please try again</Text>
          <Button size="3" asChild>
            <a href="/">Back to Home</a>
          </Button>
        </Box>
      </Flex>
    );
  }

  return (
    <Flex align="center" justify="center" style={{ minHeight: '100vh' }}>
      <Box style={{ textAlign: 'center', padding: '2rem', maxWidth: '28rem' }}>
        {/* Logo */}
        <Box style={{ margin: '0 auto 2rem' }}>
          <svg
            width="52"
            height="50"
            viewBox="0 0 33 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ margin: '0 auto' }}
          >
            <defs>
              <linearGradient
                id="logoGradient"
                x1="0"
                y1="0"
                x2="33"
                y2="0"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#0090ff" />
                <stop offset="100%" stopColor="#0f1f30" />
              </linearGradient>
            </defs>
            {/* Vertical bars */}
            <rect x="0" y="13" width="3" height="6" rx="1.5" fill="url(#logoGradient)" />
            <rect x="5" y="10" width="3" height="12" rx="1.5" fill="url(#logoGradient)" />
            <rect x="10" y="7" width="3" height="18" rx="1.5" fill="url(#logoGradient)" />
            <rect x="15" y="4" width="3" height="24" rx="1.5" fill="url(#logoGradient)" />
            <rect x="20" y="7" width="3" height="18" rx="1.5" fill="url(#logoGradient)" />
            <rect x="25" y="10" width="3" height="12" rx="1.5" fill="url(#logoGradient)" />
            <rect x="30" y="13" width="3" height="6" rx="1.5" fill="url(#logoGradient)" />
          </svg>
        </Box>

        <Heading size="6" mb="6" style={{ whiteSpace: 'nowrap' }}>
          Log in as <Text color="gray">{email}</Text>
        </Heading>

        <Button size="4" style={{ width: '100%' }} mb="4" asChild>
          <a href="narraflow://">Open NarraFlow</a>
        </Button>

        <Text size="1" color="gray" style={{ whiteSpace: 'nowrap' }}>
          Not {email}?{' '}
          <Link href="#" onClick={(e) => { e.preventDefault(); handleSwitchAccount(); }}>
            Log in with another Google account
          </Link>
        </Text>
      </Box>
    </Flex>
  );
}
