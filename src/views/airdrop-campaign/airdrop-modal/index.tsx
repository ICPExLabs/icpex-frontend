import { Modal } from "antd";
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import classNames from "classnames";
import { RightOutlined } from "@ant-design/icons";
import { observer } from "mobx-react";
import styles from "./index.module.less";
import type { UserTokenUse } from "@/types/token";
import { artemisWalletAdapter, localVerity } from "@/utils/wallet/connect";
import { querySwapStatus } from "@/utils/swap";
import type { SwapArgs } from "@/utils/wallet/transaction";
import {
  dip20Transfer,
  icrc1Transfer,
  icrc2Transfer,
  swap,
} from "@/utils/wallet/transaction";
import { CenterTitle, Notification } from "@/components";
import type { NotificationType } from "@/components/notification";
import { goMainWallet, goSubWallet, goTransactions } from "@/utils/urls";
import type { Result_2 } from "@/canisters/icpl_router/icpl_router.did";
import { BatchTransact } from "artemis-web3-adapter";

export interface SwapModalRef {
  showModal: (
    payToken?: UserTokenUse,
    addresslist?: { address: string; amount: string }[]
  ) => void;
  closeModal: () => void;
  successTip: () => void;
}
export interface SwapModalProps {
  onSuccess?: () => void;
  onFail?: () => void;
}
const airdropModal = forwardRef<SwapModalRef, SwapModalProps>(({}, ref) => {
  const [open, setOpen] = useState(false);
  const [payToken, setPayToken] = useState<UserTokenUse>();
  const [receiveToken, setReceiveToken] = useState<UserTokenUse>();
  const [swapText, setSwapText] = useState("");
  const [progress, setProgress] = useState(0);
  const [isReject, setIsReject] = useState(false);
  const [swapError, setSwapError] = useState("");
  const onNotificationClose = useCallback(() => {
    setSwapError("");
  }, []);
  // notification
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationType, setNotificationType] =
    useState<NotificationType>("loading");
  const notificationConfig = useMemo(() => {
    const baseMessage = `${payToken?.amountToUse} ${payToken?.symbol} for ${receiveToken?.amountToUse} ${receiveToken?.symbol}`;
    const isIcrcSwapFailed =
      payToken?.protocol.toUpperCase() === "ICRC-1" && !isReject;
    const errorDescription =
      swapError ||
      (isIcrcSwapFailed
        ? "The tokens will be refunded to your sub-wallet."
        : "The tokens will be refunded to your main-wallet.");
    const errorActionText = isIcrcSwapFailed
      ? "View in sub-wallet"
      : "View in main-wallet";
    return {
      loading: {
        message: `Airdrop in progress`,
        actionText: "View progress",
        action: () => {
          setOpen(true);
        },
      },
      success: {
        message: `Airdrop successfully`,
        actionText: "",
        action: () => {
          goTransactions();
        },
      },
      error: {
        message: `Airdrop failed`,
        description: errorDescription,
        actionText: errorActionText,
        action: () => {
          if (isIcrcSwapFailed) {
            goSubWallet();
          } else {
            goMainWallet();
          }
        },
      },
    };
  }, [payToken, receiveToken, isReject, swapError]);

  const handleCancel = useCallback(() => {
    setOpen(false);
  }, []);
  const showModal: SwapModalRef["showModal"] = (
    payToken,
    addresslist: { address: string; amount: string }[]
  ) => {
    if (!payToken) {
      setOpen(true);
      return;
    }
    setOpen(true);
    setNotificationOpen(true);
    setNotificationType("loading");
    setProgress(1);
    setPayToken(payToken);
    setSwapText(`Airdrop ${payToken.symbol}`);
  };
  const successTip = () => {
    setProgress(2);
  };
  useImperativeHandle(ref, () => ({
    showModal,
    closeModal: handleCancel,
    successTip,
  }));

  return (
    <>
      {/* <Notification open={notificationOpen} type={notificationType} config={notificationConfig} onClose={onNotificationClose} /> */}
      <Modal
        width={525}
        title={<CenterTitle isAlarm={false} title="Airdrop in progress" />}
        open={open}
        centered
        footer={false}
        onCancel={handleCancel}
      >
        <div className={styles.body}>
          <div className={styles.tip}>
            Please wait some time for transactions to finish
          </div>
          <div className={styles.progress}>
            {payToken ? (
              <>
                <div className={styles.item}>
                  <div
                    className={classNames(
                      styles.circle,
                      styles.check,
                      progress === 1 ? styles.active : null,
                      progress > 1 ? styles.complete : null
                    )}
                  />
                  <div className={styles.desc}>Approving {payToken.symbol}</div>
                </div>
                <div>
                  <RightOutlined className={styles.right} />
                </div>
              </>
            ) : null}
            <div className={styles.item}>
              <div
                className={classNames(
                  styles.circle,
                  styles.swap,
                  progress === 2 ? styles.active : null,
                  progress > 2 ? styles.complete : null
                )}
              />
              <div className={styles.desc}>{swapText}</div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
});

airdropModal.displayName = "SwapModal";

export default observer(airdropModal);
