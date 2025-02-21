import {
  action,
  computed,
  makeObservable,
  observable,
  runInAction,
} from "mobx";

// import PlugController from '@psychedelic/plug-controller'
import { Principal } from "@dfinity/principal";

import type { UserToken } from "@/types/token";
import type { Account } from "@/canisters/icpl_router/icpl_router.did";
import { getSubaccount } from "@/utils/account";
import { getTokenInfo } from "@/utils/token";
import { PLAT_TOKEN_CANISTER_ID } from "@/utils/constants";
import { STORE_PRINCIPALID, STORE_WALLETTYPE } from "@/utils/wallet/connect.ts";
import { AccountIdentifier } from "@dfinity/ledger-icp";

export class AppStore {
  userId = "";
  connectType = "";
  verified = false;
  platToken?: UserToken;
  tokens: UserToken[] = [];
  transferAccount?: Account;
  constructor() {
    makeObservable(this, {
      verified: observable,
      userId: observable,
      accountId: computed,
      platToken: observable,
      tokens: observable,
      transferAccount: observable,
      setVerified: action.bound,
      setUserId: action.bound,
      setPlatToken: action.bound,
      setTokens: action.bound,
      setTransferAccount: action.bound,
    });
  }
  get accountId() {
    if (!this.userId) return "";
    const principal = Principal.fromText(this.userId);
    return AccountIdentifier.fromPrincipal({ principal }).toHex();
  }
  // get accountId() {
  //   if (!this.userId)
  //     return ''
  //   return PlugController.getAccountId(Principal.fromText(this.userId) as any)
  // }

  setVerified(bool: boolean) {
    this.verified = bool;
  }

  setUserId(userId: string) {
    this.userId = userId;
    if (userId) this.setTransferAccount();
  }

  async setPlatToken() {
    const token = await getTokenInfo(PLAT_TOKEN_CANISTER_ID);
    runInAction(() => {
      this.platToken = token;
    });
  }

  setTransferAccount() {
    runInAction(async () => {
      const res = await getSubaccount();
      this.transferAccount = res;
    });
  }

  setTokens(tokens: UserToken[]) {
    this.tokens = tokens;
  }

  setConnectType(connectType: string) {
    this.connectType = connectType;
  }
}

const appStore = new AppStore();

export async function setAppConnect(principal: string) {
  if (principal.length > 0) appStore.setUserId(principal);
}

export async function setAppConnectType(principal: string, type: string) {
  if (principal.length > 0) appStore.setConnectType(type);
}

export async function setAppDisconnect() {
  localStorage.removeItem(STORE_WALLETTYPE);
  localStorage.removeItem(STORE_PRINCIPALID);
  appStore.setUserId("");
}

export default appStore;
