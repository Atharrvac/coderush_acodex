#!/bin/bash

echo "🚀 Starting College Management Backend..."

cd backend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from example..."
    cp .env.example .env
    echo "📝 Please edit backend/.env with your Supabase credentials"
    exit 1
fi

echo "✅ Starting server..."
npm run dev
