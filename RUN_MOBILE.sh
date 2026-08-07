#!/bin/bash

echo "📱 Starting College Management Mobile App..."

cd mobile

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from example..."
    cp .env.example .env
    echo "📝 Please edit mobile/.env with your API URL"
fi

echo "✅ Starting Expo..."
npx expo start
