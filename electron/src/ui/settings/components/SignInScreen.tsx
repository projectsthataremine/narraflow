/**
 * Sign In Screen
 * Full-screen authentication screen that blocks the entire app
 */

import React, { useState } from 'react';
import { Flex, Text, Box, Button } from '@radix-ui/themes';
import { MONTHLY_PRICE } from '../../../main/constants';
import { GoogleIcon } from './Icons';

interface SignInScreenProps {
  onSignInSuccess: () => void;
}

export function SignInScreen({ onSignInSuccess }: SignInScreenProps) {
  const [googleHover, setGoogleHover] = useState(false);
  const [emailHover, setEmailHover] = useState(false);
  const [showEmailFlow, setShowEmailFlow] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    try {
      if (window.electron) {
        console.log('[SignInScreen] Starting Google OAuth flow...');
        const result = await (window.electron as any).startOAuth('google');
        console.log('[SignInScreen] OAuth result:', result);
        console.log('[SignInScreen] OAuth completed successfully, calling onSignInSuccess');
        // Trigger auth check to update UI
        await onSignInSuccess();
        console.log('[SignInScreen] onSignInSuccess completed');
      }
    } catch (error) {
      console.error('[SignInScreen] OAuth failed with error:', error);
      setError(error instanceof Error ? error.message : 'Failed to sign in with Google');
    }
  };

  const handleEmailSignIn = () => {
    setShowEmailFlow(true);
  };

  const handleBackToOptions = () => {
    setShowEmailFlow(false);
    setIsSignUp(false);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
  };

  const handleAuth = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (window.electron) {
        if (isSignUp) {
          await (window.electron as any).signUpWithEmail(email, password);
        } else {
          await (window.electron as any).signInWithEmail(email, password);
        }
        // Auth state will be updated automatically
        onSignInSuccess();
      }
    } catch (err) {
      console.error(`[SignInScreen] Failed to ${isSignUp ? 'sign up' : 'sign in'}:`, err);
      setError(err instanceof Error ? err.message : `Failed to ${isSignUp ? 'sign up' : 'sign in'}`);
    } finally {
      setLoading(false);
    }
  };

  // Email flow view
  if (showEmailFlow) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        background: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Box style={{ width: '100%', maxWidth: '400px', padding: '40px 24px' }}>
          {/* Back button */}
          <Button
            size="1"
            variant="ghost"
            onClick={handleBackToOptions}
            style={{ marginBottom: '24px', cursor: 'pointer' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back
          </Button>

          {/* Heading */}
          <Box mb="6" style={{ textAlign: 'center' }}>
            <Text size="6" weight="bold" mb="2" as="div" style={{ letterSpacing: '-0.03em', lineHeight: '1.1' }}>
              {isSignUp ? 'Create an account' : 'Welcome back'}
            </Text>
            <Text size="3" color="gray" as="div" style={{ lineHeight: '1.5' }}>
              {isSignUp
                ? 'Enter your email and password to sign up'
                : 'Sign in to your account'
              }
            </Text>
          </Box>

          {/* Email and password inputs */}
          <Flex direction="column" gap="3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              autoFocus
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '15px',
                border: '1px solid var(--gray-a6)',
                borderRadius: '8px',
                background: 'var(--gray-a2)',
                color: 'var(--gray-12)',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => !isSignUp && e.key === 'Enter' && handleAuth()}
              placeholder="Password (min 6 characters)"
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '15px',
                border: '1px solid var(--gray-a6)',
                borderRadius: '8px',
                background: 'var(--gray-a2)',
                color: 'var(--gray-12)',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
            />
            {isSignUp && (
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                placeholder="Confirm password"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '15px',
                  border: '1px solid var(--gray-a6)',
                  borderRadius: '8px',
                  background: 'var(--gray-a2)',
                  color: 'var(--gray-12)',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
              />
            )}
            {error && (
              <Text size="2" color="red" style={{ marginTop: '-8px' }}>
                {error}
              </Text>
            )}
            <Button
              size="3"
              onClick={handleAuth}
              disabled={loading}
              style={{
                width: '100%',
                height: '48px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? (isSignUp ? 'Creating account...' : 'Signing in...') : (isSignUp ? 'Sign up' : 'Sign in')}
            </Button>

            {/* Toggle between sign in and sign up */}
            <Text size="2" color="gray" style={{ textAlign: 'center', marginTop: '8px' }}>
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <Text
                as="span"
                color="blue"
                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setConfirmPassword('');
                  setError('');
                }}
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </Text>
            </Text>
          </Flex>
        </Box>
      </div>
    );
  }

  // Default view with options - Full screen
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#000000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Box style={{ width: '100%', maxWidth: '440px', padding: '40px 24px' }}>
        {/* Heading */}
        <Box mb="6" style={{ textAlign: 'center' }}>
          <Text size="7" weight="bold" mb="2" as="div" style={{ letterSpacing: '-0.03em', lineHeight: '1.1' }}>
            Welcome to NarraFlow
          </Text>
          <Text size="3" color="gray" as="div" style={{ lineHeight: '1.5' }}>
            Start your 7-day free trial. No credit card required.
          </Text>
        </Box>

        {/* Sign In Buttons */}
        <Flex direction="column" gap="3" mb="6" style={{ padding: '0 20px' }}>
          {/* Google Sign In - Primary branded button */}
          <Button
            size="3"
            onClick={handleGoogleSignIn}
            onMouseEnter={() => setGoogleHover(true)}
            onMouseLeave={() => setGoogleHover(false)}
            style={{
              width: '100%',
              background: googleHover
                ? 'linear-gradient(135deg, #0080e6 0%, #006bbf 100%)'
                : 'linear-gradient(135deg, #0090ff 0%, #0070cc 100%)',
              color: '#ffffff',
              border: 'none',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              padding: '12px 20px',
              height: '48px',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: googleHover
                ? '0 8px 16px rgba(0, 144, 255, 0.3), 0 2px 4px rgba(0, 0, 0, 0.1)'
                : '0 4px 12px rgba(0, 144, 255, 0.2)',
              transform: googleHover ? 'translateY(-2px)' : 'translateY(0)',
            }}
          >
            <GoogleIcon />
            Continue with Google
          </Button>

          {/* Email Sign In - Secondary outline button */}
          <Button
            size="3"
            onClick={handleEmailSignIn}
            onMouseEnter={() => setEmailHover(true)}
            onMouseLeave={() => setEmailHover(false)}
            style={{
              width: '100%',
              background: emailHover ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
              color: emailHover ? '#ffffff' : 'var(--gray-11)',
              border: '1.5px solid var(--gray-a7)',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '500',
              padding: '12px 20px',
              height: '48px',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              borderColor: emailHover ? 'var(--gray-a8)' : 'var(--gray-a7)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="m22 7-10 7L2 7"/>
            </svg>
            Continue with Email
          </Button>
        </Flex>

        {/* Pricing */}
        <Box style={{
          paddingTop: '24px',
          borderTop: '1px solid var(--gray-a4)',
          textAlign: 'center',
        }}>
          <Flex align="center" justify="center" gap="2" mb="1">
            <Text size="6" weight="bold" style={{ color: 'var(--gray-12)', letterSpacing: '-0.02em', fontSize: 'calc(var(--font-size-6) - 2px)' }}>
              ${MONTHLY_PRICE}
            </Text>
            <Text size="3" color="gray" weight="medium">
              / month after trial
            </Text>
          </Flex>
          <Text size="2" color="gray" style={{ opacity: 0.7 }}>
            Cancel anytime, no questions asked
          </Text>
        </Box>
      </Box>
    </div>
  );
}
