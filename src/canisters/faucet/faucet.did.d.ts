import type { Principal } from "@dfinity/principal";
import type { ActorMethod } from "@dfinity/agent";

export interface Account {
  owner: Principal;
  subaccount: [] | [Uint8Array | number[]];
}
export type Result = { Ok: Array<[Principal, bigint]> } | { Err: string };
export type Result_1 = { Ok: null } | { Err: string };
export interface _SERVICE {
  airdrop: ActorMethod<[Array<[Principal, bigint]>, Principal, string], Result>;
  cycles: ActorMethod<[], bigint>;
  getSubaccount: ActorMethod<[], Account>;
  withdrawSubAccountToken: ActorMethod<[Principal], Result_1>;
}
