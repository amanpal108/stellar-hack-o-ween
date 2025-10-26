#!/bin/bash

# KERI Validation Agent Setup Script
# This script sets up the KERI-based validation agent with real VLEI verification

echo "🚀 Setting up KERI Validation Agent..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the validation-agent directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Initialize KERI agent
echo "🔧 Initializing KERI agent..."
npm run keri:init

if [ $? -ne 0 ]; then
    echo "❌ Failed to initialize KERI agent"
    exit 1
fi

# Check KERI status
echo "🔍 Checking KERI agent status..."
npm run keri:status

if [ $? -ne 0 ]; then
    echo "❌ KERI agent status check failed"
    exit 1
fi

echo ""
echo "✅ KERI Validation Agent setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Start the agent: npm start"
echo "2. Test VLEI verification: curl http://localhost:3003/vlei/check/54930012QJWZMYHNJW95"
echo "3. Check agent status: curl http://localhost:3003/health"
echo "4. View KERI credential: curl http://localhost:3003/keri/credential"
echo ""
echo "📚 For more information, see README.md"
