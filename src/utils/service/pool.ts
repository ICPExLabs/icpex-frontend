import type { AxiosResponse } from "axios";
import { to } from "../catch";
import type { BaseResponse, ListResponse } from "./request";
import request from "./request";

export function getChat(params: { poolId: string }) {
  return to<
    BaseResponse<
      {
        transactionsNum: number;
        ts: string;
        tvl: number;
        volume: number;
      }[]
    >
  >(request.get("/pool/chart", { params }));
}

export interface Transaction {
  action: string;
  totalValue: number;
  tokenAmountA: number;
  tokenAmountB: number;
  tokenSymbolA: string;
  tokenSymbolB: string;
  ts: string;
  operation: "All" | "Swap" | "AddLiquidity" | "RemoveLiquidity";
}

export function getTransactions(params: {
  operation: Transaction["operation"];
  pageNum?: number;
  pageSize?: number;
  tokenId?: string;
  poolId?: string;
  caller?: string;
}) {
  return to<AxiosResponse<ListResponse<Transaction[]>>>(
    request.get("/pool/transactions", { params })
  );
}

export function getVolumn(poolId: string) {
  return to<AxiosResponse<BaseResponse<{ tvl: number; volume24h: number }>>>(
    request.get("/pool/market/info", { params: { poolId } })
  );
}
