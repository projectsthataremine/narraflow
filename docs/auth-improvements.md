# Auth Improvements

**Date:** January 2025
**Status:** Planning

---

## Overview

Add email verification and password reset functionality to prevent fake signups and improve user experience.

---

## Features to Implement

### 1. Email Verification (Email/Password Only)

**Purpose:** Prevent fake email signups

**How it works:**
- Google OAuth: No verification needed (already verified by Google)
- Email/Password: Requires verification code before app access

**Supabase Setup:**
- Enable "Confirm email" in Authentication > User Signups
- This is provider-specific - only affects email/password, not OAuth

**User Flow:**
```
Email/Password signup
  ↓
Verification email sent
  ↓
User enters code in app
  ↓
Code verified → can access app
```

---

### 2. Password Reset Flow

**Purpose:** Allow users to reset forgotten passwords

**User Flow:**
```
Sign-in screen
  ↓
Click "Forgot password?"
  ↓
Enter email address
  ↓
Reset email sent
  ↓
Click link in email
  ↓
Enter new password
  ↓
Password reset → redirect to sign in
```

---

## Implementation Tasks

### Phase 1: Supabase Configuration
- [ ] Enable "Confirm email" in Supabase Auth settings
- [ ] Verify Google OAuth is configured
- [ ] Test that OAuth skips verification

### Phase 2: Email Verification UI
- [ ] Create `EmailVerification.tsx` component
  - Input for 6-digit code
  - "Verify" button
  - "Resend code" button (60s cooldown)
  - Error display (invalid/expired code)
  - Loading states
- [ ] Handle verification success → allow app access
- [ ] Handle verification failure → show error

### Phase 3: Password Reset UI
- [ ] Add "Forgot password?" link to sign-in screen
- [ ] Create `PasswordResetRequest.tsx` component
  - Email input
  - "Send reset link" button
  - Success message
  - "Back to sign in" link
- [ ] Create `PasswordResetConfirm.tsx` component (opened from email link)
  - New password input
  - Confirm password input
  - Password strength indicator
  - "Reset password" button
  - Success → redirect to sign in

### Phase 4: Supabase Integration
- [ ] Implement email verification with Supabase
  ```typescript
  // Verify OTP code
  const { data, error } = await supabase.auth.verifyOtp({
    email: userEmail,
    token: code,
    type: 'email'
  });
  ```
- [ ] Implement resend verification code
  ```typescript
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: userEmail
  });
  ```
- [ ] Implement password reset request
  ```typescript
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'yourapp://reset-password'
  });
  ```
- [ ] Implement password reset confirmation
  ```typescript
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });
  ```

### Phase 5: Testing
- [ ] Test email/password signup → verification required
- [ ] Test verification code entry (valid code)
- [ ] Test invalid code (error message)
- [ ] Test expired code (error message)
- [ ] Test resend code (new email sent)
- [ ] Test resend cooldown (button disabled 60s)
- [ ] Test Google OAuth → skips verification
- [ ] Test "Forgot password?" link
- [ ] Test password reset email sent
- [ ] Test reset link opens app
- [ ] Test password reset with valid inputs
- [ ] Test password mismatch error
- [ ] Test weak password error
- [ ] Test sign in with new password

---

## UI Components

### EmailVerification.tsx
```typescript
interface EmailVerificationProps {
  email: string;
  onSuccess: () => void;
}

Features:
- Heading: "Verify your email"
- Subheading: "We sent a code to [email]"
- 6-digit code input
- Verify button
- Resend button with 60s cooldown timer
- Error display
- Loading states
```

### PasswordResetRequest.tsx
```typescript
interface PasswordResetRequestProps {
  onSuccess: () => void;
  onCancel: () => void;
}

Features:
- Heading: "Reset your password"
- Email input
- Send reset link button
- Back to sign in link
- Success message
- Error display
```

### PasswordResetConfirm.tsx
```typescript
interface PasswordResetConfirmProps {
  onSuccess: () => void;
}

Features:
- Heading: "Create new password"
- New password input
- Confirm password input
- Password strength indicator
- Reset password button
- Error display (passwords don't match, weak password)
- Success → redirect to sign in
```

---

## Trial System (Current - No Changes)

**Current behavior (keep as-is):**
- User signs up → `created_at` timestamp set
- User can access app if account age < 7 days
- After 7 days → paywall → must purchase license
- No credit card required for trial
- No Stripe involvement during signup

**No changes needed - this works fine.**

---

## Notes

- Email verification is automatic via Supabase - just need UI
- Password reset emails sent by Supabase automatically
- No webhook changes needed
- No database changes needed
- Keep current 7-day trial logic (`created_at` checking)

---

## Estimated Timeline

- Phase 1: 30 minutes (Supabase config)
- Phase 2: 3-4 hours (Email verification UI)
- Phase 3: 3-4 hours (Password reset UI)
- Phase 4: 2-3 hours (Supabase integration)
- Phase 5: 2-3 hours (Testing)

**Total: ~1-2 days**
