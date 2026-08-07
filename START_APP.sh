#!/bin/bash

# NagrikSeva - Complete App Startup Script
# This script starts both backend and mobile app

echo "🏛️  Starting NagrikSeva Application..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo -e "${GREEN}✓${NC} Node.js version: $(node --version)"
echo -e "${GREEN}✓${NC} npm version: $(npm --version)"
echo ""

# Check if dependencies are installed
echo "📦 Checking dependencies..."

if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}⚠${NC}  Backend dependencies not found. Installing..."
    cd backend && npm install && cd ..
fi

if [ ! -d "mobile/node_modules" ]; then
    echo -e "${YELLOW}⚠${NC}  Mobile dependencies not found. Installing..."
    cd mobile && npm install && cd ..
fi

echo -e "${GREEN}✓${NC} All dependencies installed"
echo ""

# Check environment files
echo "🔧 Checking environment configuration..."

if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠${NC}  Backend .env file not found. Creating from example..."
    cp backend/.env.example backend/.env
    echo "⚠️  Please edit backend/.env with your Supabase credentials"
fi

if [ ! -f "mobile/.env" ]; then
    echo -e "${YELLOW}⚠${NC}  Mobile .env file not found. Creating from example..."
    cp mobile/.env.example mobile/.env
    echo "⚠️  Please edit mobile/.env with your Supabase credentials"
fi

echo -e "${GREEN}✓${NC} Environment files configured"
echo ""

# Start backend server
echo -e "${BLUE}🚀 Starting Backend Server...${NC}"
echo "   Backend will run on http://localhost:3000"
echo ""

# Open new terminal for backend
osascript -e 'tell app "Terminal"
    do script "cd \"'"$(pwd)"'/backend\" && npm start"
end tell'

sleep 3

# Start mobile app
echo -e "${BLUE}📱 Starting Mobile App...${NC}"
echo "   Expo will open in a new terminal"
echo "   Scan the QR code with Expo Go app on your phone"
echo ""

# Open new terminal for mobile
osascript -e 'tell app "Terminal"
    do script "cd \"'"$(pwd)"'/mobile\" && npx expo start"
end tell'

echo ""
echo -e "${GREEN}✅ Application started successfully!${NC}"
echo ""
echo "📋 Next steps:"
echo "   1. Wait for backend to start (check terminal)"
echo "   2. Wait for Expo to start (check terminal)"
echo "   3. Scan QR code with Expo Go app"
echo "   4. Start using NagrikSeva!"
echo ""
echo "🛑 To stop: Close both terminal windows or press Ctrl+C in each"
echo ""
