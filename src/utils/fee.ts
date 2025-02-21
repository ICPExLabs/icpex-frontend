import Big from "big.js";
import { multiplyAndConvertToBigInt } from "./common";

interface FeeParams {
  amount: number;
  isFixed: boolean;
  fee: number;
}

interface FeeParamsBig {
  amount: Big;
  isFixed: boolean;
  fee: Big;
}

export function computeFee(params: FeeParams) {
  const { amount, isFixed, fee } = params;
  if (isFixed) return fee;
  const x = Big(amount).times(fee);
  return Number(x.toPrecision(4));
}

export function computeFeeBig(params: FeeParamsBig) {
  const { amount, isFixed, fee } = params;
  if (isFixed) return fee;
  const x = Big(amount).times(fee);
  return x;
}
