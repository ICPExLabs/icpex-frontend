import type { ActorSubclass } from "@dfinity/agent";
import { createWalletActor } from "@/utils/agent/create-actor";
import type { _SERVICE } from "@/canisters/icpl_router/icpl_router.did";
import { canisterId, idlFactory } from "@/canisters/icpl_router";
import { Principal } from "@dfinity/principal";

let cachedActor: ActorSubclass<_SERVICE>;
export const createActorOfRouter = async () => {
  if (cachedActor) return cachedActor;
  cachedActor = await createWalletActor<_SERVICE>(canisterId!, idlFactory);
  return cachedActor;
};
