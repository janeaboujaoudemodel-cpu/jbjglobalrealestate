#!/bin/bash
# CI Guard: Check for prohibited terminology in the codebase
# This script fails if any of the old terms exist

echo "Checking for prohibited terminology..."

# Define patterns to search for (case-insensitive)
PATTERNS=(
  "end-user"
  "end user"
  "End User"
  "End-User"
  "end-users"
  "end users"
  "End Users"
  "End-Users"
)

# Directories to search
SEARCH_DIRS="src supabase public"

# Files to exclude (migrations are read-only)
EXCLUDE_DIRS="node_modules dist .git supabase/migrations"

FOUND=0

for pattern in "${PATTERNS[@]}"; do
  # Build exclude arguments
  EXCLUDE_ARGS=""
  for dir in $EXCLUDE_DIRS; do
    EXCLUDE_ARGS="$EXCLUDE_ARGS --exclude-dir=$dir"
  done
  
  # Search for the pattern
  MATCHES=$(grep -ri "$pattern" $SEARCH_DIRS $EXCLUDE_ARGS 2>/dev/null)
  
  if [ -n "$MATCHES" ]; then
    echo "❌ Found prohibited term '$pattern':"
    echo "$MATCHES"
    FOUND=1
  fi
done

if [ $FOUND -eq 1 ]; then
  echo ""
  echo "❌ FAILED: Prohibited terminology found in codebase."
  echo "Replace 'end-user' and variants with 'homeowner', 'buyer', 'seller', 'broker', or 'investor'."
  exit 1
else
  echo "✅ PASSED: No prohibited terminology found."
  exit 0
fi
