//node /home/lucio/repos/core-contracts-as/staking-pool/node_modules/near-sdk-as/runtime/dist/bin.js 
//--context='{"input":"e30=","output_data_receivers":[],"prepaid_gas":1000000000000000,"attached_deposit":"0","is_view":false,"block_index":1,"block_timestamp":42,"epoch_height":1,"storage_usage":60,"random_seed":"KuTCtARNzxZQ3YvXDeLjx83FDqxv2SdQTSbiq876zR7","current_account_id":"staking-pool","signer_account_id":"alice","predecessor_account_id":"alice","account_balance":"1000000000000","signer_account_pk":"7ZJRjoNqT3w68VBD6stbKgjYVmUcLmUfL7YyTWxz1dNX","account_locked_balance":"0"}' --input='{}' --wasm-file=/home/lucio/repos/core-contracts-as/staking-pool/dist/../build/debug/staking-pool.wasm --method-name=get_reward_fee_fraction --state='{}'
import { spawnSync } from "child_process"
import { inspect } from "util";
//import { util } from 'util'

let DEBUG = 0


var globalState = {}

function spawn(args) {

    if (DEBUG) console.log(args)

    let execResult = spawnSync("node", args);
    if (execResult.status != 0) {
        throw new Error("Failed to run successfully: " + execResult.output[2].toString());
    }
    if (DEBUG) {
        if (execResult.output[0]) console.log(execResult.output[0].toString())
        if (execResult.output[1]) console.log(execResult.output[1].toString())
        if (execResult.output[2]) console.log(execResult.output[2].toString())
    }
    var output = execResult.output[1];
    console.log(output.toString())
    var result;
    try {
        result = JSON.parse(output);
        globalState = result.state //store state for next call
        if (result.err) {
            console.log("🛑-ERROR from contract call: "+ inspect(result.err,{depth:10}))
        }
    }
    catch (e) {
        console.error("Failed to parse: " + output);
        throw e;
    }
    if (DEBUG) console.log(inspect(result, { depth: 10 }))
    console.log(result.outcome)
    return result;
}


class Contract {

    public block_timestamp: number = 42

    constructor(
        public contractName: string,
        public signer_account_id: string,
        public predecessor_account_id?: string | undefined
    ) { }

    call(method: string, input?: any) {

        console.log("-----------------------------------")
        console.log("------ CALL " + method)
        console.log("params: " + input?.toString())

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
            "input":"e30="
        }

        var argscall = ['./node_modules/near-sdk-as/runtime/dist/bin.js',
            `--method-name=${method}`,
            `--input=${JSON.stringify(input||{})}`,
            `--context=${JSON.stringify(context)}`,
            '--wasm-file=./build/debug/staking-pool.wasm',
            `--state=${JSON.stringify(globalState)}`]

        if (DEBUG) console.log(argscall)

        spawn(argscall)
    }
}


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

class RewardFeeFraction {
    public numerator: number
    public denominator: number
    constructor(numerator, denominator) {
        this.numerator = numerator
        this.denominator = denominator
    }
}

var params = {
    owner_id: "owner.account",
    stake_public_key: "KuTCtARNzxZQ3YvXDeLjx83FDqxv2SdQTSbiq876zR7",
    reward_fee_fraction: new RewardFeeFraction(10, 100)
}

DEBUG = 0
let c = new Contract("staking-contract", "alice")
c.call("init", {
    owner_id: "owner.account",
    stake_public_key: "KuTCtARNzxZQ3YvXDeLjx83FDqxv2SdQTSbiq876zR7",
    reward_fee_fraction: new RewardFeeFraction(10, 100)
})

c.call("get_owner_id")

c.call("get_reward_fee_fraction")

