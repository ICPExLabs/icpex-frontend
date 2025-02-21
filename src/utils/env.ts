import { getCanisters } from "../../config/env";

// dfinity environment
console.log(process.env.DFX_NETWORK);
export const isProduction = process.env.DFX_NETWORK === "ic";

export const host = isProduction
  ? "https://icp-api.io"
  : "http://localhost:8000";

export const whitelist = getCanisters();
