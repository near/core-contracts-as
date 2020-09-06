import { Context, logging, PersistentUnorderedMap, storage, u128, base58 } from "near-sdk-as"
//import { promiseConnectCallBack } from "./extra-sdk"
import { ClientAccountState, NumStakeShares, RewardFeeFraction } from "./model"

type AccountId = string;
type Balance = u128;
type EpochHeight = u64;

//export declare function assert(cond: boolean, msg: string): void

/// The amount of yocto NEAR the contract dedicates to guarantee that the "share" price never
/// decreases. It's used during rounding errors for share -> amount conversions.
const STAKE_SHARE_PRICE_GUARANTEE_FUND: u128 = u128.from(1_000_000_000_000)

//@ts-ignore
/// The amount of gas given to complete internal `on_stake_action` call.
const ON_STAKE_ACTION_GAS: u64 = 20_000_000_000_000

/// The number of epochs required for the locked balance to become unlocked.
/// NOTE: The actual number of epochs when the funds are unlocked is 3. But there is a corner case
/// when the unstaking promise can arrive at the next epoch, while the inner state is already
/// updated in the previous epoch. It will not unlock the funds for 4 epochs.
const NUM_EPOCHS_TO_UNLOCK: EpochHeight = 4;

// impl StakingContract
/******************************/
/* State and Internal methods */
/******************************/

/**
 * cache last account retrieved from storage
 */
//@ts-ignore
@global
var cache_ClientId: string// = "";
//@ts-ignore
@global
var cache_AccountInfo: ClientAccountState// = new ClientAccountState();
//@ts-ignore
@global
var createdState: StakingContractState// = new StakingContractState();

export function internalCreatedStatePtr(): StakingContractState {
    return createdState
}

export function getStateFromStorage(): StakingContractState {
    // try to read from storage
    if (storage.hasKey("STATE")) {
        createdState = storage.get<StakingContractState>("STATE") as StakingContractState
        assert(createdState != null, "fatal: state is null")
    } else {
        createdState = new StakingContractState()
    }
    return createdState
}

/**
 * global variable. Set it only if you're sure the contract state 
 * was not modified, in order to skip the state storage operation
 */
var cleanState: boolean = false
/**
 * persist state when changes are made
 */
export function saveState(): void {
    if (!cleanState) {
        storage.set<StakingContractState>("STATE", createdState)
    }
}


export function initializeState(owner_id: AccountId,
    stake_public_key: string,
    reward_fee_fraction: RewardFeeFraction): void {

    //assert(env.isValidAccountID(owner_id), "The owner account ID is invalid")
    reward_fee_fraction.assertValid()

    //assert(Context.accountLockedBalance == u128.Zero, "The staking pool shouldn't be staking at the initialization")
    //@ts-ignore
    let total_staked_balance: Balance = account_balance - STAKE_SHARE_PRICE_GUARANTEE_FUND

    if (!createdState) createdState = new StakingContractState()
    
    createdState.owner_id = owner_id
    createdState.stake_public_key_u8Arr = base58.decode(stake_public_key)
    createdState.reward_fee_fraction = reward_fee_fraction
    createdState.last_epoch_height = Context.epochHeight
    createdState.last_total_balance = account_balance
    createdState.total_staked_balance = total_staked_balance
    createdState.total_stake_shares = total_staked_balance
    createdState.reward_fee_fraction = reward_fee_fraction
    createdState.paused = false
}

/** 
 * contract state, created when the contract is created
 * this state is retrieved from storage at initialization
 * before any function call
 * 
 */
@nearBindgen
export class StakingContractState {
    /// The account ID of the owner who's running the staking validator node.
    /// NOTE: This is different from the current account ID which is used as a validator account.
    /// The owner of the staking pool can change staking public key and adjust reward fees.
    owner_id: AccountId = ""

    /// The public key which is used for staking action. It's the public key of the validator node
    /// that validates on behalf of the pool.
    stake_public_key_u8Arr: Uint8Array = new Uint8Array(32)

    /// The last epoch height when `ping` was called.
    last_epoch_height: EpochHeight = 0

    /// The last total balance of the account (consists of staked and unstaked balances).
    last_total_balance: Balance = u128.Zero

    /// The total amount of shares. It should be equal to the total amount of shares across all
    /// accounts.
    total_stake_shares: NumStakeShares = u128.Zero

    /// The total staked balance.
    total_staked_balance: Balance = u128.Zero

    /// The fraction of the reward that goes to the owner of the staking pool for running the
    /// validator node.
    reward_fee_fraction: RewardFeeFraction = new RewardFeeFraction(10, 100)

    /// Persistent unordered map from an account ID to account data
    persistentAccountsMap: PersistentUnorderedMap<AccountId, ClientAccountState> = new PersistentUnorderedMap<AccountId, ClientAccountState>("a")

    /// Whether the staking is paused.
    /// When paused, the account unstakes everything (stakes 0) and doesn't restake.
    /// It doesn't affect the staking shares or reward distribution.
    /// Pausing is useful for node maintenance. Only the owner can pause and resume staking.
    /// The contract is not paused by default.
    paused: boolean = false

    //------------------
    // Internal Methods 
    //------------------
    /** 
     * Restakes the current `total_staked_balance` into the protocol
     *  */
    restake(): void {

        if (this.paused) {
            return
        }

        // Stakes with the staking public key. If the public key is invalid the entire function
        // call will be rolled back.

        //const thenNewPromise =
           // ContractPromiseBatch.create(Context.contractName)
           //     .stake(this.total_staked_balance, this.stake_public_key_u8Arr)
           //     .then(Context.contractName)

        //promiseConnectCallBack<EmptyArgs>(thenNewPromise.id, Context.contractName,
        //    "on_stake_action", new EmptyArgs(), ON_STAKE_ACTION_GAS)
    }

    /**
     * execute stake(0) on this contract/account
     * via call to contract_account.stake(0)
     * Stop staking on the validator's public key
     */
    stake_zero(): void {
        //ContractPromiseBatch.create(Context.contractName)
        //    .stake(u128.from(0), this.stake_public_key_u8Arr)
    }

}
