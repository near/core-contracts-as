import { u128, VMContext, Context, util } from "near-sdk-as";

import { StakingContractState, initializeState, internalCreatedStatePtr } from "../contract-internal";
import { RewardFeeFraction } from "../model";

describe("contract unit tests", () => {

    it("should deposit", () => {

    //bug/let data = Context.accountLockedBalance
    //bug/expect(data).toBe(u128.from(100))

    let rff=new RewardFeeFraction(10,100)

    initializeState("alice", "KuTCtARNzxZQ3YvXDeLjx83FDqxv2SdQTSbiq876zR7", rff)

    let contract = internalCreatedStatePtr()

    VMContext.setAttached_deposit(u128.from(10));
    VMContext.setInput("");

    let result = contract.clientDeposit()

    expect(result).toBe(u128.from(100))

    });
  
    it("should stake", () => {
    });
  
    it("should deposit-and-stake", () => {
    });
  });
  