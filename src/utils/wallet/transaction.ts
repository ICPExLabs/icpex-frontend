import { Principal } from "@dfinity/principal";
import Big from "big.js";
import {
  isValidAccountId,
  isValidPrincipal,
  multiplyAndConvertToBigInt,
} from "../common";
import { idlFactory as dip20IdlFactory } from "@/canisters/dip20";
import { idlFactory as icrc1IdlFactory } from "@/canisters/icrc1_ledger";
import { idlFactory as nnsIdlFactory } from "@/canisters/ledger";
import {
  idlFactory as icrc2IdlFactory,
  canisterId as localIcpId,
} from "@/canisters/icrc2_ledger";
import { idlFactory as icplIdlFactory } from "@/canisters/icpl_icpl";
import {
  canisterId as routerCanisterId,
  idlFactory as routerIdlFactory,
} from "@/canisters/icpl_router";
import { canisterId as backendCanisterId } from "@/canisters/icpl_backend";
import { canisterId as airdropCanisterId } from "@/canisters/faucet";
import type { _SERVICE as ROUTER_SERVICE } from "@/canisters/icpl_router/icpl_router.did";
import appStore from "@/store/app";
import { AccountIdentifier, SubAccount } from "@dfinity/ledger-icp";
import { getSubaccount } from "../actors/icpl_faucet";

interface TransferToken {
  canisterId: string;
  symbol: string;
  amount: number;
  isTransferFeeFixed: boolean;
  transferFee: number;
  isBurnFeeFixed: boolean;
  burnFee: number;
  decimals: number;
  to: string;
  serverfee?: bigint;
}
type ActionCallback = (res: any) => void;
export type SwapArgs = Parameters<ROUTER_SERVICE["swapTokenToToken"]>;

export function dip20Transfer(
  token: TransferToken,
  onSuccess: ActionCallback,
  onFail: ActionCallback
) {
  const { canisterId, amount, decimals } = token;
  const transferAmount = multiplyAndConvertToBigInt(amount, decimals);
  // any should be Transaction, but plug use `@psychedelic/plug-inpage-provider` version is too old, cause incompatible
  const TRANSACTION: any = {
    idl: dip20IdlFactory,
    canisterId,
    methodName: "approve",
    args: [Principal.fromText(routerCanisterId!), transferAmount],
    onSuccess,
    onFail,
  };
  return TRANSACTION;
}
export function airdropdip20Transfer(
  token: TransferToken,
  onSuccess: ActionCallback,
  onFail: ActionCallback
) {
  const { canisterId, amount, serverfee, decimals } = token;
  const transferAmount = multiplyAndConvertToBigInt(amount, decimals);
  // any should be Transaction, but plug use `@psychedelic/plug-inpage-provider` version is too old, cause incompatible
  const TRANSACTION: any = {
    idl: dip20IdlFactory,
    canisterId,
    methodName: "approve",
    args: [
      Principal.fromText(airdropCanisterId!),
      BigInt(new Big(transferAmount.toString()).toString()),
    ],
    onSuccess,
    onFail,
  };
  return TRANSACTION;
}
export function airdropicp(
  params: { canisterId: string; amout: string },
  onSuccess: ActionCallback,
  onFail: ActionCallback
) {
  return {
    idl: icrc2IdlFactory,
    canisterId: localIcpId,
    methodName: "icrc2_approve",
    args: [
      {
        amount: BigInt(params.amout),
        created_at_time: [],
        expected_allowance: [],
        expires_at: [],
        fee: [],
        from_subaccount: [],
        memo: [],
        spender: {
          owner: Principal.fromText(airdropCanisterId!),
          subaccount: [],
        },
      },
    ],
    onSuccess,
    onFail,
  };
}
export function dip20TransferWithTarget(
  token: TransferToken,
  onSuccess: ActionCallback,
  onFail: ActionCallback
) {
  const { canisterId, amount, decimals, to } = token;
  if (!canisterId) throw new Error("CanisterId is not exist.");
  if (!to) throw new Error("Receive address is not exist.");
  const transferAmount = multiplyAndConvertToBigInt(amount, decimals);
  // any should be Transaction, but plug use `@psychedelic/plug-inpage-provider` version is too old, cause incompatible
  const TRANSACTION: any = {
    idl: dip20IdlFactory,
    canisterId,
    methodName: "transfer",
    args: [Principal.fromText(to!), transferAmount],
    onSuccess,
    onFail,
  };
  return TRANSACTION;
}

export function icrc1Transfer(
  token: TransferToken,
  onSuccess: ActionCallback,
  onFail: ActionCallback
) {
  if (!appStore.transferAccount)
    throw new Error("Transfer Account is not exist.");
  const { canisterId, amount, decimals } = token;
  if (!canisterId) throw new Error("CanisterId is not exist.");
  if (appStore.userId.trim() === "")
    throw new Error("Transfer Pid is not exist.");
  const transferAmount = multiplyAndConvertToBigInt(amount, decimals);
  const gen_subaccount = SubAccount.fromPrincipal(
    Principal.fromText(appStore.userId)
  );
  const TRANSACTION: any = {
    idl: icrc1IdlFactory,
    canisterId,
    methodName: "icrc1_transfer",
    args: [
      {
        to: {
          owner: appStore.transferAccount.owner,
          subaccount: [gen_subaccount.toUint8Array()],
        },
        fee: [],
        memo: [],
        from_subaccount: [],
        created_at_time: [],
        amount: transferAmount,
      },
    ],
    onSuccess,
    onFail,
  };
  return TRANSACTION;
}
export async function airdropicrc1Transfer(
  token: TransferToken,
  onSuccess: ActionCallback,
  onFail: ActionCallback
) {
  if (!appStore.transferAccount)
    throw new Error("Transfer Account is not exist.");
  const { canisterId, amount, serverfee, decimals } = token;
  if (!canisterId) throw new Error("CanisterId is not exist.");
  if (appStore.userId.trim() === "")
    throw new Error("Transfer Pid is not exist.");
  const res = await getSubaccount([]);
  // console.log(res.owner.toString(), res.subaccount.toString());

  const transferAmount = multiplyAndConvertToBigInt(amount, decimals);
  const gen_subaccount = SubAccount.fromPrincipal(
    Principal.fromText(canisterId)
  );
  const TRANSACTION: any = {
    idl: icrc1IdlFactory,
    canisterId,
    methodName: "icrc1_transfer",
    args: [
      {
        to: res,
        fee: [],
        memo: [],
        from_subaccount: [],
        created_at_time: [],
        amount: BigInt(new Big(transferAmount.toString()).toString()),
      },
    ],
    onSuccess,
    onFail,
  };
  return TRANSACTION;
}
// Transfers of icp and other icrc tokens
export function icrcTransferWithTarget(
  token: TransferToken,
  onSuccess: ActionCallback,
  onFail: ActionCallback,
  isairdrop?: false
) {
  if (!appStore.transferAccount)
    throw new Error("Transfer Account is not exist.");
  const { canisterId, amount, decimals, to } = token;
  if (!canisterId) throw new Error("CanisterId is not exist.");
  if (!to) throw new Error("Receive address is not exist.");
  const transferAmount = multiplyAndConvertToBigInt(amount, decimals);

  if (canisterId === localIcpId && !isairdrop) {
    let to_address: number[] = [];
    if (isValidAccountId(token.to)) {
      to_address = AccountIdentifier.fromHex(token.to).toNumbers();
    } else if (isValidPrincipal(token.to)) {
      to_address = AccountIdentifier.fromPrincipal({
        principal: Principal.fromText(token.to),
      }).toNumbers();
    } else {
      throw new Error("Invalid ICP Address!");
    }
    return {
      idl: nnsIdlFactory,
      canisterId,
      methodName: "transfer",
      args: [
        {
          to: to_address,
          fee: { e8s: BigInt(10000) },
          amount: { e8s: BigInt(transferAmount) },
          memo: BigInt(0),
          from_subaccount: [],
          created_at_time: [],
        },
      ],
      onSuccess,
      onFail,
    };
  } else if (isValidPrincipal(token.to)) {
    return {
      idl: icrc1IdlFactory,
      canisterId,
      methodName: "icrc1_transfer",
      args: [
        {
          to: {
            owner: Principal.fromText(token.to),
            subaccount: [],
          },
          fee: [],
          memo: [],
          from_subaccount: [],
          created_at_time: [],
          amount: transferAmount,
        },
      ],
      onSuccess,
      onFail,
    };
  } else {
    throw new Error("invalid transfer");
  }
}

export function icrc2Transfer(
  token: TransferToken,
  onSuccess: ActionCallback,
  onFail: ActionCallback
) {
  const { canisterId, amount, decimals } = token;
  const transferAmount = multiplyAndConvertToBigInt(amount, decimals);
  const TRANSACTION: any = {
    idl: icrc2IdlFactory,
    canisterId,
    methodName: "icrc2_approve",
    args: [
      {
        amount: BigInt(
          new Big(transferAmount.toString()).times(1.3).round(0, 0).toString()
        ),
        spender: {
          owner: Principal.fromText(routerCanisterId),
          subaccount: [],
        },
        created_at_time: [],
        expected_allowance: [],
        expires_at: [],
        fee: [],
        from_subaccount: [],
        memo: [],
      },
    ],
    onSuccess,
    onFail,
  };
  return TRANSACTION;
}
export function airdropicrc2Transfer(
  token: TransferToken,
  onSuccess: ActionCallback,
  onFail: ActionCallback
) {
  const { canisterId, amount, serverfee, decimals } = token;
  const transferAmount = multiplyAndConvertToBigInt(amount, decimals);
  const TRANSACTION: any = {
    idl: icrc2IdlFactory,
    canisterId,
    methodName: "icrc2_approve",
    args: [
      {
        amount: BigInt(new Big(transferAmount.toString()).toString()),
        spender: {
          owner: Principal.fromText(airdropCanisterId),
          subaccount: [],
        },
        created_at_time: [],
        expected_allowance: [],
        expires_at: [],
        fee: [],
        from_subaccount: [],
        memo: [],
      },
    ],
    onSuccess,
    onFail,
  };
  return TRANSACTION;
}
export function platTokenTransfer(
  token: TransferToken,
  onSuccess: ActionCallback,
  onFail: ActionCallback
) {
  const { canisterId, amount, decimals } = token;
  const transferAmount = multiplyAndConvertToBigInt(amount, decimals);
  // any should be Transaction, but plug use `@psychedelic/plug-inpage-provider` version is too old, cause incompatible
  const TRANSACTION: any = {
    idl: icplIdlFactory,
    canisterId,
    methodName: "approve",
    args: [Principal.fromText(backendCanisterId!), transferAmount],
    onSuccess,
    onFail,
  };
  return TRANSACTION;
}

export function swap(
  swapArgs: SwapArgs,
  onSuccess: ActionCallback,
  onFail: ActionCallback
) {
  const TRANSACTION: any = {
    idl: routerIdlFactory,
    canisterId: routerCanisterId,
    methodName: "swapTokenToToken",
    args: swapArgs,
    onSuccess,
    onFail,
  };
  return TRANSACTION;
}
