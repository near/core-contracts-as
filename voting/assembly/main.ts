import { context, 
  env, 
  PersistentUnorderedMap, 
  u128 } from 'near-sdk-as'
import { 
  AccountId, 
  Balance, 
  EpochHeight, 
  Result } from './types'
import { 
    ERR_VOTING_ALREADY_ENDED, 
    ERR_CHECK_RESULT_AFTER_RESULT } from './non-spec'

@nearBindgen
export class VotingContract {
  /* Type Declarations */

  /// How much each validator votes
  votes: PersistentUnorderedMap<AccountId, Balance>
  /// Total voted balance so far.
  total_voted_stake: Balance
  /// When the voting ended. `None` means the poll is still open.
  result: Result
  /// Epoch height when the contract is touched last time.
  last_epoch_height: EpochHeight

  new() : void {
    this.votes = new PersistentUnorderedMap<AccountId, Balance>("v")
    this.total_voted_stake = new u128()
    this.result =  'None'
    this.last_epoch_height = 0
  }


  /// Ping to update the votes according to current stake of validators.
  ping(): void {
    assert(this.result == 'None', ERR_VOTING_ALREADY_ENDED)
    
    let cur_epoch_height = context.epochHeight
    if (cur_epoch_height != this.last_epoch_height) {
      // Logic here
      const votes = this.votes.keys()
      this.total_voted_stake = u128.Zero
      for(let account_id in votes) {
        const account_current_stake = env.validator_stake(account_id)
        this.total_voted_stake = this.total_voted_stake + account_current_stake
        if(account_current_stake > u128.Zero) {
          this.votes.set(account_id, account_current_stake)
         }
        }
        this.check_result()
        this.last_epoch_height = cur_epoch_height
      
    }
  }

  /// Check whether the voting has ended.
  check_result(): void {
    assert(this.result == 'None', ERR_CHECK_RESULT_AFTER_RESULT)
    const total_stake = env.validator_total_stake()
    const two = u128.from(2)
    const three = u128.from(3)
    if(this.total_voted_stake > (two * total_stake / three)) {
      this.result = env.block_timestamp()
    }
  }

  /// Method for validators to vote or withdraw the vote.
  /// Votes for if `is_vote` is true, or withdraws the vote if `is_vote` is false.
  vote(is_vote: bool): void {
    this.ping()
    if(this.result != 'None') {
      return
    }
    const account_id = context.predecessor
    let account_stake = u128.Zero
    if (is_vote) {
      const stake = env.validator_stake(account_id)
      assert(stake > u128.Zero, `${account_id} is not a validator`)
      account_stake = stake
    }

    const voted_stake = this.votes.get(account_id)
    if (voted_stake) {
    // Remove the key
      this.votes.delete(account_id)
      assert(voted_stake <= this.total_voted_stake, `invariant: voted stack ${voted_stake} is more than total voted stake ${this.total_voted_stake}`)
      
      this.total_voted_stake = this.total_voted_stake + account_stake  - voted_stake

      if (account_stake > u128.Zero) {
        this.votes.set(account_id, account_stake)
        this.check_result()
      }
    }

  }

  /// Get the timestamp of when the voting finishes. `None` means the voting hasn't ended yet.
  get_result(): Result {
    return this.result
  }

  /// Returns current a pair of `total_voted_stake` and the total stake.
  /// Note: as a view method, it doesn't recompute the active stake. May need to call `ping` to
  /// update the active stake.
  get_total_voted_stake(): [u128, u128] {
    return [
      this.total_voted_stake,
      env.validator_total_stake()
    ]
  }


  /// Returns all active votes.
  /// Note: as a view method, it doesn't recompute the active stake. May need to call `ping` to
  /// update the active stake.
  get_votes(): PersistentUnorderedMap<AccountId, Balance> {
    return this.votes
  }

}