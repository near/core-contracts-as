"use strict";

//node /home/lucio/repos/core-contracts-as/staking-pool/node_modules/near-sdk-as/runtime/dist/bin.js 
//--context='{"input":"e30=","output_data_receivers":[],"prepaid_gas":1000000000000000,"attached_deposit":"0","is_view":false,"block_index":1,"block_timestamp":42,"epoch_height":1,"storage_usage":60,"random_seed":"KuTCtARNzxZQ3YvXDeLjx83FDqxv2SdQTSbiq876zR7","current_account_id":"staking-pool","signer_account_id":"alice","predecessor_account_id":"alice","account_balance":"1000000000000","signer_account_pk":"7ZJRjoNqT3w68VBD6stbKgjYVmUcLmUfL7YyTWxz1dNX","account_locked_balance":"0"}' --input='{}' --wasm-file=/home/lucio/repos/core-contracts-as/staking-pool/dist/../build/debug/staking-pool.wasm --method-name=get_reward_fee_fraction --state='{}'

var child_process = require("child_process");
var util = require("util");
var fs = require("fs");

var exp = {
    DEBUG: 0,
    block_timestamp: 42,
    publicKeyCounter: 0
}

    //avoids js scientific notation
function toInteger(num){
        return num.toLocaleString('fullwide', { useGrouping: false }) 
}


function spawn(args) {

    if (exp.DEBUG >= 2) console.log(args);

    var execResult = child_process.spawnSync("node", args);

    if (execResult.status != 0) {
        throw new Error("Failed to run successfully: " + execResult.output[2].toString());
    }
    if (exp.DEBUG >= 2) {
        if (execResult.output[0]) console.log(execResult.output[0].toString());
        if (execResult.output[1]) console.log(execResult.output[1].toString());
        if (execResult.output[2]) console.log(execResult.output[2].toString());
    }

    return execResult.output[1];
}

// ---------------------------
// -- class Account ----------
// ---------------------------
function Account(accountId) {
    this.accountId = accountId
    this.publicKey = String.fromCharCode(64 + exp.publicKeyCounter) + "ZJRjoNqT3w68VBD6stbKgjYVmUcLmUfL7YyTWxz1dNX"
    exp.publicKeyCounter++
    this.WASMFile = undefined
    this.balance = 10*1e12
    this.lockedBalance=0
    this.state = {}
}

Account.prototype.callWithAttachedDeposit = function (attachedDeposit, contractAccount, method, input) {
    Account.prototype.call.call(this,contractAccount, method, input, attachedDeposit)
}

Account.prototype.call = function (contractAccount, method, input, attachedDeposit) {

    if (!(contractAccount instanceof Account)) throw new Error("1st param must be a ContractAccount")
    if (contractAccount.WASMFile == undefined) throw new Error("destination account " + contractAccount.accountId + " has no smart contract deployed")

    exp.block_timestamp = exp.block_timestamp || 42

    console.log("-".repeat(78));
    console.log();
    console.log("-".repeat(40))
    console.log("-- "+method) 
    console.log("-".repeat(40))
    console.log(this.accountId + " CALL " + contractAccount.accountId + '.' + method + "(" + (input ? JSON.stringify(input) : "") + ")" +
        (attachedDeposit!=undefined? " --attached_deposit:"+attachedDeposit: "") 
        );

    var context = {
        "current_account_id": contractAccount.accountId,
        "signer_account_id": this.accountId, "predecessor_account_id": this.accountId,
        "attached_deposit": toInteger(attachedDeposit?attachedDeposit:0), "is_view": false,
        "block_index": 1,
        "block_timestamp": exp.block_timestamp, 
        "epoch_height": 1,
        "account_balance": toInteger(this.balance),
        "account_locked_balance": toInteger(this.lockedBalance),
        "signer_account_pk": "7ZJRjoNqT3w68VBD6stbKgjYVmUcLmUfL7YyTWxz1dNX",
        "prepaid_gas": 1000000000000000, "output_data_receivers": [],
        "storage_usage": 60, "random_seed": "KuTCtARNzxZQ3YvXDeLjx83FDqxv2SdQTSbiq876zR7",
        "input": "e30="
    };

    //exp.block_timestamp++

    var argscall = ['../node_modules/near-sdk-as/runtime/dist/bin.js',
        '--wasm-file=' + contractAccount.WASMFile,
        "--method-name=" + method,
        "--input=" + JSON.stringify(input || {}),
        "--context=" + JSON.stringify(context),
        "--state=" + JSON.stringify(contractAccount.state)];

    if (exp.DEBUG >= 2) console.log(argscall);

    if (exp.DEBUG >= 1) console.log(context)
    if (exp.DEBUG >= 1) console.log("input State")
    if (exp.DEBUG >= 1) console.log(contractAccount.state) 

    var bufferOutput = spawn(argscall);

    if (exp.DEBUG >= 1) console.log("OUTPUT: " + bufferOutput.toString());

    let output;
    let return_data_Value;
    try {
        output = JSON.parse(bufferOutput);
    }
    catch (e) {
        console.error("Failed to parse: " + bufferOutput);
        throw e;
    }

    contractAccount.state = output.state; //store contract state 
    if (exp.DEBUG >= 1) console.log("output State")
    if (exp.DEBUG >= 1) console.log(output.state)

    if (output.err) {
        console.log("🛑-ERROR from contract call: " + util.inspect(output.err, { depth: 10 }));
    }

    if (output.outcome == undefined) {
        console.log("🛑-ERROR output.outcome is null or undefined");
        console.log("OUTPUT: " + util.inspect(output, { depth: 10 }));
        return { err: output.err || "no output.outcome" }
    }

    let gas = output.outcome.burnt_gas || 0;
    console.log("    burnt_gas: " + Math.round(gas / 1e10) / 100 + " TGas");

    if (output.outcome.logs && output.outcome.logs.length) {
        console.log(" contract logs:");
        console.log(util.inspect(output.outcome.logs))
    }

    if (output.outcome.return_data) {
        try {
            return_data_Value = JSON.parse(output.outcome.return_data.Value)
        } catch {
            return_data_Value = "can't JSON.parse: " + output.outcome.return_data.Value
        }
    }

    if (exp.DEBUG >= 1) {
        console.log("OUTCOME:")
        console.log(output.outcome)
    }

    if (exp.DEBUG >= 2) console.log(util.inspect(output, { depth: 10 }));

    this.lastCallOutput = output

    return { err: output.err, data: return_data_Value }

};

//deploys a contract in the account 
Account.prototype.deploySmartContract = function (WASMFile) {
    if (this.WASMFile) throw new Error("this account " + this.accountId + "alread has a contract " + this.WASMFile)
    this.WASMFile = WASMFile
    this.state = {}

    const WASMfileStat=fs.statSync(WASMFile)
    console.log(WASMFile + "created "+WASMfileStat.ctime)

    return this
}

function setDEBUG(value){
    exp.DEBUG=value
}

// ---------------------------
// -- class expect().toBe() --
// ---------------------------
function deepEqual(object1, object2) {
    const keys1 = Object.keys(object1);
    const keys2 = Object.keys(object2);

    if (keys1.length !== keys2.length) {
        return false;
    }

    for (const key of keys1) {
        const val1 = object1[key];
        const val2 = object2[key];
        const areObjects = isObject(val1) && isObject(val2);
        if (
            areObjects && !deepEqual(val1, val2) ||
            !areObjects && val1 !== val2
        ) {
            return false;
        }
    }

    return true;
}

function isObject(object) {
    return object != null && typeof object === 'object';
}
function expect(received) {
    expect.received = received
    return expect.prototype
}
expect.prototype.toBe = function (expected, message) {
    let eq = false;
    if (isObject(expected) && isObject(expect.received)) {
        eq = deepEqual(expected, expect.received)
    }
    else {
        eq = (expected == expect.received)
    }
    if (!eq) {
        console.log("🛑 - expect failed: " + message);
        console.log("      received: " + util.inspect(expect.received, { depth: 10 }));
        console.log("      expected: " + util.inspect(expected, { depth: 10 }));
    }
    else {
        console.log("🟢 - " + message + " is " + JSON.stringify(expect.received));
    }
    return expect.prototype
}

module.exports = {
    spawn,
    toInteger,
    setDEBUG,
    Account,
    expect
}
//end module
