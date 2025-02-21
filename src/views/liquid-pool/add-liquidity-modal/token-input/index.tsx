import type { ChangeEvent, FC } from "react";
import React, { useCallback } from "react";
import { Input } from "antd";
import classNames from "classnames";
import styles from "./index.module.less";
import type { UserTokenUse } from "@/types/token";
import Big from "big.js";
import { formatBigNumberDisplay } from "@/utils/common";

interface TokenInputProps {
  token: UserTokenUse;
  disabled?: boolean;
  danger?: boolean;
  onClick?: () => void;
  onChange?: (value: string) => void;
}

const TokenInput: FC<TokenInputProps> = ({
  token,
  disabled,
  danger,
  onClick,
  onChange,
}) => {
  const triggerChange = useCallback(
    (value = "") => {
      if (disabled) return;
      onChange && onChange(value);
    },
    [disabled, onChange]
  );

  const handleMax = useCallback(() => {
    if (disabled) return;
    triggerChange(`${token.max}`);
  }, [token, disabled, triggerChange]);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const regex = /^\d*\.?\d{0,18}$/;
      if (regex.test(value)) triggerChange(value);
    },
    [triggerChange]
  );

  return (
    <>
      <div className={styles.header}>
        <div className={styles["header-left"]}>
          Transfer Fee:{" "}
          <span>
            {token.isTransferFeeFixed
              ? `${token.transferFee.toString()} ${token.symbol}`
              : `${token.transferFee.mul(100)}%`}
          </span>
        </div>
        <div className={styles["header-right"]}>
          Balance: {formatBigNumberDisplay(token?.balance)}{" "}
          <span onClick={handleMax}>MAX</span>
        </div>
      </div>
      <div
        className={classNames(styles.content, danger ? styles.danger : null)}
      >
        <div className={styles.select} onClick={onClick}>
          <div className={styles.token}>
            <div className={styles.logo}>
              <img src={token.logo} alt="logo" />
            </div>
            {token.symbol}
          </div>
        </div>
        {!disabled ? (
          <Input
            value={token.amountToUse}
            bordered={false}
            type="text"
            className={styles.input}
            onChange={handleChange}
            disabled={disabled}
            placeholder="0.0"
          />
        ) : (
          <>{token.amountToUse}</>
        )}
      </div>
    </>
  );
};

export default TokenInput;
