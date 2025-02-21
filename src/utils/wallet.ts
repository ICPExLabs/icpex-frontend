import type { Principal } from "@dfinity/principal";
import { to } from "./catch";
import { createWalletActorOfBackend } from "./actors/backend";
import { createActorOfRouter } from "./actors/router";
import { icpl_backend } from "@/canisters/icpl_backend";

/* main wallet */

export async function checkTokenExist(principal: Principal, protocol: string) {
  const [_, res] = await to(icpl_backend.checkToken(principal, protocol));
  return res;
}

export async function importToken(principal: Principal, protocol: string) {
  const actor = await createWalletActorOfBackend();
  const [err] = await to(actor.importToken(principal, protocol));
  return !err;
}

/* sub wallet */

export async function withdrawal(tokenCanister: Principal, amount: bigint) {
  const actor = await createActorOfRouter();
  return actor.withdrawSubAccountToken(tokenCanister, amount);
}
