import { Context, storage, u128, env, ContractPromise, ContractPromiseBatch, base58, logging } from "near-sdk-as"
import { HumanReadableAccount, RewardFeeFraction } from "./model"
import { AccountId, Base58PublicKey, PromiseResult } from "./types"
import { StakingContractState, getStateFromStorage, initializeState, saveState } from "./contract-internal"

const DEBUG=1

/**
 * This is the public interface for the staking contract
 * 
 * all functions are public and callable, except thos starting with '_'
 * 
 * Any code that is outside of a function is bundled into a start function. 
 * If you build with yarn `asb --wat` you'll see the generated wat file and you'll 
 * see this start function.  There is a special start section in a wasm binary
 * and this function is listed as the function that should be run when
 * the binary is instantiated, which is before any contract method is called.
 * 
 */

/**
 *  The amount of gas given to complete `vote` call.
 */
const VOTE_GAS: u128 = u128.from(100_000_000_000_000)

/// There is no deposit balance attached.
const NO_DEPOSIT: u128 = u128.from(0)

//--------------------
//   INITIALZATION
//--------------------
var contract: StakingContractState = getStateFromStorage()

/// Initializes the contract with the given owner_id, initial staking public key (with ED25519
/// curve) and initial reward fee fraction that owner charges for the validation work.
///
/// The entire current balance of this contract will be used to stake. This allows contract to
/// always maintain staking shares that can't be unstaked or withdrawn.
/// It prevents inflating the price of the share too much.
//@exportAs ("new")
export function init( owner_id: AccountId, stake_public_key: Base58PublicKey, reward_fee_fraction: RewardFeeFraction): void {
    assert(contract.owner_id == "", "Already initialized")
    //create and store this contract state
    initializeState(owner_id, stake_public_key, reward_fee_fraction)
    const ac = contract.getClientAccount("dummy")
    ac.unstaked=u128.from(10000)
    contract.saveClientAccount('dummy',ac)
    saveState()
    // Staking with the current pool to make sure the staking key is valid.
    contract.restake()
}

/// Distributes rewards and restakes if needed.
export function ping(): void {
    if (contract.internalPing()) {
        saveState()
        contract.restake()
    }
}


export function depo2(): void {
    if (DEBUG) logging.log("depo2") 
    saveState()
}

// client Context.predecessor is depositing Context.attachedDeposit in their internal account
@payable
export function deposit(): void {
    if (DEBUG) logging.log("let needToRestake = contract.internalPing() ") 
    let needToRestake = false; //contract.internalPing()
    if (DEBUG) logging.log("needToRestake = "+needToRestake.toString()) 
    if (DEBUG) logging.log("contract.clientDeposit()") 
    //const deposited=contract.clientDeposit()
    if (DEBUG) logging.log("after contract.clientDeposit()") 
    //contract.clientWithdraw(deposited)
    saveState()
    if (DEBUG) logging.log("after saveState()") 
    if (needToRestake) {
        if (DEBUG) logging.log("contract.restake()") 
        contract.restake()
    }
}

//
// client Context.predecessor is depositing Context.attachedDeposit in their internal account
// and wants to stake that amount afterwards
//
//@payable
export function deposit_and_stake(): void {
    contract.internalPing()
    let amount = contract.clientDeposit()
    contract.clientStake(amount)
    saveState()
    contract.restake()
}


/// Withdraws the entire unstaked balance from the predecessor account.
/// It's only allowed if the `unstake` action was not performed in the four most recent epochs.
export function withdraw_all(): void {
    let needToRestake = contract.internalPing()
    let clientId = Context.predecessor
    let account = contract.getClientAccount(clientId)
    contract.clientWithdraw(account.unstaked)
    saveState()
    if (needToRestake) contract.restake()
}

/// Withdraws the non staked balance for given account.
/// It's only allowed if the `unstake` action was not performed in the four most recent epochs.
export function withdraw(amount: u128): void {
    let needToRestake = contract.internalPing()
    contract.clientWithdraw(amount)
    saveState()
    if (needToRestake) contract.restake()
}


/// Stakes all available unstaked balance from the inner account of the predecessor.
export function stake_all(): void {
    // Stake action always restakes
    contract.internalPing()
    let clientId = Context.predecessor
    let account = contract.getClientAccount(clientId)
    contract.clientStake(account.unstaked)
    saveState()
    contract.restake()
}

/// Stakes the given amount from the inner account of the predecessor.
/// The inner account should have enough unstaked balance.

export function stake(amount: u128): void {
    // Stake action always restakes
    contract.internalPing()
    contract.clientStake(amount)
    saveState()
    contract.restake()
}

/// Unstakes all staked balance from the inner account of the predecessor.
/// The new total unstaked balance will be available for withdrawal in four epochs.
export function unstake_all(): void {
    // Unstake action always restakes
    contract.internalPing()
    let clientId = Context.predecessor
    let account = contract.getClientAccount(clientId)
    let amount = contract.staked_amount_from_num_shares_rounded_down(account.stake_shares)
    contract.clientUnstake(amount)
    saveState()
    contract.restake()
}

/// Unstakes the given amount from the inner account of the predecessor.
/// The inner account should have enough staked balance.
/// The new total unstaked balance will be available for withdrawal in four epochs.

export function unstake(amount: u128): void {
    // Unstake action always restakes
    contract.internalPing()
    contract.clientUnstake(amount)
    saveState()
    contract.restake()
}

//----------------
//- View methods -
//----------------

/// Returns the unstaked balance of the given account.

export function get_account_unstaked_balance(account_id: AccountId): u128 {
    return contract.getClientAccount(account_id).unstaked
}

/// Returns human readable representation of the account for the given account ID.


export function get_account(account_id: AccountId): HumanReadableAccount {
    return contract.getClientHRA(account_id)
}

/// Returns the staked balance of the given account.
/// NOTE: This is computed from the amount of "stake" shares the given account has and the
/// current amount of total staked balance and total stake shares on the account.

export function get_account_staked_balance(account_id: AccountId): u128 {
    return contract.getClientHRA(account_id).staked_balance
}

/// Returns the total balance of the given account (including staked and unstaked balances).

export function get_account_total_balance(account_id: AccountId): u128 {
    let accountHR = contract.getClientHRA(account_id)
    return accountHR.unstaked_balance + accountHR.staked_balance
}

/// Returns `true` if the given account can withdraw tokens in the current epoch.

export function is_account_unstaked_balance_available(account_id: AccountId): bool {
    return contract.getClientHRA(account_id).can_withdraw
}

/// Returns the total staking balance.

export function get_total_staked_balance(): u128 {
    return contract.total_staked_balance
}

///(internal-test) Returns total_stake_shares

export function _get_total_stake_shares(): u128 {
    return contract.total_stake_shares
}

/// Returns account ID of the staking pool owner.
export function get_owner_id(): AccountId {
    return contract.owner_id
}

/// Returns the current reward fee as a fraction.
export function get_reward_fee_fraction(): RewardFeeFraction {
    return contract.reward_fee_fraction
}

/// Returns the staking public key
export function get_staking_key(): Base58PublicKey {
    return base58.encode(contract.stake_public_key_u8Arr)
}

/// Returns true if the staking is paused
export function is_staking_paused(): bool {
    return contract.paused
}

/// Returns the number of accounts that have positive balance on this staking pool.
export function get_number_of_accounts(): u64 {
    return contract.persistentAccountsMap.length
}
/// Returns the list of accounts
export function get_accounts(from_index: i32, limit: i32): AccountId[] {
    //@ts-ignore
    return contract.persistentAccountsMap.keys(0, limit)
}


//------------------
//- Self-Callbacks -
//------------------

export function on_stake_action(): void {
    assert(Context.contractName == Context.predecessor, "Can be called only as a callback")
    assert(env.promise_results_count() == 1, "Contract expected a result on the callback")
    let stake_action_result = env.promise_result(0, 0)
    // If the stake action failed and the current locked amount is positive, 
    // then the contract has to unstake.
    if (stake_action_result != PromiseResult.Successful && Context.accountLockedBalance > u128.Zero) {
        contract.stake_zero()
    }
}

//-------------------
//- Owner's methods -
//-------------------


/// Updates current public key to the new given public key.
export function update_staking_key(stake_public_key: Base58PublicKey): void {
    contract.assertOwner()
    // When updating the staking key, the contract has to restake.
    let _need_to_restake = contract.internalPing()
    contract.stake_public_key_u8Arr = base58.decode(stake_public_key)
    saveState()
    contract.restake()
}

/// Owner's method.
/// Updates current reward fee fraction to the new given fraction.

export function update_reward_fee_fraction(reward_fee_fraction: RewardFeeFraction): void {
    contract.assertOwner()
    reward_fee_fraction.assertValid()
    let needToRestake = contract.internalPing()
    contract.reward_fee_fraction = reward_fee_fraction
    saveState()
    if (needToRestake) {
        contract.restake()
    }
}

/*
INCLUDING THIS FUNCTION BREAKS asb
/// Owner's method.
/// Calls `vote(is_vote)` on the given voting contract account ID on behalf of the pool.
export function vote(voting_account_id: AccountId, is_vote: bool): ContractPromiseBatch {
    contract.assertOwner()
    assert(env.isValidAccountID(voting_account_id), "Invalid voting account ID")
    return ContractPromiseBatch.create(voting_account_id)
        .function_call("vote", { is_vote: is_vote }, VOTE_GAS, NO_DEPOSIT)
}
*/

/// Owner's method.
/// Pauses pool staking.
export function pause_staking(): void {
    contract.assertOwner()
    assert(!contract.paused, "The staking is already paused")
    contract.internalPing()
    contract.paused = true
    saveState()
    contract.stake_zero()
}

/// Owner's method.
/// Resumes pool staking.
export function resume_staking(): void {
    contract.assertOwner()
    assert!(contract.paused, "The staking is not paused")
    contract.internalPing()
    contract.paused = false;
    saveState()
    contract.restake();
}
