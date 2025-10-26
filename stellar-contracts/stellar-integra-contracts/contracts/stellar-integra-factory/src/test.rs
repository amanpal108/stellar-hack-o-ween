#![cfg(test)]

use super::*;
use soroban_sdk::{symbol_short, testutils::Address as _, Address, Env, String};

#[test]
fn test_initialize() {
    let env = Env::default();
    let contract_id = env.register_contract(None, StellarIntegraFactory);
    let client = StellarIntegraFactoryClient::new(&env, &contract_id);

    client.initialize();

    assert_eq!(client.version(), String::from_str(&env, VERSION));
    assert_eq!(client.name(), String::from_str(&env, CONTRACT_NAME));
}

#[test]
fn test_create_trade() {
    let env = Env::default();
    let contract_id = env.register_contract(None, StellarIntegraFactory);
    let client = StellarIntegraFactoryClient::new(&env, &contract_id);

    client.initialize();

    let trade_id = String::from_str(&env, "TRADE_001");
    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);
    let escrow = Address::generate(&env);
    let amount = 1000u64;

    let trade = client.create_trade(&trade_id, &buyer, &seller, &escrow, &amount);

    assert_eq!(trade.trade_id, trade_id);
    assert_eq!(trade.buyer_address, buyer);
    assert_eq!(trade.seller_address, seller);
    assert_eq!(trade.escrow_address, escrow);
    assert_eq!(trade.amount, amount);
    assert_eq!(trade.status, String::from_str(&env, "created"));
}

#[test]
fn test_register_wallet() {
    let env = Env::default();
    let contract_id = env.register_contract(None, StellarIntegraFactory);
    let client = StellarIntegraFactoryClient::new(&env, &contract_id);

    client.initialize();

    let address = Address::generate(&env);
    let role = String::from_str(&env, "buyer");
    let lei = String::from_str(&env, "54930012QJWZMYHNJW95");
    let name = String::from_str(&env, "Tommy Hilfiger");

    let wallet = client.register_wallet(&address, &role, &lei, &name);

    assert_eq!(wallet.address, address);
    assert_eq!(wallet.role, role);
    assert_eq!(wallet.lei, lei);
    assert_eq!(wallet.name, name);
}

#[test]
fn test_update_trade_status() {
    let env = Env::default();
    let contract_id = env.register_contract(None, StellarIntegraFactory);
    let client = StellarIntegraFactoryClient::new(&env, &contract_id);

    client.initialize();

    let trade_id = String::from_str(&env, "TRADE_001");
    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);
    let escrow = Address::generate(&env);
    let amount = 1000u64;

    client.create_trade(&trade_id, &buyer, &seller, &escrow, &amount);

    let success = client.update_trade_status(&trade_id, &String::from_str(&env, "completed"));
    assert!(success);

    let trade = client.get_trade(&trade_id).unwrap();
    assert_eq!(trade.status, String::from_str(&env, "completed"));
}

