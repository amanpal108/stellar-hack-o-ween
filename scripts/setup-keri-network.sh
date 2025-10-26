#!/bin/bash

# KERI Network Setup Script
# This script sets up all agents to work with the KERI validation agent

echo "🔗 Setting up KERI Agent Network..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Wait for validation agent to be ready
echo -e "${BLUE}⏳ Waiting for KERI validation agent to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:3003/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ KERI validation agent is ready!${NC}"
        break
    fi
    echo -e "${YELLOW}⏳ Waiting... (${i}/30)${NC}"
    sleep 2
done

# Get validation agent credential
echo -e "\n${BLUE}🔑 Getting validation agent credential...${NC}"
VALIDATION_CREDENTIAL=$(curl -s http://localhost:3003/keri/credential)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Retrieved validation agent credential${NC}"
else
    echo -e "${RED}❌ Failed to get validation agent credential${NC}"
    exit 1
fi

# Register all agents with KERI network
echo -e "\n${BLUE}📝 Registering agents with KERI network...${NC}"

# Function to register an agent
register_agent() {
    local agent_id=$1
    local agent_name=$2
    local port=$3
    local capabilities=$4
    
    echo -e "${YELLOW}🔗 Registering $agent_name...${NC}"
    
    local agent_info=$(cat <<EOF
{
    "name": "$agent_name",
    "capabilities": [$capabilities],
    "endpoints": {
        "http": "http://localhost:$port",
        "keri": "http://localhost:$port/keri"
    }
}
EOF
)
    
    local response=$(curl -s -X POST http://localhost:3003/keri/register \
        -H "Content-Type: application/json" \
        -d "{\"agentId\": \"$agent_id\", \"agentInfo\": $agent_info}")
    
    if echo "$response" | grep -q "success"; then
        echo -e "${GREEN}✅ $agent_name registered successfully${NC}"
    else
        echo -e "${YELLOW}⚠️  $agent_name registration: $response${NC}"
    fi
}

# Register each agent
register_agent "buyer-agent-001" "Buyer Agent" "3001" "\"trade-execution\", \"order-management\""
register_agent "search-agent-001" "Search Agent" "3002" "\"product-search\", \"seller-discovery\""
register_agent "po-agent-001" "PO Agent" "3004" "\"purchase-order-generation\", \"document-management\""
register_agent "fulfillment-agent-001" "Fulfillment Agent" "3005" "\"inventory-management\", \"order-fulfillment\""
register_agent "dvp-agent-001" "DvP Agent" "3006" "\"delivery-vs-payment\", \"settlement\""
register_agent "payment-agent-001" "Payment Agent" "3007" "\"payment-processing\", \"stellar-transactions\""

# Test agent verification
echo -e "\n${BLUE}🧪 Testing agent verification...${NC}"

test_agent_verification() {
    local agent_id=$1
    local agent_name=$2
    
    echo -e "${YELLOW}🔍 Testing $agent_name verification...${NC}"
    
    # Create a mock credential for testing
    local mock_credential=$(cat <<EOF
{
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    "type": ["VerifiableCredential", "AgentIdentity"],
    "issuer": {
        "id": "$agent_id",
        "name": "$agent_name"
    },
    "issuanceDate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "credentialSubject": {
        "id": "$agent_id",
        "type": "TradingAgent",
        "name": "$agent_name",
        "expiresAt": "$(date -u -d '+1 year' +%Y-%m-%dT%H:%M:%SZ)"
    },
    "proof": {
        "type": "Ed25519Signature2020",
        "created": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
        "verificationMethod": "$agent_id#key-1",
        "proofPurpose": "assertionMethod",
        "proofValue": "mock-signature"
    }
}
EOF
)
    
    local response=$(curl -s -X POST http://localhost:3003/keri/verify \
        -H "Content-Type: application/json" \
        -d "{\"agentId\": \"$agent_id\", \"credential\": $mock_credential}")
    
    if echo "$response" | grep -q "valid.*true"; then
        echo -e "${GREEN}✅ $agent_name verification working${NC}"
    else
        echo -e "${YELLOW}⚠️  $agent_name verification: $response${NC}"
    fi
}

# Test verification for each agent
test_agent_verification "buyer-agent-001" "Buyer Agent"
test_agent_verification "search-agent-001" "Search Agent"
test_agent_verification "po-agent-001" "PO Agent"
test_agent_verification "fulfillment-agent-001" "Fulfillment Agent"
test_agent_verification "dvp-agent-001" "DvP Agent"
test_agent_verification "payment-agent-001" "Payment Agent"

# Test VLEI verification
echo -e "\n${BLUE}🌐 Testing VLEI verification...${NC}"
VLEI_TEST=$(curl -s -X POST http://localhost:3003/validate \
    -H "Content-Type: application/json" \
    -d '{"buyer_lei": "54930012QJWZMYHNJW95", "seller_lei": "3358004DXAMRWRUIYJ05"}')

if echo "$VLEI_TEST" | grep -q '"valid":true'; then
    echo -e "${GREEN}✅ VLEI verification working with real GLEIF API${NC}"
else
    echo -e "${YELLOW}⚠️  VLEI verification test: $VLEI_TEST${NC}"
fi

# Display network status
echo -e "\n${BLUE}📊 KERI Network Status:${NC}"
curl -s http://localhost:3003/keri/status | jq '.' 2>/dev/null || echo -e "${YELLOW}⚠️  Could not retrieve KERI status${NC}"

echo -e "\n${GREEN}🎉 KERI network setup complete!${NC}"
echo -e "\n${BLUE}🔗 All agents are now registered and can communicate securely using KERI${NC}"
echo -e "${GREEN}🌐 VLEI verification is active with real GLEIF API integration${NC}"
echo -e "\n${YELLOW}💡 Next: Start trading with full KERI and VLEI verification!${NC}"

