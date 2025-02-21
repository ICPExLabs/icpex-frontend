import { Input, Modal } from "antd";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { Principal } from "@dfinity/principal";
import classNames from "classnames";
import { observer } from "mobx-react";
import styles from "./index.module.less";
import { CenterTitle, CommonButton, Notification } from "@/components";
import type { NotificationType } from "@/components/notification";
import appStore from "@/store/app";
import {
  formatAmountByUnitToT,
  isValidAmount,
  multiplyAndConvertToBigInt,
} from "@/utils/common";
import { canisterId, idlFactory } from "@/canisters/xtc";
import { getBalance } from "@/utils/token";
import { createWalletActor } from "@/utils/agent/create-actor";
import {
  icrc1_balance_of,
  icrc1_fee,
  withdraw,
} from "@/utils/actors/cycles_ledger";
import Big from "big.js";
import { WithdrawArgs } from "@/canisters/cycles_ledger/cycles_ledger.did";

// const Number(cyclesfee) = 0.002
const XTC_META = {
  protocol: "DIP20",
  decimals: 12,
  canisterId,
};
interface AddCycleModalProps {
  open: boolean;
  closeModal: () => void;
  tokenId: string;
  basicInfo: any;
}

const AddCycleModal: React.FC<AddCycleModalProps> = (props) => {
  const { open, closeModal, tokenId } = props;
  const [loading, setLoading] = useState(false);
  const [cyclesfee, setcyclesfee] = React.useState<number | string>();
  // notification
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationType, setNotificationType] =
    useState<NotificationType>("loading");
  const [balanceCount, setBalanceCount] = useState(0);
  const [xtcDecimals, setXtcDecimals] = useState(0);
  const [displayValue, setDisplayValue] = React.useState<string>("");
  const notificationConfig = useMemo(() => {
    return {
      loading: {
        message: `Adding cycles for canister ${tokenId}`,
      },
      success: {
        message: "Adding cycles successfully ",
      },
      error: {
        message: "Add cycles failed",
      },
    };
  }, [notificationType]);

  const [cycleCount, setCycleCount] = useState("");
  const [dangerFlag, setDangerFlag] = useState(false);

  const getXtcBalance = async (params: {
    protocol: string;
    canisterId: string;
    decimals: number;
    userId: string;
  }) => {
    if (!appStore.userId) return;
    const balance = await getBalance(params);
    setBalanceCount(balance);
  };

  const getXtcInfo = async () => {
    const res = await icrc1_fee();
    const balance = await icrc1_balance_of([
      { owner: Principal.fromText(appStore.userId), subaccount: [] },
    ]);
    setBalanceCount(Number(balance));
    setcyclesfee(res.toString());
  };

  useEffect(() => {
    if (open || (!open && !xtcDecimals && appStore.userId)) {
      getXtcInfo();
    }
  }, [open, appStore.userId, xtcDecimals]);

  const handleSuccess = useCallback(() => {
    setNotificationType("success");
    closeModal();
    setLoading(false);
    window.location.reload();
  }, []);

  const handleError = useCallback(() => {
    setNotificationType("error");
    closeModal();
    setLoading(false);
  }, []);

  const showMax = useMemo(() => {
    return balanceCount > Number(cyclesfee);
  }, [balanceCount]);

  const handleMax = useCallback(() => {
    setCycleCount(`${balanceCount - Number(cyclesfee)}`);
    setDisplayValue(
      formatAmountByUnitToT(
        new Big(balanceCount?.toString()!)
          .minus(cyclesfee?.toString()!)
          .toString(),
        4,
        false
      )
    );
  }, [balanceCount]);

  const handleAdd = async () => {
    setLoading(true);
    setNotificationOpen(true);
    setNotificationType("loading");
    const withdrawArgs: WithdrawArgs = {
      to: Principal.fromText(tokenId),
      created_at_time: [],
      from_subaccount: [],
      amount: BigInt(new Big(cycleCount).round(0, 0).toString()),
    };
    console.log(withdrawArgs.amount, balanceCount);
    try {
      const res = await withdraw([withdrawArgs]);
      console.log(res);
      if ("Ok" in res) {
        handleSuccess();
        setCycleCount("");
        setDisplayValue("");
      } else {
        console.log(res.Err);
        handleError();
      }
    } catch (error) {
      console.log(error);
      handleError();
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDisplayValue(value);
    if (isValidAmount(value)) {
      if (value === "" || value === "0.0") {
        setCycleCount("");
      } else {
        setCycleCount(parseTUnitToCycles(value).toString());
      }
    }
  };
  function formatUnitToT(
    num: string | number | null | undefined,
    decimalPlaces = 4,
    isneedT: boolean = true
  ) {
    const T = 1000000000000;

    if (!num) return "0.0";
    if (typeof num === "string") {
      num = Number.parseFloat(num);
    }

    if (isNaN(num) || num === 0) {
      return "0.0";
    }

    const numInT = new Big(num).div(T).toNumber();

    if (isneedT) {
      return numInT.toFixed(decimalPlaces).replace(/\.?0+$/, "") + "";
    } else {
      return numInT.toFixed(decimalPlaces).replace(/\.?0+$/, "");
    }
  }
  function parseTUnitToCycles(value: string | number) {
    const T = 1000000000000;

    if (typeof value === "string") {
      value = Number.parseFloat(value);
    }

    if (isNaN(value)) {
      throw new Error("Invalid T unit value");
    }

    return value * T;
  }
  useEffect(() => {
    const amount = +cycleCount;
    if (cycleCount && amount) {
      if (amount + Number(cyclesfee) > balanceCount) {
        setDangerFlag(true);
        return;
      }
    }
    setDangerFlag(false);
  }, [balanceCount, cycleCount]);

  const renderBtn = () => {
    if (!+cycleCount) {
      return (
        <CommonButton size="large" disabled block className={styles.confirm}>
          Enter cycles amount
        </CommonButton>
      );
    }
    if (+cycleCount + Number(cyclesfee) > balanceCount) {
      return (
        <CommonButton
          size="large"
          disabled
          block
          className={styles.confirm}
          danger={dangerFlag}
        >
          Insufficient cycles balance
        </CommonButton>
      );
    }
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
  };

  return (
    <>
      <Modal
        width={532}
        title={<CenterTitle isAlarm={false} title="Add cycles for canister" />}
        open={open}
        centered
        footer={false}
        onCancel={closeModal}
      >
        <div className={styles.modalContainer}>
          <div className={styles.titleContainer}>
            <div className={styles.transContainer}>
              <span className={styles.label}>Transfer Fee: </span>
              <span className={styles.content}>
                {formatUnitToT(cyclesfee?.toString())}{" "}
                <span className={styles.cyclesText}>TCYCLES</span>
              </span>
            </div>
            <div className={styles.transContainer}>
              <span className={styles.label}>Balance:</span>
              <span className={styles.content}>
                {/* {formatUnitToT(balanceCount?.toString())} */}
                <span className={styles.balanceStyle}>
                  {showMax
                    ? formatUnitToT(balanceCount?.toString())
                    : formatUnitToT(balanceCount?.toString())}
                  <span className={styles.cyclesText}>TCYCLES</span>
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
              dangerFlag && styles.dangerStyle
            )}
          >
            {/* <div className={styles.inputTitle}>Amount</div> */}
            <div className={styles.contentContainer}>
              <Input
                className={styles.input}
                suffix={
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <img
                      style={{ height: "35px", marginRight: "5px" }}
                      src="https://metrics.icpex.org/images/um5iw-rqaaa-aaaaq-qaaba-cai.png"
                    ></img>
                    <span style={{ fontWeight: "600" }}>TCYCLES</span>
                  </div>
                }
                style={{
                  outline: "none",
                  border: "none",
                  color: "var(--text-primary-color)",
                }}
                onChange={handleChange}
                placeholder="0.0"
                value={displayValue}
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
      />
    </>
  );
};

export default observer(AddCycleModal);
