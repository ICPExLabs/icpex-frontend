import { Input, Modal } from "antd";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { Principal } from "@dfinity/principal";
import classNames from "classnames";
import { observer } from "mobx-react";
import { BatchTransact } from "artemis-web3-adapter";
import styles from "./index.module.less";
import { CenterTitle, CommonButton, Notification } from "@/components";
import type { NotificationType } from "@/components/notification";
import appStore from "@/store/app";
import Big from "big.js";
import {
  divideAndConvertToBig,
  formatAmountByUnit,
  isValidAccountId,
  isValidAmount,
  isValidPrincipal,
} from "@/utils/common";
import type { WalletTokenBig } from "@/types/token.ts";
import { icpl_backend } from "@/canisters/icpl_backend";
import {
  dip20TransferWithTarget,
  icrcTransferWithTarget,
} from "@/utils/wallet/transaction.ts";
import { canisterId as localIcpId } from "@/canisters/icrc2_ledger";
import { computeFeeBig } from "@/utils/fee.ts";
import { artemisWalletAdapter } from "@/utils/wallet/connect.ts";
import { AccountIdentifier } from "@dfinity/ledger-icp";
import { DECIMALS } from "@/utils/constants.ts";

interface TransferTokenModalProps {
  open: boolean;
  closeModal: () => void;
  tokenInfo: WalletTokenBig;
  refreshHandler?: () => void;
}

const TransferTokenModal: React.FC<TransferTokenModalProps> = (props) => {
  const { open, closeModal, tokenInfo, refreshHandler } = props;
  const { canisterId, symbol, balance } = tokenInfo;
  const [maxBalance, setMaxBalance] = useState<Big>(Big(0));
  const [transferFee, setTransferFee] = useState<Big>(Big(0));
  const [burnFee, setBurnFee] = useState<Big>(Big(0));
  const [loading, setLoading] = useState(false);
  const [basicInfo, setBasicInfo] = useState(null as any);
  // notification
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationType, setNotificationType] =
    useState<NotificationType>("loading");
  const [notificationMsg, setNotificationMsg] = useState("");

  const [principalOrAddress, setPrincipalOrAddress] = useState("");
  const [amount, setAmount] = useState("");

  const [amountDangerFlag, setAmountDangerFlag] = useState(false);
  const [toDangerFlag, setToDangerFlag] = useState(false);
  const [showTransfer, setShowTransfer] = useState(true);
  const [trasnferOwnAccount, setTrasnferOwnAccount] = useState(false);

  const notificationConfig = useMemo(() => {
    return {
      loading: {
        message: `Transfer ${amount} ${symbol} to ${principalOrAddress}`,
      },
      success: {
        message: "Transfer successfully",
      },
      error: {
        message: `Transfer failed! ${notificationMsg} `,
      },
    };
  }, [symbol, amount, principalOrAddress, notificationMsg]);

  const closeNotification = () => {
    setNotificationOpen(false);
  };

  const handleClose = () => {
    setAmount("");
    setPrincipalOrAddress("");
    setShowTransfer(true);
    setMaxBalance(Big(0));
    closeModal();
    setLoading(false);
  };

  const getTokenBasicInfo = async (tokenId: any, amount: string) => {
    // const result = await icpl_backend.getToken((Principal.fromText(tokenId)))
    if (tokenId !== undefined && amount !== undefined && amount.trim() !== "") {
      const result = await icpl_backend.getToken(Principal.fromText(tokenId));
      const tmpTransferFee = result.flat_fee
        ? divideAndConvertToBig(result.fee_rate, result.decimals, 18)
        : divideAndConvertToBig(result.fee_rate, DECIMALS, 18);
      const tmpBurnFee = result.flat_burn_fee
        ? divideAndConvertToBig(result.burn_rate, result.decimals, 18)
        : divideAndConvertToBig(result.burn_rate, DECIMALS, 18);
      const transferFee = computeFeeBig({
        amount: Big(amount),
        isFixed: result.flat_fee,
        fee: tmpTransferFee,
      });
      const burnFee = computeFeeBig({
        amount: Big(amount),
        isFixed: result.flat_burn_fee,
        fee: tmpBurnFee,
      });

      setTransferFee(transferFee);
      setBurnFee(burnFee);
      setBasicInfo(result);
      const tmb = Big(tokenInfo.balance).minus(transferFee).minus(burnFee);
      setMaxBalance(tmb);
      return tmb;
    }
  };

  useEffect(() => {
    if (open && basicInfo != null) {
      const tmpTransferFee = basicInfo.flat_fee
        ? divideAndConvertToBig(basicInfo.fee_rate, basicInfo.decimals, 18)
        : divideAndConvertToBig(basicInfo.fee_rate, DECIMALS, 18);
      const tmpBurnFee = basicInfo.flat_burn_fee
        ? divideAndConvertToBig(basicInfo.burn_rate, basicInfo.decimals, 18)
        : divideAndConvertToBig(basicInfo.burn_rate, DECIMALS, 18);
      const transferFee = computeFeeBig({
        amount: Big(amount === "" ? Big(0) : Big(amount)),
        isFixed: basicInfo.flat_fee,
        fee: tmpTransferFee,
      });
      const burnFee = computeFeeBig({
        amount: Big(amount === "" ? Big(0) : Big(amount)),
        isFixed: basicInfo.flat_burn_fee,
        fee: tmpBurnFee,
      });
      setTransferFee(transferFee);
      setBurnFee(burnFee);
    }
  }, [open, basicInfo, amount]);

  useEffect(() => {
    getTokenBasicInfo(canisterId, tokenInfo.balance?.toString());
  }, [open, appStore.userId, tokenInfo.balance]);

  const showMax = useMemo(() => {
    if (tokenInfo?.balance === undefined) return false;
    return tokenInfo?.balance.gt(Big(0));
  }, [tokenInfo]);

  const handleMax = useCallback(() => {
    getTokenBasicInfo(canisterId, tokenInfo.balance?.toString()).then((res) => {
      if (res !== undefined) {
        setAmount(res.toString());
      }
    });
  }, [tokenInfo.balance, maxBalance]);

  const handleAdd = async () => {
    setLoading(true);
    setNotificationOpen(true);
    setNotificationType("loading");
    try {
      const transactions: any[] = [createTransaction()];
      const batchTransactionObject = new BatchTransact(
        transactions,
        artemisWalletAdapter
      );
      let res = await batchTransactionObject.execute();
      console.log(res);
    } catch (error) {
      setNotificationOpen(true);
      setNotificationType("error");
      setNotificationMsg(error.toString());
      handleClose();
    }
  };

  const createTransaction = useCallback(() => {
    const handleSuccess = (res: any) => {
      if (refreshHandler) {
        refreshHandler();
      }
      if ("Ok" in res) {
        setNotificationType("success");
        handleClose();
        setLoading(false);
      } else {
        console.error(res.Err);
        handleError();
      }
    };
    const handleError = () => {
      if (refreshHandler) {
        refreshHandler();
      }
      setNotificationType("error");
      handleClose();
      setLoading(false);
    };
    const transferParams = {
      ...basicInfo,
      amount,
      canisterId,
      to: principalOrAddress,
    };
    const transactionMap = {
      DIP20: dip20TransferWithTarget,
      "ICRC-1": icrcTransferWithTarget,
      "ICRC-2": icrcTransferWithTarget,
    };
    return transactionMap[tokenInfo.protocol](
      transferParams,
      handleSuccess,
      handleError
    );
  }, [basicInfo, amount, canisterId, principalOrAddress]);

  const handleChangeTo = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    setPrincipalOrAddress(value);
  };
  const handleChangeAmount = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    if (isValidAmount(value)) {
      setAmount(value);
    }
  };

  const handleTransfer = () => {
    setShowTransfer(false);
  };

  useEffect(() => {
    const transferAmount: Big = amount === "" ? Big(0) : Big(amount);
    let amountDangerFlag = false;
    let toDangerFlag = false;
    let trasnferOwnAccount = false;
    if (amount && transferAmount) {
      if (transferAmount.gt(maxBalance)) {
        amountDangerFlag = true;
      }
    }
    if (principalOrAddress === appStore.userId) {
      trasnferOwnAccount = true;
    }
    if (principalOrAddress.trim().length > 0) {
      if (principalOrAddress.includes("-")) {
        toDangerFlag = !isValidPrincipal(principalOrAddress);
      } else {
        if (isValidAccountId(principalOrAddress) && canisterId === localIcpId) {
          const user_account = AccountIdentifier.fromPrincipal({
            principal: Principal.fromText(appStore.userId),
          }).toHex();
          if (principalOrAddress === user_account) {
            trasnferOwnAccount = true;
            toDangerFlag = false;
          } else {
            toDangerFlag = false;
          }
        } else {
          toDangerFlag = true;
        }
      }
    }
    if (toDangerFlag || amountDangerFlag) {
      setShowTransfer(true);
    }
    setTrasnferOwnAccount(trasnferOwnAccount);
    setAmountDangerFlag(amountDangerFlag);
    setToDangerFlag(toDangerFlag);
  }, [tokenInfo, amount, principalOrAddress, maxBalance]);

  const renderBtn = () => {
    let amount_num = Big(0);
    if (amount === "") {
      amount_num = Big(0);
    } else {
      amount_num = Big(amount);
    }
    if (!+amount) {
      return (
        <CommonButton size="large" disabled block className={styles.confirm}>
          Enter {symbol} amount
        </CommonButton>
      );
    }
    if (amount_num.gt(tokenInfo.balance)) {
      return (
        <CommonButton
          size="large"
          disabled
          block
          className={styles.confirm}
          danger={amountDangerFlag}
        >
          Insufficient balance
        </CommonButton>
      );
    }
    if (principalOrAddress === "") {
      return (
        <CommonButton
          size="large"
          disabled
          block
          className={styles.confirm}
          danger={amountDangerFlag}
        >
          {canisterId === localIcpId
            ? "Enter account ID or principal ID"
            : "Enter principal ID"}
        </CommonButton>
      );
    }
    if (toDangerFlag) {
      return (
        <CommonButton
          size="large"
          disabled
          block
          className={styles.confirm}
          danger={amountDangerFlag}
        >
          {canisterId === localIcpId
            ? "Invalid account ID or principal ID"
            : "Invalid principal ID"}
        </CommonButton>
      );
    }
    if (showTransfer) {
      if (trasnferOwnAccount) {
        return (
          <CommonButton
            style={{ backgroundColor: "#d28801", color: "white" }}
            size="large"
            block
            className={styles.confirm}
            loading={loading}
            onClick={handleTransfer}
          >
            Transfer tokens to your own address
          </CommonButton>
        );
      } else {
        return (
          <CommonButton
            type="primary"
            size="large"
            block
            className={styles.confirm}
            loading={loading}
            onClick={handleTransfer}
          >
            Transfer
          </CommonButton>
        );
      }
    } else {
      return (
        <CommonButton
          type="primary"
          size="large"
          block
          className={styles.confirm}
          loading={loading}
          onClick={handleAdd}
        >
          Confirm
        </CommonButton>
      );
    }
  };

  return (
    <>
      <Modal
        width={532}
        title={<CenterTitle title={"Transfer Token"} />}
        open={open}
        centered
        footer={false}
        onCancel={handleClose}
      >
        <div className={styles.modalContainer}>
          <div className={styles.titleContainer}>
            <div className={classNames(styles.transContainer)}>
              <span className={styles.label}>Transfer Fee:</span>
              <span className={styles.content}>
                {formatAmountByUnit(transferFee.toNumber(), 2)
                  .concat(" ")
                  .concat(tokenInfo.symbol)}
              </span>
            </div>
          </div>
          <div className={styles.titleContainer}>
            <div className={classNames(styles.transContainer)}>
              <span className={styles.label}>Burn Fee:</span>
              <span className={styles.content}>
                {formatAmountByUnit(burnFee.toNumber(), 2)
                  .concat(" ")
                  .concat(tokenInfo.symbol)}{" "}
              </span>
            </div>
            <div className={styles.transContainer}>
              <span className={styles.label}>Balance:</span>
              <span className={styles.content}>
                <span className={styles.balanceStyle}>
                  {tokenInfo?.balance === undefined ||
                  tokenInfo.balance.toNumber() === 0
                    ? "0 "
                    : formatAmountByUnit(
                        tokenInfo.balance.toString(),
                        2
                      ).concat(" ")}
                </span>
                {showMax ? (
                  <span className={styles.maxStyle} onClick={handleMax}>
                    MAX
                  </span>
                ) : null}
              </span>
            </div>
          </div>
          <div
            className={classNames(
              styles.inputContainer,
              amountDangerFlag && styles.dangerStyle,
              !showTransfer && styles.lock
            )}
          >
            <div className={styles.inputTitle}>Amount</div>
            <div className={styles.contentContainer}>
              <Input
                className={styles.input}
                onChange={handleChangeAmount}
                placeholder={`Enter ${symbol} amount `}
                value={amount}
              />
            </div>
          </div>

          <div
            className={classNames(
              styles.inputContainer,
              toDangerFlag && styles.dangerStyle,
              !showTransfer && styles.lock
            )}
          >
            <div className={styles.inputTitle}>To</div>
            <div className={styles.contentContainer}>
              <Input
                className={styles.input}
                onChange={handleChangeTo}
                placeholder={
                  canisterId === localIcpId
                    ? "Enter the account ID or principal ID"
                    : "Enter the principal ID"
                }
                value={principalOrAddress}
              />
            </div>
          </div>
        </div>
        <div className={styles.btnContainer}>{renderBtn()}</div>
      </Modal>
      <Notification
        open={notificationOpen}
        type={notificationType}
        config={notificationConfig}
        closeIcon
        onClose={closeNotification}
      />
    </>
  );
};

export default observer(TransferTokenModal);
