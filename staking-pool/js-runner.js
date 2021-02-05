var VM=require("./js-wasm-runner")

//--------------------------------
//--  main  ----------------------
//--------------------------------
//console.log(process.argv)

VM.setDEBUG(0)

let useRust = (process.argv.includes("rust"))
let useRelease = (process.argv.includes("release"))

let initORnew = "init"
let WASMFile = 'build/debug/staking-pool.wasm'
if (useRust) {
    console.log("Using RUST-based WASM")
    WASMFile = "rust-staking-pool.wasm"
    initORnew = "new"
}
if (useRelease) {
    console.log("Using RELEASE WASM")
    WASMFile = 'build/release/staking-pool.wasm'
}

// loadWASM returns the Promise from WebAssembly.instantiateStreaming
VM.loadWASM(WASMFile)
    .then( module => {
     
        var alice = new VM.Account("alice")
        var spContract = new VM.Account("staking-pool.alice")
        spContract.code = module.instance.exports
        
        //call init/new on the contract
        let initResult = alice.call(spContract, initORnew, {
            owner_id: alice.accountId,
            stake_public_key: "KuTCtARNzxZQ3YvXDeLjx83FDqxv2SdQTSbiq876zR7",
            reward_fee_fraction: {numerator:8, denominator:100}
        })
        
        expect(initResult.err).toBe(null, "err")
        
        //try get_owner_id
        let getOwner = alice.call(spContract, "get_owner_id")
        expect(getOwner.data).toBe(alice.accountId, "contract owner")
                
        var bob = new VM.Account("bob")
        
    }
    )
    .catch(err=>{
        console.log(err)
    })
