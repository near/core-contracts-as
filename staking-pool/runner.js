"use strict";

//node /home/lucio/repos/core-contracts-as/staking-pool/node_modules/near-sdk-as/runtime/dist/bin.js 
//--context='{"input":"e30=","output_data_receivers":[],"prepaid_gas":1000000000000000,"attached_deposit":"0","is_view":false,"block_index":1,"block_timestamp":42,"epoch_height":1,"storage_usage":60,"random_seed":"KuTCtARNzxZQ3YvXDeLjx83FDqxv2SdQTSbiq876zR7","current_account_id":"staking-pool","signer_account_id":"alice","predecessor_account_id":"alice","account_balance":"1000000000000","signer_account_pk":"7ZJRjoNqT3w68VBD6stbKgjYVmUcLmUfL7YyTWxz1dNX","account_locked_balance":"0"}' --input='{}' --wasm-file=/home/lucio/repos/core-contracts-as/staking-pool/dist/../build/debug/staking-pool.wasm --method-name=get_reward_fee_fraction --state='{}'

var child_process = require("child_process");
var util = require("util");

//import { util } from 'util'

var DEBUG = 0;

var globalState = {};

function spawn(args) {

    if (DEBUG) console.log(args);

    var execResult = child_process.spawnSync("node", args);

    if (execResult.status != 0) {
        throw new Error("Failed to run successfully: " + execResult.output[2].toString());
    }
    if (DEBUG) {
        if (execResult.output[0]) console.log(execResult.output[0].toString());
        if (execResult.output[1]) console.log(execResult.output[1].toString());
        if (execResult.output[2]) console.log(execResult.output[2].toString());
    }

    return execResult.output[1];
}

// class Contract
function Contract(WASMFile, contractName, signer_account_id, predecessor_account_id) {
    this.WASMFile = WASMFile
    this.contractName = contractName;
    this.signer_account_id = signer_account_id;
    this.predecessor_account_id = predecessor_account_id;
    this.block_timestamp = 42;
}

Contract.prototype.call = function (method, input) {

    if (input == undefined) input = ""

    console.log("---------------------------");
    console.log("------ CALL " + method + "(" + input.toString() + ")");

    var context = {
        "current_account_id": this.contractName,
        "signer_account_id": this.signer_account_id, "predecessor_account_id": this.predecessor_account_id || this.signer_account_id,
        "attached_deposit": "0", "is_view": false, "block_index": 1,
        "block_timestamp": this.block_timestamp, "epoch_height": 1,
        "account_balance": "1000000000000",
        "account_locked_balance": "0",
        "signer_account_pk": "7ZJRjoNqT3w68VBD6stbKgjYVmUcLmUfL7YyTWxz1dNX",
        "prepaid_gas": 1000000000000000, "output_data_receivers": [],
        "storage_usage": 60, "random_seed": "KuTCtARNzxZQ3YvXDeLjx83FDqxv2SdQTSbiq876zR7",
        "input": "e30="
    };

    var argscall = ['./node_modules/near-sdk-as/runtime/dist/bin.js',
        "--method-name=" + method,
        "--input=" + JSON.stringify(input || {}),
        "--context=" + JSON.stringify(context),
        '--wasm-file=' + this.WASMFile,
        "--state=" + JSON.stringify(globalState)];

    if (DEBUG) console.log(argscall);

    var output = spawn(argscall);

    console.log("RESULT: " + output.toString());

    var result;
    try {
        result = JSON.parse(output);
        globalState = result.state; //store state for next call
        let gas;
        if (result.outcome) gas= result.outcome.burnt_gas
        if (gas) {
            console.log("burnt_gas: " + Math.round(gas/1e9) + " Billion yoctos");
        }
        if (result.err) {
            console.log("🛑-ERROR from contract call: " + util.inspect(result.err, { depth: 10 }));
        }
    }
    catch (e) {
        console.error("Failed to parse: " + output);
        throw e;
    }

    if (DEBUG) console.log(util.inspect(result, { depth: 10 }));

    console.log("OUTCOME:")
    console.log(result.outcome)

 };

/*
var args = ['/home/lucio/repos/core-contracts-as/staking-pool/node_modules/near-sdk-as/runtime/dist/bin.js',
    '--context={"input":"e30=","output_data_receivers":[],"prepaid_gas":1000000000000000,"attached_deposit":"0","is_view":false,"block_index":1,"block_timestamp":42,"epoch_height":1,"storage_usage":60,"random_seed":"KuTCtARNzxZQ3YvXDeLjx83FDqxv2SdQTSbiq876zR7","current_account_id":"staking-pool","signer_account_id":"alice","predecessor_account_id":"alice","account_balance":"1000000000000","signer_account_pk":"7ZJRjoNqT3w68VBD6stbKgjYVmUcLmUfL7YyTWxz1dNX","account_locked_balance":"0"}',
    '--wasm-file=/home/lucio/repos/core-contracts-as/staking-pool/dist/../build/debug/staking-pool.wasm',
    '--method-name=get_reward_fee_fraction',
    '--input={}',
    '--state={}']



var method = {
    "name": "get_reward_fee_fraction",
    "input": ""
}

method.name = "get_owner_id"

var args2 = ['/home/lucio/repos/core-contracts-as/staking-pool/node_modules/near-sdk-as/runtime/dist/bin.js',
    `--method-name=${method.name}`,
    `--input=${JSON.stringify(method.input)}`,
    '--context={"input":"e30=","output_data_receivers":[],"prepaid_gas":1000000000000000,"attached_deposit":"0","is_view":false,"block_index":1,"block_timestamp":42,"epoch_height":1,"storage_usage":60,"random_seed":"KuTCtARNzxZQ3YvXDeLjx83FDqxv2SdQTSbiq876zR7","current_account_id":"staking-pool","signer_account_id":"alice","predecessor_account_id":"alice","account_balance":"1000000000000","signer_account_pk":"7ZJRjoNqT3w68VBD6stbKgjYVmUcLmUfL7YyTWxz1dNX","account_locked_balance":"0"}',
    '--wasm-file=/home/lucio/repos/core-contracts-as/staking-pool/dist/../build/debug/staking-pool.wasm',
    '--state={}']

console.log(args2)

spawn(args2)
*/

//console.log(process.argv)

DEBUG = 0;

let useRust = (process.argv.includes("rust"))
let useRelease = (process.argv.includes("release"))

let createMethodName = "init"
let WASMFile = './build/debug/staking-pool.wasm'
if (useRust) {
    console.log("Using RUST-based WASM")
    WASMFile = "./rust-staking-pool.wasm"
    createMethodName = "new"
}
if (useRelease ) {
    console.log("Using RELEASE WASM")
    WASMFile = './build/release/staking-pool.wasm'
}

var c = new Contract(WASMFile, "staking-contract", "alice");

c.call(createMethodName, {
    owner_id: "owner.account",
    stake_public_key: "KuTCtARNzxZQ3YvXDeLjx83FDqxv2SdQTSbiq876zR7",
    reward_fee_fraction: { numerator: 8, denominator: 100 }
}
)

c.call("get_owner_id")

c.call("get_reward_fee_fraction")
