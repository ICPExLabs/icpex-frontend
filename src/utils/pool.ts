import { Principal } from "@dfinity/principal";
import { getTokenInfo, getTokenLogo } from "./token";
import { divideAndConvertToNumber, truncateDecimal } from "./common";
import { ANONYMOUS_PRINCIPAL_ID, DECIMALS } from "./constants";
import { getEarnedFee } from "./service/token";
import { getVolumn } from "./service/pool";
import { icpl_router } from "@/canisters/icpl_router";
import type { Pool, PoolType } from "@/types/pool";
import type { UserToken } from "@/types/token";
import type { PoolInfo } from "@/canisters/icpl_router/icpl_router.did";
import appStore from "@/store/app.ts";

export function getTokenInfoInPool(
  params:
    | {
        token: UserToken;
        reserveAmount: bigint;
        userAmount: bigint;
      }
    | string
) {
  if (typeof params === "string") {
    return {
      protocol: "DIP20" as const,
      canisterId: params,
      name: "-",
      symbol: "-",
      decimals: 0,
      logo: "",
      canMint: false,
      source: "UNKNOWN" as const,
      owner: "",
      isTransferFeeFixed: false,
      transferFee: 0,
      isBurnFeeFixed: false,
      burnFee: 0,
      totalSupply: 0,
      reserve: 0,
      reserveBigint: 0n,
    };
  }
  const { reserveAmount, token } = params;
  const { decimals, source, ...rest } = token;
  return {
    ...rest,
    decimals,
    reserve: divideAndConvertToNumber(reserveAmount, decimals, 18),
    reserveBigint: reserveAmount,
    source: source as any,
  };
}

// transform `PoolBaseInfo` Into `Pool`
export async function initialPool(pool: PoolInfo): Promise<Pool> {
  // is_my_pool: user is participate
  const {
    pool_type,
    is_single_pool,
    pool_addr,
    is_my_pool: hasLiquidity,
  } = pool;
  const transformer: { [key: string]: PoolType } = {
    lpc: "public",
    lpp: "private",
    lps: "anchored",
  };
  const type = transformer[pool_type.toLowerCase()] || "public";
  // 24h volumn
  let volumn24h = 0;
  // const [err, result] = await getVolumn(pool.pool_addr.toText())
  // if (!err) {
  //   volumn24h = result.data.data?.volume24h || 0
  // }
  // fees earned calculate, fee * userLp/poolLp
  const totalSupply = divideAndConvertToNumber(
    pool.total_supply,
    pool.base_token_decimals
  );
  const userLp = divideAndConvertToNumber(
    pool.lp_amount,
    pool.base_token_decimals
  );
  let userEarnedFee = 0;
  // // user wallet is login
  // const userId = appStore.userId || ANONYMOUS_PRINCIPAL_ID
  // if (userId !== ANONYMOUS_PRINCIPAL_ID) {
  //   const [err, result] = await getEarnedFee({ poolId: pool.pool_addr.toText(), userId })
  //   if (!err) {
  //     const fee = result.data.data?.fee || 0
  //     if (fee === 0 || userLp === 0 || totalSupply === 0) {
  //       userEarnedFee = 0
  //     } else {
  //       userEarnedFee = truncateDecimal(fee * (userLp / totalSupply))
  //     }
  //   }
  // }
  const base = getTokenInfoInPool(pool.base_token.toString());
  base.canisterId = pool.base_token.toText();
  base.reserve = divideAndConvertToNumber(
    pool.base_reserve,
    pool.base_token_decimals,
    18
  );
  base.reserveBigint = pool.base_reserve;
  base.logo = getTokenLogo(base.canisterId);
  const quote = getTokenInfoInPool(pool.quote_token.toString());
  quote.canisterId = pool.quote_token.toText();
  quote.reserve = divideAndConvertToNumber(
    pool.quote_reserve,
    pool.quote_token_decimals,
    18
  );
  quote.reserveBigint = pool.base_reserve;
  quote.logo = getTokenLogo(quote.canisterId);
  return {
    owner: pool.owner.toText(),
    hasLiquidity,
    fee: divideAndConvertToNumber(pool.lp_fee_rate, DECIMALS, 18),
    totalSupply,
    type,
    isSingle: is_single_pool,
    canisterId: pool_addr.toText(),
    i: divideAndConvertToNumber(pool.i, DECIMALS),
    k: divideAndConvertToNumber(pool.k, DECIMALS),
    userLp,
    userEarnedFee,
    volumn24h,
    base,
    quote,
  };
}

// explore pool list
export async function getPoolList(userId: string): Promise<Pool[]> {
  const pools = await icpl_router.getPoolsInfo(Principal.fromText(userId));
  const res = pools.map((pool) => initialPool(pool));
  const resolvedPoolsPromise = Promise.all(res);
  return resolvedPoolsPromise;
}

export async function queryLpAndQuoteAmount(poolId: string, amount: bigint) {
  const res = await icpl_router.queryAddShareBase(
    amount,
    Principal.fromText(poolId)
  );
  return res;
}

export async function queryLpAndBaseAmount(poolId: string, amount: bigint) {
  const res = await icpl_router.queryAddShareQuote(
    amount,
    Principal.fromText(poolId)
  );
  return res;
}

export async function queryRatio(poolId: string) {
  const res = await icpl_router.getTimePrice(Principal.fromText(poolId));
  return res;
}

export async function queryRatioByBase(poolId: string, amount: bigint) {
  const res = await icpl_router.querySellBase(
    Principal.fromText(poolId),
    amount
  );
  return res;
}

export async function queryRatioByQuote(poolId: string, amount: bigint) {
  const res = await icpl_router.querySellQuote(
    Principal.fromText(poolId),
    amount
  );
  return res;
}

export async function queryTokensAmount(
  pool: Pool,
  userId: string,
  percentage: bigint
) {
  const [baseAmountBigint, quoteAmountBigint] =
    await icpl_router.querySellShares(
      percentage,
      Principal.fromText(userId),
      Principal.fromText(pool.canisterId)
    );
  const baseAmount = divideAndConvertToNumber(
    baseAmountBigint,
    pool.base.decimals
  );
  const quoteAmount = divideAndConvertToNumber(
    quoteAmountBigint,
    pool.quote.decimals
  );
  return [baseAmount, quoteAmount];
}
