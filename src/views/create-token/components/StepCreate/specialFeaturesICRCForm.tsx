import { Checkbox, Form, Input, Select } from "antd";
import type { CheckboxValueType } from "antd/lib/checkbox/Group";
import type { ChangeEvent } from "react";
import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
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
  }>({ transferFee: "Fixed Amount", burnFee: "Fixed Amount" });
  const [burnValue, setBurnValue] = useState<string | number>(0);
  const [transferFeeValue, setTransferFeeValue] = useState<string | number>(0);

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
  useEffect(() => {
    onIsemptChange(
      transferFeeValue.toString(),
      burnValue.toString(),
      checkedList
    );
  }, [transferFeeValue, burnValue, checkedList]);
  const handleChangeCheck = useCallback((v: CheckboxValueType[]) => {
    setCheckedList(() => {
      return v;
    });
  }, []);
  const handleChangeBurn = useCallback(
    (v: string, type: "burnFee" | "transferFee") => {
      setBurnAfter({ ...burnAfter, [type]: v });
      type === "burnFee" ? setBurnValue("0") : setTransferFeeValue("0");
      // onIsemptChange(transferFeeValue.toString(), burnValue.toString(), checkedList);
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
    // onIsemptChange(value.toString(), burnValue.toString(), checkedList);
  };
  const handleBurnValueChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const fee =
      burnAfter.burnFee === "Percentage"
        ? verifyNumberDotSimple(value, 50)
        : verifyNumberDot(value, 0.0000001 * supply, 7);
    setBurnValue(fee);
    // onIsemptChange(transferFeeValue.toString(), value.toString(), checkedList);
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
          defaultValue="Fixed Amount"
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
            <Checkbox value="supportTransfer">Transfer Fee</Checkbox>
            <Checkbox value="supportBurn">Burn Fee</Checkbox>
            <Checkbox value="supportSupply">Supports Supply Increase</Checkbox>
          </Checkbox.Group>
        </Form.Item>

        {checkedList.includes("supportTransfer") && (
          <div className={styles.detail}>
            <div className={styles.title}>Transfer Fee</div>
            <div className={styles.con}>
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

              {burnAfter.transferFee === "Percentage" && (
                <div className={styles.desp}>
                  A fixed token amount or percentage will be sent to the
                  creator. The percentage fee is an ICRC-2 feature that may not
                  work with some dApps. ICPEx provides an{" "}
                  <a
                    href="https://docs.icpex.org/icrc-2+-protocol/method-calling-guide#id-2.transfer-fee-calculation"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: "underline" }}
                  >
                    INTERGRATION GUIDE
                  </a>{" "}
                  to help dApps quickly achieve compatibility and enhance
                  ICRC-2's competitiveness.
                </div>
              )}
              {burnAfter.transferFee === "Fixed Amount" && (
                <div className={styles.desp}>
                  A fixed token amount or percentage will be sent to the
                  creator.
                </div>
              )}
            </div>
          </div>
        )}

        {checkedList.includes("supportBurn") && (
          <div className={styles.detail}>
            <div className={styles.title}>Burn Fee</div>
            <div className={styles.con}>
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
              <div className={styles.desp}>
                A fixed amount or percentage of tokens will be burned. The burn
                fee may be incompatible with some dApps. ICPEx offers an{" "}
                <a
                  href="https://docs.icpex.org/icrc-2+-protocol/method-calling-guide#id-1.burn-fee-calculation"
                  target="_blank"
                  style={{ textDecoration: "underline" }}
                  rel="noopener noreferrer"
                >
                  INTERGRATION GUIDE
                </a>{" "}
                to help dApps quickly achieve compatibility and enhance ICRC-2's
                competitiveness.
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
