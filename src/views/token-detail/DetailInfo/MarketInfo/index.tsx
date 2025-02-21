import type { FC } from "react";
import React, { useMemo, useState } from "react";
import styles from "./index.module.less";
import { ArrowDownOutlined, ArrowUpOutlined } from "@ant-design/icons";
import classNames from "classnames";

interface MarketInfoProps {
  activeKey?: string;
  onChange?: (value: string) => void;
  marketInfo: any;
}

const MarketInfo: FC<MarketInfoProps> = (props) => {
  const { marketInfo } = props;

  return (
    <div className={styles.content}>
      {marketInfo.map((item: any, index: number) => {
        const increaseFlag = item?.rate > 0;
        const decreaseFlag = item?.rate < 0;
        const stringFlag = typeof item?.rate === "string";
        return (
          <div className={styles.textContainer} key={index}>
            <div className={styles.label}> {item.label}</div>
            {item.unionMoney && (
              <div className={styles.unionMoney}> {item.unionMoney}</div>
            )}
            {item.unionCount && (
              <div className={styles.unionCount}> {item.unionCount}</div>
            )}
            {item.rate && (
              <div className={styles.rateContainer}>
                <span
                  className={classNames({
                    [styles.rate]: true,
                    [styles.increaseColor]: increaseFlag,
                    [styles.descreaseColor]: decreaseFlag,
                  })}
                >
                  {!stringFlag ? `${item.rate}%` : item.rate}
                </span>
                {stringFlag ? (
                  <></>
                ) : item.rate > 0 ? (
                  <ArrowUpOutlined
                    className={classNames({
                      [styles.increaseColor]: increaseFlag,
                      // [styles.descreaseColor]: decreaseFlag
                    })}
                  />
                ) : (
                  <ArrowDownOutlined
                    className={classNames({
                      // [styles.increaseColor]: increaseFlag,
                      [styles.descreaseColor]: decreaseFlag,
                    })}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MarketInfo;
