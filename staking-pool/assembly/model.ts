import { u128, Context } from "near-sdk-as"

export type AccountId = string;
export type Balance = u128;
export type EpochHeight = u64;

/// A type to distinguish between a balance and "stake" shares for better readability.
export type NumStakeShares = u128;

//
// client account state persisted into a map
//
@nearBindgen
export class ClientAccountState {

  /// The unstaked balance. It represents the amount the account has on this contract that
  /// can either be staked or withdrawn.
  unstaked: Balance = u128.Zero

  /// The amount of "stake" shares. Every stake share corresponds to the amount of staked balance.
  /// NOTE: The number of shares should always be less or equal than the amount of staked balance.
  /// This means the price of stake share should always be at least `1`.
  /// The price of stake share can be computed as `total_staked_balance` / `total_stake_shares`.
  stake_shares: Balance = u128.Zero

  /// The minimum epoch height when the withdrawn is allowed.
  /// This changes after unstaking action, because the amount is still locked for 3 epochs.
  unstaked_available_epoch_height: EpochHeight = 0

}

export function isEmpty(acc:ClientAccountState): boolean { 
  return acc.unstaked == u128.Zero && 
  acc.stake_shares == u128.Zero 
}


/// Represents an account structure readable by humans.
@nearBindgen
export class HumanReadableAccount {
  account_id: AccountId = ""
  /// The unstaked balance that can be withdrawn or staked.
  unstaked_balance: Balance = u128.Zero
  /// The amount balance staked at the current "stake" share price.
  staked_balance: Balance = u128.Zero
  /// Whether the unstaked balance is available for withdrawal now.
  can_withdraw: boolean = false

  constructor(account_id: string, a: ClientAccountState) {
    this.account_id = account_id
    this.unstaked_balance = a.unstaked
    //bug/this.can_withdraw = a.unstaked_available_epoch_height <= Context.epochHeight
  }
}

@nearBindgen
export class RewardFeeFraction {
  numerator: i32
  denominator: i32
  constructor(numerator: i32, denominator: i32) {
    this.numerator = numerator
    this.denominator = denominator
  }

  assertValid(): void {
    assert(this.denominator != 0, "Denominator must be a positive number")
    assert(this.numerator <= this.denominator, "The reward fee must be less or equal to 1")
  }

  multiply(value: Balance): Balance {
    return u128.div( u128.mul(u128.fromU32(this.numerator),value),u128.fromU32(this.denominator))
  }
}

