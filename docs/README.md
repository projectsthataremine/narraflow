# Mic2Text Documentation

Welcome to the Mic2Text documentation! This directory contains all the guides you need to build, deploy, and maintain the payment and licensing system.

---

## 📚 Documentation Index

### 1. **ENVIRONMENT_SETUP.md** - Start Here!
Your quick reference for all environment variables and secrets.

**Use this when:**
- Setting up your development environment
- Looking up what keys you need
- Checking which secrets are configured

**Status:** ✅ Supabase keys configured, ready for next steps

---

### 2. **SUPABASE_SETUP.md** - Supabase Configuration
Complete guide to Supabase API keys (new 2025 system).

**Use this when:**
- Understanding the new API key system
- Migrating from legacy keys
- Troubleshooting Supabase authentication

**Status:** ✅ Project created, keys configured

---

### 3. **PAYMENT_AND_LICENSING_INTEGRATION.md** - Main Implementation Guide
The complete, step-by-step guide to implementing payments and licensing.

**Use this when:**
- Implementing the payment flow
- Setting up license validation
- Understanding how the system works
- Following the implementation checklist

**Status:** 🔄 Phase 1 in progress (3/7 items done)

---

### 4. **APP_PACKAGING_AND_UPDATES.md**
Guide for packaging the Electron app and handling updates.

**Use this when:**
- Building distributable app packages
- Setting up auto-updates
- Preparing for release

**Status:** ⏳ Reference for later

---

## 🎯 Current Status

### ✅ Completed
1. Supabase project created (ID: `buqkvxtxjwyohzsogfbz`)
2. API keys generated and configured
3. Environment files created
4. Documentation written

### 🔄 In Progress
**Phase 1: Database & Keys Setup** (3/7 done)
- [x] Create Supabase project
- [x] Create API keys
- [x] Set up environment variables
- [ ] Create database table
- [ ] Generate Ed25519 key pair
- [ ] Store private key in Supabase
- [ ] Store public key in Electron

### ⏳ Next Up
1. **Create database table** - Run SQL migration for `licenses` table
2. **Generate Ed25519 keys** - For cryptographic license signing
3. **Set up edge functions** - Deploy Supabase functions
4. **Integrate Stripe** - Payment processing
5. **Add email service** - License delivery via Resend

---

## 🚀 Quick Start Guide

### First Time Setup

1. **Install Dependencies**
   ```bash
   # Marketing site
   cd marketing-site
   npm install

   # Electron app
   cd ..
   npm install
   ```

2. **Verify Environment Variables**
   ```bash
   # Check that .env.local exists
   cat marketing-site/.env.local

   # Check constants.ts exists
   cat src/main/constants.ts
   ```

3. **Generate Missing Secrets**
   ```bash
   # Edge function secret
   openssl rand -hex 32

   # Add to marketing-site/.env.local and src/main/constants.ts
   ```

4. **Continue with Phase 1**
   - See `PAYMENT_AND_LICENSING_INTEGRATION.md`
   - Follow Step 1.2: Create Database Table

---

## 📖 How to Use These Docs

### Scenario 1: "I'm starting fresh, what do I do?"
1. Read `ENVIRONMENT_SETUP.md` first
2. Follow `PAYMENT_AND_LICENSING_INTEGRATION.md` from Phase 1
3. Reference `SUPABASE_SETUP.md` for Supabase-specific questions

### Scenario 2: "I need to look up an environment variable"
1. Open `ENVIRONMENT_SETUP.md`
2. Check the "Environment Variables by Component" section
3. Find your missing value in "How to Generate Missing Values"

### Scenario 3: "I'm implementing payments"
1. Follow `PAYMENT_AND_LICENSING_INTEGRATION.md`
2. Check Phase 1 status at the top
3. Continue from the first unchecked item

### Scenario 4: "Something's broken, help!"
1. Check `PAYMENT_AND_LICENSING_INTEGRATION.md` → Troubleshooting
2. Check `SUPABASE_SETUP.md` → Common Issues
3. Verify environment variables in `ENVIRONMENT_SETUP.md`

---

## 🔐 Security Checklist

Before committing or deploying:

- [ ] `.env.local` is in `.gitignore` ✅ (already configured)
- [ ] No secret keys in committed code ✅
- [ ] Only publishable keys in constants.ts ✅
- [ ] Supabase secrets set for edge functions ⏳
- [ ] Production keys different from test keys ⏳
- [ ] All secrets rotated after sharing publicly ⏳

---

## 🎓 Understanding the System

### High-Level Flow
```
User pays → Stripe webhook → Generate license → Email license
→ User enters in app → Machine binding → Ed25519 signature
→ Local validation → Offline support
```

### Key Technologies
- **Stripe** - Payment processing
- **Supabase** - Database + edge functions
- **Ed25519** - Cryptographic signatures
- **node-machine-id** - Machine binding
- **Resend** - Email delivery

### Security Features
1. **Machine Binding** - Licenses tied to hardware
2. **Signature Verification** - Can't fake licenses
3. **Offline Validation** - Works without internet
4. **Periodic Re-validation** - Checks every 5 hours

---

## 📞 Getting Help

### Documentation
- **Stripe:** https://stripe.com/docs
- **Supabase:** https://supabase.com/docs
- **Ed25519:** https://ed25519.cr.yp.to/
- **Resend:** https://resend.com/docs

### Internal Docs
- Implementation guide: `PAYMENT_AND_LICENSING_INTEGRATION.md`
- Environment setup: `ENVIRONMENT_SETUP.md`
- Supabase config: `SUPABASE_SETUP.md`

---

## ✅ Next Steps

**You are here:** Environment configured, Supabase ready

**Next:** Create database table (Phase 1, Step 1.2)

**Then:** Generate Ed25519 keys (Phase 1, Step 1.3)

**Finally:** Deploy edge functions and set up payments

See `PAYMENT_AND_LICENSING_INTEGRATION.md` for detailed steps!
