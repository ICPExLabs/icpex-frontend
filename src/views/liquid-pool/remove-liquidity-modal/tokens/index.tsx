import type { FC } from "react";
import React from "react";
import classNames from "classnames";
import styles from "./index.module.less";
import type { UserToken } from "@/types/token";
import Big from "big.js";

export interface TokensProps {
  isPrivate: boolean;
  baseToken: UserToken;
  quoteToken: UserToken;
  amount: {
    base: number;
    quote: number;
  };
  selectedToken: "base" | "quote";
  onChange: (value: "base" | "quote") => void;
  isConfirmed: boolean;
}
const Tokens: FC<TokensProps> = ({
  isPrivate,
  baseToken,
  quoteToken,
  amount,
  selectedToken,
  isConfirmed,
  onChange,
}) => {
  if (baseToken?.balance === undefined || quoteToken?.balance === undefined) {
    return;
  }
  return (
    <div className={styles.tokens}>
      <div
        className={classNames(
          styles.token,
          isConfirmed ? styles.confirmed : "",
          isPrivate && selectedToken === "base" ? styles["token-selected"] : ""
        )}
        onClick={() => onChange("base")}
      >
        <div className={styles["token-left"]}>
          {isPrivate ? <div className={styles.radio} /> : null}
          <div className={styles.logo}>
            <img src={baseToken.logo} alt="logo" />
          </div>
          {baseToken.symbol}
        </div>
        <div className={styles["token-right"]}>
          <div className={styles.amount}>{amount.base}</div>
          <div className={styles.fee}>
            Transfer Fee:{" "}
            {baseToken.isTransferFeeFixed
              ? `${baseToken.transferFee} ${baseToken.symbol}`
              : `${new Big(baseToken.transferFee).mul(100)}%`}
          </div>
        </div>
      </div>
      <div
        className={classNames(
          styles.token,
          isConfirmed ? styles.confirmed : "",
          isPrivate && selectedToken === "quote" ? styles["token-selected"] : ""
        )}
        onClick={() => onChange("quote")}
      >
        <div className={styles["token-left"]}>
          {isPrivate ? <div className={styles.radio} /> : null}
          <div className={styles.logo}>
            <img src={quoteToken.logo} alt="logo" />
          </div>
          {quoteToken.symbol}
        </div>
        <div className={styles["token-right"]}>
          <div className={styles.amount}>{amount.quote}</div>
          <div className={styles.fee}>
            Transfer Fee:{" "}
            {quoteToken.isTransferFeeFixed
              ? `${quoteToken.transferFee} ${quoteToken.symbol}`
              : `${new Big(quoteToken.transferFee).mul(100)}%`}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tokens;
