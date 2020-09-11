"use strict";
var VM=require("./VM-bin-runner-wrap")
var expect=VM.expect

//--------------------------------
//--  main  ----------------------
//--------------------------------
//console.log(process.argv)

VM.setDEBUG(0)

let useRust = (process.argv.includes("rust"))
let useRelease = (process.argv.includes("release"))
let verbose = (process.argv.includes("-v"))

let initORnew = "init" //default
let WASMFile = './build/debug/staking-pool.wasm'
if (useRust) {
    console.log("Using RUST-based WASM")
    WASMFile = "./rust-staking-pool.wasm"
    initORnew = "new"
}
if (useRelease) {
    console.log("Using RELEASE WASM")
    WASMFile = './build/release/staking-pool.wasm'
}

if (verbose) VM.setDEBUG(1)

var alice = new VM.Account("alice")
var spContract = new VM.Account("staking-pool.alice").deploySmartContract(WASMFile)

var bob = new VM.Account("bob")

//call init/new on the contract
let initResult = alice.call(spContract, initORnew, {
    owner_id: alice.accountId,
    stake_public_key: "KuTCtARNzxZQ3YvXDeLjx83FDqxv2SdQTSbiq876zR7",
    reward_fee_fraction: {numerator:8, denominator:100}
})

expect(initResult.err).toBe(null, "err")

//try get_owner_id
// let getOwner = alice.call(spContract, "get_owner_id")
// expect(getOwner.data).toBe(alice.accountId, "contract owner")

//try get_reward_fee_fraction
// let rffResult = alice.call(spContract, "get_reward_fee_fraction")
// expect(rffResult.data).toBe({ numerator: 8, denominator: 100 }, "get_reward_fee_fraction")

let bobDeposit
//try deposit Zero
//bobDeposit = 0
//let depositResult = bob.callWithAttachedDeposit(bobDeposit, spContract, "deposit")
//console.log(util.inspect(bob.lastCallOutput))

//try deposit 100
bobDeposit = 100_000_000_000
let depositResult1 = bob.call(spContract, "depo2")
let depositResult2 = bob.callWithAttachedDeposit(bobDeposit, spContract, "depo2")
let depositResult = bob.callWithAttachedDeposit(bobDeposit, spContract, "deposit")
//console.log(util.inspect(bob.lastCallOutput))

//let wdResult = bob.call(spContract, "withdraw_all")

//try get_account_unstaked_balance
//let unstakedCall = bob.call(spContract, "get_account_unstaked_balance",{account_id:"bob"})
//expect(unstakedCall.data).toBe(bobDeposit, "bob unstaked after deposit")

