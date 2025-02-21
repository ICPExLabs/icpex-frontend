import type { ActorSubclass } from "@dfinity/agent";
import { createActor } from "../agent/create-actor";
import type { _SERVICE as DIP20_SERVICE } from "@/canisters/icpl_icpl/icpl_icpl.did";
import { idlFactory as dip20IdlFactory } from "@/canisters/icpl_icpl";
import type { _SERVICE as ICRC1_SERVICE } from "@/canisters/icrc1_ledger/icrc1_ledger.did";
import { idlFactory as icrc1IdlFactory } from "@/canisters/icrc1_ledger";
import type { _SERVICE as ICRC2_SERVICE } from "@/canisters/icrc2_ledger/icrc2_ledger.did";
import { idlFactory as icrc2IdlFactory } from "@/canisters/icrc2_ledger";

// cache actors
const cachedActorMap: { [key: string]: ActorSubclass<any> } = {};

// tokens of various protocols to create actor

// dip20
export function createDip20Actor(
  canisterId: string
): ActorSubclass<DIP20_SERVICE> {
  if (cachedActorMap[canisterId]) return cachedActorMap[canisterId];
  cachedActorMap[canisterId] = createActor<DIP20_SERVICE>(
    canisterId,
    dip20IdlFactory
  );
  return cachedActorMap[canisterId];
}

// icrc1
export function createIcrc1Actor(
  canisterId: string
): ActorSubclass<ICRC1_SERVICE> {
  if (cachedActorMap[canisterId]) return cachedActorMap[canisterId];
  cachedActorMap[canisterId] = createActor<ICRC1_SERVICE>(
    canisterId,
    icrc1IdlFactory
  );
  return cachedActorMap[canisterId];
}

// icrc2
export function createIcrc2Actor(
  canisterId: string
): ActorSubclass<ICRC2_SERVICE> {
  if (cachedActorMap[canisterId]) return cachedActorMap[canisterId];
  cachedActorMap[canisterId] = createActor<ICRC2_SERVICE>(
    canisterId,
    icrc2IdlFactory
  );
  return cachedActorMap[canisterId];
}
