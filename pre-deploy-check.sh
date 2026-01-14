#!/bin/bash

echo "🔒 Pre-deployment Security Check"
echo "=================================="
echo ""

# Check if .env files are in .gitignore
if ! grep -q "^\.env" .gitignore; then
    echo "❌ WARNING: .env files are not in .gitignore!"
    echo "   Add these lines to .gitignore:"
    echo "   .env"
    echo "   .env.local"
    echo "   .env.production"
    exit 1
fi

# Check if any .env files are tracked by git
ENV_FILES=$(git ls-files | grep -E "^\.env" || true)
if [ ! -z "$ENV_FILES" ]; then
    echo "❌ ERROR: Found .env files in git:"
    echo "$ENV_FILES"
    echo ""
    echo "   Remove them with:"
    echo "   git rm --cached $ENV_FILES"
    exit 1
fi

# Check for hardcoded API keys in source files
HARDCODED=$(git grep -n -I -E "AIza[0-9A-Za-z_-]{35}" -- "*.ts" "*.tsx" "*.js" "*.jsx" 2>/dev/null || true)
if [ ! -z "$HARDCODED" ]; then
    echo "⚠️  WARNING: Possible hardcoded API keys found:"
    echo "$HARDCODED"
    echo ""
fi

# Check if code uses import.meta.env instead of process.env
WRONG_ENV=$(git grep -n "process\.env\." -- "*.ts" "*.tsx" 2>/dev/null || true)
if [ ! -z "$WRONG_ENV" ]; then
    echo "⚠️  WARNING: Found process.env usage (should use import.meta.env in Vite):"
    echo "$WRONG_ENV"
    echo ""
fi

echo "✅ Security checks completed!"
echo ""
echo "📋 Before deploying to Netlify:"
echo "   1. Go to Netlify Dashboard > Site settings > Environment variables"
echo "   2. Add: VITE_API_KEY = <your-api-key>"
echo "   3. Never commit .env.local to git"
echo "   4. If you exposed a key, rotate it at https://aistudio.google.com/apikey"
echo ""
