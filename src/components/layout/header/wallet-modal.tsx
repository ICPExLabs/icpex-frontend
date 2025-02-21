import { Modal } from "antd";
import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { observer } from "mobx-react";
import { PoweroffOutlined } from "@ant-design/icons";
import { Principal } from "@dfinity/principal";
import styles from "./wallet-modal.module.less";
import { disconnect } from "@/utils/wallet/connect";
import appStore from "@/store/app";
import { truncateString } from "@/utils/principal";
import { Copy, Share } from "@/components/icons";
import CenterTitle from "@/components/modal/center-title";
import icpPng from "@/assets/icp.jpg";
import { getBalanceByIcrc1 } from "@/utils/token";
import { ICP_CANISTER_ID } from "@/utils/constants";
import { icpl_oracle } from "@/canisters/icpl_oracle";
import { divideAndConvertToNumber, truncateDecimal } from "@/utils/common";
import { walletlist } from "../../../../artemis-web3-adapter/src/wallets/walletlist.js";
import { AccountIdentifier } from "@dfinity/ledger-icp";

export interface WalletModalRef {
  showModal: () => void;
}
interface WalletModalProps {}
const WalletModal = forwardRef<WalletModalRef, WalletModalProps>((_, ref) => {
  const [open, setOpen] = useState(false);
  const [icpInfo, setIcpInfo] = useState({
    balance: 0,
    price: 0,
  });
  const assets = useMemo(() => {
    return truncateDecimal(icpInfo.balance * icpInfo.price);
  }, [icpInfo]);

  const closeModal = () => {
    setOpen(false);
  };

  const handleDisconnected = () => {
    if (!appStore.userId) return;
    disconnect().then(() => {
      closeModal();
    });
  };

  const getIcpInfo = async (params: { userId: string; canisterId: string }) => {
    const balanceBigint = await getBalanceByIcrc1(params);
    const [[_, priceBigint]] = await icpl_oracle.pricesBatch([
      Principal.fromText(params.canisterId),
    ]);
    const balance = divideAndConvertToNumber(balanceBigint, 8);
    const price = divideAndConvertToNumber(priceBigint, 18);
    setIcpInfo({
      balance,
      price,
    });
  };

  const showModal: WalletModalRef["showModal"] = () => {
    setOpen(true);
    if (!appStore.userId) return;
    getIcpInfo({ userId: appStore.userId, canisterId: ICP_CANISTER_ID });
  };

  useImperativeHandle(ref, () => ({
    showModal,
  }));
  let accountId = "";
  if (appStore.userId) {
    const principal = Principal.fromText(appStore.userId);
    accountId = AccountIdentifier.fromPrincipal({ principal }).toHex();
  }
  return (
    <Modal
      title={<CenterTitle title=" Principle ID" />}
      open={open}
      onCancel={closeModal}
      footer={false}
    >
      <div className={styles.wallet}>
        <div className={styles.name}>
          {walletlist.find((item) => item.id === appStore.connectType)
            ?.walletName || "Plug"}
        </div>
        <div className={styles.principal}>
          {truncateString(appStore.userId)}
        </div>
        <Share
          href={`https://dashboard.internetcomputer.org/account/${accountId}`}
        />{" "}
        <Copy text={appStore.userId} />
      </div>
      <div className={styles.icp}>
        <div>
          <img className={styles.icplogo} src={icpPng} alt="logo" />
          ICP
        </div>
        <div className={styles["icp-right"]}>
          <div>{icpInfo.balance}</div>
          <div className={styles.total}>${assets}</div>
        </div>
      </div>
      <div className={styles.actions}>
        <div className={styles.action} onClick={handleDisconnected}>
          <div className={styles.logo}>
            <PoweroffOutlined />
          </div>
          Disconnect
        </div>
      </div>
    </Modal>
  );
});

WalletModal.displayName = "WalletModal";
export default observer(WalletModal);
