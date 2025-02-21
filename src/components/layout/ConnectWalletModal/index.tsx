import { Modal, Checkbox } from "antd";
import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { observer } from "mobx-react";
import { Principal } from "@dfinity/principal";
import styles from "./index.module.less";
import { disconnect, requestConnect } from "@/utils/wallet/connect";
import appStore from "@/store/app";
import CenterTitle from "@/components/modal/center-title";
import { getBalanceByIcrc1 } from "@/utils/token";
import { ICP_CANISTER_ID } from "@/utils/constants";
import { icpl_oracle } from "@/canisters/icpl_oracle";
import { divideAndConvertToNumber, truncateDecimal } from "@/utils/common";
import { walletlist } from "../../../../artemis-web3-adapter/src/wallets/walletlist";
import type { CheckboxChangeEvent } from "antd/es/checkbox";
import fillLogo from "@/assets/check-circle-fill.svg";
import classNames from "classnames";

export interface ConnectWalletModallRef {
  showModal: () => void;
}
interface ConnectWalletModalProps {}
const ConnectWalletModal = forwardRef<
  ConnectWalletModallRef,
  ConnectWalletModalProps
>((_, ref) => {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(true);
  const [curType, setCurType] = useState("");

  const closeModal = () => {
    setOpen(false);
    setCurType("");
    setChecked(true);
  };

  const showModal: ConnectWalletModallRef["showModal"] = () => {
    setOpen(true);
    if (!appStore.userId) return;
  };

  useImperativeHandle(ref, () => ({
    showModal,
  }));

  const handleChange = (e: CheckboxChangeEvent) => {
    setChecked(e.target.checked);
  };

  const handleConnect = (type: string) => {
    setCurType(type);
    requestConnect(type);
    closeModal();
  };

  return (
    <Modal
      title={<CenterTitle title=" Connect Wallet" />}
      width={358}
      open={open}
      onCancel={closeModal}
      footer={false}
    >
      <div className={styles.service}>
        <Checkbox checked={checked} onChange={handleChange} />{" "}
        <span className={styles.prefixTip}>
          I have read, understand and agree to the{" "}
        </span>
        <a
          href="https://docs.icpex.org/legal-and-privacy/terms-of-service"
          target="_blank"
          rel="noreferrer"
        >
          <span className={styles.readTip}>Terms of Service</span>
        </a>
        .
      </div>
      {walletlist.map((item) => {
        const isActive = curType === item.id || checked;
        return (
          <div
            className={classNames(
              styles.walletContainer,
              checked && styles.walletActive
            )}
            key={item.id}
            onClick={() => handleConnect(item.id)}
          >
            <div className={styles.imgContainer}>
              <img
                className={classNames(
                  styles.iconWallet,
                  isActive && styles.active
                )}
                src={item.icon}
              />
              <span
                className={classNames(
                  styles.iconName,
                  isActive && styles.active
                )}
              >
                {item.name}{" "}
              </span>
            </div>
            {curType === item.id && (
              <img className={styles.fillLogo} src={fillLogo} />
            )}
          </div>
        );
      })}
    </Modal>
  );
});

ConnectWalletModal.displayName = "ConnectWalletModal";
export default observer(ConnectWalletModal);
