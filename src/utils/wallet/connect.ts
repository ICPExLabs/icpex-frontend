import { Artemis } from "artemis-web3-adapter";
import { host, whitelist } from "@/utils/env";
import {
  setAppConnect,
  setAppDisconnect,
  setAppConnectType,
} from "@/store/app";

export const artemisWalletAdapter = new Artemis();

export const STORE_PRINCIPALID = "principalId";
export const STORE_WALLETTYPE = "walletType";

export async function localVerity() {
  if (process.env.DFX_NETWORK !== "ic") {
    try {
      await artemisWalletAdapter.isLoaded();
    } catch (e) {
      console.warn(
        "Unable to fetch root key. Check to ensure that your local replica is running"
      );
      console.error(e);
    }
  }
}

export async function isConnect() {
  const result = await artemisWalletAdapter.principalId;
  return !!result;
}

export async function disconnect() {
  const timer = new Promise((resolve) => setTimeout(() => resolve(true), 1000));
  let result;
  try {
    // bug: sometimes disconnect always in pending status
    await artemisWalletAdapter.disconnect();
    const agree_res = localStorage.getItem("agreeRisk");
    localStorage.clear();
    localStorage.setItem("agreeRisk", agree_res ? "false" : "true");
    result = await Promise.race([timer, disconnect]);
  } catch (error) {
    console.error(error);
  }
  // set app state
  setAppDisconnect();
  return result;
}

export async function requestConnect(type = "plug") {
  try {
    const publicKey = await artemisWalletAdapter.connect(type, {
      whitelist,
      host,
    });
    if (publicKey) {
      localStorage.setItem(STORE_PRINCIPALID, publicKey);
      localStorage.setItem(STORE_WALLETTYPE, type);
      // set app state
      setAppConnect(publicKey);
      setAppConnectType(publicKey, type);
    }

    return !!publicKey;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error);
    return false;
  }
}

export async function verifyConnectionAndAgent() {
  let principalId = localStorage.getItem(STORE_PRINCIPALID);
  let type = localStorage.getItem(STORE_WALLETTYPE);
  if (!!principalId && principalId !== "false") {
    requestConnect(type);
    return true;
  } else {
    return false;
  }
}
