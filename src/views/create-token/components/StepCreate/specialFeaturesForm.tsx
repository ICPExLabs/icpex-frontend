import { Checkbox, Form, Input, Select } from "antd";
import type { CheckboxValueType } from "antd/lib/checkbox/Group";
import type { ChangeEvent } from "react";
import React, { useCallback, useImperativeHandle, useState } from "react";
import { Principal } from "@dfinity/principal";
import { observer } from "mobx-react";
import classNames from "classnames";
import styles from "./index.module.less";
import { canisterId } from "@/canisters/icpl_router";
import appStore from "@/store/app";
import { verifyNumberDot, verifyNumberDotSimple } from "@/utils/common";

const { Option } = Select;

const SpecialFeaturesForm: React.FC<{
  propRef: React.Ref<any>;
  visible: boolean;
  supply: number;
  isempt: boolean;
  onIsemptChange: (v1: any, v2: any, checkedList: any) => void;
}> = ({ propRef, visible, supply, isempt, onIsemptChange }) => {
  const [checkedList, setCheckedList] = useState<CheckboxValueType[]>([]);
  const [burnAfter, setBurnAfter] = useState<{
    transferFee?: string;
    burnFee?: string;
  }>({ transferFee: "Percentage", burnFee: "Percentage" });
  const [burnValue, setBurnValue] = useState<string | number>("0.1");
  const [transferFeeValue, setTransferFeeValue] = useState<string | number>(
    "0.1"
  );

  const [form] = Form.useForm();

  const getFormData = useCallback(() => {
    const formValues = form.getFieldsValue();
    const groupCheck = formValues?.groupCheck;
    const isPercentTransferFix = burnAfter.transferFee === "Fixed Amount";
    const isBurnFeeFix = burnAfter.burnFee === "Fixed Amount";

    if (!groupCheck) return {};

    return {
      owner: Principal.fromText(appStore.userId as string),
      fee_to: Principal.fromText(canisterId as string),
      mint_on: groupCheck.includes("supportSupply"),
      burn_on: groupCheck.includes("supportBurn"),
      transfer_on: groupCheck.includes("supportTransfer"),
      flat_fee: isPercentTransferFix,
      flat_burn_fee: isBurnFeeFix,
      fee: +transferFeeValue,
      burn_rate: +burnValue,
    };
  }, [burnAfter, transferFeeValue, burnValue]);

  const clear = () => {
    form.resetFields();
  };

  useImperativeHandle(propRef, () => ({
    getFormData,
    clear,
  }));
  const handleChangeCheck = useCallback((v: CheckboxValueType[]) => {
    setCheckedList(v);
  }, []);
  let curtype: string;
  const handleChangeBurn = useCallback(
    (v: string, type: "burnFee" | "transferFee") => {
      setBurnAfter({ ...burnAfter, [type]: v });
      curtype = type;
      type === "burnFee" ? setBurnValue("0") : setTransferFeeValue("0");
    },
    [burnAfter]
  );

  const handleTransferFeeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const fee =
      burnAfter.transferFee === "Percentage"
        ? verifyNumberDotSimple(value, 50)
        : verifyNumberDot(value, 0.0000001 * supply, 7);
    setTransferFeeValue(fee);
    onIsemptChange(value, burnValue, checkedList);
  };

  const handleBurnValueChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const fee =
      burnAfter.burnFee === "Percentage"
        ? verifyNumberDotSimple(value, 50)
        : verifyNumberDot(value, 0.0000001 * supply, 7);
    setBurnValue(fee);
    onIsemptChange(transferFeeValue, value, checkedList);
  };

  const selectBurnAfter = useCallback(
    (type: "burnFee" | "transferFee") => {
      const options =
        type === "burnFee" ? (
          <>
            <Option className={styles["burn-option"]} value="Percentage">
              Percentage
            </Option>
            <Option className={styles["burn-option"]} value="Fixed Amount">
              Fixed Amount
            </Option>
          </>
        ) : (
          <>
            <Option className={styles["burn-option"]} value="Percentage">
              Percentage
            </Option>
            <Option className={styles["burn-option"]} value="Fixed Amount">
              Fixed Amount
            </Option>
          </>
        );

      return (
        <Select
          className={styles["burn-select"]}
          defaultValue="Percentage"
          dropdownStyle={{ background: "#324377", color: "#8B9AC9" }}
          defaultActiveFirstOption={false}
          // defaultOpen
          onChange={(v) => handleChangeBurn(v, type)}
        >
          {options}
        </Select>
      );
    },
    [handleChangeBurn]
  );

  return visible ? (
    <Form form={form} layout="vertical">
      <div className={styles["special-features-form"]}>
        <Form.Item name="groupCheck">
          <Checkbox.Group onChange={handleChangeCheck}>
            <Checkbox value="supportBurn">Burn Fee</Checkbox>
            <Checkbox value="supportTransfer">Transfer Fee</Checkbox>
            <Checkbox value="supportSupply">Supports Supply Increase</Checkbox>
          </Checkbox.Group>
        </Form.Item>

        {checkedList.includes("supportBurn") && (
          <div className={styles.detail}>
            <div className={styles.title}>Burn Fee</div>
            <div className={styles.con}>
              <div className={styles.desp}>
                A fixed amount or percentage of tokens will be sent to the burn
                address for each on-chain transfer.
              </div>

              <div
                className={classNames(
                  styles.burn,
                  burnAfter.burnFee === "Percentage"
                    ? styles.percent
                    : styles.num
                )}
              >
                <Input
                  addonAfter={selectBurnAfter("burnFee")}
                  value={burnValue}
                  autoComplete="off"
                  onChange={handleBurnValueChange}
                />
              </div>
            </div>
          </div>
        )}

        {checkedList.includes("supportTransfer") && (
          <div className={styles.detail}>
            <div className={styles.title}>Transfer Fee</div>
            <div className={styles.con}>
              <div className={styles.desp}>
                A fixed amount or percentage of tokens will be sent to the
                creator's address for each on-chain transfer.
              </div>

              <div
                className={classNames(
                  styles.burn,
                  burnAfter.transferFee === "Percentage"
                    ? styles.percent
                    : styles.num
                )}
              >
                <Input
                  addonAfter={selectBurnAfter("transferFee")}
                  value={transferFeeValue}
                  autoComplete="off"
                  pattern="\d+(\.\d{0,2})?"
                  onChange={handleTransferFeeChange}
                />
              </div>
            </div>
          </div>
        )}

        {checkedList.includes("supportSupply") && (
          <div className={styles.detail}>
            <div className={styles.title}>Supports Supply Increase</div>
            <div className={styles.con}>
              Allow the creator to issue additional tokens after token creation.
            </div>
          </div>
        )}
      </div>
    </Form>
  ) : null;
};

export default observer(SpecialFeaturesForm);
