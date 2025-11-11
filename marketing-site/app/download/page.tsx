'use client';

import { useEffect, useState } from 'react';
import { Box, Flex, Heading, Text, Button, Card } from '@radix-ui/themes';
import { Download, Check, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface Release {
  tag_name: string;
  assets: Array<{
    name: string;
    browser_download_url: string;
    size: number;
  }>;
}

export default function DownloadPage() {
  const [release, setRelease] = useState<Release | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [showUpdateInstructions, setShowUpdateInstructions] = useState(false);

  useEffect(() => {
    fetch('https://api.github.com/repos/projectsthataremine/narraflow/releases/latest')
      .then(res => res.json())
      .then(data => {
        setRelease(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch release:', err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!release || downloadStarted) return;

    const timer = setTimeout(() => {
      const armAsset = release.assets.find(a => a.name.includes('arm64'));
      if (armAsset) {
        window.location.href = armAsset.browser_download_url;
        setDownloadStarted(true);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [release, downloadStarted]);

  const armAsset = release?.assets.find(a => a.name.includes('arm64'));
  const intelAsset = release?.assets.find(a => a.name.includes('x64'));

  const steps = [
    {
      number: 1,
      title: 'Open the downloaded file',
      description: 'Find NarraFlow.dmg in your Downloads folder and double-click to open it.'
    },
    {
      number: 2,
      title: 'Install NarraFlow',
      description: 'Drag the NarraFlow icon into your Applications folder.'
    },
    {
      number: 3,
      title: 'Launch NarraFlow',
      description: 'Open NarraFlow from your Applications folder or using Spotlight (Cmd+Space).'
    },
    {
      number: 4,
      title: 'Grant permissions',
      description: 'See the macOS Security Notice below for security approval steps.'
    }
  ];

  return (
    <Box style={{ minHeight: '100vh', paddingTop: '8rem', paddingBottom: '4rem' }}>
      <Box className="container" style={{ maxWidth: '800px' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Flex direction="column" gap="4" align="center" mb="8">
            <Heading size="8" weight="bold" align="center">
              Download NarraFlow
            </Heading>
            <Text size="5" color="gray" align="center">
              {loading ? 'Loading...' : `Version ${release?.tag_name || 'latest'}`}
            </Text>
          </Flex>
        </motion.div>

        {/* Download Buttons */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card size="4" variant="classic" mb="6" style={{
            borderWidth: '2px',
            borderColor: 'var(--accent-6)',
            boxShadow: '0 12px 40px rgba(0, 112, 243, 0.2), 0 2px 8px rgba(0, 0, 0, 0.1)'
          }}>
            <Flex direction="column" gap="4">
              {downloadStarted && (
                <Box style={{
                  padding: '1rem',
                  background: 'var(--accent-3)',
                  borderRadius: 'var(--radius-3)',
                  border: '1px solid var(--accent-6)'
                }}>
                  <Text size="3" weight="medium" color="blue" align="center">
                    Your download should start automatically. If not, click below.
                  </Text>
                </Box>
              )}

              <Flex direction="column" gap="3">
                <Heading size="5" weight="bold">
                  macOS (Apple Silicon)
                </Heading>
                <Text size="2" color="gray" mb="2">
                  For M1, M2, M3, M4 Macs
                </Text>
                <Button
                  asChild
                  size="4"
                  variant="solid"
                  disabled={!armAsset}
                  style={{ width: '100%' }}
                >
                  <a href={armAsset?.browser_download_url || '#'}>
                    <Download size={20} style={{ marginRight: '0.5rem' }} />
                    Download for Apple Silicon
                    {armAsset && ` (${(armAsset.size / 1024 / 1024).toFixed(1)} MB)`}
                  </a>
                </Button>
              </Flex>

              <Box style={{ borderTop: '1px solid var(--gray-5)', paddingTop: '1rem' }} />

              <Flex direction="column" gap="3">
                <Heading size="5" weight="bold">
                  macOS (Intel)
                </Heading>
                <Text size="2" color="gray" mb="2">
                  For Intel-based Macs
                </Text>
                <Button
                  asChild
                  size="4"
                  variant="outline"
                  disabled={!intelAsset}
                  style={{ width: '100%' }}
                >
                  <a href={intelAsset?.browser_download_url || '#'}>
                    <Download size={20} style={{ marginRight: '0.5rem' }} />
                    Download for Intel
                    {intelAsset && ` (${(intelAsset.size / 1024 / 1024).toFixed(1)} MB)`}
                  </a>
                </Button>
              </Flex>
            </Flex>
          </Card>
        </motion.div>

        {/* Updating Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card
            size="3"
            variant="surface"
            mb="6"
            style={{ cursor: 'pointer' }}
            onClick={() => setShowUpdateInstructions(!showUpdateInstructions)}
          >
            <Flex align="center" justify="between">
              <Text weight="bold">Updating from a previous version?</Text>
              <motion.div
                animate={{ rotate: showUpdateInstructions ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown size={20} />
              </motion.div>
            </Flex>
            <motion.div
              initial={false}
              animate={{
                height: showUpdateInstructions ? 'auto' : 0,
                opacity: showUpdateInstructions ? 1 : 0,
              }}
              transition={{ duration: 0.3 }}
              style={{ overflow: 'hidden' }}
            >
              <Box mt="4" style={{ borderTop: '1px solid var(--gray-5)', paddingTop: '1rem' }}>
                <Text size="2" color="gray" style={{ lineHeight: '1.7' }}>
                  <strong>1. Quit NarraFlow if it's currently running</strong>
                  <br />
                  Use one of the following ways to quit:
                  <br />
                  &nbsp;&nbsp;&nbsp;&nbsp;a. If visible in dock: Open from dock, then quit via menu bar (NarraFlow → Quit) or press Command+Q
                  <br />
                  &nbsp;&nbsp;&nbsp;&nbsp;b. If not in dock: Open from Applications folder, then quit via menu bar or press Command+Q
                  <br /><br />
                  <strong>2. Delete the old version</strong>
                  <br />
                  Once quit, drag the old NarraFlow app from Applications to the trash
                  <br /><br />
                  <strong>3. Follow the installation steps below</strong>
                </Text>
              </Box>
            </motion.div>
          </Card>
        </motion.div>

        {/* Installation Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Heading size="6" weight="bold" mb="5">
            Installation Steps
          </Heading>
          <Flex direction="column" gap="4">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
              >
                <Card size="3" variant="surface">
                  <Flex gap="4" align="start">
                    <Flex
                      align="center"
                      justify="center"
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: 'var(--accent-9)',
                        color: 'white',
                        flexShrink: 0,
                        fontWeight: 'bold',
                        fontSize: '1.25rem'
                      }}
                    >
                      {step.number}
                    </Flex>
                    <Flex direction="column" gap="2" style={{ flex: 1 }}>
                      <Text size="4" weight="bold">
                        {step.title}
                      </Text>
                      <Text size="3" color="gray">
                        {step.description}
                      </Text>
                    </Flex>
                  </Flex>
                </Card>
              </motion.div>
            ))}
          </Flex>
        </motion.div>

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.1 }}
        >
          <Card
            size="3"
            variant="surface"
            mt="6"
            style={{
              background: 'var(--accent-2)',
              borderColor: 'var(--accent-6)'
            }}
          >
            <Flex direction="column" gap="3">
              <Heading size="4" weight="bold">
                macOS Security Notice
              </Heading>
              <Text size="2" color="gray" style={{ lineHeight: '1.7' }}>
                When you first launch NarraFlow, macOS Gatekeeper may show a warning because the app is downloaded from the internet. This is normal and expected.
                <br /><br />
                <strong>If you see "NarraFlow cannot be opened":</strong>
                <br />
                1. Go to System Settings → Privacy & Security
                <br />
                2. Scroll down to find "NarraFlow was blocked"
                <br />
                3. Click "Open Anyway"
                <br />
                4. Click "Open" in the confirmation dialog
                <br /><br />
                NarraFlow will also request microphone access to transcribe your speech. This is required for the app to function.
              </Text>
            </Flex>
          </Card>
        </motion.div>

        {/* System Requirements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.3 }}
        >
          <Card size="3" variant="surface" mt="6">
            <Flex direction="column" gap="3">
              <Heading size="4" weight="bold">
                System Requirements
              </Heading>
              <Flex direction="column" gap="2">
                <Flex align="center" gap="2">
                  <Check size={18} color="var(--accent-9)" />
                  <Text size="2" color="gray">macOS Big Sur 11.0 or later</Text>
                </Flex>
                <Flex align="center" gap="2">
                  <Check size={18} color="var(--accent-9)" />
                  <Text size="2" color="gray">Apple Silicon (M1/M2/M3/M4) or Intel processor</Text>
                </Flex>
                <Flex align="center" gap="2">
                  <Check size={18} color="var(--accent-9)" />
                  <Text size="2" color="gray">Microphone access</Text>
                </Flex>
              </Flex>
            </Flex>
          </Card>
        </motion.div>

        {/* Support */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.5 }}
        >
          <Text size="3" color="gray" align="center" mt="6" asChild>
            <p>
              Need help?{' '}
              <Text asChild>
                <a
                  href="mailto:support@narraflow.com"
                  style={{ color: 'var(--accent-9)', fontWeight: '600' }}
                >
                  Contact support
                </a>
              </Text>
            </p>
          </Text>
        </motion.div>
      </Box>
    </Box>
  );
}
