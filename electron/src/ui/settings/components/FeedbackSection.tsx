/**
 * Feedback Section
 * Allows users to submit bug reports, feature requests, and general feedback
 */

import React, { useState, useRef } from 'react';
import { Box, Text, Select, Switch, Flex, Button, Tooltip, IconButton } from '@radix-ui/themes';

export function FeedbackSection() {
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [message, setMessage] = useState('');
  const [macOSVersion, setMacOSVersion] = useState('');
  const [appVersion, setAppVersion] = useState('');
  const [contactType, setContactType] = useState('');
  const [consentToShare, setConsentToShare] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSend = async () => {
    setIsLoading(true);

    try {
      // Build metadata object with dynamic fields based on contact type
      const metadata: any = {};

      if (contactType === 'bug') {
        if (macOSVersion) metadata.macos_version = macOSVersion;
        if (appVersion) metadata.app_version = appVersion;
      }

      // Add consent flag for testimonials
      if (contactType === 'testimonial') {
        metadata.consent_to_share = consentToShare;
      }

      // Add attachment names if present
      if (attachments.length > 0) {
        metadata.attachments = attachments.map(f => ({
          name: f.name,
          size: f.size,
          type: f.type
        }));
      }

      // Submit to API (using full Supabase URL from Electron)
      const response = await fetch('https://buqkvxtxjwyohzsogfbz.supabase.co/functions/v1/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: contactType,
          message: message.trim(),
          metadata
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit form');
      }

      setIsSent(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Get dynamic labels based on contact type
  const getMessageLabel = () => {
    switch (contactType) {
      case 'bug':
        return 'What happened?';
      case 'feature':
        return 'What feature would you like?';
      case 'feedback':
        return 'Your feedback';
      case 'help':
        return 'What do you need help with?';
      case 'testimonial':
        return 'Share your experience';
      default:
        return 'Your message';
    }
  };

  const getMessagePlaceholder = () => {
    switch (contactType) {
      case 'bug':
        return 'Describe what steps led up to the issue...';
      case 'feature':
        return 'Describe the feature you\'d like to see...';
      case 'feedback':
        return 'Share your thoughts with us...';
      case 'help':
        return 'Describe what you need help with...';
      case 'testimonial':
        return 'Tell us how NarraFlow has helped you...';
      default:
        return 'Type your message here...';
    }
  };

  const showVersionFields = contactType === 'bug';
  const maxMessageLength = 500;

  // Show success message if sent
  if (isSent) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary)' }}>
            Message sent!
          </h2>
          <p style={{ fontSize: '14px', opacity: 0.8, maxWidth: '500px', color: 'var(--text-primary)', marginBottom: '16px' }}>
            Your message was sent. We'll try to respond within 48 hours.
          </p>
          <p style={{ fontSize: '12px', opacity: 0.6, paddingTop: '16px', color: 'var(--text-primary)' }}>
            You can close this window now.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        fontSize: '14px',
        paddingRight: '8px',
      }}>
        {/* Contact Type */}
        <Box>
          <Text size="2" color="gray" mb="2" as="div">
            Type of contact
          </Text>
          <Select.Root
            value={contactType}
            onValueChange={(value) => setContactType(value)}
          >
            <Select.Trigger style={{ width: '100%' }} placeholder="Select type..." />
            <Select.Content position="popper" side="bottom" align="start">
              <Select.Item value="bug">Bug Report</Select.Item>
              <Select.Item value="feature">Feature Request</Select.Item>
              <Select.Item value="feedback">General Feedback</Select.Item>
              <Select.Item value="testimonial">Testimonial / Success Story</Select.Item>
              <Select.Item value="help">Help/Support</Select.Item>
              <Select.Item value="other">Other</Select.Item>
            </Select.Content>
          </Select.Root>
        </Box>

        {/* Consent checkbox - only show for testimonials */}
        {contactType === 'testimonial' && (
          <Box style={{
            padding: '16px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: 'var(--radius-3)',
          }}>
            <Flex align="start" gap="3">
              <Switch
                checked={consentToShare}
                onCheckedChange={setConsentToShare}
                style={{ marginTop: '2px' }}
              />
              <Text size="2" style={{ lineHeight: '1.5' }}>
                I give permission for NarraFlow to use my testimonial in marketing materials (website, social media, etc.) and to contact me for additional details or photos if needed.
              </Text>
            </Flex>
          </Box>
        )}

        {/* macOS Version - only show for bug reports */}
        {showVersionFields && (
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)' }}>
              macOS version
              <Tooltip content="Find your macOS version: Apple menu → About This Mac">
                <span style={{
                  cursor: 'help',
                  fontSize: '12px',
                  border: '1px solid currentColor',
                  borderRadius: '50%',
                  width: '16px',
                  height: '16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>?</span>
              </Tooltip>
            </label>
            <select
              value={macOSVersion}
              onChange={(e) => setMacOSVersion(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-system)',
                fontSize: '14px',
                cursor: 'pointer',
                boxSizing: 'border-box',
                transition: 'all 0.2s ease',
              }}
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
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)' }}>
              app version
              <Tooltip content="Find your app version: Open NarraFlow → version shown at bottom left of settings window">
                <span style={{
                  cursor: 'help',
                  fontSize: '12px',
                  border: '1px solid currentColor',
                  borderRadius: '50%',
                  width: '16px',
                  height: '16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>?</span>
              </Tooltip>
            </label>
            <select
              value={appVersion}
              onChange={(e) => setAppVersion(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-system)',
                fontSize: '14px',
                cursor: 'pointer',
                boxSizing: 'border-box',
                transition: 'all 0.2s ease',
              }}
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
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
              {getMessageLabel()}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={getMessagePlaceholder()}
              maxLength={maxMessageLength}
              style={{
                width: '100%',
                height: '128px',
                padding: '12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-system)',
                fontSize: '14px',
                resize: 'none',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'all 0.2s ease',
              }}
            />
            <div style={{ textAlign: 'right', fontSize: '12px', opacity: 0.5, marginTop: '4px', color: 'var(--text-primary)' }}>
              {message.length} / {maxMessageLength} characters
            </div>
          </div>
        )}

        {/* Attachments - only show when contact type is selected */}
        {contactType && (
          <div>
            <label style={{ display: 'block', marginBottom: '8px', opacity: 0.7, color: 'var(--text-primary)' }}>
              Attachments
            </label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
            />
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={handleClick}
              style={{
                width: '100%',
                minHeight: '96px',
                padding: '16px',
                border: `2px dashed ${isDragging ? 'var(--accent-primary)' : 'var(--border-light)'}`,
                background: isDragging ? 'rgba(163, 190, 140, 0.1)' : 'transparent',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                cursor: 'pointer',
                boxSizing: 'border-box',
              }}
            >
              <p style={{ textAlign: 'center', opacity: 0.5, fontSize: '12px', color: 'var(--text-primary)' }}>
                Drag and drop images here or click to browse
              </p>
            </div>

            {/* Attachment badges */}
            {attachments.length > 0 && (
              <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '4px 8px',
                      background: 'rgba(163, 190, 140, 0.1)',
                      border: '1px solid rgba(163, 190, 140, 0.3)',
                      fontSize: '12px',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <span style={{ opacity: 0.8 }}>{file.name}</span>
                    <IconButton
                      onClick={() => removeAttachment(index)}
                      size="1"
                      variant="ghost"
                      color="red"
                    >
                      ✕
                    </IconButton>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Send button */}
      <Flex pt="4" justify="end">
        <Button
          onClick={handleSend}
          disabled={!message.trim() || isLoading}
          size="3"
          variant="solid"
        >
          {isLoading && (
            <svg style={{ animation: 'spin 1s linear infinite', height: '16px', width: '16px' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {isLoading ? 'Sending...' : 'Send'}
        </Button>
      </Flex>
    </div>
  );
}
