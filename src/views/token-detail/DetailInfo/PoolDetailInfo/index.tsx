import React from "react";
import styles from "./index.module.less";
import { combineCountData, getCountUnit } from "@/utils/dashboard";
import Big from "big.js";

interface PoolDetailInfoProps {
  basicInfo: any;
  poolMarketInfo: any;
}

const PoolDetailInfo: React.FC<PoolDetailInfoProps> = (props) => {
  const { basicInfo, poolMarketInfo } = props;
  const getFormatData = (sourceData: any) => {
    if ((sourceData ?? "") !== "") {
      return `$${getCountUnit(sourceData, false)}`;
    } else {
      return "--";
    }
  };

  return (
    <div className={styles.content}>
      <div className={styles.textContainer}>
        <div className={styles.label}>{"Trading Fee Rate"}</div>
        <div className={styles.unionCount}>
          {" "}
          {basicInfo?.transFee ? `${basicInfo?.transFee}%` : "--"}
        </div>
      </div>
      <div className={styles.textContainer}>
        <div className={styles.label}>{"TVL"}</div>
        <div className={styles.unionMoney}>
          {" "}
          {getFormatData(poolMarketInfo?.tvl)}
        </div>
      </div>
      {basicInfo?.k !== undefined && (
        <div className={styles.textContainer}>
          <div className={styles.label}>{"Volatility Coefficient"}</div>
          <div className={styles.unionCount}>
            {" "}
            {Big(Number(basicInfo?.k))
              .div(10 ** 18)
              .toNumber()}
          </div>
        </div>
      )}

      <div className={styles.textContainer}>
        <div className={styles.label}>{"Volume 24H"}</div>
        <div className={styles.unionCount}>
          {" "}
          {getFormatData(poolMarketInfo?.volume24h)}
        </div>
      </div>
    </div>
  );
};

export default PoolDetailInfo;
