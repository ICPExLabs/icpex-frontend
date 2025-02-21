import { createWalletActor } from "@/utils/agent/create-actor";
import type { _SERVICE } from "@/canisters/icpl_icpl/icpl_icpl.did";
import { idlFactory } from "@/canisters/icpl_icpl";

// let cachedActor: ActorSubclass<_SERVICE>
export const createActorOfDip20 = async (canisterId: string) => {
  // if (cachedActor)
  //   return cachedActor
  const cachedActor = await createWalletActor<_SERVICE>(
    canisterId!,
    idlFactory
  );
  return cachedActor;
};
