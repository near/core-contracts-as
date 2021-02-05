import { u128, util } from "near-sdk-as";

export enum PromiseResult {
    /// Current version of the protocol never returns `PromiseResult::NotReady`.
    NotReady = 0,
    Successful,
    Failed,
}

function encodeArgs<T>(t: T): Uint8Array {
    if (t instanceof Uint8Array) {
        return t;
    }
    return encode<T>(t);
}


export function promiseConnectCallBack<T>(
    unconnectedPromiseId: u64,
    contractName: string,
    methodName: string,
    args: T,
    gas: u64,
    amount: u128 = u128.Zero
): void {
    let argsArr = encodeArgs<T>(args);
    const contract_name_encoded = util.stringToBytes(contractName);
    const method_name_encoded = util.stringToBytes(methodName);
    let amount_arr = amount.toUint8Array();

    // const id = env.promise_then(
    //     unconnectedPromiseId,
    //     contract_name_encoded.byteLength,
    //     contract_name_encoded.dataStart,
    //     method_name_encoded.byteLength,
    //     method_name_encoded.dataStart,
    //     argsArr.byteLength,
    //     argsArr.dataStart,
    //     amount_arr.dataStart,
    //     gas
    // )
}
