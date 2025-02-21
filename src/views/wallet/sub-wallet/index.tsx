import type { FC } from "react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import TokenBar from "../token-bar";
import TokenList from "./list";
import type { WithdrawModalModalRef } from "./withdraw-modal";
import WithdrawModal from "./withdraw-modal";
import { getSubWalletTokens } from "@/utils/token";
import type { SubWalletToken } from "@/types/token";
import WalletInfo from "@/views/wallet/wallet-info";
import { truncateString } from "@/utils/principal.ts";
import { getPrincipalDashboardURL } from "@/utils/urls.ts";
import { SubAccount } from "@dfinity/ledger-icp";
import { Principal } from "@dfinity/principal";
import appStore from "@/store/app.ts";
import Big from "big.js";

interface WalletProps {
  userId: string;
  accountId: string;
}
const SubWallet: FC<WalletProps> = ({ userId }) => {
  const [loading, setLoading] = useState(false);
  const [hideZeroBalance, setHideZeroBalance] = useState(false);
  const [searchCanister, setSearchCanister] = useState("");
  const [tokens, setTokens] = useState<SubWalletToken[]>([]);
  const filterTokens = useMemo(() => {
    return tokens.filter((token) => {
      if (hideZeroBalance) {
        if (token?.balance === undefined || token?.balance.lte(Big(0)))
          return false;
      }
      if (searchCanister) {
        const lowerSearch = searchCanister.toLowerCase();
        if (
          !token.canisterId.includes(lowerSearch) &&
          !token.symbol.toLowerCase().includes(lowerSearch)
        )
          return false;
      }
      return true;
    });
  }, [tokens, hideZeroBalance, searchCanister]);
  const info = useMemo(() => {
    let user_pid = Principal.anonymous();
    try {
      user_pid = Principal.fromText(appStore?.userId);
    } catch (e) {
      console.warn("invalid pid:{}", e);
    }
    let sub_account_string: string[] = [];
    if (
      user_pid.toText() !== Principal.anonymous().toText() &&
      user_pid.toText() !== Principal.managementCanister().toText()
    ) {
      const gen_subaccount = SubAccount.fromPrincipal(
        Principal.fromText(appStore.userId)
      );
      sub_account_string = gen_subaccount
        .toUint8Array()
        .toString()
        .split(",")
        .map((num) => Number(num).toString(16).toUpperCase().padStart(2, "0"));
    }
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
          label: "Subaccount ID: ",
          id: truncateString(sub_account_string.toString()),
          copyText: sub_account_string,
        },
      ],
    };
  }, [userId]);
  const getList = useCallback(async () => {
    setLoading(true);
    const newTokens = await getSubWalletTokens();
    setLoading(false);
    newTokens.length && setTokens(newTokens);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    getList();
  }, [userId]);

  const withdrawModalRef = useRef<WithdrawModalModalRef>(null);
  const openModal = (token: SubWalletToken) => {
    if (token.balance.lte(Big(0))) return;
    withdrawModalRef.current?.openModal(token);
  };
  return (
    <>
      <WalletInfo {...info} />
      <TokenBar
        hide={hideZeroBalance}
        onHideChange={setHideZeroBalance}
        searchCanister={searchCanister}
        onSeachChange={setSearchCanister}
      />
      <TokenList
        data={filterTokens}
        loading={loading}
        onWithdrawal={openModal}
      />
      <WithdrawModal ref={withdrawModalRef} />
    </>
  );
};

export default SubWallet;
