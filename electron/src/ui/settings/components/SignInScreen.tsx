/**
 * Sign In Screen
 * Full-screen authentication screen that blocks the entire app
 */

import React, { useState } from 'react';
import { Flex, Text, Box, Button } from '@radix-ui/themes';
import { MONTHLY_PRICE } from '../../../main/constants';
import { GoogleIcon, NarraFlowLogo } from './Icons';

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
    <Box
      style={{
        width: '100vw',
        height: '100vh',
        background: '#000000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle background gradient glow */}
      <Box
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '800px',
          height: '800px',
          background: 'radial-gradient(circle, rgba(0, 122, 255, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <Flex
        direction="column"
        align="center"
        gap="6"
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '420px',
          width: '100%',
          padding: '0 32px',
        }}
      >
        {/* Logo */}
        <Box style={{ marginBottom: '12px', opacity: 0.9 }}>
          <NarraFlowLogo />
        </Box>

        {/* Main heading */}
        <Flex direction="column" align="center" gap="2">
          <Text
            size="7"
            weight="bold"
            style={{
              background: 'linear-gradient(135deg, #FFFFFF 0%, rgba(255, 255, 255, 0.7) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.02em',
              textAlign: 'center',
            }}
          >
            Welcome to NarraFlow
          </Text>
          <Text
            size="3"
            style={{
              color: 'rgba(255, 255, 255, 0.5)',
              textAlign: 'center',
              lineHeight: '1.6',
            }}
          >
            Start your 7-day free trial. No credit card required.
          </Text>
        </Flex>

        {/* Sign In Buttons */}
        <Flex direction="column" gap="3" style={{ width: '100%', marginTop: '8px' }}>
          {/* Google Sign In - White button with colored logo */}
          <button
            onClick={handleGoogleSignIn}
            onMouseEnter={() => setGoogleHover(true)}
            onMouseLeave={() => setGoogleHover(false)}
            style={{
              width: '100%',
              background: googleHover ? '#ffffff' : '#f8f9fa',
              color: '#1f1f1f',
              border: googleHover ? '1px solid rgba(0, 0, 0, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
              borderRadius: '10px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              padding: '14px 20px',
              height: '52px',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: googleHover
                ? '0 4px 12px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)'
                : '0 2px 6px rgba(0, 0, 0, 0.1)',
              transform: googleHover ? 'translateY(-1px)' : 'translateY(0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
            }}
          >
            <GoogleIcon />
            Continue with Google
          </button>

          {/* Email Sign In - Secondary outline button */}
          <button
            onClick={handleEmailSignIn}
            onMouseEnter={() => setEmailHover(true)}
            onMouseLeave={() => setEmailHover(false)}
            style={{
              width: '100%',
              background: emailHover ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
              color: emailHover ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '500',
              padding: '14px 20px',
              height: '52px',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              borderColor: emailHover ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="m22 7-10 7L2 7"/>
            </svg>
            Continue with Email
          </button>
        </Flex>

        {/* Pricing */}
        <Box
          mt="4"
          py="4"
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            textAlign: 'center',
            width: '100%',
          }}
        >
          <Flex align="center" justify="center" gap="2" mb="1">
            <Text size="6" weight="bold" style={{ color: '#ffffff', letterSpacing: '-0.02em' }}>
              ${MONTHLY_PRICE}
            </Text>
            <Text size="3" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              / month after trial
            </Text>
          </Flex>
          <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
            Cancel anytime, no questions asked
          </Text>
        </Box>
      </Flex>
    </Box>
  );
}
