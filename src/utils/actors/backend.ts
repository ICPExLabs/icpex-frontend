import type { ActorSubclass } from "@dfinity/agent";
import { createWalletActor, createActor } from "@/utils/agent/create-actor";
import type { _SERVICE } from "@/canisters/icpl_backend/icpl_backend.did";
import { canisterId, idlFactory } from "@/canisters/icpl_backend";
import { Principal } from "@dfinity/principal";

let cachedWalletActor: ActorSubclass<_SERVICE>;

let cachedActor: ActorSubclass<_SERVICE>;

export const createWalletActorOfBackend = async () => {
  if (cachedWalletActor) return cachedWalletActor;
  cachedWalletActor = await createWalletActor<_SERVICE>(
    canisterId!,
    idlFactory
  );
  return cachedWalletActor;
};

export const createActorOfBackend = async () => {
  if (cachedActor) return cachedActor;
  cachedActor = await createActor<_SERVICE>(canisterId!, idlFactory);
  return cachedActor;
};
