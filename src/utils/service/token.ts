import type { AxiosResponse } from "axios";
import { to } from "../catch";
import type { BaseResponse } from "./request";
import request from "./request";

export function getEarnedFee(params: { poolId: string }) {
  return to<AxiosResponse<BaseResponse<{ fee: number }>>>(
    request.get("/token/user/fee", { params })
  );
}

export function getPoolChartData(params: { poolId: any }) {
  return to<AxiosResponse<BaseResponse<{ fee: number }>>>(
    request.get("/pool/chart", {
      params,
    })
  );
}

export function getTokenPoolList(params: { tokenId: string }) {
  return to<AxiosResponse<BaseResponse<{ fee: number }>>>(
    request.get("/token/pool/list", { params })
  );
}

export function getTopTokenList() {
  return to<AxiosResponse<BaseResponse<{ data: any }>>>(
    request.get("/token/token/list")
  );
}
export function getSimpleTokenList(tokenId: string) {
  if (tokenId === null || tokenId === undefined || tokenId.trim() === "") {
    tokenId = "aaaaa-aa";
  }
  return to<AxiosResponse<BaseResponse<{ data: any }>>>(
    request.get(`/token/token/list?tokenId=${tokenId}`)
  );
}
export function getTransactionList(params: { poolId: any }) {
  return to<AxiosResponse<BaseResponse<{ data: any }>>>(
    request.get("/pool/transactions", { params })
  );
}

export function getTokenMarketInfo(params: { tokenId: any }) {
  return to<AxiosResponse<BaseResponse<{ data: any }>>>(
    request.get("/token/market/info", { params })
  );
}

export function getTokenChart(params: { tokenId: any }) {
  return to<AxiosResponse<BaseResponse<{ data: any }>>>(
    request.get("/token/chart", { params })
  );
}
