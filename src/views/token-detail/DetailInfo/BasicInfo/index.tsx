import React, { useEffect, useState } from "react";
import classNames from "classnames";
import styles from "./index.module.less";
import { getCountUnit } from "@/utils/dashboard";
import { divideAndConvertToNumber, formatAmountByUnit } from "@/utils/common";
import { DECIMALS } from "@/utils/constants";

interface BasicInfoProps {
  basicInfo: any;
}

const BasicInfo: React.FC<BasicInfoProps> = (props) => {
  const { basicInfo } = props;
  const [detailData, setDetailData] = useState({} as any);

  useEffect(() => {
    if (basicInfo && Object.keys(basicInfo).length > 0) {
      const {
        address: canisterId,
        token_type: protocol,
        decimals: decimalsBigint,
        owner,
        total_supply,
        flat_fee: isTransferFeeFixed,
        fee_rate,
        flat_burn_fee: isBurnFeeFixed,
        burn_rate,
        mint_on: canMint,
        platform_token_type: source,
        ...rest
      } = basicInfo;
      const tempSupply = Number(total_supply) / 10 ** Number(decimalsBigint);
      const decimals = Number(decimalsBigint);
      const tempBurn = isBurnFeeFixed
        ? divideAndConvertToNumber(burn_rate, decimals, 18)
        : divideAndConvertToNumber(burn_rate, DECIMALS, 18);
      const tempTranfer = isTransferFeeFixed
        ? divideAndConvertToNumber(fee_rate, decimals, 18)
        : divideAndConvertToNumber(fee_rate, DECIMALS, 18);
      const tempObj = {
        total_supply: `${formatAmountByUnit(tempSupply)}`,
        burn_fee: tempBurn
          ? isBurnFeeFixed
            ? formatAmountByUnit(tempBurn)
            : `${(tempBurn * 100).toFixed(1)}%`
          : "--",
        flat_fee: tempTranfer
          ? isTransferFeeFixed
            ? formatAmountByUnit(tempTranfer)
            : `${(tempTranfer * 100).toFixed(1)}%`
          : "--",
        holders: basicInfo.holders ? `${Number(basicInfo.holders)}` : "--",
        support_flag: source === "CREATETOKEN",
        mint_on: canMint,
      };
      setDetailData(tempObj);
    }
  }, [basicInfo]);

  return (
    <div className={styles.content}>
      <div className={styles.textContainer}>
        <div className={styles.label}>{"Total Supply"}</div>
        <div className={styles.unionMoney}> {detailData?.total_supply}</div>
      </div>
      <div className={styles.textContainer}>
        <div className={styles.label}>{"Burn Fee"}</div>
        <div className={styles.unionMoney}> {detailData?.burn_fee}</div>
      </div>
      <div className={styles.textContainer}>
        <div className={styles.label}>{"Transfer Fee"}</div>
        <div className={styles.unionCount}> {detailData?.flat_fee}</div>
      </div>
      <div className={styles.textContainer}>
        <div className={styles.label}>{"Holders"}</div>
        <div className={styles.unionMoney}> {detailData?.holders}</div>
      </div>
      <div className={styles.textContainer}>
        <div className={styles.label}>{"Supports Supply Increase"}</div>
        <div
          className={classNames({
            [styles.increaseContainer]: true,
            [styles.increaseColor]: detailData?.mint_on,
            [styles.descreaseColor]: !detailData?.mint_on,
          })}
        >
          {" "}
          {detailData?.mint_on ? "YES" : "NO"}
        </div>
      </div>
    </div>
  );
};

export default BasicInfo;
