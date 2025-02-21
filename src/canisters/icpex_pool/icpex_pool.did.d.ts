import type { Principal } from "@dfinity/principal";
import type { ActorMethod } from "@dfinity/agent";

export interface _SERVICE {
  cycles: ActorMethod<[], bigint>;
  retrieve: ActorMethod<[Principal, bigint, Principal], undefined>;
  transfer: ActorMethod<[Principal, Principal, bigint], undefined>;
}
