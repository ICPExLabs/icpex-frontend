import { createWalletActor, createActor } from "@/utils/agent/create-actor";
import type { _SERVICE, Account, Result } from "@/canisters/faucet/faucet.did";
import { idlFactory } from "@/canisters/faucet";
import { Principal } from "@dfinity/principal";
import { canisterId } from "@/canisters/faucet";
export let canisterID: string;
if (canisterId) {
  canisterID = canisterId;
} else {
  console.error("No CANISTER_ID found in environment variables.");
}
export async function getSubaccount(Params: []): Promise<Account> {
  const Actor: _SERVICE = await createWalletActor(canisterId, idlFactory);
  return Actor.getSubaccount(...Params);
}
export async function airdrop(
  Params: [Array<[Principal, bigint]>, Principal, string]
): Promise<Result> {
  const Actor: _SERVICE = await createWalletActor(canisterId, idlFactory);
  return Actor.airdrop(...Params);
}
