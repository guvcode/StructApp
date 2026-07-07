#!/bin/bash
# CI-style guardrail to verify AGENTS.md workflow compliance

echo "Checking workflow compliance..."

# 1. Check if task branch matches current tracker
echo "1. Verifying task tracker status..."
grep -q "IN PROG" .doc/10-progress-tracker.md && echo "   ⚠️  Task still in progress - ensure completion before merge" || echo "   ✓ No in-progress tasks"

# 2. Check if memory.md was saved today
echo "2. Checking memory.md timestamp..."
if grep -q "$(date +%Y-%m-%d)" memory.md; then
    echo "   ✓ memory.md saved today"
else
    echo "   ⚠️  memory.md may need updating"
fi

# 3. Check for unchecked items in task completion
echo "3. Checking for unchecked task items..."
if grep -q "\- \[ \]" memory.md; then
    echo "   ⚠️  Unchecked items found in memory"
else
    echo "   ✓ No unchecked items"
fi

echo "Done. Review warnings before proceeding."