#!/bin/bash
# Shark Agent v4.8.3 — Context Reinject Script
# Usage: Run this script to restore build context after compaction

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTEXT_FILE="$SCRIPT_DIR/.shark/auto-inject/BUILD_CONTEXT.md"
KRAKEN_FILE="$SCRIPT_DIR/.shark/auto-inject/KRAKEN_REINJECT.md"

echo "=== SHARK AGENT CONTEXT REINJECT ==="
echo ""
echo "Copy the following into your system prompt:"
echo ""
echo "========================================"
echo "START COPY BELOW THIS LINE"
echo "========================================"
echo ""
cat "$CONTEXT_FILE"
echo ""
echo "========================================"
echo "END COPY ABOVE THIS LINE"
echo "========================================"
echo ""
echo "Or for KRAKEN mode (shorter version):"
echo ""
cat "$KRAKEN_FILE"
