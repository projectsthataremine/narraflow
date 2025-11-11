/**
 * Account Section
 * Handles user authentication, subscriptions, and license management
 */

import React, { useState, useEffect } from 'react';
import { Flex, Text, Box, Button, Badge, IconButton, Code } from '@radix-ui/themes';
import { Copy, Plus, RefreshCw, Key } from 'lucide-react';
import { MONTHLY_PRICE } from '../../../main/constants';
import { UserAccount, License, SubscriptionStatus } from './types';
import { GoogleIcon, EditIcon } from './Icons';

export function AccountSection() {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionStatus>({ type: 'none' });
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [activatingLicense, setActivatingLicense] = useState<string | null>(null);
  const [revokingLicense, setRevokingLicense] = useState<string | null>(null);
  const [cancelingLicense, setCancelingLicense] = useState<string | null>(null);
  const [currentMachineId, setCurrentMachineId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get current machine ID on mount
  useEffect(() => {
    const getMachineId = async () => {
      try {
        if (window.electron) {
          const result = await (window.electron as any).invoke('GET_MACHINE_ID');
          console.log('[Account] Got machine ID:', result.machineId);
          setCurrentMachineId(result.machineId);
        }
      } catch (error) {
        console.error('[Account] Failed to get machine ID:', error);
      }
    };
    getMachineId();
  }, []);

  // Check auth and load user data on mount
  useEffect(() => {
    checkAuth();

    // Listen for auth state changes (e.g., after OAuth completes)
    if (window.electron) {
      (window.electron as any).on('AUTH_STATE_CHANGED', () => {
        console.log('[Account] Auth state changed, refreshing...');
        checkAuth();
      });
    }
  }, []);

  const checkAuth = async () => {
    try {
      console.log('[Account] Checking auth status...');
      if (window.electron) {
        // Get auth status from main process
        const authData = await (window.electron as any).invoke('GET_AUTH_STATUS');
        console.log('[Account] Auth data received:', authData);

        if (authData && authData.user) {
          console.log('[Account] User found:', authData.user.email);
          // Parse user name (assuming Google OAuth provides full_name)
          const nameParts = authData.user.user_metadata?.full_name?.split(' ') || ['User', ''];

          setUser({
            id: authData.user.id,
            email: authData.user.email || '',
            firstName: nameParts[0] || 'User',
            lastName: nameParts.slice(1).join(' ') || '',
            profilePicUrl: authData.user.user_metadata?.avatar_url,
            provider: 'google',
            createdAt: authData.user.created_at,
          });

          // Fetch licenses
          await fetchLicenses(authData.user.id);
        } else {
          console.log('[Account] No user found, setting user to null');
          setUser(null);
        }
      }
    } catch (error) {
      console.error('[Account] Failed to check auth:', error);
    } finally {
      console.log('[Account] Setting loading to false');
      setLoading(false);
    }
  };

  const fetchLicenses = async (userId: string) => {
    try {
      if (window.electron) {
        const licensesData = await (window.electron as any).invoke('GET_LICENSES', { userId });
        setLicenses(licensesData || []);

        // Determine subscription status based on licenses
        if (licensesData && licensesData.length > 0) {
          const license = licensesData[0];
          if (license.status === 'active' && license.renews_at) {
            setSubscription({
              type: 'active',
              startDate: new Date(license.created_at).getTime(),
              nextBillingDate: new Date(license.renews_at).getTime(),
              plan: 'Pro Plan',
            });
          } else if (license.status === 'pending' && license.expires_at) {
            // Trial status - calculate days remaining
            const expiresAt = new Date(license.expires_at).getTime();
            const now = Date.now();
            const daysRemaining = Math.max(0, Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)));

            if (daysRemaining > 0) {
              setSubscription({
                type: 'trial',
                startDate: new Date(license.created_at).getTime(),
                daysRemaining,
              });
            } else {
              setSubscription({
                type: 'trial_expired',
                expiredDate: expiresAt,
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('[Account] Failed to fetch licenses:', error);
    }
  };

  const handleSignIn = async () => {
    try {
      if (window.electron) {
        console.log('[Account] Starting Google OAuth flow...');
        await (window.electron as any).invoke('START_OAUTH', { provider: 'google' });
        // After OAuth completes, checkAuth will be called again
        await checkAuth();
      }
    } catch (error) {
      console.error('[Account] OAuth failed:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      if (window.electron) {
        await (window.electron as any).invoke('SIGN_OUT');
        setUser(null);
        setSubscription({ type: 'none' });
        setLicenses([]);
      }
    } catch (error) {
      console.error('[Account] Sign out failed:', error);
    }
  };

  const handleUseLicense = async (licenseKey: string) => {
    try {
      setActivatingLicense(licenseKey);

      if (window.electron) {
        console.log('[Account] Activating license:', licenseKey);
        const result = await (window.electron as any).invoke('ACTIVATE_LICENSE', { licenseKey });
        console.log('[Account] Activation result:', result);

        // Reload licenses to show updated status
        if (user) {
          await fetchLicenses(user.id);
        }

        alert('License activated successfully!');
      }
    } catch (error) {
      console.error('[Account] License activation failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Failed to activate license: ${errorMessage}\n\nPlease check the console for more details.`);
    } finally {
      setActivatingLicense(null);
    }
  };

  const handleRevokeLicense = async (licenseKey: string) => {
    if (!confirm('Are you sure you want to revoke this license from this machine? You can activate it on another machine afterwards.')) {
      return;
    }

    try {
      setRevokingLicense(licenseKey);

      if (window.electron) {
        console.log('[Account] Revoking license:', licenseKey);
        const result = await (window.electron as any).invoke('REVOKE_LICENSE', { licenseKey });
        console.log('[Account] Revocation result:', result);

        // Reload licenses to show updated status
        if (user) {
          await fetchLicenses(user.id);
        }

        alert('License revoked successfully! You can now use it on another machine.');
      }
    } catch (error) {
      console.error('[Account] License revocation failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Failed to revoke license: ${errorMessage}\n\nPlease check the console for more details.`);
    } finally {
      setRevokingLicense(null);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This cannot be undone.')) {
      return;
    }

    try {
      if (window.electron) {
        await (window.electron as any).invoke('DELETE_ACCOUNT');
        setUser(null);
        setSubscription({ type: 'none' });
        setLicenses([]);
      }
    } catch (error) {
      console.error('[Account] Delete account failed:', error);
      alert('Failed to delete account. Please try again.');
    }
  };

  const handleRenameMachine = async (licenseId: string, newName: string) => {
    try {
      if (window.electron) {
        console.log('[Account] Renaming machine for license:', licenseId, 'to:', newName);
        await (window.electron as any).invoke('RENAME_MACHINE', { licenseId, newName });

        // Update local state
        setLicenses(licenses.map(license =>
          license.id === licenseId
            ? { ...license, metadata: { ...license.metadata, machine_name: newName } }
            : license
        ));
      }
    } catch (error) {
      console.error('[Account] Machine rename failed:', error);
      alert('Failed to rename machine. Please try again.');
    }
  };

  const handleCancelLicense = async (licenseKey: string) => {
    try {
      setCancelingLicense(licenseKey);

      console.log('[Account] Opening marketing site account page for license:', licenseKey);

      // Determine marketing site URL based on environment
      const marketingSiteUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://trynarraflow.com';
      const accountUrl = `${marketingSiteUrl}?openAccount=true`;

      // Open marketing site with account dialog open
      if (window.electron) {
        await (window.electron as any).invoke('OPEN_EXTERNAL_URL', { url: accountUrl });
      } else {
        window.open(accountUrl, '_blank');
      }
    } catch (error) {
      console.error('[Account] Failed to open account page:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Failed to open account page: ${errorMessage}`);
    } finally {
      setCancelingLicense(null);
    }
  };

  const handleRefreshLicenses = async () => {
    setIsRefreshing(true);

    // Start both the fetch and the minimum 1-second delay
    const startTime = Date.now();

    if (user) {
      await fetchLicenses(user.id);
    }

    // Ensure at least 1 second has passed before re-enabling the button
    const elapsed = Date.now() - startTime;
    const remainingTime = Math.max(0, 1000 - elapsed);

    if (remainingTime > 0) {
      await new Promise(resolve => setTimeout(resolve, remainingTime));
    }

    setIsRefreshing(false);
  };

  const handleAddLicense = () => {
    // Open marketing site to purchase
    const marketingSiteUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://trynarraflow.com';
    if (window.electron) {
      (window.electron as any).invoke('OPEN_EXTERNAL_URL', { url: marketingSiteUrl });
    } else {
      window.open(marketingSiteUrl, '_blank');
    }
  };

  const handleManageSubscription = async (stripeCustomerId: string) => {
    try {
      console.log('[Account] Opening customer portal for:', stripeCustomerId);
      if (window.electron) {
        const result = await (window.electron as any).invoke('OPEN_CUSTOMER_PORTAL', { stripeCustomerId });
        console.log('[Account] Customer portal result:', result);
        if (!result.success) {
          console.error('[Account] Customer portal failed:', result.error);
          alert(`Failed: ${result.error}`);
        }
      }
    } catch (error) {
      console.error("[Account] Customer portal error:", error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to open customer portal'}`);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: '400px' }}>
        <Text size="3" color="gray">Loading...</Text>
      </Flex>
    );
  }

  // Render different views based on user state
  if (!user) {
    return <NotLoggedInView onSignIn={handleSignIn} />;
  }

  if (subscription.type === 'trial_expired') {
    return <TrialExpiredView user={user} onSubscribe={() => {
      console.log('[Account] Subscribe clicked');
      // TODO: Implement Stripe checkout
    }} />;
  }

  // Determine if trial is expired
  const trialExpired = subscription.type === 'trial_expired';

  // For all logged-in users, show the unified account view
  return <UnifiedAccountView
    user={user}
    allLicenses={licenses}
    onUseLicense={handleUseLicense}
    onRevokeLicense={handleRevokeLicense}
    onManageSubscription={handleManageSubscription}
    onRenameMachine={handleRenameMachine}
    onRefreshLicenses={handleRefreshLicenses}
    onAddLicense={handleAddLicense}
    activatingLicense={activatingLicense}
    revokingLicense={revokingLicense}
    isRefreshing={isRefreshing}
    currentMachineId={currentMachineId}
    onSignOut={handleSignOut}
    onDeleteAccount={handleDeleteAccount}
    trialExpired={trialExpired}
  />;
}

// Not Logged In View
interface NotLoggedInViewProps {
  onSignIn: () => void;
}

function NotLoggedInView({ onSignIn }: NotLoggedInViewProps) {
  return (
    <Flex align="center" justify="center" style={{ minHeight: '100%' }}>
      <Box style={{ width: '100%', maxWidth: '480px', textAlign: 'center' }}>
        <Box mb="4" style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '64px',
          height: '64px',
          border: '2px solid var(--accent-9)',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </Box>
        <Text size="5" weight="bold" mb="2" as="div">
          Get started with NarraFlow
        </Text>
        <Text size="3" color="gray" mb="6" as="div" style={{ lineHeight: '1.6' }}>
          Sign in with your Google account to start your 7-day free trial.<br/>
          No credit card required.
        </Text>

        {/* Google Sign In Button - matching marketing site */}
        <Button
          size="3"
          onClick={onSignIn}
          style={{
            background: 'white',
            color: '#000',
            border: '1px solid #ddd',
            fontFamily: 'Roboto, sans-serif',
            cursor: 'pointer',
          }}
        >
          <GoogleIcon />
          Sign in with Google
        </Button>

          {/* Pricing */}
          <Box style={{
            marginTop: '32px',
            paddingTop: '32px',
            borderTop: '1px solid var(--border-light)',
          }}>
            <Text size="2" color="gray" mb="2">
              After trial
            </Text>
            <Text size="7" weight="bold" style={{ color: 'var(--accent-9)' }}>
              ${MONTHLY_PRICE}<Text as="span" size="4" weight="regular" color="gray">/month</Text>
            </Text>
            <Text size="2" color="gray" mt="2">
              Cancel anytime
            </Text>
          </Box>
      </Box>
    </Flex>
  );
}

// Profile Card Component (Reusable)
interface ProfileCardProps {
  user: UserAccount;
  onSignOut: () => void;
  onDeleteAccount: () => void;
}

function ProfileCard({ user, onSignOut, onDeleteAccount }: ProfileCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const avatarUrl = user.profilePicUrl;

  // Fallback avatar
  const fallbackAvatar = (
    <div style={{
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, var(--accent-9) 0%, var(--accent-10) 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ffffff',
      fontWeight: '600',
      fontSize: '20px',
    }}>
      {user.email?.[0]?.toUpperCase()}
    </div>
  );

  return (
    <Flex align="center" gap="3" mb="4">
      {/* Profile Picture */}
      {avatarUrl && !imageError ? (
        <>
          <img
            src={avatarUrl}
            alt="Profile"
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              objectFit: 'cover',
              display: imageLoaded ? 'block' : 'none',
            }}
          />
          {!imageLoaded && fallbackAvatar}
        </>
      ) : (
        fallbackAvatar
      )}

      {/* User Info */}
      <Flex direction="column">
        <Text size="3" weight="bold">
          {user.email}
        </Text>
        <Text size="1" style={{ opacity: 0.7 }}>
          {user.createdAt ? `Created ${new Date(user.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}` : ''}
        </Text>
      </Flex>
    </Flex>
  );
}

// Unified Account View (combines Trial and Active subscription views)
interface UnifiedAccountViewProps {
  user: UserAccount;
  allLicenses: License[];
  onUseLicense: (licenseKey: string) => void;
  onRevokeLicense: (licenseKey: string) => void;
  onManageSubscription: (stripeCustomerId: string) => void;
  onRenameMachine: (licenseId: string, newName: string) => void;
  onRefreshLicenses: () => void;
  onAddLicense: () => void;
  activatingLicense: string | null;
  revokingLicense: string | null;
  isRefreshing: boolean;
  currentMachineId: string | null;
  onSignOut: () => void;
  onDeleteAccount: () => void;
  trialExpired: boolean;
}

function UnifiedAccountView({ user, allLicenses, onUseLicense, onRevokeLicense, onManageSubscription, onRenameMachine, onRefreshLicenses, onAddLicense, activatingLicense, revokingLicense, isRefreshing, currentMachineId, onSignOut, onDeleteAccount, trialExpired }: UnifiedAccountViewProps) {
  const [editingLicense, setEditingLicense] = useState<string | null>(null);
  const [editedName, setEditedName] = useState('');
  const [hoveredLicense, setHoveredLicense] = useState<string | null>(null);

  // Filter licenses for display: Show active, pending, and valid canceled licenses
  const now = new Date();
  const displayLicenses = allLicenses.filter(license => {
    // Exclude revoked and expired licenses
    if (license.status === 'revoked' || license.status === 'expired') {
      return false;
    }

    // Keep active and pending licenses
    if (license.status === 'active' || license.status === 'pending') {
      return true;
    }

    // For canceled licenses, only show if not expired yet
    if (license.status === 'canceled' && license.expires_at) {
      const expiresAt = new Date(license.expires_at);
      return expiresAt > now;
    }

    // Default: don't show
    return false;
  });

  // Check if user has EVER had any license (even if canceled/expired)
  const hasEverHadLicense = allLicenses.length > 0;

  // Check if user has any licenses to display
  const hasLicenses = displayLicenses.length > 0;

  return (
    <div>
      {/* Profile Card */}
      <ProfileCard user={user} onSignOut={onSignOut} onDeleteAccount={onDeleteAccount} />

      {/* Trial Expired Banner - Only show if trial expired AND user has never purchased */}
      {trialExpired && !hasEverHadLicense && (
        <Flex
          p="3"
          mb="4"
          style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)',
            border: '2px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
          }}
        >
          <Text size="3" weight="bold" style={{ color: 'var(--red-11)' }}>
            Your trial has ended
          </Text>
        </Flex>
      )}

      {/* Licenses Section Header */}
      <Flex justify="between" align="center" mb="3">
        <Text size="2" weight="bold" style={{ opacity: 0.7 }}>
          LICENSES
        </Text>
        <Flex gap="2">
          <Button
            size="1"
            variant="soft"
            style={{ cursor: 'pointer', padding: '0 8px' }}
            onClick={onAddLicense}
          >
            <Plus size={16} />
          </Button>
          <Button
            size="1"
            variant="soft"
            color="gray"
            style={{ cursor: 'pointer', padding: '0 8px' }}
            onClick={onRefreshLicenses}
            disabled={isRefreshing}
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </Button>
        </Flex>
      </Flex>

      {/* Licenses List */}
      {hasLicenses ? (
        <Flex direction="column" gap="3">
          {displayLicenses.map((license) => (
            <LicenseCard
              key={license.id}
              license={license}
              currentMachineId={currentMachineId}
              onCopyKey={(key) => {
                navigator.clipboard.writeText(key);
              }}
              onActivate={onUseLicense}
              onRevoke={onRevokeLicense}
              onRenameMachine={onRenameMachine}
              onManageSubscription={onManageSubscription}
              activating={activatingLicense === license.key}
              revoking={revokingLicense === license.key}
              editing={editingLicense === license.id}
              setEditing={setEditingLicense}
              editedName={editedName}
              setEditedName={setEditedName}
              hovered={hoveredLicense === license.id}
              setHovered={setHoveredLicense}
            />
          ))}
        </Flex>
      ) : (
        <Flex
          direction="column"
          align="center"
          justify="center"
          gap="3"
          p="6"
          style={{ background: 'var(--gray-a2)', borderRadius: '8px' }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Key size={24} style={{ opacity: 0.5 }} />
          </div>
          <Text size="2" style={{ opacity: 0.7, textAlign: 'center' }}>
            No licenses yet. Add a license to activate NarraFlow on this device.
          </Text>
          <Button size="2" onClick={onAddLicense}>
            <Plus size={14} />
            Purchase License
          </Button>
        </Flex>
      )}
    </div>
  );
}

// LicenseCard Component (matching Clipp's design)
interface LicenseCardProps {
  license: License;
  currentMachineId: string | null;
  onCopyKey: (key: string) => void;
  onActivate: (key: string) => void;
  onRevoke: (key: string) => void;
  onRenameMachine: (licenseId: string, newName: string) => void;
  onManageSubscription: (stripeCustomerId: string) => void;
  activating: boolean;
  revoking: boolean;
  editing: boolean;
  setEditing: (id: string | null) => void;
  editedName: string;
  setEditedName: (name: string) => void;
  hovered: boolean;
  setHovered: (id: string | null) => void;
}

function LicenseCard({
  license,
  currentMachineId,
  onCopyKey,
  onActivate,
  onRevoke,
  onRenameMachine,
  onManageSubscription,
  activating,
  revoking,
  editing,
  setEditing,
  editedName,
  setEditedName,
  hovered,
  setHovered,
}: LicenseCardProps) {
  const machineId = license.metadata?.machine_id || license.machine_id;
  const machineName = license.metadata?.machine_name || license.machine_name;
  const isActiveOnThisMachine = currentMachineId && machineId && machineId === currentMachineId;

  const handleSave = () => {
    if (editedName.trim() && editedName !== machineName) {
      onRenameMachine(license.id, editedName.trim());
    }
    setEditing(null);
  };

  return (
    <div
      style={{
        padding: '16px',
        background: 'var(--gray-a2)',
        border: '1px solid var(--gray-a6)',
        borderRadius: '8px',
      }}
    >
      {/* License Key Row */}
      <Flex align="center" gap="2" mb="3">
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'var(--accent-a3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Key size={16} style={{ color: 'var(--accent-11)' }} />
        </div>
        <Flex direction="column" style={{ flex: 1, minWidth: 0 }}>
          <Text size="1" style={{ opacity: 0.7, marginBottom: '4px' }}>
            License Key
          </Text>
          <Text size="1" style={{ fontFamily: 'monospace', fontSize: '11px', opacity: 0.9 }}>
            {license.key.slice(0, 20)}...
          </Text>
        </Flex>
        <IconButton
          onClick={() => onCopyKey(license.key)}
          size="1"
          variant="soft"
          style={{ cursor: 'pointer' }}
        >
          <Copy size={14} />
        </IconButton>
      </Flex>

      {/* Status Badge */}
      <Flex align="center" gap="2" mb="3">
        <Badge
          color={
            license.status === "active" ? "blue" :
            license.status === "canceled" ? "red" :
            "yellow"
          }
          size="1"
        >
          {license.status.charAt(0).toUpperCase() + license.status.slice(1)}
        </Badge>
        {license.status === "canceled" && license.expires_at && (
          <Text size="1" style={{ opacity: 0.7 }}>
            Expires {new Date(license.expires_at).toLocaleDateString()}
          </Text>
        )}
        {license.status === "active" && license.renews_at && (
          <Text size="1" style={{ opacity: 0.7 }}>
            Renews {new Date(license.renews_at).toLocaleDateString()}
          </Text>
        )}
      </Flex>

      {/* Machine Info */}
      {machineId && (
        <div
          onMouseEnter={() => setHovered(license.id)}
          onMouseLeave={() => setHovered(null)}
          style={{ marginBottom: '12px' }}
        >
          <Text size="1" style={{ opacity: 0.7, marginBottom: '4px', display: 'block' }}>
            Machine Name
          </Text>
          <Flex
            justify="between"
            align="center"
            gap="2"
            style={{
              background: editing ? 'var(--accent-a3)' : 'transparent',
              borderRadius: '6px',
              minHeight: '32px',
              padding: '4px 8px'
            }}
          >
            {editing ? (
              <>
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                    else if (e.key === "Escape") setEditing(null);
                  }}
                  autoFocus
                  style={{
                    flex: 1,
                    padding: '0',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--gray-12)',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
                <Button
                  onClick={handleSave}
                  size="1"
                  variant="ghost"
                  color="blue"
                  style={{ cursor: 'pointer', fontSize: '11px', padding: '4px 8px' }}
                >
                  Save
                </Button>
              </>
            ) : (
              <>
                <Text size="2" weight="medium">
                  {machineName || "Unknown"}
                </Text>
                {hovered && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditing(license.id);
                      setEditedName(machineName || "");
                    }}
                    size="1"
                    variant="ghost"
                    color="blue"
                    style={{ cursor: 'pointer', fontSize: '11px', padding: '4px 8px' }}
                  >
                    Edit
                  </Button>
                )}
              </>
            )}
          </Flex>
        </div>
      )}

      {/* Action Buttons */}
      <Flex gap="2" wrap="wrap">
        {/* Show "Use on this machine" for licenses without a machine */}
        {!machineId && (
          <Button
            onClick={() => onActivate(license.key)}
            disabled={activating}
            size="2"
            variant="soft"
            style={{ cursor: activating ? "not-allowed" : "pointer", flex: 1 }}
          >
            {activating ? "Activating..." : "Use on this machine"}
          </Button>
        )}

        {/* Show "Revoke" only for licenses active on this machine */}
        {isActiveOnThisMachine && (
          <Button
            onClick={() => onRevoke(license.key)}
            disabled={revoking}
            color="red"
            size="2"
            variant="soft"
            style={{ cursor: revoking ? "not-allowed" : "pointer", flex: 1 }}
          >
            {revoking ? "Revoking..." : "Revoke"}
          </Button>
        )}

        {/* Show "Reactivate" for canceled licenses, "Manage" for active */}
        {license.stripe_customer_id && (
          <Button
            onClick={() => onManageSubscription(license.stripe_customer_id)}
            size="2"
            variant="soft"
            color={license.status === "canceled" ? "blue" : "gray"}
            style={{ cursor: 'pointer', flex: 1 }}
          >
            {license.status === "canceled" ? "Reactivate" : "Manage"}
          </Button>
        )}
      </Flex>
    </div>
  );
}

// Trial Expired View
interface TrialExpiredViewProps {
  user: UserAccount;
  onSubscribe: () => void;
}

function TrialExpiredView({ user, onSubscribe }: TrialExpiredViewProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100%',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '480px',
      }}>
        <div style={{
          padding: '48px 32px',
          background: 'var(--bg-primary)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
          textAlign: 'center',
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>
            Trial Expired
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: '1.6' }}>
            Your 7-day trial has ended. Subscribe to continue using NarraFlow.
          </p>

          <Button
            onClick={onSubscribe}
            size="3"
            variant="solid"
          >
            Subscribe for ${MONTHLY_PRICE}/month
          </Button>
        </div>
      </div>
    </div>
  );
}
