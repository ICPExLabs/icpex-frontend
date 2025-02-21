import { icpl_router } from "@/canisters/icpl_router";
import type { _SERVICE as ROUTER_SERVICE } from "@/canisters/icpl_router/icpl_router.did";

import { icpl_transactions } from "@/canisters/icpl_transactions";
import type { _SERVICE as TRANSACTIONS_SERVICE } from "@/canisters/icpl_transactions/icpl_transactions.did";

// @ts-expect-error no withOptions
export const queryReceiveAmountAndPath: ROUTER_SERVICE["quote"] = async (
  ...args
) => {
  return await icpl_router.quote(...args);
};

// @ts-expect-error no withOptions
export const swap: ROUTER_SERVICE["swapTokenToToken"] = async (...args) => {
  return await icpl_router.swapTokenToToken(...args);
};

// @ts-expect-error no withOptions
export const querySwapStatus: TRANSACTIONS_SERVICE["querySwapStatus"] = async (
  ...args
) => {
  return await icpl_transactions.querySwapStatus(...args);
};

// @ts-expect-error no withOptions
export const getDeviationRate: ROUTER_SERVICE["get_deviation_rate"] = async (
  ...args
) => {
  return await icpl_router.get_deviation_rate(...args);
};
