import { Context, logging, PersistentUnorderedMap, storage, u128, base58 } from "near-sdk-as"
import { promiseConnectCallBack } from "./extra-sdk"
import { ClientAccountState, NumStakeShares, RewardFeeFraction } from "./model"

type AccountId = string;
type Balance = u128;
type EpochHeight = u64;
class EmptyArgs { }
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

    assert(Context.accountLockedBalance == u128.Zero, "The staking pool shouldn't be staking at the initialization")
    let account_balance = Context.accountBalance
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

        const thenNewPromise =
            ContractPromiseBatch.create(Context.contractName)
                .stake(this.total_staked_balance, this.stake_public_key_u8Arr)
                .then(Context.contractName)

        promiseConnectCallBack<EmptyArgs>(thenNewPromise.id, Context.contractName,
            "on_stake_action", new EmptyArgs(), ON_STAKE_ACTION_GAS)
    }

    /**
     * execute stake(0) on this contract/account
     * via call to contract_account.stake(0)
     * Stop staking on the validator's public key
     */
    stake_zero(): void {
        ContractPromiseBatch.create(Context.contractName)
            .stake(u128.from(0), this.stake_public_key_u8Arr)
    }

    /**
     * get client account from persistent storage or create a new client account
     * caches last get
     */
    getClientAccount(clientAccountId: AccountId): ClientAccountState {

        if (clientAccountId != cache_ClientId) {
            // if not cached
            const tryGet = this.persistentAccountsMap.get(clientAccountId)
            if (tryGet == null) { //new client
                cache_AccountInfo = new ClientAccountState()
            }
            cache_ClientId = clientAccountId
        }
        return cache_AccountInfo as ClientAccountState
    }

    /**
     * store client account in persistent storage
     */
    saveClientAccount(clientAccountId: AccountId, accountInfo: ClientAccountState): void {
        if (accountInfo.isEmpty) {
            //deletet
            this.persistentAccountsMap.delete(clientAccountId)
        } else {
            //store
            this.persistentAccountsMap.set(clientAccountId, accountInfo)
        }
    }

    /**
     * client Context.predecessor is depositing Context.attachedDeposit into their internal account
     */
    clientDeposit(): u128 {
        const clientId = Context.predecessor
        const accountInfo = this.getClientAccount(clientId)
        const amount = Context.attachedDeposit
        //@ts-ignore
        accountInfo.unstaked += amount
        this.saveClientAccount(clientId, accountInfo)

        //@ts-ignore
        this.last_total_balance += amount

        logging.log("@" + clientId + " deposited " + amount.toString() + ". New unstaked balance is " + accountInfo.unstaked.toString())

        return amount
    }

    clientWithdraw(amount: Balance): void {
        assert(amount > u128.Zero, "Withdrawal amount should be positive")
        const clientId = Context.predecessor
        let accountInfo = this.getClientAccount(clientId)
        assert(accountInfo.unstaked >= amount, "Not enough unstaked balance to withdraw")
        assert(accountInfo.unstaked_available_epoch_height <= Context.epochHeight, "The unstaked balance is not yet available due to unstaking delay")
        //@ts-ignore
        accountInfo.unstaked -= amount
        this.saveClientAccount(clientId, accountInfo)

        logging.log("@" + clientId + " withdrawing " + amount.toString() + ". New unstaked balance is " + accountInfo.unstaked.toString())
        // call transfer from clientId into this contract
        ContractPromiseBatch.create(clientId).transfer(amount)
        //@ts-ignore
        this.last_total_balance -= amount
    }

    /// Returns the number of "stake" shares rounded down corresponding to the given staked balance
    /// amount.
    ///
    /// price = total_staked / total_shares
    /// Price is fixed
    /// (total_staked + amount) / (total_shares + num_shares) = total_staked / total_shares
    /// (total_staked + amount) * total_shares = total_staked * (total_shares + num_shares)
    /// amount * total_shares = total_staked * num_shares
    /// num_shares = amount * total_shares / total_staked
    num_shares_from_staked_amount_rounded_down(amount: Balance): NumStakeShares {
        assert(this.total_staked_balance > u128.Zero, "The total staked balance can't be 0")
        //@ts-ignore
        return this.total_stake_shares * amount / this.total_staked_balance
    }

    /// Returns the staked amount rounded down corresponding to the given number of "stake" shares.
    staked_amount_from_num_shares_rounded_down(num_shares: NumStakeShares): Balance {
        //@ts-ignore
        assert(this.total_stake_shares > u128.Zero, "The total number of stake shares can't be 0")
        //@ts-ignore
        return this.total_staked_balance * num_shares / this.total_stake_shares
    }

    /// Returns the number of "stake" shares rounded up corresponding to the given staked balance
    /// amount.
    ///
    /// Rounding up division of `a / b` is done using `(a + b - 1) / b`.
    num_shares_from_staked_amount_rounded_up(amount: Balance): NumStakeShares {
        assert(this.total_staked_balance > u128.Zero, "The total staked balance can't be 0")
        return (this.total_stake_shares * amount + this.total_staked_balance - u128.One) / this.total_staked_balance
    }
    /// Returns the staked amount rounded up corresponding to the given number of "stake" shares.
    ///
    /// Rounding up division of `a / b` is done using `(a + b - 1) / b`.
    staked_amount_from_num_shares_rounded_up(num_shares: NumStakeShares): Balance {
        assert(this.total_stake_shares > u128.Zero, "The total number of stake shares can't be 0")
        return (this.total_staked_balance * num_shares + this.total_stake_shares - u128.One) / this.total_stake_shares
    }


    clientStake(amount: Balance): void {

        assert(amount > u128.Zero, "Staking amount should be positive")
        let clientId = Context.predecessor
        let accountInfo = this.getClientAccount(clientId)

        // Calculate the number of "stake" shares that the account will receive 
        //for staking the given amount.
        let num_shares = this.num_shares_from_staked_amount_rounded_down(amount)
        assert(num_shares > u128.Zero, 'The calculated number of "stake" shares received for staking should be positive')

        // The amount of tokens the account will be charged from the unstaked balance.
        // Rounded down to avoid overcharging the account to guarantee that the account can always
        // unstake at least the same amount as staked.
        let charge_amount = this.staked_amount_from_num_shares_rounded_down(num_shares)
        assert(charge_amount > u128.Zero, "Invariant violation. Calculated staked amount must be positive, because \"stake\" share price should be at least 1")
        assert(accountInfo.unstaked >= charge_amount, "Not enough unstaked balance to stake")
        accountInfo.unstaked -= charge_amount
        accountInfo.stake_shares += num_shares
        this.saveClientAccount(clientId, accountInfo)

        // The staked amount that will be added to the total to guarantee the "stake" share price
        // never decreases. The difference between `stake_amount` and `charge_amount` is paid
        // from the allocated STAKE_SHARE_PRICE_GUARANTEE_FUND.
        let stake_amount = this.staked_amount_from_num_shares_rounded_up(num_shares)
        this.total_staked_balance += stake_amount
        this.total_stake_shares += num_shares
        logging.log("@" + clientId + " staking " + charge_amount.toString() +
            ". Received " + num_shares.toString() + " new staking shares." +
            " Total " + accountInfo.unstaked.toString() + " unstaked balance and " + accountInfo.stake_shares.toString() + " staking shares")
        logging.log("Contract total staked balance is " + this.total_staked_balance.toString() +
            ". Total number of shares " + this.total_stake_shares.toString())
    }

    clientUnstake(amount: u128): void {
        //@ts-ignore
        assert(amount > u128.Zero, "Unstaking amount should be positive")
        let clientId = Context.predecessor
        let accountInfo = this.getClientAccount(clientId)
        //@ts-ignore
        assert(this.total_staked_balance > u128.Zero, "The contract doesn't have staked balance")

        // Calculate the number of shares required to unstake the given amount.
        // NOTE: The number of shares the account will pay is rounded up.
        let num_shares: u128 = this.num_shares_from_staked_amount_rounded_up(amount)
        assert(num_shares > u128.Zero, 'Invariant violation. The calculated number of "stake" shares for unstaking should be positive')
        assert(accountInfo.stake_shares >= num_shares, "Not enough staked balance to unstake")

        // Calculating the amount of tokens the account will receive by unstaking the corresponding
        // number of "stake" shares, rounding up.
        let receive_amount = this.staked_amount_from_num_shares_rounded_up(num_shares)
        assert(receive_amount > u128.Zero, "Invariant violation. Calculated staked amount must be positive, because \"stake\" share price should be at least 1")
        accountInfo.stake_shares -= num_shares
        //@ts-ignore
        accountInfo.unstaked += receive_amount
        accountInfo.unstaked_available_epoch_height = Context.epochHeight + NUM_EPOCHS_TO_UNLOCK
        this.saveClientAccount(clientId, accountInfo)

        // The amount tokens that will be unstaked from the total to guarantee the "stake" share
        // price never decreases. The difference between `receive_amount` and `unstake_amount` is
        // paid from the allocated STAKE_SHARE_PRICE_GUARANTEE_FUND.
        let unstake_amount = this.staked_amount_from_num_shares_rounded_down(num_shares)
        //@ts-ignore
        this.total_staked_balance -= unstake_amount
        //@ts-ignore
        this.total_stake_shares -= num_shares

        logging.log("@" + clientId + " unstaking " + receive_amount.toString() + "." +
            " Spent " + num_shares.toString() + " staking shares." +
            " Total " + accountInfo.unstaked.toString() + " unstaked balance" +
            " and " + accountInfo.stake_shares.toString() + " staking shares")

        logging.log("Contract total staked balance is " + this.total_staked_balance.toString() + "." +
            " Total number of shares " + this.total_staked_balance.toString())
    }

    /// Asserts that the method was called by the owner.
    assertOwner(): void {
        assert(Context.predecessor == this.owner_id, "Can only be called by the owner")
    }

    /**
     * Distributes rewards after the new epoch. It's automatically called before every action.
     * Returns true if the current epoch height is different from the last epoch height.
     * Returns false and does nothing if the current epoch hasn't changed 
     */
    ping(): boolean {
        let epoch_height = Context.epochHeight
        if (this.last_epoch_height == epoch_height) {
            return false
        }
        this.last_epoch_height = epoch_height
        // New total amount (both locked and unlocked balances).
        // NOTE: We need to subtract `attached_deposit` in case `ping` called from `deposit` call
        // since the attached deposit gets included in the `account_balance`, and we have not
        // accounted it yet.
        //@ts-ignore
        let total_balance = Context.accountLockedBalance + Context.accountBalance - Context.attachedDeposit
        //@ts-ignore
        assert(total_balance >= this.last_total_balance, "The new total balance should not be less than the old total balance")
        //@ts-ignore
        let total_reward: Balance = total_balance - this.last_total_balance
        //@ts-ignore
        if (total_reward > u128.Zero) {
            // The validation fee that the contract owner takes.
            let owners_fee: u128 = this.reward_fee_fraction.multiply(total_reward)

            // Distributing the remaining reward to the delegators first.
            //@ts-ignore
            let remaining_reward: Balance = total_reward - owners_fee
            //@ts-ignore
            this.total_staked_balance += remaining_reward

            // Now buying "stake" shares for the contract owner at the new share price.
            let num_shares = this.num_shares_from_staked_amount_rounded_down(owners_fee)
            if (num_shares > u128.Zero) {
                // Updating owner's inner account
                let ownerAccount = this.getClientAccount(this.owner_id)
                //@ts-ignore
                ownerAccount.stake_shares += num_shares
                this.saveClientAccount(this.owner_id, ownerAccount)
                // Increasing the total amount of "stake" shares.
                //@ts-ignore
                this.total_stake_shares += num_shares
            }
            // Increasing the total staked balance by the owners fee, no matter whether the owner
            // received any shares or not.
            //@ts-ignore
            this.total_staked_balance += owners_fee
            logging.log("Epoch " + epoch_height.toString() +
                ": Contract received total rewards of " + total_reward.toString() +
                " tokens. New total staked balance is " + this.total_staked_balance.toString() +
                ". Total number of shares " + this.total_stake_shares.toString())
            if (num_shares > u128.Zero) {
                logging.log("Total rewards fee is " + num_shares.toString() + " stake shares.")
            }
        }
        //@ts-ignore
        this.last_total_balance = total_balance
        return true
    }
}
