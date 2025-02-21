import type { ChangeEvent } from "react";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { QuestionCircleFilled, SettingOutlined } from "@ant-design/icons";
import { Input, Tooltip } from "antd";
import { useClickAway } from "ahooks";
import classNames from "classnames";
import styles from "./index.module.less";
import { CommonButton } from "@/components";

export interface SettingRef {
  openSettings: () => void;
}
export interface SettingProps {
  slippage: string;
  onSlippage?: (value: string) => void;
  isExpertMode: boolean;
  onMode?: (value: boolean) => void;
  className?: string;
}
const Setting = forwardRef<SettingRef, SettingProps>(
  ({ slippage, onSlippage, isExpertMode, onMode, className }, ref) => {
    const [open, setOpen] = useState(false);
    const handleSetting = () => {
      setOpen(!open);
    };
    const handleOpen = () => {
      setTimeout(() => {
        setOpen(true);
      });
    };
    const settingButtonRef = useRef<HTMLDivElement>(null);
    const settingRef = useRef<HTMLDivElement>(null);
    useClickAway(() => {
      setOpen(false);
    }, [settingRef, settingButtonRef]);

    const triggerSlippage = (value: string) => {
      onSlippage && onSlippage(value);
    };
    const handleAuto = () => {
      triggerSlippage("0.5");
    };
    const handleSlippageChange = (e: ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value;
      const regex = /^\d*\.?\d{0,2}$/;
      if (regex.test(value)) {
        if (Number(value) > 50) value = "50";
        triggerSlippage(value);
      }
    };

    const handleMode = (value: boolean) => {
      onMode && onMode(value);
    };

    useEffect(() => {
      if (!open) {
        if (Number(slippage) === 0) triggerSlippage("0.1");
      }
    }, [open]);

    useImperativeHandle(ref, () => ({
      openSettings: handleOpen,
    }));

    return (
      <div className={styles["setting-wrapper"]}>
        <div
          ref={settingButtonRef}
          className={classNames(styles.icon, className ?? null)}
          onClick={handleSetting}
        >
          <SettingOutlined />
        </div>
        {open ? (
          <div className={styles.setting} ref={settingRef}>
            <div className={styles["setting-header"]}>Setting</div>
            <div className={styles["setting-content"]}>
              <div className={styles["setting-top"]}>
                <div>Slippage Tolerance</div>
                <div className={styles["setting-st"]}>{slippage}%</div>
              </div>
              <div className={styles["setting-bottom"]}>
                <div className={styles["setting-input-wrapper"]}>
                  <Input
                    bordered={false}
                    className={styles["setting-input"]}
                    value={slippage}
                    onChange={handleSlippageChange}
                  />{" "}
                  <div className={styles["setting-unit"]}>%</div>
                </div>
                <CommonButton
                  type="primary"
                  size="small"
                  className={styles["setting-auto"]}
                  onClick={handleAuto}
                >
                  Auto
                </CommonButton>
              </div>
            </div>
            <div className={styles.expert}>
              <div className="export-header">
                Expert Mode{" "}
                <Tooltip title="Expert mode allows high slippage. Please turn on this mode with caution.">
                  <QuestionCircleFilled className={styles.question} />
                </Tooltip>
              </div>
              <div className={styles["expert-content"]}>
                <div
                  className={classNames(
                    styles["expert-item"],
                    !isExpertMode ? styles.selected : ""
                  )}
                  onClick={() => handleMode(false)}
                >
                  OFF
                </div>
                <div
                  className={classNames(
                    styles["expert-item"],
                    isExpertMode ? styles.selected : ""
                  )}
                  onClick={() => handleMode(true)}
                >
                  ON
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }
);

Setting.displayName = "Setting";
export default Setting;
