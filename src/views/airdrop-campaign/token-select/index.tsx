import type { ChangeEvent, FC } from "react";
import React, { useCallback } from "react";
import { CaretDownOutlined } from "@ant-design/icons";
import { Input, Tooltip } from "antd";
import classNames from "classnames";
import styles from "./index.module.less";
import type { UserTokenUse } from "@/types/token";
import { isValidAmount } from "@/utils/common";
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
    <div className={styles.main}>
      <div className={styles.left}>
        <div className={styles.header}>
          <div className={styles.label}>Token</div>
          <div className={styles.balance}>
            Balance: {token?.balance.toString() || 0}
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
          {token?.canisterId}
          {/* {
            (token && !locked)
              ? <Input value={token.amountToUse} type="text" className={styles.input} onChange={handleChange} disabled={inputDisabled} placeholder="0.0" />
              : <>{token?.amountToUse}</>
          } */}
        </div>
      </div>
      <div className={styles.right}>
        <div className={styles.title}>Decimals:</div>
        <div className={styles.decimalsVal}>{token?.decimals || 0}</div>
      </div>
    </div>
  );
};

export default TokenSelect;
