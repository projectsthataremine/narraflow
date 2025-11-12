#!/bin/bash

# Upload Supabase Edge Function Secrets
# Reads from .env.secrets and uploads all secrets to Supabase

set -e  # Exit on error

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Upload Secrets to Supabase                                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if .env.secrets exists
if [ ! -f ".env.secrets" ]; then
  echo -e "${RED}Error: .env.secrets file not found!${NC}"
  echo -e "${YELLOW}Please copy .env.secrets.example to .env.secrets and fill in your values.${NC}"
  exit 1
fi

# Load environment variables from .env.secrets
echo -e "${BLUE}Loading secrets from .env.secrets...${NC}"
export $(grep -v '^#' .env.secrets | grep -v '^$' | xargs)

# Build the secrets command
SECRETS_CMD="npx supabase secrets set"

# Add WEBSITE_URL
if [ -n "$WEBSITE_URL" ]; then
  SECRETS_CMD="$SECRETS_CMD WEBSITE_URL=\"$WEBSITE_URL\""
  echo -e "${GREEN}✓${NC} WEBSITE_URL"
else
  echo -e "${YELLOW}⚠${NC} WEBSITE_URL not set"
fi

# Add Sandbox (Test Mode) secrets
if [ -n "$STRIPE_SECRET_KEY_SANDBOX" ]; then
  SECRETS_CMD="$SECRETS_CMD STRIPE_SECRET_KEY_SANDBOX=\"$STRIPE_SECRET_KEY_SANDBOX\""
  echo -e "${GREEN}✓${NC} STRIPE_SECRET_KEY_SANDBOX"
else
  echo -e "${YELLOW}⚠${NC} STRIPE_SECRET_KEY_SANDBOX not set"
fi

if [ -n "$STRIPE_PRICE_ID_MONTHLY_SANDBOX" ]; then
  SECRETS_CMD="$SECRETS_CMD STRIPE_PRICE_ID_MONTHLY_SANDBOX=\"$STRIPE_PRICE_ID_MONTHLY_SANDBOX\""
  echo -e "${GREEN}✓${NC} STRIPE_PRICE_ID_MONTHLY_SANDBOX"
else
  echo -e "${YELLOW}⚠${NC} STRIPE_PRICE_ID_MONTHLY_SANDBOX not set"
fi

if [ -n "$STRIPE_PRICE_ID_ANNUAL_SANDBOX" ]; then
  SECRETS_CMD="$SECRETS_CMD STRIPE_PRICE_ID_ANNUAL_SANDBOX=\"$STRIPE_PRICE_ID_ANNUAL_SANDBOX\""
  echo -e "${GREEN}✓${NC} STRIPE_PRICE_ID_ANNUAL_SANDBOX"
else
  echo -e "${YELLOW}⚠${NC} STRIPE_PRICE_ID_ANNUAL_SANDBOX not set"
fi

if [ -n "$STRIPE_WEBHOOK_SECRET_SANDBOX" ]; then
  SECRETS_CMD="$SECRETS_CMD STRIPE_WEBHOOK_SECRET_SANDBOX=\"$STRIPE_WEBHOOK_SECRET_SANDBOX\""
  echo -e "${GREEN}✓${NC} STRIPE_WEBHOOK_SECRET_SANDBOX"
else
  echo -e "${YELLOW}⚠${NC} STRIPE_WEBHOOK_SECRET_SANDBOX not set"
fi

# Add Production (Live Mode) secrets
if [ -n "$STRIPE_SECRET_KEY_PROD" ]; then
  SECRETS_CMD="$SECRETS_CMD STRIPE_SECRET_KEY_PROD=\"$STRIPE_SECRET_KEY_PROD\""
  echo -e "${GREEN}✓${NC} STRIPE_SECRET_KEY_PROD"
else
  echo -e "${YELLOW}⚠${NC} STRIPE_SECRET_KEY_PROD not set"
fi

if [ -n "$STRIPE_PRICE_ID_MONTHLY_PROD" ]; then
  SECRETS_CMD="$SECRETS_CMD STRIPE_PRICE_ID_MONTHLY_PROD=\"$STRIPE_PRICE_ID_MONTHLY_PROD\""
  echo -e "${GREEN}✓${NC} STRIPE_PRICE_ID_MONTHLY_PROD"
else
  echo -e "${YELLOW}⚠${NC} STRIPE_PRICE_ID_MONTHLY_PROD not set"
fi

if [ -n "$STRIPE_PRICE_ID_ANNUAL_PROD" ]; then
  SECRETS_CMD="$SECRETS_CMD STRIPE_PRICE_ID_ANNUAL_PROD=\"$STRIPE_PRICE_ID_ANNUAL_PROD\""
  echo -e "${GREEN}✓${NC} STRIPE_PRICE_ID_ANNUAL_PROD"
else
  echo -e "${YELLOW}⚠${NC} STRIPE_PRICE_ID_ANNUAL_PROD not set"
fi

if [ -n "$STRIPE_WEBHOOK_SECRET_PROD" ]; then
  SECRETS_CMD="$SECRETS_CMD STRIPE_WEBHOOK_SECRET_PROD=\"$STRIPE_WEBHOOK_SECRET_PROD\""
  echo -e "${GREEN}✓${NC} STRIPE_WEBHOOK_SECRET_PROD"
else
  echo -e "${YELLOW}⚠${NC} STRIPE_WEBHOOK_SECRET_PROD not set"
fi

echo ""
echo -e "${YELLOW}Ready to upload secrets to Supabase.${NC}"
read -p "Continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}Upload cancelled.${NC}"
  exit 0
fi

# Execute the command
echo -e "${BLUE}Uploading secrets...${NC}"
eval $SECRETS_CMD

echo ""
echo -e "${GREEN}✓ Secrets uploaded successfully!${NC}"
echo ""
echo -e "${BLUE}To view current secrets, run:${NC}"
echo -e "  npx supabase secrets list"
