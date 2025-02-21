import type { FC } from "react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { observer } from "mobx-react";
import { Principal } from "@dfinity/principal";
import WalletInfo from "../wallet-info";
import TokenBar from "../token-bar";
import type { AddTokenModalRef } from "../add-token-modal";
import AddTokenModal from "../add-token-modal";
import TokenList from "./list";
import { truncateString } from "@/utils/principal";
import { getAccountDashboardURL, getPrincipalDashboardURL } from "@/utils/urls";
import {
  getBalance,
  getBalanceBig,
  transformTokenInfoToMainWalletToken,
} from "@/utils/token";
import type { WalletTokenBig } from "@/types/token";
import tokenStore from "@/store/token";
import { icpl_backend } from "@/canisters/icpl_backend";
import { icpl_oracle } from "@/canisters/icpl_oracle";
import { divideAndConvertToNumber, sortTokens } from "@/utils/common.ts";
import appStore from "@/store/app.ts";
import Big from "big.js";

interface WalletProps {
  userId: string;
  accountId: string;
}
const MainWallet: FC<WalletProps> = ({ userId, accountId }) => {
  const info = useMemo(() => {
    return {
      assets: "0.0",
      ids: [
        {
          label: "Principle ID: ",
          id: truncateString(userId),
          shareHref: getPrincipalDashboardURL(userId),
          copyText: userId,
        },
        {
          label: "Account ID: ",
          id: truncateString(accountId),
          shareHref: getAccountDashboardURL(accountId),
          copyText: accountId,
        },
      ],
    };
  }, [userId, accountId]);

  const [loading, setLoading] = useState(false);
  const [hideZeroBalance, setHideZeroBalance] = useState(false);
  const [searchCanister, setSearchCanister] = useState("");
  const [tokens, setTokens] = useState<WalletTokenBig[]>([]);
  let tokensValue = tokens;

  const filterTokens = useMemo(() => {
    return tokens.filter((token) => {
      if (hideZeroBalance) {
        if (token.balance.lte(Big(0))) return false;
      }
      if (searchCanister) {
        const lowerSearch = searchCanister.toLowerCase();
        if (
          !token.canisterId.includes(lowerSearch) &&
          !token.symbol.toLowerCase().includes(lowerSearch)
        )
          return false;
      }
      if (token.source !== "CERTIFICATION") {
        if (!tokenStore.addTokens.includes(token.canisterId)) {
          return false;
        }
      }
      return true;
    });
  }, [tokens, hideZeroBalance, searchCanister, tokenStore.addTokens]);

  const getList = useCallback(async () => {
    setLoading(true);
    const list = sortTokens(await icpl_backend.getTokenInfo());
    const requests = list.map(async (item) => {
      const token = transformTokenInfoToMainWalletToken(item);
      return {
        ...token,
      };
    });
    const tokens = await Promise.all(requests);
    setLoading(false);
    tokensValue = tokens.filter(
      (item) =>
        item.source === "CERTIFICATION" ||
        tokenStore.addTokens.includes(item.canisterId)
    );
    setTokens(tokens);
  }, [userId]);

  const getAsyncList = useCallback(
    async (userId: string) => {
      if (tokensValue.length > 0) {
        // Only CERTIFICATION and addTokens show in list
        let newTokens: WalletTokenBig[] = [];
        const batchSize = 10;
        tokensValue = sortTokens(tokensValue);
        for (let i = 0; i < tokensValue.length; i += batchSize) {
          if (appStore.userId !== userId) break;
          const batch = tokensValue.slice(i, i + batchSize);
          const canisterIds = tokensValue.map((item) =>
            Principal.fromText(item.canisterId)
          );
          const prices = await icpl_oracle.pricesBatch(canisterIds);
          const priceMap = new Map(
            prices.map(([principal, bigint]) => [principal.toText(), bigint])
          );
          try {
            const promises = batch.map(async (item) => {
              try {
                const balance = await getBalanceBig({ ...item, userId });
                const price_int = priceMap.get(item.canisterId);
                const price = divideAndConvertToNumber(
                  price_int === null ? Number(0) : Number(price_int),
                  18
                );
                return {
                  ...item,
                  balance: balance,
                  price: Number.isNaN(price) ? 0 : price,
                };
              } catch (error) {
                console.error("Error fetching data:", error);
                return {
                  ...item,
                  balance: Big(0),
                  price: 0,
                };
              }
            });
            const results = await Promise.all(promises);
            newTokens = [];

            tokensValue.forEach((result) => {
              if (
                !results.some((token) => token.canisterId === result.canisterId)
              ) {
                newTokens.push(result);
              }
            });
            newTokens.push(...results);
            newTokens = sortTokens(newTokens);
            setTokens([...newTokens]);
            tokensValue = newTokens;
          } catch (error) {
            console.error("Error processing batch:", error);
          }
        }
      }
    },
    [userId, setLoading, tokenStore.addTokens]
  );

  const refresh = async () => {
    await getList();
    await getAsyncList(appStore.userId);
  };

  useEffect(() => {
    if (!appStore.userId) return;
    refresh();
  }, [appStore.userId]);

  const addTokenModalRef = useRef<AddTokenModalRef>(null);
  const handleAdd = () => {
    if (!userId) return;
    addTokenModalRef.current?.show(userId);
  };

  return (
    <>
      <WalletInfo {...info} />
      <TokenBar
        isMain
        hide={hideZeroBalance}
        onHideChange={setHideZeroBalance}
        searchCanister={searchCanister}
        onSeachChange={setSearchCanister}
        onAdd={handleAdd}
      />
      <TokenList
        data={filterTokens}
        loading={loading}
        refreshHandler={refresh}
      />
      <AddTokenModal ref={addTokenModalRef} onRefresh={refresh} />
    </>
  );
};

export default observer(MainWallet);
