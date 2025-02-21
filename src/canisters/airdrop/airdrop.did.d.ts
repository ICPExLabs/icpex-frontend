import type { Principal } from "@dfinity/principal";
import type { ActorMethod } from "@dfinity/agent";
import type { IDL } from "@dfinity/candid";

export interface Account {
  owner: Principal;
  subaccount: [] | [Uint8Array | number[]];
}
export type Result = { Ok: null } | { Err: Array<[Principal, bigint]> };
export type Result_1 = { Ok: null } | { Err: string };
export interface _SERVICE {
  airdrop: ActorMethod<[Array<[Principal, bigint]>, Principal, string], Result>;
  cycles: ActorMethod<[], bigint>;
  getSubaccount: ActorMethod<[], Account>;
  withdrawSubAccountToken: ActorMethod<[Principal], Result_1>;
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
