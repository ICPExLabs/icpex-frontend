import type { Principal } from "@dfinity/principal";
import type { ActorMethod } from "@dfinity/agent";

export interface _SERVICE {
  addICPLedgerAddr: ActorMethod<[Principal], bigint>;
  addICPPrice: ActorMethod<[string], undefined>;
  cycles: ActorMethod<[], bigint>;
  mannualRefreshAndGetPrice: ActorMethod<
    [[] | [Principal]],
    [Array<[Principal, bigint]>, bigint, Principal]
  >;
  pricesBatch: ActorMethod<[Array<Principal>], Array<[Principal, bigint]>>;
}
