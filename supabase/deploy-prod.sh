#!/bin/bash

# Deploy Production Edge Functions
# This script syncs dev to prod and then deploys all production functions

set -e  # Exit on error

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Deploy Production Edge Functions                         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Sync dev to prod
echo -e "${YELLOW}Step 1: Syncing dev functions to production...${NC}"
./supabase/sync-dev-to-prod.sh
echo ""

# Step 2: Show diff
echo -e "${YELLOW}Step 2: Changes to be deployed:${NC}"
git diff --stat supabase/functions/
echo ""

# Step 3: Confirm deployment
echo -e "${YELLOW}Step 3: Ready to deploy${NC}"
read -p "Deploy these changes to production? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}Deployment cancelled.${NC}"
  exit 0
fi

# Step 4: Deploy
echo -e "${BLUE}Deploying to production...${NC}"
npx supabase functions deploy

echo ""
echo -e "${GREEN}✓ Production deployment complete!${NC}"
