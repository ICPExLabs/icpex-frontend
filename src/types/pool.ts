import type { Token } from "./token";

export type PoolType = "public" | "private" | "anchored";
export type PoolTemplate = "standard" | "single";

export interface TokenInPool extends Token {
  reserve: number;
  reserveBigint: bigint;
  userAmount: number;
  userAmountBigint: bigint;
}

export interface Pool {
  owner: string;
  hasLiquidity: boolean;
  canisterId: string;
  type: PoolType;
  isSingle: boolean;
  totalSupply: number;
  fee: number;
  i: number;
  k: number;
  userLp: number;
  userEarnedFee: number;
  volumn24h: number;
  base: TokenInPool;
  quote: TokenInPool;
}
