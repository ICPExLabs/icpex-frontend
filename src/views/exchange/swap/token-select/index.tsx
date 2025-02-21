import type { ChangeEvent, FC } from "react";
import React, { useCallback } from "react";
import { CaretDownOutlined } from "@ant-design/icons";
import { Input, Tooltip } from "antd";
import classNames from "classnames";
import styles from "./index.module.less";
import type { UserTokenUse } from "@/types/token";
import { formatBigNumberDisplay, isValidAmount } from "@/utils/common";

interface TokenSelectProps {
  token?: UserTokenUse;
  label: string;
  showMax?: boolean;
  inputDisabled?: boolean;
  locked?: boolean;
  danger?: boolean;
  onSelect?: () => void;
  onChange?: (value: string) => void;
}

const TokenSelect: FC<TokenSelectProps> = ({
  token,
  label,
  showMax = true,
  inputDisabled,
  locked,
  danger,
  onSelect,
  onChange,
}) => {
  const triggerChange = useCallback(
    (value = "") => {
      if (inputDisabled) return;
      onChange && onChange(value);
    },
    [inputDisabled, onChange]
  );

  const handleMax = useCallback(() => {
    if (!token) return;
    triggerChange(`${token.max}`);
  }, [token, triggerChange]);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (isValidAmount(value)) triggerChange(value);
    },
    [triggerChange]
  );

  return (
    <>
      <div className={styles.header}>
        <div>{label}</div>
        <div className={styles["header-right"]}>
          Balance: {formatBigNumberDisplay(token?.balance)}
          {showMax ? <span onClick={handleMax}>MAX</span> : null}
        </div>
      </div>
      <div
        className={classNames(
          styles.content,
          locked ? styles.lock : null,
          danger ? styles.danger : null
        )}
      >
        <div className={styles.select} onClick={onSelect}>
          <div className={styles.token}>
            {token ? (
              <>
                <div className={styles.logo}>
                  <Tooltip title={token.canisterId}>
                    <img src={token.logo} alt="logo" />
                  </Tooltip>
                </div>
                {token.symbol}
              </>
            ) : (
              "Select Token"
            )}
          </div>
          <CaretDownOutlined />
        </div>
        {token && !locked ? (
          <Input
            value={token.amountToUse}
            bordered={false}
            type="text"
            className={styles.input}
            onChange={handleChange}
            disabled={inputDisabled}
            placeholder="0.0"
          />
        ) : (
          <>{token?.amountToUse}</>
        )}
      </div>
    </>
  );
};

export default TokenSelect;
