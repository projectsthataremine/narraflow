'use client';

import React from 'react';
import ReactDOM from 'react-dom';
import DesktopIcon from './DesktopIcon';
import Taskbar from './Taskbar';
import Window from './Window';
import { useWindowStore } from '@/stores/windowStore';
import { Mic, DollarSign, BookOpen, Star, Info, User, Trash2, Mail, File, RefreshCw, Copy, Plus } from 'lucide-react';

// Placeholder window content components
function DemoWindow() {
  return (
    <div className="p-8 text-[var(--desktop-text)]">
      <h2 className="text-2xl font-bold mb-4">Demo Window</h2>
      <p>This will be the interactive transcription demo.</p>
      <p className="mt-4 text-sm opacity-70">Coming soon: Press Fn to speak and see real-time transcription!</p>
    </div>
  );
}

function PricingWindow() {
  return (
    <div className="p-8 text-[var(--desktop-text)] font-mono">
      <div className="space-y-6 max-w-xl">
        <p className="text-lg">
          let's keep this simple.
        </p>

        <div className="bg-[var(--desktop-window-bg)] p-6 rounded border border-[var(--desktop-window-border)]">
          <p className="text-2xl font-bold mb-2">
            <span className="text-[var(--desktop-accent)]">$3</span>/month
          </p>
          <p className="text-sm opacity-80">
            covers a single machine. cancel anytime.
          </p>
        </div>

        <div className="space-y-3 text-sm opacity-90">
          <p>
            download and try it out for <span className="text-[var(--desktop-accent)] font-bold">7 days free</span>.
          </p>
          <p>
            after that, it's $3/month. cancel at any time.
          </p>
          <p className="pt-4">
            that's it. nothing more.
          </p>
          <p className="text-xs opacity-70 pt-2">
            (that was easy, huh?)
          </p>
        </div>
      </div>
    </div>
  );
}

function AccountWindow() {
  const [user, setUser] = React.useState<any>(null);
  const [licenses, setLicenses] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isSigningIn, setIsSigningIn] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [hoveredStatus, setHoveredStatus] = React.useState<string | null>(null);
  const [hoveredButton, setHoveredButton] = React.useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = React.useState({ x: 0, y: 0 });
  const [lastCopyTime, setLastCopyTime] = React.useState<number>(0);
  const [lastRefreshTime, setLastRefreshTime] = React.useState<number>(0);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    checkUser();

    // Check for success parameter in URL
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('success') === 'true') {
        setShowSuccess(true);
        // Clear the success parameter from URL
        window.history.replaceState({}, '', '/');

        // Auto-hide after 5 seconds
        setTimeout(() => setShowSuccess(false), 5000);
      }
    }
  }, []);

  async function checkUser() {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);

    if (user) {
      await fetchLicenses(user);
    }

    setLoading(false);
  }

  async function fetchLicenses(userToFetch?: any) {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();

    const targetUser = userToFetch || user;
    if (!targetUser) return;

    // Fetch licenses for this user, filter out expired
    const { data: licensesData } = await supabase
      .from('licenses')
      .select('*')
      .eq('user_id', targetUser.id)
      .neq('status', 'expired')
      .order('created_at', { ascending: false });

    setLicenses(licensesData || []);
  }

  async function handleRefreshLicenses() {
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTime;

    // Throttle: only allow refresh every 20 seconds
    if (timeSinceLastRefresh < 20000) {
      const remainingSeconds = Math.ceil((20000 - timeSinceLastRefresh) / 1000);
      if (typeof window !== 'undefined' && (window as any).showToast) {
        (window as any).showToast(`wait ${remainingSeconds}s before refreshing again`);
      }
      return;
    }

    setLastRefreshTime(now);
    setIsRefreshing(true);
    await fetchLicenses();
    setIsRefreshing(false);
  }

  async function handleSignIn() {
    setIsSigningIn(true);
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  async function handleSignOut() {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setLicenses([]);
  }

  async function copyLicenseKey(key: string) {
    const now = Date.now();
    const timeSinceLastCopy = now - lastCopyTime;

    // Throttle: only allow copy every 1 second (silently ignore rapid clicks)
    if (timeSinceLastCopy < 1000) {
      return;
    }

    setLastCopyTime(now);
    await navigator.clipboard.writeText(key);
    if (typeof window !== 'undefined' && (window as any).showToast) {
      (window as any).showToast('license key copied');
    }
  }

  const handleTooltipEnter = (button: string, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top
    });
    setHoveredButton(button);
  };

  const handleTooltipLeave = () => {
    setHoveredButton(null);
  };

  // Portal component for tooltips
  const TooltipPortal = ({ children }: { children: React.ReactNode }) => {
    if (!mounted || typeof document === 'undefined') return null;
    return ReactDOM.createPortal(children, document.body);
  };

  if (loading) {
    return (
      <div className="p-8 text-[var(--desktop-text)] font-mono flex items-center justify-center">
        <p className="opacity-70">loading...</p>
      </div>
    );
  }

  // Not logged in - show sign-in prompt
  if (!user) {
    return (
      <div className="p-8 text-[var(--desktop-text)] font-mono">
        <div className="space-y-6 max-w-xl">
          <p className="text-lg opacity-90">
            sign in to access your account
          </p>

          <p className="text-sm opacity-70">
            manage your subscription, view your licenses, and access unlimited transcription.
          </p>

          <div className="flex justify-center pt-2">
            <button
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded shadow hover:shadow-md transition-all disabled:opacity-50 border border-gray-300"
              style={{ fontFamily: 'Roboto, sans-serif' }}
            >
              <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
              {isSigningIn ? 'signing in...' : 'Sign in with Google'}
            </button>
          </div>

          <p className="text-xs opacity-60 pt-4">
            after the 7-day trial, it's $3/month. cancel anytime.
          </p>
        </div>
      </div>
    );
  }

  // Logged in - show account info
  const hasLicenses = licenses.length > 0;

  return (
    <div className="p-8 text-[var(--desktop-text)] font-mono">
      {/* Success Message */}
      {showSuccess && (
        <div className="mb-6 p-4 bg-green-400/10 border border-green-400/30 text-green-400 text-sm rounded">
          <p className="font-bold">subscription successful!</p>
          <p className="opacity-80 mt-1">your license key will appear below. copy it and enter it in the electron app to activate.</p>
        </div>
      )}

      <div className="space-y-6 max-w-3xl text-sm">
        {/* User Info */}
        <div className="space-y-3">
          <div>
            <span className="opacity-70">email: </span>
            <span>{user.email}</span>
          </div>

          <button
            onClick={handleSignOut}
            className="px-3 py-1.5 text-xs border border-[var(--desktop-text)] opacity-70 hover:opacity-100 hover:border-red-400 hover:text-red-400 transition-colors"
          >
            sign out
          </button>
        </div>

        {/* Subscriptions Section */}
        <div className="pt-4 border-t border-[var(--desktop-window-border)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold opacity-90">licenses</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/create-checkout-session', {
                      method: 'POST',
                    });
                    const data = await response.json();
                    if (data.url) {
                      window.location.href = data.url;
                    } else {
                      alert('Failed to create checkout session');
                    }
                  } catch (error) {
                    console.error('Checkout error:', error);
                    alert('Failed to start checkout');
                  }
                }}
                onMouseEnter={(e) => handleTooltipEnter('add', e)}
                onMouseLeave={handleTooltipLeave}
                className="p-1 opacity-50 hover:opacity-100 transition-all"
              >
                <Plus size={14} />
              </button>
              <button
                onClick={handleRefreshLicenses}
                onMouseEnter={(e) => handleTooltipEnter('refresh', e)}
                onMouseLeave={handleTooltipLeave}
                disabled={isRefreshing}
                className="p-1 opacity-50 hover:opacity-100 transition-all disabled:opacity-30"
              >
                <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {hasLicenses ? (
            <div className="space-y-3">
              {licenses.map((license) => (
                <div key={license.id} className="space-y-2 p-4 border border-[var(--desktop-window-border)] rounded">
                  {/* License Key */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-baseline gap-2 flex-1 min-w-0">
                      <span className="opacity-70 text-xs whitespace-nowrap">license key:</span>
                      <span className="font-mono text-xs break-all">{license.key}</span>
                    </div>
                    <button
                      onClick={() => copyLicenseKey(license.key)}
                      onMouseEnter={(e) => handleTooltipEnter(`copy-${license.id}`, e)}
                      onMouseLeave={handleTooltipLeave}
                      className="p-1 opacity-50 hover:opacity-100 transition-opacity flex-shrink-0"
                    >
                      <Copy size={12} />
                    </button>
                  </div>

                  {/* Status */}
                  <div className="flex items-baseline gap-2 relative">
                    <span className="opacity-70 text-xs">status:</span>
                    <span
                      className={`text-xs ${license.status === 'active' ? 'text-green-400' : ''} cursor-help border-b border-dotted border-current`}
                      onMouseEnter={() => setHoveredStatus(`${license.id}-status`)}
                      onMouseLeave={() => setHoveredStatus(null)}
                    >
                      {license.status}
                    </span>
                    {hoveredStatus === `${license.id}-status` && (
                      <div className="absolute left-0 top-6 z-50 bg-[var(--desktop-taskbar-bg)] border border-[var(--desktop-window-border)] px-3 py-2 text-xs shadow-lg min-w-[200px]">
                        {license.status === 'pending' && (
                          <p>not yet activated on a machine. enter this key in the app to activate.</p>
                        )}
                        {license.status === 'active' && (
                          <p>currently active and bound to a machine.</p>
                        )}
                        {license.status === 'canceled' && (
                          <p>subscription cancelled. this license is no longer valid.</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Machine ID if bound */}
                  {license.machine_id && (
                    <div className="flex items-baseline gap-2">
                      <span className="opacity-70 text-xs">machine:</span>
                      <span className="text-xs break-all">{license.machine_id.substring(0, 16)}...</span>
                    </div>
                  )}

                  {/* Expiration / Renewal / Cancel Button */}
                  {(license.expires_at || license.renews_at || license.stripe_customer_id) && (
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-[var(--desktop-window-border)]">
                      {license.expires_at ? (
                        <span className="opacity-70">
                          expires on: {new Date(license.expires_at).toLocaleDateString()}
                        </span>
                      ) : license.renews_at ? (
                        <span className="opacity-70">
                          renews on: {new Date(license.renews_at).toLocaleDateString()}
                        </span>
                      ) : (
                        <span></span>
                      )}
                      {license.stripe_customer_id && (
                        <button
                          onClick={async () => {
                            try {
                              const response = await fetch('/api/create-customer-portal', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ stripe_customer_id: license.stripe_customer_id }),
                              });
                              const data = await response.json();
                              if (data.url) {
                                window.location.href = data.url;
                              } else {
                                if (typeof window !== 'undefined' && (window as any).showToast) {
                                  (window as any).showToast('failed to open customer portal');
                                }
                              }
                            } catch (error) {
                              console.error('Customer portal error:', error);
                              if (typeof window !== 'undefined' && (window as any).showToast) {
                                (window as any).showToast('failed to open customer portal');
                              }
                            }
                          }}
                          className={`px-2 py-0.5 text-xs border border-[var(--desktop-text)] opacity-50 hover:opacity-100 transition-colors ${
                            license.status === 'canceled'
                              ? 'hover:border-green-400 hover:text-green-400'
                              : 'hover:border-red-400 hover:text-red-400'
                          }`}
                        >
                          {license.status === 'canceled' ? 'undo cancel' : 'cancel'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="opacity-70 text-sm">no active licenses</p>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/create-checkout-session', {
                      method: 'POST',
                    });
                    const data = await response.json();
                    if (data.url) {
                      window.location.href = data.url;
                    } else {
                      alert('Failed to create checkout session');
                    }
                  } catch (error) {
                    console.error('Checkout error:', error);
                    alert('Failed to start checkout');
                  }
                }}
                className="px-4 py-2 bg-[var(--desktop-accent)] text-[var(--desktop-window-bg)] font-bold hover:opacity-80 transition-opacity"
              >
                subscribe now
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Portal Tooltips */}
      {hoveredButton === 'add' && (
        <TooltipPortal>
          <div
            className="fixed bg-[var(--desktop-taskbar-bg)] border border-[var(--desktop-window-border)] px-2 py-1 text-xs shadow-lg font-mono text-[var(--desktop-text)] whitespace-nowrap"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
              transform: 'translate(-50%, -100%) translateY(-8px)',
              zIndex: 10000,
            }}
          >
            add license/machine
          </div>
        </TooltipPortal>
      )}
      {hoveredButton === 'refresh' && (
        <TooltipPortal>
          <div
            className="fixed bg-[var(--desktop-taskbar-bg)] border border-[var(--desktop-window-border)] px-2 py-1 text-xs shadow-lg font-mono text-[var(--desktop-text)] whitespace-nowrap"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
              transform: 'translate(-50%, -100%) translateY(-8px)',
              zIndex: 10000,
            }}
          >
            refresh licenses
          </div>
        </TooltipPortal>
      )}
      {hoveredButton?.startsWith('copy-') && (
        <TooltipPortal>
          <div
            className="fixed bg-[var(--desktop-taskbar-bg)] border border-[var(--desktop-window-border)] px-2 py-1 text-xs shadow-lg font-mono text-[var(--desktop-text)] whitespace-nowrap"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
              transform: 'translate(-50%, -100%) translateY(-8px)',
              zIndex: 10000,
            }}
          >
            copy key
          </div>
        </TooltipPortal>
      )}
    </div>
  );
}

function DocsWindow() {
  return (
    <div className="p-8 text-[var(--desktop-text)] font-mono">
      <div className="space-y-8 text-sm">
        {/* System Requirements */}
        <section>
          <h3 className="text-lg font-bold text-[var(--desktop-accent)] mb-3">system requirements</h3>
          <p className="mb-2">
            <span className="text-[var(--desktop-accent)] font-bold">macOS Big Sur (11.0) or later</span>
          </p>
          <p className="text-xs opacity-70">
            released November 2020. older versions not supported - use at your own risk.
          </p>
        </section>

        {/* Quick Start */}
        <section>
          <h3 className="text-lg font-bold text-[var(--desktop-accent)] mb-3">quick start</h3>
          <p className="mb-2">
            hold down <span className="text-[var(--desktop-accent)]">Fn</span> (or your custom hotkey), speak, release.
            your text appears wherever your cursor is and gets copied to your clipboard.
          </p>
          <p className="opacity-80">
            that's it. that's the whole app.
          </p>
        </section>

        {/* Interface */}
        <section>
          <h3 className="text-lg font-bold text-[var(--desktop-accent)] mb-3">interface</h3>
          <p className="mb-2">
            when you first download and run the app, you'll see the settings window.
            this is your main interface for controlling everything.
          </p>
          <p className="mb-2 opacity-80">
            you don't need to keep this open - close it and the app keeps running in the background.
            your hotkey will still work.
          </p>
          <p className="opacity-80">
            while recording, you'll see a small visualizer appear on screen.
            that's the only other UI element - minimal and non-intrusive.
          </p>
        </section>

        {/* Settings Tabs */}
        <section>
          <h3 className="text-lg font-bold text-[var(--desktop-accent)] mb-3">settings tabs</h3>

          <div className="space-y-4 opacity-90">
            <div>
              <p className="font-bold mb-1">general</p>
              <p>- change your hotkey (Fn, Shift+Option, etc.)</p>
              <p>- pick your microphone</p>
              <p>- toggle dock visibility (show or hide app in dock)</p>
              <p>- reset the app if things get weird (only if advised - it's more of a dev thing)</p>
            </div>

            <div>
              <p className="font-bold mb-1">recording pill</p>
              <p>customize the little visualizer that shows up when you're recording.</p>
              <p>colors, size, glow intensity - make it yours.</p>
            </div>

            <div>
              <p className="font-bold mb-1">history</p>
              <p>your last 10 transcriptions live here.</p>
              <p>click to copy, or delete transcriptions you don't need anymore.</p>
            </div>

            <div>
              <p className="font-bold mb-1">account</p>
              <p>manage your subscription, view your trial status.</p>
              <p>sign in with Google. cancel anytime.</p>
            </div>
          </div>
        </section>

        {/* Licensing */}
        <section>
          <h3 className="text-lg font-bold text-[var(--desktop-accent)] mb-3">licensing</h3>
          <p className="mb-2">
            we use Stripe for checkout. when you purchase your subscription,
            we'll send you to Stripe to complete payment.
          </p>
          <p className="mb-2 opacity-80">
            once you subscribe, you'll be redirected back to your account page
            where you'll see your license key. enter it in the app to activate.
          </p>
          <p className="mb-2 opacity-80">
            cancel? you can do it through the app or online. you'll be redirected to Stripe
            where you'll confirm cancellation. then your key becomes invalid and the app stops working.
            but the Electron app stays on your machine - reactivate anytime.
          </p>
          <p className="text-xs opacity-70">
            one key = one device. simple as that.
          </p>
        </section>

        {/* Updates */}
        <section>
          <h3 className="text-lg font-bold text-[var(--desktop-accent)] mb-3">updates</h3>
          <p className="mb-2">
            bottom left of settings, you'll see the version and a little cloud icon.
          </p>
          <p className="mb-2">
            <span className="text-[var(--desktop-secondary)]">gray?</span> you're good.
            <span className="text-red-400 ml-2">red?</span> update available.
          </p>
          <p className="opacity-80">
            hover over the cloud to check. click it to update.
          </p>
        </section>

        {/* Closing/Quitting the App */}
        <section>
          <h3 className="text-lg font-bold text-[var(--desktop-accent)] mb-3">closing vs quitting</h3>
          <p className="mb-2">
            hitting <span className="text-[var(--desktop-accent)]">X</span> just closes the settings window.
            the app keeps running in the background so your hotkey still works.
          </p>
          <p className="opacity-80">
            want to actually quit? press <span className="text-[var(--desktop-accent)]">Cmd+Q</span>.
            that's the only way to fully quit the app.
          </p>
        </section>

        {/* Footer */}
        <div className="pt-8 border-t border-[var(--desktop-window-border)] text-xs opacity-60">
          <p>
            feedback on these docs? think we can do better?{' '}
            <span className="text-[var(--desktop-accent)] cursor-pointer hover:underline">
              contact us here
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

function ShowcaseWindow() {
  const { openWindow, bringToFront } = useWindowStore();

  return (
    <div className="p-8 text-[var(--desktop-text)] font-mono">
      <div className="space-y-6 max-w-2xl text-sm">
        <p className="text-base opacity-90">
          we're still pretty new, and we'd love to hear from you.
        </p>

        <div className="space-y-4 opacity-80">
          <p>
            if mic2text has helped you in any way - saved you time, made your workflow easier,
            or just made your day a little better - we'd love to hear about it.
          </p>

          <p>
            your feedback helps us improve and shows others how people are actually using the app.
          </p>
        </div>

        <div className="pt-4">
          <button
            onClick={() => {
              const viewportWidth = globalThis.window.innerWidth;
              const viewportHeight = globalThis.window.innerHeight;
              const windowWidth = 700;
              const windowHeight = 600;
              const taskbarHeight = 40;

              const centerX = (viewportWidth - windowWidth) / 2;
              const centerY = (viewportHeight - windowHeight - taskbarHeight) / 2;

              const randomOffsetX = Math.floor(Math.random() * 100) - 50;
              const randomOffsetY = Math.floor(Math.random() * 100) - 50;

              openWindow('form', 'contact form', {
                x: centerX + randomOffsetX,
                y: centerY + randomOffsetY
              }, {
                width: windowWidth,
                height: windowHeight
              });

              setTimeout(() => bringToFront('form'), 0);
            }}
            className="px-4 py-2 bg-[var(--desktop-accent)] text-[var(--desktop-window-bg)] text-sm font-bold hover:opacity-80 transition-opacity"
          >
            share your feedback
          </button>
        </div>

        <div className="pt-6 border-t border-[var(--desktop-window-border)] text-xs opacity-60">
          <p>
            especially love positive feedback - it helps us showcase real use cases and testimonials right here.
          </p>
        </div>
      </div>
    </div>
  );
}

function ContactWindow() {
  const { openWindow, bringToFront } = useWindowStore();

  return (
    <div className="p-8 text-[var(--desktop-text)] font-mono">
      <div className="space-y-6 max-w-xl text-sm">
        <p>
          got questions? feedback? need help?
        </p>

        <p className="opacity-80">
          click the button below and press send.
        </p>

        <button
          onClick={() => {
            const viewportWidth = globalThis.window.innerWidth;
            const viewportHeight = globalThis.window.innerHeight;
            const windowWidth = 700;
            const windowHeight = 600;
            const taskbarHeight = 40;

            const centerX = (viewportWidth - windowWidth) / 2;
            const centerY = (viewportHeight - windowHeight - taskbarHeight) / 2;

            const randomOffsetX = Math.floor(Math.random() * 100) - 50;
            const randomOffsetY = Math.floor(Math.random() * 100) - 50;

            openWindow('form', 'contact form', {
              x: centerX + randomOffsetX,
              y: centerY + randomOffsetY
            }, {
              width: windowWidth,
              height: windowHeight
            });

            // Ensure form is on top after opening
            setTimeout(() => bringToFront('form'), 0);
          }}
          className="px-4 py-2 bg-[var(--desktop-accent)] text-[var(--desktop-window-bg)] text-sm font-bold hover:opacity-80 transition-opacity"
        >
          click here to open form
        </button>

        <div className="pt-4 space-y-2 text-xs opacity-70">
          <p>for bug reports, please include:</p>
          <p>- your macOS version</p>
          <p>- app version (bottom left of settings)</p>
          <p>- what you were doing when it happened</p>
          <p className="pt-2">we typically respond within 48 hours.</p>
        </div>
      </div>
    </div>
  );
}

function FormWindow() {
  const [attachments, setAttachments] = React.useState<File[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [macOSVersion, setMacOSVersion] = React.useState('');
  const [appVersion, setAppVersion] = React.useState('');
  const [contactType, setContactType] = React.useState('');
  const [hoveredTooltip, setHoveredTooltip] = React.useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = React.useState({ x: 0, y: 0 });
  const [mounted, setMounted] = React.useState(false);
  const [isSent, setIsSent] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleTooltipEnter = (tooltip: string, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.right + 8,
      y: rect.top + rect.height / 2
    });
    setHoveredTooltip(tooltip);
  };

  const handleTooltipLeave = () => {
    setHoveredTooltip(null);
  };

  // Portal component for tooltips
  const TooltipPortal = ({ children }: { children: React.ReactNode }) => {
    if (!mounted || typeof document === 'undefined') return null;
    return ReactDOM.createPortal(children, document.body);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    const maxSize = 100 * 1024 * 1024; // 100MB in bytes
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    Array.from(files).forEach(file => {
      if (file.size > maxSize) {
        invalidFiles.push(file.name);
      } else {
        validFiles.push(file);
      }
    });

    if (invalidFiles.length > 0) {
      alert(`The following files are too large (max 100MB):\n${invalidFiles.join('\n')}`);
    }

    if (validFiles.length > 0) {
      setAttachments([...attachments, ...validFiles]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    console.log('Sending form:', { contactType, macOSVersion, appVersion, message, attachments: attachments.map(f => f.name) });

    setIsLoading(true);

    // Simulate API call with 2 second delay
    setTimeout(() => {
      setIsLoading(false);
      setIsSent(true);
    }, 2000);
  };

  // Get dynamic labels based on contact type
  const getMessageLabel = () => {
    switch (contactType) {
      case 'bug':
        return 'what happened?';
      case 'feature':
        return 'what feature would you like?';
      case 'feedback':
        return 'your feedback';
      case 'help':
        return 'what do you need help with?';
      default:
        return 'your message';
    }
  };

  const getMessagePlaceholder = () => {
    switch (contactType) {
      case 'bug':
        return 'describe what steps led up to the issue...';
      case 'feature':
        return 'describe the feature you\'d like to see...';
      case 'feedback':
        return 'share your thoughts with us...';
      case 'help':
        return 'describe what you need help with...';
      default:
        return 'type your message here...';
    }
  };

  const showVersionFields = contactType === 'bug';
  const maxMessageLength = 500;

  // Show success message if sent
  if (isSent) {
    return (
      <div className="p-8 text-[var(--desktop-text)] font-mono h-full flex flex-col items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold mb-4">message sent!</h2>
          <p className="text-sm opacity-80 max-w-md">
            your message was sent. we'll try to respond within 48 hours.
          </p>
          <p className="text-xs opacity-60 pt-4">
            you can close this window now.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 text-[var(--desktop-text)] font-mono h-full flex flex-col">
      <div className="flex-1 overflow-auto desktop-scrollbar space-y-4 text-sm pr-2">
        {/* Contact Type */}
        <div>
          <label className="block mb-2 opacity-70">type of contact</label>
          <select
            value={contactType}
            onChange={(e) => setContactType(e.target.value)}
            className="w-full p-2 bg-[var(--desktop-window-bg)] border border-[var(--desktop-window-border)] text-[var(--desktop-text)] font-mono text-sm focus:outline-none focus:border-[var(--desktop-accent)]"
          >
            <option value="">Select type...</option>
            <option value="bug">Bug Report</option>
            <option value="feature">Feature Request</option>
            <option value="feedback">General Feedback</option>
            <option value="help">Help/Support</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* macOS Version - only show for bug reports */}
        {showVersionFields && (
          <div>
            <label className="block mb-2 opacity-70 flex items-center gap-2">
              macOS version
              <div
                className="relative"
                onMouseEnter={(e) => handleTooltipEnter('macos', e)}
                onMouseLeave={handleTooltipLeave}
              >
                <span className="cursor-help text-xs border border-current rounded-full w-4 h-4 flex items-center justify-center">?</span>
              </div>
            </label>
            <select
              value={macOSVersion}
              onChange={(e) => setMacOSVersion(e.target.value)}
              className="w-full p-2 bg-[var(--desktop-window-bg)] border border-[var(--desktop-window-border)] text-[var(--desktop-text)] font-mono text-sm focus:outline-none focus:border-[var(--desktop-accent)]"
            >
              <option value="">Select version...</option>
              <option value="15.0">macOS Sequoia 15.0</option>
              <option value="14.0">macOS Sonoma 14.0</option>
              <option value="13.0">macOS Ventura 13.0</option>
              <option value="12.0">macOS Monterey 12.0</option>
              <option value="11.0">macOS Big Sur 11.0</option>
              <option value="other">Other</option>
            </select>
          </div>
        )}

        {/* App Version - only show for bug reports */}
        {showVersionFields && (
          <div>
            <label className="block mb-2 opacity-70 flex items-center gap-2">
              app version
              <div
                className="relative"
                onMouseEnter={(e) => handleTooltipEnter('app', e)}
                onMouseLeave={handleTooltipLeave}
              >
                <span className="cursor-help text-xs border border-current rounded-full w-4 h-4 flex items-center justify-center">?</span>
              </div>
            </label>
            <select
              value={appVersion}
              onChange={(e) => setAppVersion(e.target.value)}
              className="w-full p-2 bg-[var(--desktop-window-bg)] border border-[var(--desktop-window-border)] text-[var(--desktop-text)] font-mono text-sm focus:outline-none focus:border-[var(--desktop-accent)]"
            >
              <option value="">Select version...</option>
              <option value="0.1.0">v0.1.0</option>
              <option value="0.0.9">v0.0.9</option>
              <option value="0.0.8">v0.0.8</option>
              <option value="other">Other</option>
            </select>
          </div>
        )}

        {/* Message field - only show when contact type is selected */}
        {contactType && (
          <div>
            <label className="block mb-2 opacity-70">{getMessageLabel()}</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={getMessagePlaceholder()}
              maxLength={maxMessageLength}
              className="w-full h-32 p-3 bg-[var(--desktop-window-bg)] border border-[var(--desktop-window-border)] text-[var(--desktop-text)] font-mono text-sm resize-none focus:outline-none focus:border-[var(--desktop-accent)]"
            />
            <div className="text-right text-xs opacity-50 mt-1">
              {message.length} / {maxMessageLength} characters
            </div>
          </div>
        )}

        {/* Attachments - only show when contact type is selected */}
        {contactType && (
          <div>
            <label className="block mb-2 opacity-70">attachments</label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={handleClick}
              className={`w-full min-h-24 p-4 border-2 border-dashed ${
                isDragging ? 'border-[var(--desktop-accent)] bg-[var(--desktop-accent)]/10' : 'border-[var(--desktop-window-border)]'
              } flex flex-col items-center justify-center transition-colors cursor-pointer hover:border-[var(--desktop-accent)]/50`}
            >
              <p className="text-center opacity-50 text-xs">
                drag and drop images here or click to browse
              </p>
            </div>

            {/* Attachment badges */}
            {attachments.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-2 px-2 py-1 bg-[var(--desktop-accent)]/10 border border-[var(--desktop-accent)]/30 text-xs"
                  >
                    <span className="opacity-80">{file.name}</span>
                    <button
                      onClick={() => removeAttachment(index)}
                      className="opacity-50 hover:opacity-100 hover:text-red-400 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Send button */}
      <div className="pt-4 flex justify-end">
        <button
          onClick={handleSend}
          disabled={!message.trim() || isLoading}
          className={`px-6 py-2 font-bold flex items-center gap-2 ${
            message.trim() && !isLoading
              ? 'bg-[var(--desktop-accent)] text-[var(--desktop-window-bg)] hover:opacity-80'
              : 'bg-[var(--desktop-window-border)] text-[var(--desktop-text)] opacity-50 cursor-not-allowed'
          } transition-opacity`}
        >
          {isLoading && (
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {isLoading ? 'sending...' : 'send'}
        </button>
      </div>

      {/* Portal Tooltips */}
      {hoveredTooltip === 'macos' && (
        <TooltipPortal>
          <div
            className="fixed bg-[var(--desktop-taskbar-bg)] border border-[var(--desktop-window-border)] p-3 text-xs shadow-lg font-mono text-[var(--desktop-text)]"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
              transform: 'translateY(-50%)',
              zIndex: 10000,
            }}
          >
            <div className="font-bold mb-1 opacity-90">How to get your version:</div>
            <div className="opacity-80">Apple icon (top left screen) → About This Mac</div>
            <div className="opacity-80">→ you should see the macOS version</div>
          </div>
        </TooltipPortal>
      )}

      {hoveredTooltip === 'app' && (
        <TooltipPortal>
          <div
            className="fixed bg-[var(--desktop-taskbar-bg)] border border-[var(--desktop-window-border)] p-3 text-xs shadow-lg font-mono text-[var(--desktop-text)]"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
              transform: 'translateY(-50%)',
              zIndex: 10000,
            }}
          >
            <div className="font-bold mb-1 opacity-90">How to get your app version:</div>
            <div className="opacity-80">Open app (click icon in dock or Cmd+Space → type Mic2Text)</div>
            <div className="opacity-80">→ version shown at bottom left of settings window</div>
          </div>
        </TooltipPortal>
      )}
    </div>
  );
}

function TrashWindow() {
  const deletedFiles = [
    { name: 'free_subscription_key.mp4', isRickroll: true },
  ];

  const handleFileClick = (file: typeof deletedFiles[0]) => {
    if (file.isRickroll) {
      window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank');
    }
  };

  return (
    <div className="p-8 text-[var(--desktop-text)] font-mono">
      <div className="flex items-center justify-end mb-8">
        <p className="text-sm opacity-70">{deletedFiles.length} items</p>
      </div>

      <div className="space-y-4 text-sm">
        <div className="grid grid-cols-4 gap-6 pt-4">
          {deletedFiles.map((file, index) => (
            <div
              key={index}
              onClick={() => handleFileClick(file)}
              className={`flex flex-col items-center gap-2 p-3 group ${
                file.isRickroll ? 'cursor-pointer hover:bg-[var(--desktop-accent)]/20 transition-colors rounded' : ''
              }`}
            >
              <File size={48} className={file.isRickroll ? 'group-hover:text-[var(--desktop-accent)] transition-colors' : ''} />
              <span className={`text-xs text-center break-words max-w-full ${
                file.isRickroll ? 'group-hover:text-[var(--desktop-accent)] transition-colors' : ''
              }`}>
                {file.name}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-6 text-xs opacity-50 border-t border-[var(--desktop-window-border)] mt-8">
          <p>items in trash are automatically deleted after 30 days</p>
        </div>
      </div>
    </div>
  );
}

function AboutWindow() {
  return (
    <div className="p-8 text-[var(--desktop-text)] font-mono">
      <div className="space-y-6 max-w-2xl text-sm">
        <p className="text-base">
          mic2text is speech-to-text, simplified.
        </p>

        <div className="space-y-4 opacity-90">
          <p>
            hold down a key (default: Fn), speak, and your words appear wherever your cursor is.
            it also copies to your clipboard and saves to history.
          </p>

          <p>
            <span className="text-[var(--desktop-accent)] font-bold">mac only</span> - requires macOS Big Sur (11.0) or later.
            built by a single developer who just wanted the simplest possible way to turn speech into text.
          </p>

          <p className="text-xs opacity-60">
            older macOS versions not supported. use at your own risk.
          </p>
        </div>

        <div className="border-l-2 border-[var(--desktop-accent)] pl-4 space-y-3 opacity-90">
          <p className="font-bold text-[var(--desktop-accent)]">key features:</p>
          <ul className="space-y-2 list-disc list-inside">
            <li>auto-formats and fixes your text as you speak</li>
            <li>optional AI layer for advanced formatting (if you want it)</li>
            <li>100% local processing - your text never touches our servers</li>
            <li>minimal, non-intrusive UI</li>
            <li>custom key assignment (Fn by default)</li>
          </ul>
        </div>

        <div className="pt-4 space-y-3 text-xs opacity-80">
          <p>
            no iOS sync. no team features. no enterprise dashboards.
          </p>
          <p>
            just simple, affordable speech-to-text for people who want exactly that.
          </p>
          <p className="text-[var(--desktop-accent)]">
            $3/month. that's the goal - keep it simple, keep it cheap.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Desktop() {
  const { windows, openWindow } = useWindowStore();
  const [mounted, setMounted] = React.useState(false);
  const [toast, setToast] = React.useState<{ message: string; id: number } | null>(null);

  React.useEffect(() => {
    setMounted(true);

    // Check if we should auto-open account window after auth
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('openAccount') === 'true') {
        // Open account window
        setTimeout(() => {
          const viewportWidth = globalThis.window.innerWidth;
          const viewportHeight = globalThis.window.innerHeight;
          const windowWidth = 730;
          const windowHeight = 620;
          const taskbarHeight = 40;

          const centerX = (viewportWidth - windowWidth) / 2;
          const centerY = (viewportHeight - windowHeight - taskbarHeight) / 2;

          openWindow('account', 'account', {
            x: centerX,
            y: centerY
          }, {
            width: windowWidth,
            height: windowHeight
          });
        }, 100);

        // Clean up URL
        window.history.replaceState({}, '', '/');
      }
    }
  }, [openWindow]);

  // Calculate icon positions - only use client-side values
  const getIconPositions = () => {
    if (!mounted) return [];

    const rightX = globalThis.window.innerWidth - 120;

    return [
      { id: 'pricing', name: 'pricing', icon: <DollarSign size={48} />, position: { x: 30, y: 30 } },
      { id: 'account', name: 'account', icon: <User size={48} />, position: { x: rightX, y: 30 } },
      { id: 'about', name: 'about', icon: <Info size={48} />, position: { x: 30, y: 150 } },
      { id: 'docs', name: 'docs', icon: <BookOpen size={48} />, position: { x: 30, y: 270 } },
      { id: 'showcase', name: 'showcase', icon: <Star size={48} />, position: { x: 30, y: 390 } },
      { id: 'demo', name: 'demo', icon: <Mic size={48} />, position: { x: globalThis.window.innerWidth / 2 - 40, y: globalThis.window.innerHeight / 2 - 100 } },
    ];
  };

  const icons = getIconPositions();

  const windowContent: Record<string, React.ReactNode> = {
    demo: <DemoWindow />,
    pricing: <PricingWindow />,
    account: <AccountWindow />,
    docs: <DocsWindow />,
    showcase: <ShowcaseWindow />,
    about: <AboutWindow />,
    contact: <ContactWindow />,
    form: <FormWindow />,
    trash: <TrashWindow />,
  };

  const getTrashPosition = () => {
    if (!mounted) return { x: 0, y: 0 };
    const rightX = globalThis.window.innerWidth - 120;
    return { x: rightX, y: globalThis.window.innerHeight - 150 };
  };

  const trashPosition = getTrashPosition();

  const toastTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const showToast = React.useCallback((message: string) => {
    // Clear any existing timeout
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    const id = Date.now();
    setToast({ message, id });

    // Auto-hide after 2 seconds
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
      toastTimeoutRef.current = null;
    }, 2000);
  }, []);

  // Make showToast available globally for child components
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).showToast = showToast;
    }
  }, [showToast]);

  return (
    <div className="fixed inset-0 bg-[var(--desktop-bg)] overflow-hidden">
      {/* Background watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <h1
          className="font-mono font-bold text-[var(--desktop-text)] opacity-5"
          style={{ fontSize: '12rem', letterSpacing: '-0.05em' }}
        >
          mic2text
        </h1>
      </div>

      {/* Desktop Icons */}
      {icons.map((icon) => (
        <DesktopIcon
          key={icon.id}
          id={icon.id}
          name={icon.name}
          icon={icon.icon}
          initialPosition={icon.position}
        />
      ))}

      {/* Trash Icon (bottom right) */}
      {mounted && (
        <DesktopIcon
          id="trash"
          name="trash"
          icon={<Trash2 size={48} />}
          initialPosition={trashPosition}
        />
      )}

      {/* Windows */}
      {windows.map((window) => (
        <Window key={window.id} id={window.id}>
          {windowContent[window.id] || <div className="p-8">Window content</div>}
        </Window>
      ))}

      {/* Toast notification */}
      {toast && (
        <div
          key={toast.id}
          className="fixed bottom-14 right-4 px-4 py-2 bg-[var(--desktop-taskbar-bg)] border border-[var(--desktop-window-border)] text-[var(--desktop-text)] text-sm font-mono shadow-lg animate-slide-in-right"
          style={{
            animation: 'slideInRight 0.3s ease-out',
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Taskbar */}
      <Taskbar />

      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
