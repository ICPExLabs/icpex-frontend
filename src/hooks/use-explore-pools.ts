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

  // const updatePool = useCallback(async () => {
  //   const [err, result] = await getTokenPoolList({ tokenId: "" });
  //   if (err) {
  //     return [];
  //   }
  //   const pools = await getPoolList(appStore.userId || ANONYMOUS_PRINCIPAL_ID);
  //   const updatedPools = await Promise.all(
  //     pools.map(async (pool) => {
  //       const foundItem = (result.data.data as any).find(
  //         (item) => item.poolId === pool.canisterId
  //       );
  //       if (foundItem?.baseSymbol !== undefined) {
  //         pool.base.symbol = foundItem.baseSymbol;
  //       } else {
  //         pool.base.symbol = (await getTokenInfo(pool.base.canisterId)).symbol;
  //       }
  //       if (foundItem?.quoteSymbol !== undefined) {
  //         pool.quote.symbol = foundItem.quoteSymbol;
  //       } else {
  //         pool.quote.symbol = (
  //           await getTokenInfo(pool.quote.canisterId)
  //         ).symbol;
  //       }
  //       if (foundItem?.volume24h !== undefined) {
  //         return { ...pool, volumn24h: foundItem.volume24h };
  //       } else {
  //         return pool;
  //       }
  //     })
  //   );

  //   updatedPools.sort((a, b) => b.volumn24h - a.volumn24h);
  //   setPools(updatedPools);
  //   const promiseFee = updatedPools.map(async (pool) => {
  //     let userEarnedFee = 0;
  //     const userId = appStore.userId || ANONYMOUS_PRINCIPAL_ID;
  //     if (userId !== ANONYMOUS_PRINCIPAL_ID && pool.hasLiquidity) {
  //       const [err, result] = await getEarnedFee({ poolId: pool.canisterId });
  //       if (!err) {
  //         const fee = result.data.data?.fee || 0;
  //         if (fee === 0 || pool.userLp === 0 || pool.totalSupply === 0) {
  //           userEarnedFee = 0;
  //         } else {
  //           userEarnedFee = fee * (pool.userLp / pool.totalSupply);
  //         }
  //       }
  //     }
  //     return { ...pool, userEarnedFee };
  //   });
  //   const pools_two = await Promise.all(promiseFee);
  //   setPools(pools_two);
  //   poolsRef.current = pools;
  // }, []);

  const updatePool = useCallback(async () => {
    try {
      const [err, result] = await getTokenPoolList({ tokenId: "" });
      if (err) {
        console.error("Failed to get token pool list:", err);
        return;
      }

      const pools = await getPoolList(
        appStore.userId || ANONYMOUS_PRINCIPAL_ID
      );

      // 使用 allSettled 代替 all 确保单个失败不影响整体
      const settledPools = await Promise.allSettled(
        pools.map(async (pool) => {
          try {
            const foundItem = (result.data.data as any).find(
              (item) => item.poolId === pool.canisterId
            );

            // 处理 base symbol
            let baseSymbol = pool.base.symbol;
            if (foundItem?.baseSymbol) {
              baseSymbol = foundItem.baseSymbol;
            } else {
              try {
                baseSymbol = (await getTokenInfo(pool.base.canisterId)).symbol;
              } catch (e) {
                console.warn(
                  `Failed to get base token info for ${pool.base.canisterId}`,
                  e
                );
              }
            }

            // 处理 quote symbol
            let quoteSymbol = pool.quote.symbol;
            if (foundItem?.quoteSymbol) {
              quoteSymbol = foundItem.quoteSymbol;
            } else {
              try {
                quoteSymbol = (await getTokenInfo(pool.quote.canisterId))
                  .symbol;
              } catch (e) {
                console.warn(
                  `Failed to get quote token info for ${pool.quote.canisterId}`,
                  e
                );
              }
            }

            return {
              ...pool,
              base: { ...pool.base, symbol: baseSymbol },
              quote: { ...pool.quote, symbol: quoteSymbol },
              volumn24h: foundItem?.volume24h || pool.volumn24h || 0,
            };
          } catch (e) {
            console.error("Error processing pool:", pool.canisterId, e);
            return pool; // 返回原始 pool 作为 fallback
          }
        })
      );

      // 过滤出成功的结果
      const updatedPools = settledPools
        .map((result) => (result.status === "fulfilled" ? result.value : null))
        .filter(Boolean) as Pool[];

      updatedPools.sort((a, b) => (b.volumn24h || 0) - (a.volumn24h || 0));

      // 处理收益时也使用 allSettled
      const feeResults = await Promise.allSettled(
        updatedPools.map(async (pool) => {
          try {
            let userEarnedFee = 0;
            const userId = appStore.userId || ANONYMOUS_PRINCIPAL_ID;

            if (userId !== ANONYMOUS_PRINCIPAL_ID && pool.hasLiquidity) {
              const [err, result] = await getEarnedFee({
                poolId: pool.canisterId,
              });
              if (!err && result?.data?.data) {
                const fee = result.data.data.fee || 0;
                userEarnedFee =
                  pool.userLp > 0 && pool.totalSupply > 0
                    ? fee * (pool.userLp / pool.totalSupply)
                    : 0;
              }
            }
            return { ...pool, userEarnedFee };
          } catch (e) {
            console.error(
              "Error calculating fee for pool:",
              pool.canisterId,
              e
            );
            return { ...pool, userEarnedFee: 0 }; // 返回默认值
          }
        })
      );

      // 过滤出成功的结果
      const pools_two = feeResults
        .map((result) => (result.status === "fulfilled" ? result.value : null))
        .filter(Boolean) as Pool[];

      setPools(pools_two);
      poolsRef.current = pools_two;
    } catch (error) {
      console.error("Global error in updatePool:", error);
      setPools([]); // 确保状态被清空
    }
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
