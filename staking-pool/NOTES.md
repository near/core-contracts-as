##Differences with rust contract:

* In the rust contract the main struct StakingContract containing all the contract state gets auto-magically deserialized from storage and serialized again before and after each contract-fn call

The AS code would be

    class Foo {}
    let SELF: Foo;
    if (storage.hasKey("STATE")) { SELF = storage.get("STATE")

Then each exported method acts like instance methods onSELF, which also has be initialized.

That's the model that Rust uses and you are welcome to do it differently, just make sure to have the same exported methods and you're fine.

In the future a pass will be added to the AS with a @ORM decorator for the class you want to act like the contract's object, then you would have the option to make it ORM or not, whereas with Rust you always do.

##AS top level var & functions

In AS, at the top level, any code that is outside of a function is bundled into a start function.  If you build with yarn `asb --wat` you'll see the generated wat file and you'll see this start function.  There is a special start section in a wasm binary and this function is listed as the function that should be run when the binary is instantiated, which is before any contract method is called.

So if you have a global variable it will be read in at the start.  Which is also what rust does

## As-pect testing -- Level 1:  /assembly/__tests__

The test at `/assembly/__tests__/*.spec.ts` are only for unit-testing, you'll have `descrbe|it|expect` within WASM code 

env.epoch_height()
LinkError: WebAssembly.Instance(): Import #13 module="env" function="account_locked_balance" error: function import requires a callable


## Jest testing -- Level 2: /__tests__

The tests at `/__tests__/*.spec.ts` are run on a simulated VM environment, the tests load your comiled WASM on the simulated VM and you can call and test the contracts's public functions but you won't have access to internal state. You have full `jest` `descrbe|it|expect` and you have access to `Env` and `Context`

## Enums en github.com/nearprotocol/nearcore
pub enum PromiseResult {
    /// Current version of the protocol never returns `PromiseResult::NotReady`.
    NotReady,
    #[serde(with = "crate::serde_with::bytes_as_str")]
    Successful(Vec<u8>),
    Failed,
}