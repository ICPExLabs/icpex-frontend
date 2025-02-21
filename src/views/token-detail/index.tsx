import type { FC } from "react";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Space } from "antd";
import { observer } from "mobx-react";
import Transactions from "../dashboard/transactions";
import styles from "./index.module.less";
import DetailInfo from "./DetailInfo";
import PreviewInfo from "./PreviewInfo";
import HeaderInfo from "./HeaderInfo";
import arrowLeft from "@/assets/arrow-left.svg";
import {
  getMarketInfoData,
  getPoolBasicInfo,
  getPoolChartInfo,
  getPoolListDataSimple,
  getPoolListDataWhole,
  getPoolMarketInfo,
  getTokenBasicInfo,
  getTokenBasicInfoMore,
  getTokenChartDetail,
  getTokenListData,
} from "@/utils/dashboard";
import Pools from "@/views/dashboard/TopPools";
import {
  divide,
  divideAndConvertToNumber,
  formatAmountByUnit,
  multiply,
} from "@/utils/common.ts";
import { icpl_oracle } from "@/canisters/icpl_oracle";
import { Principal } from "@dfinity/principal";
import { getSimpleTokenList } from "@/utils/service/token.ts";

const TokenDetail: FC = () => {
  const navigate = useNavigate();
  const { tokenId, detailType } = useParams();
  const [marketInfo, setMarketInfo] = useState([] as any);
  const [chartInfo, setChartInfo] = useState([] as any);
  const [poolList, setPoolList] = useState([] as any);
  const [basicInfo, setBasicInfo] = useState(null as any);
  const [poolMarketInfo, setPoolMarketInfo] = useState({} as any);
  const [tokenListData, setTokenListData] = useState([] as any);

  useEffect(() => {
    if (detailType === "token") {
      initData();
    } else {
      initSimpleData();
    }
  }, []);

  useEffect(() => {
    const updateMarketInfo = () => {
      if (!tokenId) return;
      getMarketInfoData(tokenId).then(async (res) => {
        setMarketInfo([...res]);
        try {
          const [[_, priceBigint]] = await icpl_oracle.pricesBatch([
            Principal.fromText(tokenId),
          ]);
          const price = divideAndConvertToNumber(priceBigint, 18);
          const marketCapData = {
            label: "Market Cap",
            unionMoney:
              formatAmountByUnit(
                divide(
                  multiply(Number(basicInfo.total_supply), price),
                  10 ** Number(basicInfo.decimals),
                  18
                )
              ) || "--",
          };
          setMarketInfo([...res, marketCapData]);
        } catch (e) {}
      });
    };

    updateMarketInfo();

    return () => {};
  }, [basicInfo, tokenListData]);

  const initData = async () => {
    if (!tokenId) return;

    getTokenChartDetail(tokenId).then((res) => {
      setChartInfo(res);
    });

    getTokenBasicInfo(tokenId).then(async (res) => {
      setBasicInfo(res);
    });

    getPoolListDataSimple(tokenId).then(async (res) => {
      setPoolList(res);
    });

    getTokenListData(tokenId).then((res) => {
      setTokenListData(res);
    });
  };

  async function getTokenListData(tokenId: string) {
    const [err, result] = await getSimpleTokenList(tokenId);
    let listData = [] as any;
    if (!err) {
      listData = result?.data?.data || [];
    }
    return listData;
  }

  const initSimpleData = () => {
    if (!tokenId) return;
    getPoolBasicInfo(tokenId).then(async (res) => {
      setBasicInfo(res);
    });
    getPoolMarketInfo(tokenId).then((res) => {
      setPoolMarketInfo(res);
    });
    getPoolChartInfo(tokenId).then((res) => {
      setChartInfo(res);
    });
  };

  return (
    <>
      <div className={styles.back}>
        <div
          className={styles.backContainer}
          onClick={(e) => {
            e.stopPropagation();
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate("/dashboard");
            }
          }}
        >
          <Space>
            <img src={arrowLeft} alt="arrow" />
            <span> Go back</span>
          </Space>
        </div>
      </div>
      <HeaderInfo
        basicInfo={basicInfo}
        tokenId={tokenId}
        detailType={detailType}
        tokenListData={tokenListData}
      />
      <div className={styles.content}>
        <DetailInfo
          marketInfo={marketInfo}
          basicInfo={basicInfo}
          detailType={detailType}
          poolMarketInfo={poolMarketInfo}
        />
        <PreviewInfo detailType={detailType} chartInfo={chartInfo} />
      </div>
      {detailType === "token" && (
        <Pools tableData={poolList} title="Pools" detailType />
      )}
      <Transactions detailType={detailType} curId={tokenId} />
    </>
  );
};

export default observer(TokenDetail);
