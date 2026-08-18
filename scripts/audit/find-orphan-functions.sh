#!/bin/bash
# Cross-reference every edge function against every place a caller could name it.
cd /home/user/jbjglobalrealestate
FUNCS=$(ls supabase/functions | grep -v '^_shared$')

# Build one haystack of everything that could reference a function name,
# EXCLUDING each function's own directory (so a function doesn't cite itself).
> /tmp/hay.txt
grep -rhoE "[a-z0-9][a-z0-9-]{2,}" \
  --include=*.ts --include=*.tsx --include=*.sql --include=*.toml \
  --include=*.json --include=*.yml --include=*.md \
  src/ supabase/migrations/ supabase/config.toml 2>/dev/null >> /tmp/hay.txt
# function-to-function references (a function invoking another by name)
grep -rhoE "[a-z0-9][a-z0-9-]{2,}" supabase/functions/ --include=*.ts 2>/dev/null >> /tmp/hay.txt
sort -u /tmp/hay.txt -o /tmp/hay-sorted.txt

referenced=0; orphan=0
> /tmp/orphans.txt
for f in $FUNCS; do
  # count references that are NOT inside the function's own directory
  n=$(grep -rl --include=*.ts --include=*.tsx --include=*.sql --include=*.toml \
        --include=*.json --include=*.yml -F "$f" \
        src/ supabase/migrations/ supabase/functions/ supabase/config.toml 2>/dev/null \
      | grep -v "^supabase/functions/$f/" | wc -l)
  if [ "$n" -eq 0 ]; then echo "$f" >> /tmp/orphans.txt; orphan=$((orphan+1));
  else referenced=$((referenced+1)); fi
done
echo "total=$(echo "$FUNCS" | wc -l) referenced=$referenced orphan=$orphan"
