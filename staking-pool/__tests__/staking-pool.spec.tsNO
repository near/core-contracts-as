import { Runtime, Account } from "near-sdk-as/runtime";

//global test vars && initialization
let runtime: Runtime;
let alice: Account, spContract: Account, bob: Account

runtime = new Runtime();

alice = runtime.newAccount("alice");
bob = runtime.newAccount("bob");

spContract = runtime.newAccount("staking-pool",
  __dirname + "/../build/debug/staking-pool.wasm"
);

//helper functions


//------------------
//--- TEST SUITE ---
//------------------
describe("staking-pool contract test", () => {

  beforeEach(() => {
  });

  //-----------
  it("can be created", () => {

    let initResult = alice.call_other("staking-pool",
      "init",
      {
        owner_id: "alice",
        stake_public_key: "KuTCtARNzxZQ3YvXDeLjx83FDqxv2SdQTSbiq876zR7",
        reward_fee_fraction: { numerator: 8, denominator: 100 }
      }
    )

    expect(initResult.err).toBe(null)

    //aliceOwner.call_other("staking-pool", "create", createParams)
    let getOwnerResult = alice.call_other("staking-pool", "get_owner_id")

    expect(getOwnerResult.return_data).toBe("alice")

  });

  it("bob can deposit & stake", () => {

    let bobDepositResult = bob.call_other("staking-pool", "deposit",undefined,undefined,"100")
    expect(bobDepositResult.err).toBeNull()
    
    let yoctos = 80*1e24
    let bobStakeResult = bob.call_other("staking-pool", "stake",{amount:yoctos})
    expect(bobStakeResult.err).toBeNull()

  });


});

//-------------------------