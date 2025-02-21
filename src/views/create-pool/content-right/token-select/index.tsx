import type { ChangeEvent, FC } from "react";
import React, { useCallback, useMemo } from "react";
import { CaretDownOutlined, CloseOutlined } from "@ant-design/icons";
import { Input } from "antd";
import classNames from "classnames";
import styles from "./index.module.less";
import type { UserTokenUse } from "@/types/token";
import { formatBigNumberDisplay, isValidAmount } from "@/utils/common";
import { ServerResponse } from "node:http";

interface TokenSelectProps {
  token?: UserTokenUse;
  type?: "both" | "only-select";
  showMax?: boolean;
  locked?: boolean;
  isbase: boolean;
  onSelect: () => void;
  onChange: (value: string) => void;
  onClear: (value: boolean) => void;
  dangerFlag?: boolean;
}

const TokenSelect: FC<TokenSelectProps> = ({
  token,
  type = "both",
  showMax = true,
  locked,
  dangerFlag = false,
  onSelect,
  onChange,
  onClear,
  isbase,
}) => {
  const contentStyle = useMemo(
    () => ({
      width: type === "only-select" ? "50%" : "100%",
    }),
    [type]
  );

  const handleSelect = useCallback(() => {
    if (locked) return;
    onSelect();
  }, [locked, onSelect]);

  const triggerChange = useCallback(
    (value = "") => {
      if (locked) return;
      onChange(value);
    },
    [locked, onChange]
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
  const handleClickClear = () => {
    onClear(isbase);
  };
  return (
    <>
      {type === "both" ? (
        <div className={styles.header}>
          <div className={styles["header-right"]}>
            Balance: {formatBigNumberDisplay(token?.balance)}
            {showMax ? <span onClick={handleMax}>MAX</span> : null}
          </div>
        </div>
      ) : null}
      <div
        className={classNames(
          styles.content,
          dangerFlag && styles.dangerStyle,
          locked ? styles.lock : null
        )}
        style={contentStyle}
      >
        <div className={styles.select} onClick={handleSelect}>
          <div className={styles.token}>
            {token ? (
              <>
                <div className={styles.logo}>
                  <img src={token.logo} alt="logo" />
                </div>
                {token.symbol}
              </>
            ) : (
              "Select Token"
            )}
          </div>
          <CaretDownOutlined />
        </div>
        {type === "both" && token ? (
          <Input
            value={token.amountToUse}
            bordered={false}
            disabled={locked}
            type="text"
            className={styles.input}
            onChange={handleChange}
            placeholder="0.0"
          />
        ) : null}
      </div>
    </>
  );
};

export default TokenSelect;
