#!/bin/bash

# Sync Dev Edge Functions to Production
# This script copies dev edge function code to production versions,
# replacing environment variable names appropriately.

set -e  # Exit on error

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Syncing Dev Edge Functions to Production                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Define function pairs (dev -> prod)
declare -a FUNCTION_PAIRS=(
  "create-checkout-session-dev:create-checkout-session"
  "create-customer-portal-dev:create-customer-portal"
  "create_stripe_trial-dev:create_stripe_trial"
  "stripe-webhook-dev:stripe-webhook"
  "assign_license_to_machine-dev:assign_license_to_machine"
  "revoke_license_from_machine-dev:revoke_license_from_machine"
  "validate_license-dev:validate_license"
)

# Function to replace environment variable names
replace_env_vars() {
  local content="$1"

  # Replace all DEV environment variables with PROD versions
  content="${content//STRIPE_SECRET_KEY_DEV/STRIPE_SECRET_KEY_PROD}"
  content="${content//STRIPE_PRICE_ID_DEV/STRIPE_PRICE_ID_PROD}"
  content="${content//STRIPE_WEBHOOK_SECRET_DEV/STRIPE_WEBHOOK_SECRET_PROD}"

  echo "$content"
}

# Counter for success/failure
SUCCESS_COUNT=0
SKIP_COUNT=0
TOTAL_COUNT=${#FUNCTION_PAIRS[@]}

# Process each function pair
for pair in "${FUNCTION_PAIRS[@]}"; do
  IFS=':' read -r dev_func prod_func <<< "$pair"

  DEV_PATH="supabase/functions/${dev_func}"
  PROD_PATH="supabase/functions/${prod_func}"

  echo -e "${YELLOW}Processing:${NC} $dev_func → $prod_func"

  # Check if dev function exists
  if [ ! -d "$DEV_PATH" ]; then
    echo -e "${RED}  ✗ Dev function not found: $DEV_PATH${NC}"
    SKIP_COUNT=$((SKIP_COUNT + 1))
    continue
  fi

  # Create prod directory if it doesn't exist
  mkdir -p "$PROD_PATH"

  # Copy and transform all TypeScript/JavaScript files
  shopt -s nullglob
  for file in "$DEV_PATH"/*.ts "$DEV_PATH"/*.js; do
    if [ -f "$file" ]; then
      filename=$(basename "$file")

      # Read file content
      content=$(cat "$file")

      # Replace environment variables
      transformed_content=$(replace_env_vars "$content")

      # Write to prod function
      echo "$transformed_content" > "$PROD_PATH/$filename"

      echo -e "${GREEN}  ✓ Synced: $filename${NC}"
    fi
  done

  # Copy deno.json if it exists
  if [ -f "$DEV_PATH/deno.json" ]; then
    cp "$DEV_PATH/deno.json" "$PROD_PATH/deno.json"
    echo -e "${GREEN}  ✓ Synced: deno.json${NC}"
  fi

  SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
  echo ""
done

# Summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Summary                                                   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo -e "${GREEN}Synced:${NC} $SUCCESS_COUNT/$TOTAL_COUNT functions"
if [ $SKIP_COUNT -gt 0 ]; then
  echo -e "${YELLOW}Skipped:${NC} $SKIP_COUNT functions (not found)"
fi
echo ""

# Prompt for deployment
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Review the changes with: git diff"
echo "2. Deploy to production with:"
echo -e "   ${BLUE}npx supabase functions deploy${NC}"
echo ""
echo -e "${GREEN}✓ Sync complete!${NC}"
