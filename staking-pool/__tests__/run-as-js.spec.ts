export type u64=BigInt 

import { StakingContractState, initializeState, internalCreatedStatePtr } from "../assembly/contract-internal";
import { RewardFeeFraction } from "../assembly/model";
import { Context, VMContext, u128 } from "near-sdk-as";

//global test vars && initialization
let contract = new StakingContractState()


//helper functions


//------------------
//--- TEST SUITE ---
//------------------
describe("staking-pool contract test", () => {

  beforeEach(() => {
  });

  //-----------
  it("can be created", () => {

    
    initializeState("alice","KuTCtARNzxZQ3YvXDeLjx83FDqxv2SdQTSbiq876zR7", new RewardFeeFraction(10,100))
    contract = internalCreatedStatePtr()
    
     expect(contract.owner_id).toBe("alice")

  });

  it("bob can deposit & stake", () => {

    VMContext.setSigner_account_id("bob")
    VMContext.setAttached_deposit(u128.from(100))
    contract.clientDeposit()

    let hrw = contract.getClientHRA(Context.predecessor)
    expect(hrw.unstaked_balance).toBe(u128.from(100))
    
    let yoctos = 80*1e24
    contract.clientStake(u128.from(yoctos))

    let hrw2 = contract.getClientHRA(Context.predecessor)
    expect(hrw2.staked_balance).toBe(u128.from(80))
    expect(hrw2.unstaked_balance).toBe(u128.from(20))

  });


});

//-------------------------