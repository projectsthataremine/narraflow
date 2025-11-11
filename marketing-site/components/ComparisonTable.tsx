'use client';

import { Check } from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { Box, Flex, Heading, Text, Table, Badge } from '@radix-ui/themes';
import { getMonthlyPrice, formatPrice } from '@/lib/config';

export default function ComparisonTable() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-25%' });
  const [monthlyPrice, setMonthlyPrice] = useState(5);

  useEffect(() => {
    getMonthlyPrice().then(setMonthlyPrice);
  }, []);

  const features = [
    { name: 'Speech-to-text transcription' },
    { name: 'Auto-formatting & grammar fixes' },
    { name: 'Works in any app' },
    { name: 'Custom hotkey (Fn by default)' },
    { name: 'Transcription history' },
    { name: '100% local processing (privacy)', highlight: true },
    { name: 'Zero telemetry or usage tracking', highlight: true },
    { name: 'Automatic clipboard copy' },
    { name: 'Visual feedback pill' },
    { name: 'Language support', value: 'English' },
    { name: 'Apple Silicon & Intel support' },
    { name: 'macOS Big Sur 11.0+' },
  ];

  return (
    <Box asChild ref={ref}>
      <section id="features-list" className="section" style={{ background: 'var(--gray-2)' }}>
        <Box className="container" style={{ maxWidth: '1000px' }}>
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
          >
            <Flex direction="column" gap="4" align="center" mb="8">
              <Heading size="8" weight="bold" align="center">
                Everything you need. <Text color="blue">Nothing you don't.</Text>
              </Heading>
              <Text size="5" color="gray" align="center" style={{ maxWidth: '700px' }}>
                Professional speech-to-text at an honest price.
              </Text>
            </Flex>
          </motion.div>

          {/* Features Table */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Box style={{
              background: 'var(--color-panel-solid)',
              borderRadius: 'var(--radius-4)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-5)',
            }}>
              <Table.Root variant="surface">
                <Table.Header>
                  <Table.Row style={{ background: 'var(--accent-9)' }}>
                    <Table.ColumnHeaderCell
                      colSpan={2}
                      style={{
                        padding: '1.75rem 1.5rem',
                        color: 'white',
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        textAlign: 'center',
                        letterSpacing: '-0.02em'
                      }}
                    >
                      Everything Included
                    </Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {features.map((feature, index) => (
                    <FeatureRow
                      key={index}
                      feature={feature.name}
                      value={feature.value}
                      highlight={feature.highlight}
                      index={index}
                      isInView={isInView}
                    />
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>
          </motion.div>

          {/* Bottom Note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <Text size="4" color="gray" align="center" mt="6" asChild>
              <p>
                <Text weight="bold">{formatPrice(monthlyPrice)}/month</Text> for everything above. No hidden tiers.
              </p>
            </Text>
          </motion.div>
        </Box>
      </section>
    </Box>
  );
}

interface FeatureRowProps {
  feature: string;
  value?: string;
  highlight?: boolean;
  index: number;
  isInView: boolean;
}

function FeatureRow({ feature, value, highlight, index, isInView }: FeatureRowProps) {
  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
      transition={{ duration: 0.4, delay: 0.3 + index * 0.05 }}
      style={{ background: highlight ? 'var(--accent-2)' : undefined }}
    >
      <Table.Cell style={{ padding: '1rem 1.5rem' }}>
        <Flex gap="2" align="center">
          <Text weight="medium">{feature}</Text>
          {highlight && (
            <Badge color="blue" size="1">Key</Badge>
          )}
        </Flex>
      </Table.Cell>
      <Table.Cell style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
        {value ? (
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.3, delay: 0.3 + index * 0.05 + 0.1 }}
          >
            <Text size="2" weight="bold" color="blue">
              {value}
            </Text>
          </motion.span>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0, rotate: -180 }}
            animate={isInView ? { opacity: 1, scale: 1, rotate: 0 } : { opacity: 0, scale: 0, rotate: -180 }}
            transition={{ duration: 0.4, delay: 0.3 + index * 0.05 + 0.1, type: 'spring', stiffness: 200 }}
            style={{ display: 'flex', justifyContent: 'center' }}
          >
            <Check size={24} color="var(--accent-9)" />
          </motion.div>
        )}
      </Table.Cell>
    </motion.tr>
  );
}
