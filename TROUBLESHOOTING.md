# 🔧 Troubleshooting Guide

## Common Issues and Solutions

### Issue: Payment Agent Returns 500 Error

**Symptoms:**
- UI shows error during payment release step
- Console shows "Payment transaction failed"
- Status: 500 error from payment agent

**Possible Causes & Solutions:**

#### 1. Services Not Restarted After Code Changes

If you made changes to the payment agent code, you need to restart the services:

```bash
# Stop all services (Ctrl+C in the terminal running services)

# Restart all services
npm run services
```

#### 2. Accounts Not Funded

Check if all testnet accounts have XLM:

```bash
node scripts/verify_accounts.js
```

If accounts are not funded, run:

```bash
node scripts/fund_escrow.js
```

#### 3. Network Issues

Stellar testnet might be temporarily unavailable. Check:
- https://status.stellar.org/
- Wait a few minutes and try again

#### 4. Invalid Account Keys

The seller account in the mock data might not match the real funded account:

**Check:** `mocks/agent_registry.json`

The seller's `stellar_account` should be:
```
GBPFMDZ5VNL56YNMXOQ35RUFRS3S6LZN66SB2OYOQXHK3X46UGTBJBBP
```

If it's different, update it:

```bash
# Edit mocks/agent_registry.json and change the stellar_account field
# Then restart services
```

#### 5. Check Payment Agent Logs

Look at the terminal running `npm run services` for detailed error logs:

```
💸 [PAYMENT-AGENT] Executing Stellar payment: ...
🔐 [PAYMENT-AGENT] Creating keypair from secret...
📡 [PAYMENT-AGENT] Loading source account: ...
💰 [PAYMENT-AGENT] Source balance: ... XLM
📡 [PAYMENT-AGENT] Verifying destination account: ...
```

If you see an error about "Destination account not found", the seller account needs to be funded.

---

### Issue: No Transactions Appearing on Stellar Explorer

**Symptoms:**
- UI completes successfully
- No transaction links or links return 404

**Solution:**

You're in simulation mode. Make sure:

1. Real keypairs are being used in `client/src/App.js`:
   ```javascript
   const DEMO_ACCOUNTS = {
     buyer: { public: "GBVEGE...", secret: "SBWYF5..." },
     seller: { public: "GBPFMD...", secret: "SA3RAY..." },
     escrow: { public: "GB27XH...", secret: "SC54WR..." }
   };
   ```

2. These match the accounts in `scripts/test_accounts.json`

3. Restart the React app:
   ```bash
   cd client
   npm start
   ```

---

### Issue: "Destination account not found" Error

**Symptoms:**
```
❌ [PAYMENT-AGENT] Destination account not found: GBPFMD...
Account may not be funded on testnet.
```

**Solution:**

The seller account needs to be funded. Run:

```bash
node scripts/fund_escrow.js
```

Or manually fund via Friendbot:
```
https://friendbot.stellar.org?addr=GBPFMDZ5VNL56YNMXOQ35RUFRS3S6LZN66SB2OYOQXHK3X46UGTBJBBP
```

---

### Issue: Services Won't Start

**Symptoms:**
```
Error: Cannot find module 'stellar-sdk'
```

**Solution:**

Install dependencies:

```bash
# Root dependencies
npm install

# Install for all services
npm install --prefix services/buyer-agent
npm install --prefix services/search-agent
npm install --prefix services/validation-agent
npm install --prefix services/po-agent
npm install --prefix services/fulfillment-agent
npm install --prefix services/dvp-agent
npm install --prefix services/payment-agent

# Client dependencies
cd client && npm install
```

Or use the workspace install:

```bash
npm install
```

---

### Issue: Port Already in Use

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution:**

Kill processes using those ports:

```bash
# macOS/Linux
lsof -ti:3001,3002,3003,3004,3005,3006,3007 | xargs kill -9

# Or manually find and kill
lsof -i:3001
kill -9 <PID>
```

Then restart services:

```bash
npm run services
```

---

### Issue: React App Won't Start

**Symptoms:**
```
Error: Create React App requires Node 14 or higher
```

**Solution:**

Update Node.js:

```bash
# Check version
node --version

# If < 14, update via nvm or installer
nvm install 18
nvm use 18
```

---

### Issue: CORS Errors in Browser

**Symptoms:**
```
Access to fetch at 'http://localhost:3001/start' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solution:**

Make sure all services are running with CORS enabled. Check that each service has:

```javascript
const cors = require('cors');
app.use(cors());
```

Restart services if needed:

```bash
npm run services
```

---

## Quick Diagnosis Script

Run this to check everything:

```bash
# 1. Verify accounts
node scripts/verify_accounts.js

# 2. Test services manually
curl http://localhost:3001/health  # buyer-agent
curl http://localhost:3002/health  # search-agent
# ... etc

# 3. Check React is running
curl http://localhost:3000
```

---

## Complete Reset

If all else fails, do a complete reset:

```bash
# 1. Kill all processes
killall node

# 2. Clean install
rm -rf node_modules
rm -rf client/node_modules
rm -rf services/*/node_modules
npm install

# 3. Recreate and fund accounts
node scripts/create_test_accounts.js
node scripts/fund_escrow.js

# 4. Verify
node scripts/verify_accounts.js

# 5. Start fresh
npm run services  # Terminal 1
cd client && npm start  # Terminal 2
```

---

## Still Having Issues?

### Check the Logs

1. **Service Logs**: Look at the terminal running `npm run services`
2. **Browser Console**: Open DevTools (F12) and check Console tab
3. **Network Tab**: Check the Network tab in DevTools for failed requests

### Verify Step by Step

Test each agent individually:

```bash
# Buyer Agent
curl -X POST http://localhost:3001/start -H "Content-Type: application/json" -d '{
  "buyer_name": "Test",
  "buyer_lei": "5493001KJTIIGC8Y1R12",
  "buyer_account": "GBVEGE...",
  "prompt_text": "Test"
}'

# Payment Agent (check escrow)
curl -X POST http://localhost:3007/check-escrow -H "Content-Type: application/json" -d '{
  "escrow_public_key": "GB27XHTEUUQRJZQP5TIVMP6SOW7VSVYCNZD5OYD3NO2U2UL6VV3CW245"
}'
```

---

## Getting Help

If you're still stuck:

1. Check the `REAL_PAYMENTS_GUIDE.md` for detailed setup instructions
2. Review the `README.md` for architecture overview
3. Check Stellar status: https://status.stellar.org/
4. Review Stellar SDK docs: https://stellar.github.io/js-stellar-sdk/

---

## Common Pitfalls

- ❌ Forgetting to restart services after code changes
- ❌ Using unfunded testnet accounts
- ❌ Mismatched public/secret keys
- ❌ Wrong seller account in mock data
- ❌ Not waiting for previous demo to complete before starting new one
- ❌ Network timeouts (testnet can be slow)

---

## Success Checklist

Before running a demo, verify:

- ✅ All accounts are funded (run `verify_accounts.js`)
- ✅ All 7 services are running (ports 3001-3007)
- ✅ React app is running (port 3000)
- ✅ No CORS errors in browser console
- ✅ Seller account in `mocks/agent_registry.json` matches funded account
- ✅ DEMO_ACCOUNTS in `client/src/App.js` has real keypairs

When all checks pass, you're ready to run the demo! 🚀

