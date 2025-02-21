import type { FC } from "react";
import React, { useCallback, useState } from "react";
import { Button, Space, Tooltip } from "antd";
import { useNavigate } from "react-router-dom";
import classNames from "classnames";
import { observer } from "mobx-react";
import AddCycleModal from "../AddCycleModal";
import styles from "./index.module.less";
import { getPrincipalDashboardURL } from "@/utils/urls";
import { Copy, Share } from "@/components";
import { capitalizeFirstLetter, formatAmountByUnit } from "@/utils/common";
import { getPriceChangeRate } from "@/utils/dashboard";
import { truncateString } from "@/utils/principal";
import appStore from "@/store/app";

interface HeaderInfoIProps {
  basicInfo: any;
  tokenId: string;
  detailType: string;
  tokenListData?: any;
}

const HeaderInfo: FC<HeaderInfoIProps> = (props) => {
  const { basicInfo, tokenId, detailType, tokenListData } = props;
  const tokenTarget = tokenListData?.find(
    (item: any) => item.tokenId === tokenId
  );
  const curRate = getPriceChangeRate(
    tokenTarget?.price,
    tokenTarget?.priceChange
  );
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const viewSwapDetail = () => {
    if (detailType === "pool") {
      navigate(
        `/exchange?payToken=${basicInfo?.base_token}&receiveToken=${basicInfo?.quote_token}`
      );
    } else {
      navigate(`/exchange?payToken=${tokenId}`);
    }
  };

  const viewLiquidityDetail = () => {
    if (detailType === "pool") {
      navigate(
        `/liquidPool?categoryType=tokens&payToken=${basicInfo?.base_token}&receiveToken=${basicInfo?.quote_token}`
      );
    } else {
      navigate(`/liquidPool?categoryType=tokens&payToken=${tokenId}`);
    }
  };

  const handleAddCycles = useCallback(() => {
    if (!appStore.userId) return;
    setOpen(true);
  }, [appStore.userId]);

  const closeModal = useCallback(() => {
    setOpen(false);
  }, []);

  const customRenderCycle = () => {
    return (
      <div
        className={classNames({
          [styles.cycleContainer]: true,
          [styles.poolCycleContainer]: detailType === "pool",
          [styles.emptyCycles]:
            !!basicInfo && basicInfo?.platform_token_type !== "CREATETOKEN",
        })}
      >
        <span className={styles.cycleStyle}>
          {detailType === "token" || detailType === "pool"
            ? basicInfo?.cycles
            : "--"}
        </span>
        {!!basicInfo && (
          <span className={styles.addContainer} onClick={handleAddCycles}>
            <span className={styles.cycleDivider} />
            <span className={styles.addBtnStyle}>+ Add Cycles</span>
          </span>
        )}
      </div>
    );
  };

  return (
    <>
      <div
        className={classNames({
          [styles.headerContainer]: true,
          [styles.poolHeader]: detailType === "pool",
        })}
      >
        {detailType === "token" && (
          <div className={styles.coinContainer}>
            <img className={styles.coinImage} src={basicInfo?.logo} />
            <span className={styles.coinName}>{basicInfo?.symbol}</span>
          </div>
        )}
        {detailType === "pool" && (
          <div
            className={classNames(
              styles.coinContainer,
              styles.poolContainer,
              styles.poolColumn
            )}
          >
            <div className={styles.poolImgContainer}>
              <div>
                <Tooltip title={basicInfo?.base_token}>
                  <img className={styles.coinImage} src={basicInfo?.baseUrl} />
                </Tooltip>
                <Tooltip title={basicInfo?.quote_token}>
                  <img
                    className={classNames(styles.coinImage, styles.lastCoin)}
                    src={basicInfo?.quoteUrl}
                  />
                </Tooltip>
                <span className={styles.coinName}>
                  {basicInfo?.baseSymbol}/{basicInfo?.quoteSymbol}
                </span>
              </div>
              <div className={styles.tag}>
                {basicInfo?.type
                  ? `${capitalizeFirstLetter(basicInfo?.type)} Pool`
                  : "--"}{" "}
              </div>
            </div>
            <Space className={styles.transContainer}>
              <img src={basicInfo?.baseUrl} className={styles.transIcon} />
              <span className={styles.transText}>
                {basicInfo?.baseSymbol && basicInfo?.baseToQuote
                  ? `1 ${basicInfo?.baseSymbol} = ${
                      basicInfo?.baseToQuote || ""
                    } ${basicInfo?.quoteSymbol}`
                  : "-- = --"}
              </span>
              <img src={basicInfo?.quoteUrl} className={styles.transIcon} />
              <span className={styles.transText}>
                {basicInfo?.quoteSymbol && basicInfo?.quoteToBase
                  ? `1 ${basicInfo?.quoteSymbol} = ${
                      basicInfo?.quoteToBase || ""
                    } ${basicInfo?.baseSymbol}`
                  : "-- = --"}
              </span>
            </Space>
          </div>
        )}
        {detailType === "token" && (
          <div className={styles.rateContainer}>
            <div className={styles.rateCount}>
              {(tokenTarget?.price ?? "") !== ""
                ? `$${formatAmountByUnit(tokenTarget?.price)}`
                : "--"}
            </div>
            <div
              className={classNames({
                [styles.rateRatio]: true,
              })}
            >
              {curRate ? (
                <>
                  <span>(</span>
                  <span
                    className={classNames({
                      [styles.increaseColor]: +curRate > 0,
                      [styles.descreaseColor]: +curRate < 0,
                    })}
                  >{`${curRate}%`}</span>
                  <span>)</span>
                </>
              ) : (
                "--"
              )}
            </div>
          </div>
        )}
        <div
          className={classNames({
            [styles.textContainer]: true,
            [styles.poolContainer]: detailType === "pool",
            [styles.extraTokenStyle]: detailType === "token",
            [styles.extraPoolStyle]: detailType === "pool",
          })}
        >
          <span
            className={classNames({
              [styles.textContent]: true,
              [styles.poolTextContent]: detailType === "pool",
            })}
          >
            {truncateString(tokenId)}
          </span>
          <Space
            className={classNames({
              [styles.poolTextContent]: detailType === "pool",
            })}
          >
            <Share href={getPrincipalDashboardURL(tokenId)} />
            <Copy text={tokenId} />
          </Space>
        </div>
        {detailType === "token" ? (
          <>
            {customRenderCycle()}
            <div
              className={classNames({
                [styles.btnContainer]: true,
              })}
            >
              <Space>
                <Button
                  className={styles.add}
                  size="small"
                  onClick={viewLiquidityDetail}
                >
                  Add Liquidity
                </Button>
                <Button
                  type="primary"
                  onClick={viewSwapDetail}
                  className={styles.swap}
                  size="small"
                >
                  Swap
                </Button>
              </Space>
            </div>
          </>
        ) : (
          <div
            className={classNames({
              [styles.btnContainer]: true,
              [styles.poolBtnStyle]: detailType === "pool",
            })}
          >
            {customRenderCycle()}
            <Space>
              <Button
                className={styles.add}
                size="small"
                onClick={viewLiquidityDetail}
              >
                Add Liquidity
              </Button>
              <Button
                type="primary"
                onClick={viewSwapDetail}
                className={styles.swap}
                size="small"
              >
                Swap
              </Button>
            </Space>
          </div>
        )}
      </div>
      {basicInfo && (
        <AddCycleModal
          open={open}
          closeModal={closeModal}
          tokenId={tokenId}
          basicInfo={basicInfo}
        />
      )}
    </>
  );
};

export default observer(HeaderInfo);
