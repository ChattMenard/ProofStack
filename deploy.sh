#!/usr/bin/env bash

# ProofStack Deployment Script
echo "🚀 Deploying ProofStack to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "❌ Not logged in to Vercel. Please run 'vercel login' first."
    exit 1
fi

# Deploy to Vercel
echo "📦 Building and deploying..."
vercel --prod

echo "✅ Deployment complete!"
echo "🌐 Your app should be live at the URL shown above."