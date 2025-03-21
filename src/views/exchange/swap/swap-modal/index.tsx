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
    payToken: UserTokenUse,
    receiveToken: UserTokenUse,
    swapArgs: SwapArgs
  ) => void;
  closeModal: () => void;
}
export interface SwapModalProps {
  onSuccess?: () => void;
  onFail?: () => void;
}
const SwapModal = forwardRef<SwapModalRef, SwapModalProps>(
  ({ onSuccess: afterSuccess, onFail: afterFail }, ref) => {
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
          message: `Swap ${baseMessage}`,
          actionText: "View progress",
          action: () => {
            setOpen(true);
          },
        },
        success: {
          message: `Swapped ${baseMessage}`,
          actionText: "View in transactions",
          action: () => {
            goTransactions();
          },
        },
        error: {
          message: `Swap ${baseMessage} failed`,
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

    const handleFail = useCallback(
      (isReject = false) => {
        setIsReject(isReject);
        afterFail && afterFail();
        setNotificationType("error");
        handleCancel();
      },
      [afterFail, handleCancel]
    );

    const handleSuccess = useCallback(() => {
      afterSuccess && afterSuccess();
      setNotificationType("success");
      handleCancel();
    }, [afterSuccess, handleCancel]);

    const setNextState = () => {
      setProgress((prevState) => prevState + 1);
    };

    const payTokenTransfer = (token: UserTokenUse) => {
      const onSuccess = (res: any) => {
        if ("Ok" in res) {
          setNextState();
        } else {
          console.error(res, "approve error");
          handleFail();
        }
      };
      const onFail = (res: any) => {
        console.error(`approve ${token.symbol} error`, res);
        handleFail(true);
      };
      const { protocol } = token;
      const transferParams = { ...token, amount: token.amountToUse };
      const transactionMap = {
        DIP20: dip20Transfer,
        "ICRC-1": icrc1Transfer,
        "ICRC-2": icrc2Transfer,
      };
      return transactionMap[protocol](transferParams, onSuccess, onFail);
    };

    const queryStatus = async (order: bigint) => {
      const results = await querySwapStatus(order);
      const result = results[0];
      const status = result.status as any;
      if (status.Succeeded === null) {
        handleSuccess();
        return;
      }
      if (status.Failed === null) {
        console.error(result.fail_msg);
        handleFail();
        return;
      }
      // loop
      setTimeout(() => {
        queryStatus(order);
      }, 2000);
    };

    const swapTokens = (swapArgs: SwapArgs) => {
      const onSuccess = (res: Result_2) => {
        if ("Ok" in res) {
          queryStatus(res.Ok);
          return;
        }
        if ("Err" in res) {
          setSwapError(res.Err);
        }
        handleFail();
      };
      const onFail = (res: any) => {
        console.error("swap error", res);
        handleFail();
      };
      return swap(swapArgs, onSuccess, onFail);
    };

    const handleActions = async (
      payToken: UserTokenUse,
      swapArgs: SwapArgs
    ) => {
      setNextState();
      try {
        await localVerity();
        await new BatchTransact(
          [payTokenTransfer(payToken), swapTokens(swapArgs)],
          artemisWalletAdapter
        ).execute();
      } catch (error) {
        if (error instanceof Error) {
          console.error("catch error:", error.message);
          if (error.message.includes("reject")) {
            handleFail(true);
            return;
          }
        }
        console.error(error);
        handleFail();
      }
    };

    const showModal: SwapModalRef["showModal"] = (
      payToken,
      receiveToken,
      swapArgs
    ) => {
      setOpen(true);
      setNotificationOpen(true);
      setNotificationType("loading");
      setProgress(0);
      setPayToken(payToken);
      setReceiveToken(receiveToken);
      setSwapText(`Swap ${payToken.symbol} to ${receiveToken.symbol}`);
      handleActions(payToken, swapArgs);
    };

    useImperativeHandle(ref, () => ({
      showModal,
      closeModal: handleCancel,
    }));

    return (
      <>
        <Notification
          open={notificationOpen}
          type={notificationType}
          config={notificationConfig}
          onClose={onNotificationClose}
        />
        <Modal
          width={525}
          title={<CenterTitle title="Swap in progress" />}
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
                    <div className={styles.desc}>
                      Approving {payToken.symbol}
                    </div>
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
  }
);

SwapModal.displayName = "SwapModal";

export default observer(SwapModal);
