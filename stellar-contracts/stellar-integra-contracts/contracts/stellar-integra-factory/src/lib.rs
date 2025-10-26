#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, String, Vec, Map};

const VERSION: &str = "1.0.0";
const CONTRACT_NAME: &str = "Stellar Integra Factory";

#[contract]
pub struct StellarIntegraFactory;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TradeData {
    pub trade_id: String,
    pub buyer_address: Address,
    pub seller_address: Address,
    pub escrow_address: Address,
    pub amount: u64,
    pub status: String,
    pub created_at: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct WalletInfo {
    pub address: Address,
    pub role: String, // "buyer", "seller", "escrow"
    pub lei: String,
    pub name: String,
    pub created_at: u64,
}

#[contractimpl]
impl StellarIntegraFactory {
    /// Initialize the factory contract
    pub fn initialize(env: &Env) {
        env.storage().instance().set(&symbol_short!("VERSION"), &VERSION);
        env.storage().instance().set(&symbol_short!("NAME"), &CONTRACT_NAME);
    }

    /// Get contract version
    pub fn version(env: &Env) -> String {
        env.storage()
            .instance()
            .get(&symbol_short!("VERSION"))
            .unwrap_or_else(|| String::from_str(env, "unknown"))
    }

    /// Get contract name
    pub fn name(env: &Env) -> String {
        env.storage()
            .instance()
            .get(&symbol_short!("NAME"))
            .unwrap_or_else(|| String::from_str(env, "unknown"))
    }

    /// Create a new trade
    pub fn create_trade(
        env: &Env,
        trade_id: String,
        buyer_address: Address,
        seller_address: Address,
        escrow_address: Address,
        amount: u64,
    ) -> TradeData {
        let trade = TradeData {
            trade_id: trade_id.clone(),
            buyer_address,
            seller_address,
            escrow_address,
            amount,
            status: String::from_str(env, "created"),
            created_at: env.ledger().timestamp(),
        };

        let mut trades: Map<String, TradeData> = env.storage()
            .persistent()
            .get(&symbol_short!("TRADES"))
            .unwrap_or_else(|| Map::new(env));
        
        trades.set(trade_id.clone(), trade.clone());
        env.storage().persistent().set(&symbol_short!("TRADES"), &trades);

        trade
    }

    /// Get trade by ID
    pub fn get_trade(env: &Env, trade_id: String) -> Option<TradeData> {
        let trades: Map<String, TradeData> = env.storage()
            .persistent()
            .get(&symbol_short!("TRADES"))
            .unwrap_or_else(|| Map::new(env));
        
        trades.get(trade_id)
    }

    /// Update trade status
    pub fn update_trade_status(env: &Env, trade_id: String, status: String) -> bool {
        let mut trades: Map<String, TradeData> = env.storage()
            .persistent()
            .get(&symbol_short!("TRADES"))
            .unwrap_or_else(|| Map::new(env));
        
        if let Some(mut trade) = trades.get(trade_id.clone()) {
            trade.status = status;
            trades.set(trade_id, trade);
            env.storage().persistent().set(&symbol_short!("TRADES"), &trades);
            true
        } else {
            false
        }
    }

    /// Register a wallet
    pub fn register_wallet(
        env: &Env,
        address: Address,
        role: String,
        lei: String,
        name: String,
    ) -> WalletInfo {
        let wallet = WalletInfo {
            address: address.clone(),
            role: role.clone(),
            lei,
            name,
            created_at: env.ledger().timestamp(),
        };

        let mut wallets: Map<Address, WalletInfo> = env.storage()
            .persistent()
            .get(&symbol_short!("WALLETS"))
            .unwrap_or_else(|| Map::new(env));
        
        wallets.set(address.clone(), wallet.clone());
        env.storage().persistent().set(&symbol_short!("WALLETS"), &wallets);

        wallet
    }

    /// Get wallet info
    pub fn get_wallet(env: &Env, address: Address) -> Option<WalletInfo> {
        let wallets: Map<Address, WalletInfo> = env.storage()
            .persistent()
            .get(&symbol_short!("WALLETS"))
            .unwrap_or_else(|| Map::new(env));
        
        wallets.get(address)
    }

    /// Get all trades (returns up to 100 trades)
    pub fn get_all_trades(env: &Env) -> Vec<TradeData> {
        let trades = Vec::new(env);
        // Note: In a real implementation, you'd want to store trade IDs in a list
        // For this example, we'll return an empty vector
        trades
    }

    /// Get contract statistics
    pub fn get_stats(_env: &Env) -> (u32, u32) {
        // Return (total_trades, total_wallets)
        // In a real implementation, you'd track these counters
        (0, 0)
    }
}

mod test;
