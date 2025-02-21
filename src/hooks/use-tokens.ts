import { useCallback, useEffect, useRef, useState } from "react";
import { useUpdateEffect } from "ahooks";
import { observe } from "mobx";
import type { UserToken } from "@/types/token";
import { getBalanceAndMax, getSelectableTokens } from "@/utils/token";
import appStore from "@/store/app";
import tokenStore from "@/store/token";
import { PLAT_TOKEN_CANISTER_ID } from "@/utils/constants";
import { sortTokens } from "@/utils/common.ts";
import Big from "big.js";

export function useTokens() {
  const [userId, setUserId] = useState(appStore.userId);
  // show token list
  const [tokens, setTokens] = useState<UserToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  // all token list
  const tokensRef = useRef<UserToken[]>([]);

  const loadTokens = useCallback(() => {
    // Only CERTIFICATION and addTokens show in list
    const tokens = tokensRef.current
      .slice(0)
      .filter(
        (token) =>
          token.source === "CERTIFICATION" ||
          tokenStore.addTokens.includes(token.canisterId)
      );
    const pinnedTokens: UserToken[] = [];
    tokenStore.pinTokens.forEach((tokenId) => {
      const index = tokens.findIndex((token) => token.canisterId === tokenId);
      if (index > -1) {
        pinnedTokens.push(tokens.splice(index, 1)[0]);
      }
    });
    const sortedTokens = pinnedTokens.concat(sortTokens(tokens));
    setTokens(sortedTokens);
  }, []);

  useEffect(() => {
    observe(
      tokenStore,
      "pinTokens",
      () => {
        loadTokens();
      },
      false
    );
    observe(
      tokenStore,
      "addTokens",
      () => {
        updateTokensBalance();
        loadTokens();
      },
      true
    );
    observe(
      appStore,
      "userId",
      ({ newValue, oldValue }) => {
        if (newValue !== oldValue) setUserId(appStore.userId);
      },
      false
    );
  }, []);

  const updateTokensBalance = async () => {
    const check_update_path =
      window.location.pathname.startsWith("/exchange") ||
      window.location.pathname.startsWith("/createPool") ||
      window.location.pathname.startsWith("/liquidPool") ||
      window.location.pathname.startsWith("/airdropCampaign") ||
      window.location.pathname.startsWith("/dashboard");
    if (!check_update_path) return;
    if (!userId || !tokensRef.current.length) return;
    const platToken = tokensRef.current.find(
      (token) => token.canisterId === PLAT_TOKEN_CANISTER_ID
    );
    // Only CERTIFICATION and addTokens show in list
    const filterTokens = tokensRef.current.filter(
      (token) =>
        token.canisterId !== PLAT_TOKEN_CANISTER_ID &&
        (token.source === "CERTIFICATION" ||
          tokenStore.addTokens.includes(token.canisterId))
    );
    const reorganizationTokensBeforeSort = platToken
      ? [platToken].concat(filterTokens)
      : filterTokens;
    const reorganizationTokens = sortTokens(reorganizationTokensBeforeSort);
    const batchSize = 5;
    const newBalances: Record<string, { balance: Big; max: Big }> = {};
    const tokens = tokensRef.current
      .slice(0)
      .filter(
        (token) =>
          token.source === "CERTIFICATION" ||
          tokenStore.addTokens.includes(token.canisterId)
      );

    for (let i = 0; i < reorganizationTokens.length; i += batchSize) {
      const batchTokens = reorganizationTokens.slice(i, i + batchSize);
      const balancePromises = batchTokens.map(async (targetToken) => {
        const { balance, max } = await getBalanceAndMax({
          ...targetToken,
          userId: appStore.userId,
        });
        newBalances[targetToken.canisterId] = { balance, max };
      });
      await Promise.all(balancePromises);
      const updatedTokensRef = tokensRef.current.map((targetToken) => ({
        ...targetToken,
        balance:
          newBalances[targetToken.canisterId] !== undefined
            ? newBalances[targetToken.canisterId].balance
            : targetToken.balance,
        max:
          newBalances[targetToken.canisterId] !== undefined
            ? newBalances[targetToken.canisterId].max
            : targetToken.max,
      }));
      const updatedTokens = tokens.map((targetToken) => ({
        ...targetToken,
        balance:
          newBalances[targetToken.canisterId] !== undefined
            ? newBalances[targetToken.canisterId].balance
            : targetToken.balance,
        max:
          newBalances[targetToken.canisterId] !== undefined
            ? newBalances[targetToken.canisterId].max
            : targetToken.max,
      }));
      tokensRef.current = updatedTokensRef;
      setTokens(sortTokens(updatedTokens));
      appStore.setTokens(sortTokens(updatedTokens));
    }
  };
  const updateBalance = useCallback(() => {
    if (userId) {
      setRefreshCount(refreshCount + 1);
    }
  }, [userId, refreshCount]);

  const getTokens = useCallback(async () => {
    const newTokens = await getSelectableTokens();
    tokensRef.current = newTokens;
    setTokens(newTokens);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await getTokens();
    loadTokens();
    setLoading(false);
    if (userId) {
      setRefreshCount(refreshCount + 1);
    }
  }, [userId, refreshCount]);

  useEffect(() => {
    refresh();
  }, [userId]);

  useUpdateEffect(() => {
    updateTokensBalance();
    let intervalId: any;
    let onRefresh = false;
    let lastTaskCompletionTimestamp = Date.now();
    const func = async () => {
      intervalId = setInterval(() => {
        const milessecondsSinceLastTaskCompletion = Math.floor(
          Date.now() - lastTaskCompletionTimestamp
        );
        if (
          appStore.userId !== "aaaaa-aa" &&
          appStore.userId &&
          !onRefresh &&
          milessecondsSinceLastTaskCompletion > 15000
        ) {
          onRefresh = true;
          updateTokensBalance();
          onRefresh = false;
          lastTaskCompletionTimestamp = Date.now();
        }
      }, 15000);
    };
    func();
    return () => {
      clearInterval(intervalId);
    };
  }, [refreshCount]);

  return { tokens, loading, updateBalance, refresh, tokensRef };
}
