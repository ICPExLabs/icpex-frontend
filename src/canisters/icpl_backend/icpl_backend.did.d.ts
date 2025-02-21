import type { Principal } from "@dfinity/principal";
import type { ActorMethod } from "@dfinity/agent";
import type { IDL } from "@dfinity/candid";

export type Result = { Ok: Principal } | { Err: string };
export interface TokenInfo {
  decimals: bigint;
  flat_fee: boolean;
  owner: Principal;
  logo: string;
  name: string;
  mint_on: boolean;
  platform_token_type: string;
  burn_rate: bigint;
  fee_rate: bigint;
  address: Principal;
  flat_burn_fee: boolean;
  token_type: string;
  total_supply: bigint;
  symbol: string;
}
export interface TokenSymbolInfo {
  decimals: bigint;
  logo: string;
  platform_token_type: string;
  token_type: string;
  symbol: string;
}
export interface _SERVICE {
  checkToken: ActorMethod<[Principal, string], TokenInfo>;
  createToken: ActorMethod<
    [
      string,
      string,
      string,
      number,
      bigint,
      bigint,
      boolean,
      bigint,
      boolean,
      boolean,
      string,
      [] | [Principal]
    ],
    Result
  >;
  cycles: ActorMethod<[], bigint>;
  getMetadata: ActorMethod<[], [Principal, Principal, Principal, bigint]>;
  getSymbolToken: ActorMethod<[string], TokenSymbolInfo>;
  getToken: ActorMethod<[Principal], TokenInfo>;
  getTokenCnt: ActorMethod<[], bigint>;
  getTokenIds: ActorMethod<[bigint], Array<string>>;
  getTokenInfo: ActorMethod<[], Array<TokenInfo>>;
  getTokenLogo: ActorMethod<[Principal], string>;
  getUserCreateTokenInfo: ActorMethod<[Principal], Array<TokenInfo>>;
  getUserSubWallet: ActorMethod<[], Array<TokenInfo>>;
  mintToken: ActorMethod<[Principal, Principal, bigint], undefined>;
  removeTokensControllers: ActorMethod<
    [Principal, [] | [Principal]],
    undefined
  >;
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
