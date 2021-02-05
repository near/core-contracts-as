import { u128 } from 'near-sdk-as'

export type AccountId = string
export type Balance = u128
export type EpochHeight = u64
export type WrappedTimestamp = u64
export type Result = u64 | 'None'