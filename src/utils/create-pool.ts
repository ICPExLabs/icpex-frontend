import { Principal } from "@dfinity/principal";
import { createActorOfRouter } from "./actors/router";
import type { _SERVICE } from "@/canisters/icpl_router/icpl_router.did";

// @ts-expect-error no withOptions
export const createPublicPool: _SERVICE["createCommonPool"] = async (
  ...args: [
    Principal,
    Principal,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    [] | [boolean]
  ]
) => {
  const actor = await createActorOfRouter();
  return actor.createCommonPool(...args);
};

// @ts-expect-error no withOptions
export const createPrivatePool: _SERVICE["createPrivatePool"] = async (
  ...args: [
    Principal,
    Principal,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    [] | [boolean]
  ]
) => {
  const actor = await createActorOfRouter();
  return actor.createPrivatePool(...args);
};

// @ts-expect-error no withOptions
export const createAnchoredPool: _SERVICE["createStablePool"] = async (
  ...args: [
    Principal,
    Principal,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    [] | [boolean]
  ]
) => {
  const actor = await createActorOfRouter();
  return actor.createStablePool(...args);
};

// @ts-expect-error no withOptions
export const addLiquidityOfPublic: _SERVICE["addLiquidity"] = async (
  ...args
) => {
  const actor = await createActorOfRouter();
  return actor.addLiquidity(...args);
};

// @ts-expect-error no withOptions
export const addLiquidityOfAnchored: _SERVICE["addStableLiquidity"] = async (
  ...args
) => {
  const actor = await createActorOfRouter();
  return actor.addStableLiquidity(...args);
};

// @ts-expect-error no withOptions
export const addLiquidityOfPrivate: _SERVICE["addPrivateLiquidity"] = async (
  ...args
) => {
  const actor = await createActorOfRouter();
  return actor.addPrivateLiquidity(...args);
};

// @ts-expect-error no withOptions
export const resetParameterOfPrivate: _SERVICE["resetParamPrivatePool"] =
  async (...args) => {
    const actor = await createActorOfRouter();
    return actor.resetParamPrivatePool(...args);
  };

// @ts-expect-error no withOptions
export const removeLiquidity: _SERVICE["sellShares"] = async (...args) => {
  const actor = await createActorOfRouter();
  return actor.sellShares(...args);
};

// @ts-expect-error no withOptions
export const lockLiquidity: _SERVICE["lockLiquidity"] = async (...args) => {
  const actor = await createActorOfRouter();
  return actor.lockLiquidity(...args);
};
// transferLiquidity
export const transferLiquidity = async (
  params: [Principal, Principal, bigint]
) => {
  const cachedActor: _SERVICE = await createActorOfRouter();
  return cachedActor.transferLiquidity(...params);
};
