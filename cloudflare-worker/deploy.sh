#!/bin/bash

# Deployment script for Cloudflare Worker Blog using Wrangler
# Usage: ./deploy.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BLOG_DIR="$SCRIPT_DIR/.."

echo "🚀 Deploying Cloudflare Worker to Wrangler..."

# Build the blog first
echo "📦 Building blog..."
cd "$BLOG_DIR"
npm run build

# Copy the built site files to the Worker directory
echo "📋 Copying site files to Worker directory..."
cd "$SCRIPT_DIR"
cp -r "$BLOG_DIR/_site"/* .

# Deploy the worker with assets
echo "🔧 Deploying worker with Wrangler..."

# Check if wrangler is installed
if [ ! -f ./node_modules/.bin/wrangler ]; then
  npm install
fi

npx wrangler deploy --name blog-worker

echo "✅ Deployment complete!"
echo "📖 Your blog is now available at the deployed Worker URL"
echo "📖 See README.md for subdomain setup instructions"
