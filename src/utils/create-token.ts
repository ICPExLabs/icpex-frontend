import { Principal } from "@dfinity/principal";
import {
  createActorOfBackend,
  createWalletActorOfBackend,
} from "./actors/backend";
import { createDip20Actor, createIcrc2Actor } from "./actors/token";
import { createActorOfDip20 } from "./actors/dip20";
import type { _SERVICE } from "@/canisters/icpl_backend/icpl_backend.did";
import type { _SERVICE as _SERVICEICRC2 } from "@/canisters/icrc2_ledger/icrc2_ledger.did";

// @ts-expect-error no withOptions
export const createToken: _SERVICE["createToken"] = async (...params) => {
  const actor = await createWalletActorOfBackend();
  return actor.createToken(...params);
};

// @ts-expect-error no withOptions
export const addToken: _SERVICE["mintToken"] = async (...params) => {
  const actor = await createWalletActorOfBackend();
  return actor.mintToken(...params);
};

// @ts-expect-error no withOptions
export const removeToken: _SERVICE["removeTokensControllers"] = async (
  ...params
) => {
  const actor = await createWalletActorOfBackend();
  return actor.removeTokensControllers(...params);
};

// @ts-expect-error no withOptions
export const getTokenCnt: _SERVICE["getTokenCnt"] = async (...params) => {
  const actor = await createActorOfBackend();
  return actor.getTokenCnt(...params);
};

// @ts-expect-error no withOptions
export const setOwner: _SERVICE["setOwner"] = async (canisterId: string) => {
  const actor = await createActorOfDip20(canisterId);
  return actor.setOwner(Principal.fromText("aaaaa-aa"));
};

// @ts-expect-error no withOptions
export const setICRC2Owner: _SERVICEICRC2["icrc_plus_set_owner"] = async (
  canisterId: string,
  owner: string
) => {
  const actor = await createIcrc2Actor(canisterId);
  return actor.icrc_plus_set_owner({ owner: Principal.fromText("aaaaa-aa") });
};

// @ts-expect-error no withOptions
export const getICRC2Holders: _SERVICEICRC2["icrc_plus_holders_count"] = async (
  canisterId: string
) => {
  const actor = await createIcrc2Actor(canisterId);
  return actor.icrc_plus_holders_count();
};
