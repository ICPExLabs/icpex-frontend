import { Principal } from "@dfinity/principal";
import {
  createDip20Actor,
  createIcrc1Actor,
  createIcrc2Actor,
} from "./actors/token";
import { DECIMALS, TOKEN_PROTOCOLS } from "./constants";
import {
  divideAndConvertToBig,
  divideAndConvertToNumber,
  minus,
} from "./common";
import { createWalletActorOfBackend } from "./actors/backend";
import { icpl_backend } from "@/canisters/icpl_backend";
import { icpl_oracle } from "@/canisters/icpl_oracle";
import type {
  ImportToken,
  SubWalletToken,
  UserToken,
  WalletTokenBig,
} from "@/types/token";
import type { TokenInfo } from "@/canisters/icpl_backend/icpl_backend.did";
import { canisterId as routerCanisterId } from "@/canisters/icpl_router";
import appStore from "@/store/app";
import { idlFactory } from "@/canisters/icpl_icpl";
import { createActor, createWalletActor } from "@/utils/agent/create-actor";
import { SubAccount } from "@dfinity/ledger-icp";
import Big from "big.js";

export interface GetBalanceParams {
  userId: string;
  protocol: string;
  canisterId: string;
}

export function getBalanceByDip20(params: {
  userId: string;
  canisterId: string;
}) {
  const { canisterId, userId } = params;
  const actor = createDip20Actor(canisterId);
  return actor.balanceOf(Principal.fromText(userId));
}

export function getBalanceByIcrc1(params: {
  userId: string;
  canisterId: string;
}) {
  const { canisterId, userId } = params;
  const actor = createIcrc1Actor(canisterId);
  return actor.icrc1_balance_of({
    owner: Principal.fromText(userId),
    subaccount: [],
  });
}

export function getBalanceByIcrc2(params: {
  userId: string;
  canisterId: string;
}) {
  const { canisterId, userId } = params;
  const actor = createIcrc2Actor(canisterId);
  return actor.icrc1_balance_of({
    owner: Principal.fromText(userId),
    subaccount: [],
  });
}

export async function getBalance(params: {
  protocol: string;
  canisterId: string;
  decimals: number;
  userId: string;
}) {
  const balanceBigint = await getBalanceBase(params);
  const balance = divideAndConvertToNumber(balanceBigint, params.decimals);
  return balance;
}

export async function getBalanceBig(params: {
  protocol: string;
  canisterId: string;
  decimals: number;
  userId: string;
}): Promise<Big.Big> {
  const balanceBigint = await getBalanceBase(params);
  const balance = divideAndConvertToBig(balanceBigint, params.decimals);
  return balance;
}

export async function getBalanceBase(params: {
  protocol: string;
  canisterId: string;
  userId: string;
}) {
  const { protocol } = params;
  if (!TOKEN_PROTOCOLS.includes(protocol)) return BigInt(0);

  const strategies: {
    [key: string]: (params: GetBalanceParams) => Promise<bigint>;
  } = {
    DIP20: getBalanceByDip20,
    "ICRC-1": getBalanceByIcrc1,
    "ICRC-2": getBalanceByIcrc2,
  };
  const getBalanceFunc = strategies[protocol.toUpperCase()];
  let balanceBigint = BigInt(0);
  try {
    balanceBigint = await getBalanceFunc(params);
  } catch (e) {
    console.error(e);
  }
  return balanceBigint;
}

export async function getBalanceAndMax(params: {
  protocol: string;
  canisterId: string;
  decimals: number;
  userId: string;
  transferFee: Big;
  burnFee: Big;
  isTransferFeeFixed: boolean;
  isBurnFeeFixed: boolean;
}) {
  const balance = await getBalanceBig(params);
  const { protocol, transferFee, burnFee } = params;
  let max = Big(0);
  if (protocol !== "DIP20") {
    max = balance.minus(transferFee.plus(burnFee).mul(2));
  } else {
    max = balance;
  }
  return {
    max,
    balance,
  };
}

export const getTokenLogo = (canisterId: string) =>
  `https://metrics.icpex.org/images/${canisterId}.png`;

// transform `TokenInfo` Into `UserToken`
export function transformTokenInfoToUserToken(tokenInfo: TokenInfo): UserToken {
  const {
    address: canisterId,
    token_type: protocol,
    decimals: decimalsBigint,
    owner,
    total_supply,
    flat_fee: isTransferFeeFixed,
    fee_rate,
    flat_burn_fee: isBurnFeeFixed,
    burn_rate,
    mint_on: canMint,
    platform_token_type: source,
    ...rest
  } = tokenInfo;
  const decimals = Number(decimalsBigint);
  const transferFee = isTransferFeeFixed
    ? divideAndConvertToBig(fee_rate, decimals, 18)
    : divideAndConvertToBig(fee_rate, DECIMALS, 18);
  const burnFee = isBurnFeeFixed
    ? divideAndConvertToBig(burn_rate, decimals, 18)
    : divideAndConvertToBig(burn_rate, DECIMALS, 18);
  const totalSupply = divideAndConvertToBig(total_supply, decimals);
  return {
    ...rest,
    logo: getTokenLogo(canisterId.toText()),
    canisterId: canisterId.toText(),
    protocol: protocol as "DIP20" | "ICRC-1" | "ICRC-2",
    owner: owner.toText(),
    decimals: Number(decimals),
    totalSupply,
    isTransferFeeFixed,
    transferFee,
    isBurnFeeFixed,
    burnFee,
    balance: Big(0),
    max: Big(0),
    canMint,
    source: source as UserToken["source"],
  };
}

class CachePool {
  private cache: Map<string, { timestamp: number; tokenInfo: any }>;
  private expiryTime: number;

  constructor() {
    this.cache = new Map();
    this.expiryTime = 60 * 60 * 1000; // 60 minutes in milliseconds
  }

  async getToken(canisterId: string): Promise<any> {
    const currentTime = new Date().getTime();
    if (this.cache.has(canisterId)) {
      const { timestamp, tokenInfo } = this.cache.get(canisterId)!;
      if (currentTime - timestamp <= this.expiryTime) {
        return tokenInfo;
      } else {
        this.cache.delete(canisterId);
      }
    }

    const tokenInfo = await icpl_backend.getToken(
      Principal.fromText(canisterId)
    );
    this.cache.set(canisterId, { timestamp: currentTime, tokenInfo });
    return tokenInfo;
  }
}

const cachePool = new CachePool();

export async function getTokenInfo(canisterId: string) {
  return transformTokenInfoToUserToken(await cachePool.getToken(canisterId));
}

// selectable tokens (for swap token and create pool)
export async function getSelectableTokens() {
  const list = await icpl_backend.getTokenInfo();
  const tokens: UserToken[] = list.map((token) =>
    transformTokenInfoToUserToken(token)
  );
  return tokens;
}

// transform `TokenInfo` Into `UserToken`
export function transformTokenToUserToken(tokenInfo: TokenInfo): UserToken {
  const {
    address,
    token_type: protocol,
    decimals: decimalsBigint,
    mint_on: canMint,
    platform_token_type: source,
    owner,
    total_supply,
    flat_fee: isTransferFeeFixed,
    fee_rate,
    flat_burn_fee: isBurnFeeFixed,
    burn_rate,
    ...rest
  } = tokenInfo;
  const decimals = Number(decimalsBigint);
  const transferFee = isTransferFeeFixed
    ? divideAndConvertToBig(fee_rate, decimals, 18)
    : divideAndConvertToBig(fee_rate, DECIMALS, 18);
  const burnFee = isBurnFeeFixed
    ? divideAndConvertToBig(burn_rate, decimals, 18)
    : divideAndConvertToBig(burn_rate, DECIMALS, 18);
  const totalSupply = divideAndConvertToBig(total_supply, decimals);
  return {
    ...rest,
    logo: getTokenLogo(address.toText()),
    canisterId: address.toText(),
    protocol: protocol as "DIP20" | "ICRC-1" | "ICRC-2",
    owner: owner.toText(),
    decimals,
    totalSupply,
    isTransferFeeFixed,
    transferFee,
    isBurnFeeFixed,
    burnFee,
    balance: Big(0),
    max: Big(0),
    canMint,
    source: source as UserToken["source"],
  };
}

export async function getUserTokenList(userId: string) {
  const originalTokens = await icpl_backend.getUserCreateTokenInfo(
    Principal.fromText(userId)
  );
  const tokens: UserToken[] = originalTokens.map((token) =>
    transformTokenToUserToken(token)
  );
  return tokens;
}

export async function getHolders(id: string) {
  // console.log(7777, id)
  const actor = await createActor(id, idlFactory);
  // console.log(77771, actor)
  const res = await (actor as any).getHoldersNum();
  // console.log(77772, res)
  return res;
}

export async function getCycles(id: string) {
  const actor = await createActor(id, idlFactory);
  const res = await (actor as any).cycles();
  return res;
}
export async function getDIP20TotalSupply(id: string) {
  const actor = await createActor(id, idlFactory);
  const res = await (actor as any).totalSupply();
  return res;
}

// transform `TokenInfo` Into `WalletToken`
export function transformTokenInfoToMainWalletToken(
  tokenInfo: TokenInfo
): WalletTokenBig {
  const {
    token_type: protocol,
    address,
    name,
    symbol,
    decimals,
    logo,
    platform_token_type: source,
  } = tokenInfo;
  return {
    protocol: protocol as "DIP20" | "ICRC-1" | "ICRC-2",
    canisterId: address.toText(),
    name,
    symbol,
    decimals: Number(decimals),
    logo,
    balance: Big(0),
    price: 0,
    source: source as WalletTokenBig["source"],
  };
}

// added tokens
export async function getAddedTokens() {
  const list = await icpl_backend.getTokenInfo();
  const tokens: ImportToken[] = list.map((item) => {
    const {
      address,
      token_type: protocol,
      name,
      symbol,
      decimals,
      logo,
      platform_token_type: source,
    } = item;
    return {
      canisterId: address.toText(),
      protocol: protocol as "DIP20" | "ICRC-1" | "ICRC-2",
      name,
      symbol,
      decimals: Number(decimals),
      logo,
      source: source as ImportToken["source"],
    };
  });
  return tokens;
}

// transform `TokenInfo` Into `SubWalletToken`
export function transformTokenInfoToSubWalletToken(
  tokenInfo: TokenInfo
): SubWalletToken {
  const {
    token_type: protocol,
    address,
    name,
    symbol,
    decimals: decimalsBigint,
    logo,
  } = tokenInfo;
  const canisterId = address.toText();
  const decimals = Number(decimalsBigint);
  return {
    protocol: protocol as "DIP20" | "ICRC-1" | "ICRC-2",
    canisterId,
    name,
    symbol,
    decimals,
    logo,
    balance: Big(0),
    price: 0,
  };
}

export async function getSubWalletBalance(params: {
  tokenId: string;
  decimals: number;
}) {
  const { tokenId, decimals } = params;
  const actor = createIcrc1Actor(tokenId);
  const gen_subaccount = SubAccount.fromPrincipal(
    Principal.fromText(appStore.userId)
  );
  const balanceBigint = await actor.icrc1_balance_of({
    owner: Principal.fromText(routerCanisterId),
    subaccount: [gen_subaccount.toUint8Array()],
  });
  return divideAndConvertToBig(balanceBigint, decimals, 18);
}
// sub wallet token
export async function getSubWalletTokens() {
  const actor = await createWalletActorOfBackend();
  const list = await actor.getUserSubWallet();
  const requests = list.map(async (item) => {
    const token = await transformTokenInfoToSubWalletToken(item);
    const balance = await getSubWalletBalance({
      tokenId: token.canisterId,
      decimals: token.decimals,
    });
    const [[_, priceBigint]] = await icpl_oracle.pricesBatch([
      Principal.fromText(token.canisterId),
    ]);
    const price = divideAndConvertToNumber(priceBigint, 18);
    return {
      ...token,
      balance,
      price,
    };
  });
  const tokens = await Promise.all(requests);
  return tokens;
}

export async function getPlugXtcActor(id: string) {
  const actor = await createWalletActor(id, idlFactory);
  return actor;
}

// @ts-expect-error no withOptions
export const getICRC2PlusCycles: _SERVICEICRC2["icrc_plus_cycles"] = async (
  canisterId: string
) => {
  const actor = await createIcrc2Actor(canisterId);
  return actor.icrc_plus_cycles();
};

// @ts-expect-error no withOptions
export const getICRC2Holders: _SERVICEICRC2["icrc_plus_holders_count"] = async (
  canisterId: string
) => {
  const actor = await createIcrc2Actor(canisterId);
  return actor.icrc_plus_holders_count();
};

// @ts-expect-error no withOptions
export const getICRCTotalSupply: _SERVICEICRC2["icrc1_total_supply"] = async (
  canisterId: string
) => {
  const actor = await createIcrc2Actor(canisterId);
  return actor.icrc1_total_supply();
};
