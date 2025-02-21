import type { FC } from "react";
import React from "react";
import classNames from "classnames";
import styles from "./index.module.less";
import type { UserToken } from "@/types/token";

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
        </div>
      </div>
    </div>
  );
};

export default Tokens;
