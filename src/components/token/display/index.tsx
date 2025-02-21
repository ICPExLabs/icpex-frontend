import type { FC } from "react";
import React from "react";
import classNames from "classnames";
import styles from "./index.module.less";
import { getTokenDetailUrl } from "@/utils/urls.ts";

export interface TokenDisplayProps {
  logo: string;
  symbol: string;
  name: string;
  className?: string;
  canisterId?: string;
}

const TokenDisplay: FC<TokenDisplayProps> = ({
  logo,
  symbol,
  name,
  className,
  canisterId,
}) => {
  return (
    <div className={classNames(styles.token, className)}>
      <div className={styles.logo}>
        <img src={logo} alt="logo" />
      </div>
      <div>
        <div className={styles.symbol}>
          {canisterId ? (
            <a
              href={getTokenDetailUrl(canisterId)}
              target="_blank"
              className={styles.link}
              rel="noreferrer"
            >
              {symbol}
            </a>
          ) : (
            <span>{symbol}</span>
          )}
        </div>
        <div className={styles.name}>{name}</div>
      </div>
    </div>
  );
};

export default TokenDisplay;
