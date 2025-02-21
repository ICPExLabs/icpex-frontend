import type { Principal } from "@dfinity/principal";
import type { ActorMethod } from "@dfinity/agent";

export interface Account {
  owner: Principal;
  subaccount: [] | [Uint8Array | number[]];
}
export interface PoolInfo {
  i: bigint;
  k: bigint;
  base_reserve: bigint;
  owner: Principal;
  block_timestamp_last: bigint;
  pool_addr: Principal;
  lp_amount: bigint;
  pool_type: string;
  lp_lock: bigint;
  quote_user: bigint;
  lp_fee_rate: bigint;
  base_token_decimals: number;
  quote_token_decimals: number;
  base_user: bigint;
  quote_token: Principal;
  base_price_cumulative_last: bigint;
  quote_reserve: bigint;
  base_token: Principal;
  pool_status: PoolStatus;
  mt_fee_rate: bigint;
  is_single_pool: boolean;
  total_supply: bigint;
  is_my_pool: boolean;
}
export type PoolStatus =
  | { CREATE_BASE_INPUT: null }
  | { CREATE_QUOTE_INPUT: null }
  | { OFFLINE: null }
  | { ROLLBACK_UNDONE: null }
  | { CREATED: null }
  | { ROLLBACK_DONE: null }
  | { ONLINE: null };
export type RState = { ONE: null } | { AboveOne: null } | { BelowOne: null };
export type Result = { Ok: [Principal, bigint] } | { Err: string };
export type Result_1 = { Ok: number } | { Err: string };
export type Result_2 = { Ok: null } | { Err: string };
export type Result_3 = { Ok: bigint } | { Err: string };
export type Result_4 =
  | {
      Ok: [bigint, Array<Principal>, number, bigint, bigint];
    }
  | { Err: string };
export type Result_5 = { Ok: bigint } | { Err: string };
export type TokenType =
  | { EXT: null }
  | { UNKOWN: null }
  | { ICRC1: null }
  | { ICRC2: null }
  | { DIP20: null };
export interface _SERVICE {
  addLiquidity: ActorMethod<
    [Principal, bigint, bigint, bigint, bigint],
    [bigint, bigint, bigint]
  >;
  addPrivateLiquidity: ActorMethod<
    [Principal, bigint, bigint, bigint],
    [bigint, bigint]
  >;
  addStableLiquidity: ActorMethod<
    [Principal, bigint, bigint, bigint, bigint],
    [bigint, bigint, bigint]
  >;
  createCommonPool: ActorMethod<
    [
      Principal,
      Principal,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      [] | [boolean]
    ],
    Result
  >;
  createPrivatePool: ActorMethod<
    [
      Principal,
      Principal,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      [] | [boolean]
    ],
    Result
  >;
  createStablePool: ActorMethod<
    [
      Principal,
      Principal,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      [] | [boolean]
    ],
    Result
  >;
  cycles: ActorMethod<[], bigint>;
  getMidPrice: ActorMethod<[Principal], bigint>;
  getPoolInfo: ActorMethod<[Principal, Principal], PoolInfo>;
  getPoolsInfo: ActorMethod<[Principal], Array<PoolInfo>>;
  getSubaccount: ActorMethod<[], Account>;
  getTimePrice: ActorMethod<[Principal], bigint>;
  get_deviation_rate: ActorMethod<
    [bigint, bigint, Principal, bigint],
    Result_1
  >;
  get_mid_price_extra_decimals: ActorMethod<[Principal, number], bigint>;
  get_token_type_by_principal_with_refresh: ActorMethod<[Principal], TokenType>;
  get_token_type_by_principal_without_refresh: ActorMethod<
    [Principal],
    TokenType
  >;
  lockLiquidity: ActorMethod<[Principal, bigint, bigint], Result_2>;
  lockLiquidityV2: ActorMethod<[Principal, bigint, bigint], Result_3>;
  queryAddShareBase: ActorMethod<
    [bigint, Principal],
    [bigint, bigint, bigint, bigint]
  >;
  queryAddShareQuote: ActorMethod<
    [bigint, Principal],
    [bigint, bigint, bigint, bigint]
  >;
  querySellBase: ActorMethod<
    [Principal, bigint],
    [bigint, bigint, bigint, RState, bigint]
  >;
  querySellQuote: ActorMethod<
    [Principal, bigint],
    [bigint, bigint, bigint, RState, bigint]
  >;
  querySellShares: ActorMethod<
    [bigint, Principal, Principal],
    [bigint, bigint, bigint, bigint]
  >;
  quote: ActorMethod<[Principal, Principal, bigint, bigint], Result_4>;
  resetParamPrivatePool: ActorMethod<
    [Principal, bigint, bigint, bigint],
    undefined
  >;
  sellShares: ActorMethod<
    [bigint, Principal, bigint, bigint, bigint, bigint],
    [bigint, bigint]
  >;
  swapTokenToToken: ActorMethod<
    [Principal, Principal, bigint, bigint, Array<Principal>, bigint, bigint],
    Result_5
  >;
  transferLiquidity: ActorMethod<[Principal, Principal, bigint], Result_2>;
  transferLiquidityV2: ActorMethod<[Principal, Principal, bigint], Result_3>;
  withdrawSubAccountToken: ActorMethod<[Principal, bigint], Result_2>;
}
