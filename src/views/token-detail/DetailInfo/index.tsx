import type { FC } from "react";
import React, { useMemo, useState } from "react";
import classNames from "classnames";
import { Space, Tooltip } from "antd";
import styles from "./index.module.less";
import MarketInfo from "./MarketInfo";
import BasicInfo from "./BasicInfo";
import SocialMediaLinks from "./SocialMediaLinks";
import PoolDetailInfo from "./PoolDetailInfo";
import { getEllipsisText } from "@/utils/dashboard";
import { LockFilled } from "@ant-design/icons";

const types = [
  {
    label: "Market Info",
    key: "market",
  },
  {
    label: "Basic Info",
    key: "basic",
  },
  {
    label: "Social Media Links",
    key: "social",
  },
];

interface DetailInfoIProps {
  marketInfo: any;
  basicInfo: any;
  detailType: string;
  poolMarketInfo?: any;
}

const DetailInfo: FC<DetailInfoIProps> = (props) => {
  const [innerActiveKey, setInnerActiveKey] = useState("market");
  const { marketInfo, basicInfo, detailType, poolMarketInfo } = props;
  console.log(basicInfo, "address");

  const inkBarStyle = useMemo(() => {
    let index = types.findIndex((item) => item.key === innerActiveKey);
    index = index < 0 ? 0 : index;
    const leftMap: { [prop: string]: number } = {
      1: 95,
      2: 210,
    };
    return {
      left: `${leftMap[String(index)] || 0}px`,
    };
  }, [innerActiveKey]);

  const onClick = (key: string) => {
    if (innerActiveKey !== key) {
      setInnerActiveKey(key);
    }
  };

  const tabContentMap = {
    market: <MarketInfo marketInfo={marketInfo} />,
    basic: <BasicInfo basicInfo={basicInfo} />,
    social: <SocialMediaLinks basicInfo={basicInfo} />,
  };

  const customRender = () => {
    if (detailType === "token") {
      return (
        <>
          <div className={styles.content}>
            <div className={styles.tabs}>
              {types.map((type) => {
                return (
                  <div
                    className={classNames({
                      [styles.item]: true,
                      [styles.marketWidth]: type.key === "market",
                      [styles.basicWidth]: type.key === "basic",
                      [styles.flexStyle]: type.key === "social",
                      [styles["item-active"]]: type.key === innerActiveKey,
                    })}
                    key={type.key}
                    onClick={() => onClick(type.key)}
                  >
                    {type.label}
                  </div>
                );
              })}
              <div
                className={classNames({
                  [styles["ink-bar"]]: true,
                })}
                style={inkBarStyle}
              />
            </div>
          </div>
          {tabContentMap[innerActiveKey as keyof typeof tabContentMap]}
        </>
      );
    } else {
      return (
        <>
          <div className={classNames(styles.lockContent, styles.content)}>
            <div className={styles.lockTitle}>{"Distribution of tokens"}</div>
            {/* <Divider/> */}
            <div className={styles.symbolContainer}>
              <Space>
                <span>
                  <Tooltip title={basicInfo?.base_token}>
                    {" "}
                    <img
                      src={basicInfo?.baseUrl}
                      className={styles.symbolIcon}
                    />
                  </Tooltip>
                  <Tooltip title={basicInfo?.baseSymbol}>
                    {" "}
                    <span className={styles.symbolText}>
                      {getEllipsisText(basicInfo?.baseSymbol)}
                    </span>
                  </Tooltip>
                </span>
                <span>
                  {basicInfo?.baseReserveRate
                    ? `${basicInfo?.baseReserveRate}%`
                    : "--"}
                </span>
              </Space>
              <div>
                {basicInfo?.baseReserve || "--"} ({" "}
                {basicInfo?.baseReserveLock || "--"} <LockFilled />)
              </div>
            </div>
            {/* <div className={styles.divider}></div> */}
            <div className={styles.symbolContainer}>
              <Space>
                <span>
                  <Tooltip title={basicInfo?.quote_token}>
                    <img
                      src={basicInfo?.quoteUrl}
                      className={styles.symbolIcon}
                    />
                  </Tooltip>
                  <Tooltip title={basicInfo?.quoteSymbol}>
                    {" "}
                    <span className={styles.symbolText}>
                      {getEllipsisText(basicInfo?.quoteSymbol)}
                    </span>
                  </Tooltip>
                </span>
                <span>
                  {basicInfo?.quoteReserveRate
                    ? `${basicInfo?.quoteReserveRate}%`
                    : "--"}
                </span>
              </Space>
              <div>
                {basicInfo?.quoteReserve || "--"} ({" "}
                {basicInfo?.quoteReserveLock || "--"} <LockFilled />)
              </div>
            </div>
          </div>
          <PoolDetailInfo
            basicInfo={basicInfo}
            poolMarketInfo={poolMarketInfo}
          />
        </>
      );
    }
  };
  return <div className={styles.contentContainer}>{customRender()}</div>;
};

export default DetailInfo;
