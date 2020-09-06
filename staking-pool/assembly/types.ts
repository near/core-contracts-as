import { u128 } from "near-sdk-as";

export type Balance = u128;

export type AccountId = string;

export type EpochHeight = u64;

export type PublicKey = Uint8Array;

export type Base58PublicKey = string

export enum PromiseResult {
  /// Current version of the protocol never returns `PromiseResult::NotReady`.
  NotReady=0,
  Successful,
  Failed,
}

export function ntoy(nearAmount:number):u128{
    return u128.from(nearAmount*1e24)
}

export function yton(yoctoAmount:u128):number{
    return yoctoAmount/u128.from(1e24)
}
