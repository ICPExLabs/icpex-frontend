import Big from "big.js";

export enum TokenUsage {
  BASE = "base",
  QUOTE = "quote",
}

export interface BaseToken {
  protocol: "DIP20" | "ICRC-1" | "ICRC-2";
  canisterId: string;
  name: string;
  symbol: string;
  decimals: number;
  logo: string;
}

export interface ImportToken extends BaseToken {
  source: "CERTIFICATION" | "CREATETOKEN" | "IMPORT" | "UNKNOWN";
}

export interface WalletTokenBig extends BaseToken {
  balance: Big;
  price: number;
  source: "CERTIFICATION" | "CREATETOKEN" | "IMPORT" | "UNKNOWN";
}

export interface SubWalletToken extends BaseToken {
  balance: Big;
  price: number;
}

export interface Token extends BaseToken {
  owner: string;
  isTransferFeeFixed: boolean;
  transferFee: Big;
  isBurnFeeFixed: boolean;
  burnFee: Big;
  totalSupply: Big;
  canMint: boolean;
  source: "CERTIFICATION" | "CREATETOKEN" | "IMPORT" | "UNKNOWN";
}

export interface UserToken extends Token {
  balance: Big;
  max: Big;
}

export interface UserTokenUse extends UserToken {
  amountToUse: string;
}
