import type { Principal } from "@dfinity/principal";
import type { ActorMethod } from "@dfinity/agent";

export interface FeeInfo {
  decimals: number;
  flat_fee: boolean;
  burn_rate: bigint;
  fee_rate: bigint;
  flat_burn_fee: boolean;
  total_supply: bigint;
}
export interface Metadata {
  fee: bigint;
  decimals: number;
  owner: Principal;
  logo: string;
  name: string;
  totalSupply: bigint;
  symbol: string;
}
export type Result = { Ok: bigint } | { Err: TxError };
export type TxError =
  | { InsufficientAllowance: null }
  | { InsufficientBalance: null }
  | { ErrorOperationStyle: null }
  | { Unauthorized: null }
  | { LedgerTrap: null }
  | { ErrorTo: null }
  | { Other: null }
  | { BlockUsed: null }
  | { AmountTooSmall: null };
export interface _SERVICE {
  allowance: ActorMethod<[Principal, Principal], bigint>;
  approve: ActorMethod<[Principal, bigint], Result>;
  balanceOf: ActorMethod<[Principal], bigint>;
  cycles: ActorMethod<[], bigint>;
  decimals: ActorMethod<[], number>;
  getAllowanceSize: ActorMethod<[], bigint>;
  getExtInfo: ActorMethod<[], [boolean, boolean, bigint, Principal]>;
  getFee: ActorMethod<[bigint], bigint>;
  getFeeInfo: ActorMethod<[], FeeInfo>;
  getHolders: ActorMethod<[bigint, bigint], Array<[Principal, bigint]>>;
  getHoldersNum: ActorMethod<[], bigint>;
  getMetadata: ActorMethod<[], Metadata>;
  getUserApprovals: ActorMethod<[Principal], Array<[Principal, bigint]>>;
  logo: ActorMethod<[], string>;
  mint: ActorMethod<[Principal, bigint], Result>;
  name: ActorMethod<[], string>;
  owner: ActorMethod<[], Principal>;
  setBurnRate: ActorMethod<[bigint], undefined>;
  setFee: ActorMethod<[bigint], undefined>;
  setFeeTo: ActorMethod<[Principal], undefined>;
  setLogo: ActorMethod<[string], undefined>;
  setName: ActorMethod<[string], undefined>;
  setOwner: ActorMethod<[Principal], undefined>;
  symbol: ActorMethod<[], string>;
  totalSupply: ActorMethod<[], bigint>;
  transfer: ActorMethod<[Principal, bigint], Result>;
  transferFrom: ActorMethod<[Principal, Principal, bigint], Result>;
}
