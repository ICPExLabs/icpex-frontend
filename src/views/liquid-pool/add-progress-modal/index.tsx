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
import {
  canisterId as routerCanisterId,
  idlFactory as routerIdlFactory,
} from "@/canisters/icpl_router";
import {
  dip20Transfer,
  icrc1Transfer,
  icrc2Transfer,
} from "@/utils/wallet/transaction";
import type { NotificationType } from "@/components/notification";
import Notification from "@/components/notification";
import { CenterTitle } from "@/components";
import { goTransactions } from "@/utils/urls";
import { BatchTransact } from "artemis-web3-adapter";

interface PoolInfo {
  isSingle: boolean;
  methodName: string;
  args: any[];
}
export interface AddProgressModalRef {
  showModal: (
    baseToken: UserTokenUse,
    quoteToken: UserTokenUse,
    pool: PoolInfo
  ) => void;
  closeModal: () => void;
}
export interface AddProgressModalProps {
  onSuccess?: () => void;
  onFail?: () => void;
}
const AddProgressModal = forwardRef<AddProgressModalRef, AddProgressModalProps>(
  ({ onSuccess: afterSuccess, onFail: afterFail }, ref) => {
    const [open, setOpen] = useState(false);
    const [baseToken, setBaseToken] = useState<UserTokenUse>();
    const [quoteToken, setQuoteToken] = useState<UserTokenUse>();
    const [isSingle, setIsSingle] = useState<boolean>(false);
    const [progress, setProgress] = useState(0);

    // notification
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [notificationType, setNotificationType] =
      useState<NotificationType>("loading");
    const notificationConfig = useMemo(() => {
      const baseMessage = `${baseToken?.amountToUse || 0} ${
        baseToken?.symbol
      } + ${quoteToken?.amountToUse || 0} ${quoteToken?.symbol}`;
      return {
        loading: {
          message: `Add LP ${baseMessage}`,
          actionText: "View progress",
          action: () => {
            setOpen(true);
          },
        },
        success: {
          message: `Add LP ${baseMessage}`,
          actionText: "View in transactions",
          action: () => {
            goTransactions();
          },
        },
        error: {
          message: `Add LP ${baseMessage} failed`,
        },
      };
    }, [baseToken, quoteToken]);

    const liquidText = useMemo(() => {
      if (!baseToken || !quoteToken) return "";
      let tokenText = baseToken.symbol ?? "";
      tokenText += quoteToken.symbol ? ` + ${quoteToken.symbol}` : "";
      return tokenText;
    }, [baseToken, quoteToken]);

    const handleCancel = useCallback(() => {
      setOpen(false);
    }, []);

    const setNextState = useCallback(() => {
      setProgress((prevState) => prevState + 1);
    }, []);

    const handleFail = useCallback(() => {
      afterFail && afterFail();
      setNotificationType("error");
      handleCancel();
    }, [afterFail, handleCancel]);

    const handleSuccess = useCallback(() => {
      afterSuccess && afterSuccess();
      setNotificationType("success");
      handleCancel();
    }, [afterSuccess, handleCancel]);

    const createTransaction = useCallback((token: UserTokenUse) => {
      const onSuccess = (res: any) => {
        if ("Ok" in res) {
          setNextState();
        } else {
          console.error(res, "approve error");
          handleFail();
        }
      };
      const onFail = (res: any) => {
        console.error("approve error", res);
        handleFail();
      };
      const { protocol } = token;
      const transferParams = { ...token, amount: token.amountToUse };
      const transactionMap = {
        DIP20: dip20Transfer,
        "ICRC-1": icrc1Transfer,
        "ICRC-2": icrc2Transfer,
      };
      return transactionMap[protocol](transferParams, onSuccess, onFail);
    }, []);

    const addLiquidityAction = (pool: PoolInfo) => {
      const onSuccess = () => {
        handleSuccess();
      };
      const onFail = (res: any) => {
        handleFail();
        console.error(res, "add liquidity error");
      };
      const ACTION = {
        idl: routerIdlFactory,
        canisterId: routerCanisterId,
        methodName: pool.methodName,
        args: [...pool.args],
        onSuccess,
        onFail,
      } as any;
      return ACTION;
    };

    const handleTransactions: AddProgressModalRef["showModal"] = async (
      baseToken,
      quoteToken,
      pool
    ) => {
      setNextState();
      const transactions: any[] = [createTransaction(baseToken)];
      if (!pool.isSingle) transactions.push(createTransaction(quoteToken));
      transactions.push(addLiquidityAction(pool));
      try {
        await localVerity();
        await new BatchTransact(transactions, artemisWalletAdapter).execute();
      } catch (error) {
        handleFail();
        console.error(error);
      }
    };

    const showModal: AddProgressModalRef["showModal"] = (
      baseToken,
      quoteToken,
      pool
    ) => {
      setOpen(true);
      setNotificationOpen(true);
      setNotificationType("loading");
      setProgress(0);
      setIsSingle(pool.isSingle);
      setBaseToken(baseToken);
      setQuoteToken(quoteToken);
      handleTransactions(baseToken, quoteToken, pool);
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
        />
        <Modal
          width={725}
          title={<CenterTitle title="Add LP in progress" />}
          open={open}
          centered
          maskClosable={false}
          footer={false}
          onCancel={handleCancel}
        >
          <div className={styles.body}>
            <div className={styles.tip}>
              Please wait some time for transactions to finish
            </div>
            <div className={styles.progress}>
              {baseToken ? (
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
                      Approving {baseToken.symbol}
                    </div>
                  </div>
                  <div>
                    <RightOutlined className={styles.right} />
                  </div>
                </>
              ) : null}
              {!isSingle && quoteToken ? (
                <>
                  <div className={styles.item}>
                    <div
                      className={classNames(
                        styles.circle,
                        styles.check,
                        progress === 2 ? styles.active : null,
                        progress > 2 ? styles.complete : null
                      )}
                    />
                    <div className={styles.desc}>
                      Approving {quoteToken.symbol}
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
                    styles.liquid,
                    progress === (isSingle ? 2 : 3) ? styles.active : null,
                    progress > (isSingle ? 2 : 3) ? styles.complete : null
                  )}
                />
                <div className={styles.desc}>{liquidText}</div>
              </div>
            </div>
          </div>
        </Modal>
      </>
    );
  }
);

AddProgressModal.displayName = "AddProgressModal";

export default observer(AddProgressModal);
