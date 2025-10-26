#!/bin/bash

# Kill all Stellar Integra services
echo "🧹 Stopping all Stellar Integra services..."

# Kill services on ports 3000-3007
for port in 3000 3001 3002 3003 3004 3005 3006 3007; do
    pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo "🛑 Killing process on port $port (PID: $pid)"
        kill -9 $pid 2>/dev/null
    else
        echo "✅ Port $port is free"
    fi
done

# Kill any remaining Node.js processes related to our services
pkill -f "services/.*-agent" 2>/dev/null || true
pkill -f "stellar-integra" 2>/dev/null || true

echo "✅ All services stopped"
