import { useCallback, useEffect, useRef, useState } from "react";
import type { Pool } from "@/types/pool";
import { getPoolList } from "@/utils/pool";
import appStore from "@/store/app";
import { ANONYMOUS_PRINCIPAL_ID } from "@/utils/constants";
import { getEarnedFee, getTokenPoolList } from "@/utils/service/token.ts";
import { getTokenInfo } from "@/utils/token.ts";

export interface FilterFunction {
  (pool: Pool): boolean;
}
export function useExplorePools(filterFunction?: FilterFunction) {
  const [pools, setPools] = useState<Pool[]>([]);
  const [filterPools, setFilterPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(false);
  const poolsRef = useRef<Pool[]>([]);

  const updatePool = useCallback(async () => {
    const [err, result] = await getTokenPoolList({ tokenId: "" });
    if (err) {
      return [];
    }
    const pools = await getPoolList(appStore.userId || ANONYMOUS_PRINCIPAL_ID);
    const updatedPools = await Promise.all(
      pools.map(async (pool) => {
        const foundItem = (result.data.data as any).find(
          (item) => item.poolId === pool.canisterId
        );
        if (foundItem?.baseSymbol !== undefined) {
          pool.base.symbol = foundItem.baseSymbol;
        } else {
          pool.base.symbol = (await getTokenInfo(pool.base.canisterId)).symbol;
        }
        if (foundItem?.quoteSymbol !== undefined) {
          pool.quote.symbol = foundItem.quoteSymbol;
        } else {
          pool.quote.symbol = (
            await getTokenInfo(pool.quote.canisterId)
          ).symbol;
        }
        if (foundItem?.volume24h !== undefined) {
          return { ...pool, volumn24h: foundItem.volume24h };
        } else {
          return pool;
        }
      })
    );
    updatedPools.sort((a, b) => b.volumn24h - a.volumn24h);
    setPools(updatedPools);
    const promiseFee = updatedPools.map(async (pool) => {
      let userEarnedFee = 0;
      const userId = appStore.userId || ANONYMOUS_PRINCIPAL_ID;
      if (userId !== ANONYMOUS_PRINCIPAL_ID && pool.hasLiquidity) {
        const [err, result] = await getEarnedFee({ poolId: pool.canisterId });
        if (!err) {
          const fee = result.data.data?.fee || 0;
          if (fee === 0 || pool.userLp === 0 || pool.totalSupply === 0) {
            userEarnedFee = 0;
          } else {
            userEarnedFee = fee * (pool.userLp / pool.totalSupply);
          }
        }
      }
      return { ...pool, userEarnedFee };
    });
    const pools_two = await Promise.all(promiseFee);
    setPools(pools_two);
    poolsRef.current = pools;
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await updatePool();
    setLoading(false);
  }, [updatePool]);

  useEffect(() => {
    refresh();
  }, [appStore.userId]);

  useEffect(() => {
    if (filterFunction) {
      const newPools = pools.filter(filterFunction);
      setFilterPools(newPools);
    }
  }, [pools, filterFunction]);

  return { pools, filterPools, loading, updatePool };
}
