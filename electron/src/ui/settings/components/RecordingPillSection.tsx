/**
 * Recording Pill Section
 * Customization options for the recording pill overlay
 */

import React, { useState } from 'react';
import { Flex, Text, Box, Button, Switch, IconButton, Badge } from '@radix-ui/themes';
import { Link, Unlink } from 'lucide-react';
import { PillConfig } from './types';
import { ShuffleIcon, SunIcon, MoonIcon, BarChartIcon, LayersIcon, ChevronIcon } from './Icons';

interface RecordingPillSectionProps {
  pillConfig: PillConfig;
  setPillConfig: (config: PillConfig) => void;
}

export function RecordingPillSection({ pillConfig, setPillConfig }: RecordingPillSectionProps) {
  const [previewDarkMode, setPreviewDarkMode] = useState(true);
  const [openSection, setOpenSection] = useState<'bars' | 'background' | null>(null);
  const [paddingLinked, setPaddingLinked] = useState(true);

  const handleRandomize = () => {
    const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

    // Helper function to convert hex to HSL
    const hexToHSL = (hex: string): { h: number; s: number; l: number } => {
      // Remove # if present
      hex = hex.replace(/^#/, '');

      // Parse hex to RGB
      const r = parseInt(hex.substring(0, 2), 16) / 255;
      const g = parseInt(hex.substring(2, 4), 16) / 255;
      const b = parseInt(hex.substring(4, 6), 16) / 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
          case g: h = ((b - r) / d + 2) / 6; break;
          case b: h = ((r - g) / d + 4) / 6; break;
        }
      }

      return { h: h * 360, s: s * 100, l: l * 100 };
    };

    // Helper function to convert HSL to hex
    const hslToHex = (h: number, s: number, l: number): string => {
      s = s / 100;
      l = l / 100;

      const c = (1 - Math.abs(2 * l - 1)) * s;
      const x = c * (1 - Math.abs((h / 60) % 2 - 1));
      const m = l - c / 2;

      let r = 0, g = 0, b = 0;
      if (h < 60) { r = c; g = x; b = 0; }
      else if (h < 120) { r = x; g = c; b = 0; }
      else if (h < 180) { r = 0; g = c; b = x; }
      else if (h < 240) { r = 0; g = x; b = c; }
      else if (h < 300) { r = x; g = 0; b = c; }
      else { r = c; g = 0; b = x; }

      const toHex = (n: number) => {
        const hex = Math.round((n + m) * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      };

      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    };

    const colors: [string, string][] = [
      ['#a855f7', '#60a5fa'], // Purple Blue
      ['#ff6b6b', '#feca57'], // Sunset
      ['#0891b2', '#6366f1'], // Ocean
      ['#10b981', '#059669'], // Forest
      ['#f59e0b', '#ef4444'], // Fire
    ];
    const randomColor = colors[randomInt(0, colors.length - 1)];

    // 50% chance of having a background
    const hasBackground = Math.random() < 0.5;

    let backgroundConfig = {};
    if (hasBackground) {
      // Convert color1 to HSL, make it dark (5-15% lightness), keep hue
      const hsl = hexToHSL(randomColor[0]);
      const darkBackgroundColor = hslToHex(hsl.h, hsl.s, randomInt(5, 15));

      backgroundConfig = {
        hasBackground: true,
        backgroundColor: darkBackgroundColor,
        backgroundShape: Math.random() < 0.5 ? 'pill' : 'rectangle',
        backgroundPaddingX: 12,
        backgroundPaddingY: 8,
        borderWidth: randomInt(0, 3),
        borderColor: randomColor[0], // Use dominant color for border
      };
    } else {
      backgroundConfig = {
        hasBackground: false,
      };
    }

    setPillConfig({
      ...pillConfig,
      numBars: randomInt(5, 15),
      barWidth: randomInt(5, 20),
      barGap: randomInt(2, 10),
      maxHeight: randomInt(15, 70),
      borderRadius: randomInt(0, 10),
      glowIntensity: randomInt(0, 20),
      color1: randomColor[0],
      color2: randomColor[1],
      ...backgroundConfig,
    });
  };

  return (
    <div>
      {/* Header with Randomize button */}
      <Flex justify="between" align="center" mb="5">
        <Text size="5" weight="bold">Customize Recording Pill</Text>
        <Button
          onClick={handleRandomize}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
          }}
        >
          <ShuffleIcon />
          <Text size="2" weight="medium">Randomize</Text>
        </Button>
      </Flex>

      {/* Accordion Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>

        {/* Bar Animation Section */}
        <div style={{
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          background: 'var(--bg-secondary)',
        }}>
          {/* Accordion Header */}
          <button
            onClick={() => setOpenSection(openSection === 'bars' ? null : 'bars')}
            style={{
              width: '100%',
              padding: '16px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: 'var(--text-primary)',
            }}
          >
            {/* Icon Badge */}
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              background: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <BarChartIcon />
            </div>

            {/* Title and Subtitle */}
            <div style={{ flex: 1, textAlign: 'left' }}>
              <Text size="3" weight="bold" style={{ display: 'block' }}>Bar Animation</Text>
              <Text size="2" style={{ color: 'var(--text-secondary)', display: 'block' }}>
                Customize bar appearance and behavior
              </Text>
            </div>

            {/* Chevron */}
            <ChevronIcon isOpen={openSection === 'bars'} />
          </button>

          {/* Accordion Content */}
          {openSection === 'bars' && (
            <div style={{
              padding: '0 16px 16px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}>
              {/* Number of Bars */}
              <Flex align="center" gap="4" justify="between">
                <Text size="3" style={{ minWidth: '120px' }}>Number of Bars</Text>
                <input
                  type="range"
                  min="5"
                  max="15"
                  value={pillConfig.numBars}
                  onChange={(e) => setPillConfig({ ...pillConfig, numBars: parseInt(e.target.value) })}
                  style={{ flex: 1, height: '4px', cursor: 'pointer' }}
                />
                <Text size="3" weight="medium" style={{ minWidth: '40px', textAlign: 'right' }}>{pillConfig.numBars}</Text>
              </Flex>

              {/* Bar Width */}
              <Flex align="center" gap="4" justify="between">
                <Text size="3" style={{ minWidth: '120px' }}>Bar Width</Text>
                <input
                  type="range"
                  min="2"
                  max="20"
                  value={pillConfig.barWidth}
                  onChange={(e) => setPillConfig({ ...pillConfig, barWidth: parseInt(e.target.value) })}
                  style={{ flex: 1, height: '4px', cursor: 'pointer' }}
                />
                <Text size="3" weight="medium" style={{ minWidth: '40px', textAlign: 'right' }}>{pillConfig.barWidth}px</Text>
              </Flex>

              {/* Bar Gap */}
              <Flex align="center" gap="4" justify="between">
                <Text size="3" style={{ minWidth: '120px' }}>Bar Gap</Text>
                <input
                  type="range"
                  min="2"
                  max="10"
                  value={pillConfig.barGap}
                  onChange={(e) => setPillConfig({ ...pillConfig, barGap: parseInt(e.target.value) })}
                  style={{ flex: 1, height: '4px', cursor: 'pointer' }}
                />
                <Text size="3" weight="medium" style={{ minWidth: '40px', textAlign: 'right' }}>{pillConfig.barGap}px</Text>
              </Flex>

              {/* Max Height */}
              <Flex align="center" gap="4" justify="between">
                <Text size="3" style={{ minWidth: '120px' }}>Max Height</Text>
                <input
                  type="range"
                  min="8"
                  max="70"
                  value={pillConfig.maxHeight}
                  onChange={(e) => setPillConfig({ ...pillConfig, maxHeight: parseInt(e.target.value) })}
                  style={{ flex: 1, height: '4px', cursor: 'pointer' }}
                />
                <Text size="3" weight="medium" style={{ minWidth: '40px', textAlign: 'right' }}>{pillConfig.maxHeight}px</Text>
              </Flex>

              {/* Border Radius */}
              <Flex align="center" gap="4" justify="between">
                <Text size="3" style={{ minWidth: '120px' }}>Border Radius</Text>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round((pillConfig.borderRadius / 10) * 100)}
                  onChange={(e) => {
                    const percentage = parseInt(e.target.value);
                    const pixels = Math.round((percentage / 100) * 10);
                    setPillConfig({ ...pillConfig, borderRadius: pixels });
                  }}
                  style={{ flex: 1, height: '4px', cursor: 'pointer' }}
                />
                <Text size="3" weight="medium" style={{ minWidth: '40px', textAlign: 'right' }}>{Math.round((pillConfig.borderRadius / 10) * 100)}%</Text>
              </Flex>

              {/* Glow Intensity */}
              <Flex align="center" gap="4" justify="between">
                <Text size="3" style={{ minWidth: '120px' }}>Glow Intensity</Text>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={pillConfig.glowIntensity}
                  onChange={(e) => setPillConfig({ ...pillConfig, glowIntensity: parseInt(e.target.value) })}
                  style={{ flex: 1, height: '4px', cursor: 'pointer' }}
                />
                <Text size="3" weight="medium" style={{ minWidth: '40px', textAlign: 'right' }}>{pillConfig.glowIntensity}</Text>
              </Flex>

              {/* Use Gradient with Colors */}
              <Flex justify="between" align="center" mt="2">
                <Flex align="center" gap="2">
                  <Text size="3">Use Gradient</Text>
                  <Switch
                    checked={pillConfig.useGradient}
                    onCheckedChange={(checked) => setPillConfig({ ...pillConfig, useGradient: checked })}
                  />
                </Flex>

                {/* Colors on the right */}
                <Flex gap="3" align="center">
                  <input
                    type="color"
                    value={pillConfig.color1}
                    onChange={(e) => setPillConfig({ ...pillConfig, color1: e.target.value })}
                    style={{
                      width: '20px',
                      height: '20px',
                      border: '1px solid var(--border-light)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  />
                  {pillConfig.useGradient && (
                    <input
                      type="color"
                      value={pillConfig.color2}
                      onChange={(e) => setPillConfig({ ...pillConfig, color2: e.target.value })}
                      style={{
                        width: '20px',
                        height: '20px',
                        border: '1px solid var(--border-light)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    />
                  )}
                </Flex>
              </Flex>
            </div>
          )}
        </div>

        {/* Background Section */}
        <div style={{
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          background: 'var(--bg-secondary)',
        }}>
          {/* Accordion Header */}
          <button
            onClick={() => setOpenSection(openSection === 'background' ? null : 'background')}
            style={{
              width: '100%',
              padding: '16px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: 'var(--text-primary)',
            }}
          >
            {/* Icon Badge */}
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              background: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <LayersIcon />
            </div>

            {/* Title and Subtitle */}
            <div style={{ flex: 1, textAlign: 'left' }}>
              <Flex align="center" gap="2">
                <Text size="3" weight="bold">Background</Text>
                <Badge color={pillConfig.hasBackground ? "green" : "gray"} size="1">
                  {pillConfig.hasBackground ? "ON" : "OFF"}
                </Badge>
              </Flex>
              <Text size="2" style={{ color: 'var(--text-secondary)', display: 'block' }}>
                Add background container with borders
              </Text>
            </div>

            {/* Chevron */}
            <ChevronIcon isOpen={openSection === 'background'} />
          </button>

          {/* Accordion Content */}
          {openSection === 'background' && (
            <div style={{
              padding: '0 16px 16px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}>
              {/* Enable Background Toggle */}
              <Flex justify="between" align="center">
                <Text size="3">Enable Background</Text>
                <Switch
                  checked={pillConfig.hasBackground}
                  onCheckedChange={(checked) => setPillConfig({ ...pillConfig, hasBackground: checked })}
                />
              </Flex>

              {pillConfig.hasBackground && (
                <>
                  {/* Background Shape Selector */}
                  <div>
                    <Text size="3" style={{ display: 'block', marginBottom: '8px' }}>Shape</Text>
                    <Flex gap="2">
                      <Button
                        variant={pillConfig.backgroundShape === 'pill' ? 'solid' : 'outline'}
                        onClick={() => setPillConfig({ ...pillConfig, backgroundShape: 'pill' })}
                        style={{ flex: 1 }}
                      >
                        Pill
                      </Button>
                      <Button
                        variant={pillConfig.backgroundShape === 'rectangle' ? 'solid' : 'outline'}
                        onClick={() => setPillConfig({ ...pillConfig, backgroundShape: 'rectangle' })}
                        style={{ flex: 1 }}
                      >
                        Rectangle
                      </Button>
                    </Flex>
                  </div>

                  {/* Background Color */}
                  <Flex align="center" gap="3" justify="between">
                    <Text size="3">Background Color</Text>
                    <input
                      type="color"
                      value={pillConfig.backgroundColor}
                      onChange={(e) => setPillConfig({ ...pillConfig, backgroundColor: e.target.value })}
                      style={{
                        width: '24px',
                        height: '24px',
                        border: '1px solid var(--border-light)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    />
                  </Flex>

                  {/* Background Padding X and Y */}
                  <Flex direction="column" gap="2">
                    {/* Padding X */}
                    <Flex align="center" gap="4" justify="between">
                      <Text size="3" style={{ minWidth: '120px' }}>Padding X</Text>
                      <input
                        type="range"
                        min="4"
                        max="24"
                        value={pillConfig.backgroundPaddingX ?? 12}
                        onChange={(e) => {
                          const newValue = parseInt(e.target.value);
                          if (paddingLinked) {
                            setPillConfig({
                              ...pillConfig,
                              backgroundPaddingX: newValue,
                              backgroundPaddingY: newValue
                            });
                          } else {
                            setPillConfig({ ...pillConfig, backgroundPaddingX: newValue });
                          }
                        }}
                        style={{ flex: 1, height: '4px', cursor: 'pointer' }}
                      />
                      <Text size="3" weight="medium" style={{ minWidth: '40px', textAlign: 'right' }}>{pillConfig.backgroundPaddingX ?? 12}px</Text>
                    </Flex>

                    {/* Link Button */}
                    <Flex align="center" pl="2">
                      <IconButton
                        size="1"
                        variant={paddingLinked ? 'solid' : 'soft'}
                        color={paddingLinked ? 'blue' : 'gray'}
                        onClick={() => {
                          if (!paddingLinked) {
                            // When linking, sync Y to match X
                            setPillConfig({
                              ...pillConfig,
                              backgroundPaddingY: pillConfig.backgroundPaddingX ?? 12
                            });
                          }
                          setPaddingLinked(!paddingLinked);
                        }}
                        style={{ cursor: 'pointer' }}
                        title={paddingLinked ? 'Unlink padding values' : 'Link padding values'}
                      >
                        {paddingLinked ? <Link size={14} /> : <Unlink size={14} />}
                      </IconButton>
                    </Flex>

                    {/* Padding Y */}
                    <Flex align="center" gap="4" justify="between">
                      <Text size="3" style={{ minWidth: '120px' }}>Padding Y</Text>
                      <input
                        type="range"
                        min="4"
                        max="24"
                        value={pillConfig.backgroundPaddingY ?? 12}
                        onChange={(e) => {
                          const newValue = parseInt(e.target.value);
                          if (paddingLinked) {
                            setPillConfig({
                              ...pillConfig,
                              backgroundPaddingX: newValue,
                              backgroundPaddingY: newValue
                            });
                          } else {
                            setPillConfig({ ...pillConfig, backgroundPaddingY: newValue });
                          }
                        }}
                        style={{ flex: 1, height: '4px', cursor: 'pointer' }}
                      />
                      <Text size="3" weight="medium" style={{ minWidth: '40px', textAlign: 'right' }}>{pillConfig.backgroundPaddingY ?? 12}px</Text>
                    </Flex>
                  </Flex>

                  {/* Border Width */}
                  <Flex align="center" gap="4" justify="between">
                    <Text size="3" style={{ minWidth: '120px' }}>Border Width</Text>
                    <input
                      type="range"
                      min="0"
                      max="3"
                      value={pillConfig.borderWidth}
                      onChange={(e) => setPillConfig({ ...pillConfig, borderWidth: parseInt(e.target.value) })}
                      style={{ flex: 1, height: '4px', cursor: 'pointer' }}
                    />
                    <Text size="3" weight="medium" style={{ minWidth: '40px', textAlign: 'right' }}>{pillConfig.borderWidth}px</Text>
                  </Flex>

                  {/* Border Color (only if borderWidth > 0) */}
                  {pillConfig.borderWidth > 0 && (
                    <Flex align="center" gap="3" justify="between">
                      <Text size="3">Border Color</Text>
                      <input
                        type="color"
                        value={pillConfig.borderColor}
                        onChange={(e) => setPillConfig({ ...pillConfig, borderColor: e.target.value })}
                        style={{
                          width: '24px',
                          height: '24px',
                          border: '1px solid var(--border-light)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      />
                    </Flex>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Live Preview */}
      <Box position="relative" mt="4">
        {/* Dark/Light Mode Toggle */}
        <Box style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          zIndex: 10,
        }}>
          <Button
            variant="outline"
            onClick={() => setPreviewDarkMode(!previewDarkMode)}
            style={{
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {previewDarkMode ? <SunIcon /> : <MoonIcon />}
          </Button>
        </Box>

        <Box style={{
          padding: '40px',
          background: previewDarkMode ? 'var(--bg-secondary)' : '#f5f5f5',
          border: '1px solid var(--border-light)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px',
          borderRadius: 'var(--radius-3)',
        }}>
          <PillPreview config={pillConfig} />
        </Box>
      </Box>
    </div>
  );
}

// Live Pill Preview Component
interface PillPreviewProps {
  config: PillConfig;
}

function PillPreview({ config }: PillPreviewProps) {
  const [amplitude] = useState(0.7); // Simulated amplitude

  const displayData = Array.from({ length: config.numBars }, () => {
    const variation = (Math.random() - 0.5) * 0.2;
    return Math.max(0.3, Math.min(1.0, amplitude + variation));
  });

  const barsContent = (
    <div style={{
      display: 'flex',
      gap: `${config.barGap}px`,
      alignItems: 'center',
    }}>
      {displayData.map((barAmplitude, index) => {
        const height = barAmplitude * config.maxHeight;
        return (
          <div
            key={index}
            style={{
              width: `${config.barWidth}px`,
              height: `${height * 2}px`,
              background: config.useGradient
                ? `linear-gradient(to bottom, ${config.color1}, ${config.color2}, ${config.color1})`
                : config.color1,
              borderRadius: `${config.borderRadius}px`,
              boxShadow: config.glowIntensity > 0
                ? `0 0 ${config.glowIntensity}px ${config.color1}aa`
                : 'none',
              transition: 'height 0.1s ease-out',
            }}
          />
        );
      })}
    </div>
  );

  // If background is enabled, wrap the bars in a container
  if (config.hasBackground) {
    return (
      <div style={{
        background: config.backgroundColor,
        padding: `${config.backgroundPaddingY ?? 12}px ${config.backgroundPaddingX ?? 12}px`,
        borderRadius: config.backgroundShape === 'pill' ? '999px' : '8px',
        border: config.borderWidth > 0
          ? `${config.borderWidth}px solid ${config.borderColor}`
          : 'none',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {barsContent}
      </div>
    );
  }

  // Otherwise, return just the bars
  return barsContent;
}
