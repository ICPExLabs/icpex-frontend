import type { FC } from "react";
import React, { useEffect, useState } from "react";
import styles from "./index.module.less";
import Transactions from "./transactions";
import Pools from "./TopPools";
import TopTokens from "./TopTokens";
import AreaChart from "./PreviewInfo/AreaChart";
import ColumnChart from "./PreviewInfo/ColumnChart";
import { DimensionSelector } from "@/components";
import {
  getPoolChartInfo,
  getPoolListDataSimple,
  getTokenListDataSimple,
} from "@/utils/dashboard";
import { handleTask } from "@/utils/catch.ts";

export const DashBoard: FC = () => {
  const [tokenListData, setTokenListData] = useState([] as any);
  const [poolListData, setPoolListData] = useState([] as any);
  const [chartData, setChartData] = useState([] as any);
  const [dimension, setDimension] = useState("overview");
  const [tokenLoading, setTokenLoading] = useState(false);
  const [poolLoading, setPoolLoading] = useState(false);

  const dimentions = [
    {
      value: "overview",
      label: "Overview",
      style: {
        width: "143px",
      },
    },
    {
      value: "tokens",
      label: "Top Tokens",
      style: {
        width: "181px",
      },
    },
    {
      value: "pools",
      label: "Top Pools",
      style: {
        width: "181px",
      },
    },
    {
      value: "transactions",
      label: "Transactions",
      style: {
        width: "181px",
      },
    },
  ];

  useEffect(() => {
    fetchListData();
  }, []);

  const fetchPoolChartInfo = async () => {
    const chartResult = await getPoolChartInfo();
    setChartData(chartResult);
  };

  const fetchTokenListData = async () => {
    setTokenLoading(true);
    const result = await getTokenListDataSimple();
    setTokenListData(result);
    setTokenLoading(false);
  };

  const fetchPoolListData = async () => {
    setPoolLoading(true);
    const poolResult = await getPoolListDataSimple();

    setPoolListData(poolResult);
    setPoolLoading(false);
  };

  const fetchListData = async () => {
    Promise.all([
      handleTask(fetchPoolChartInfo(), null),
      handleTask(fetchTokenListData(), null),
      handleTask(fetchPoolListData(), null),
    ]);
  };

  return (
    <div className={styles.contentContainer}>
      <DimensionSelector
        value={dimension}
        options={dimentions}
        onChange={setDimension}
        style={{ width: 722 }}
      />
      {["overview"].includes(dimension) && (
        <div className={styles.overviewContainer}>
          <header className={styles.header}>
            <div className={styles["header-left"]}>Overview</div>
          </header>
          <div className={styles.content}>
            <AreaChart
              data={chartData}
              headerTitle="TVL"
              type="tvl"
              headerTitleComment="TVL is calculated based on official tokens."
            />
            <ColumnChart
              data={chartData}
              headerTitle="Volume"
              type="volume"
              headerTitleComment="Volume is calculated based on official tokens."
            />
          </div>
        </div>
      )}
      {["tokens", "overview"].includes(dimension) && (
        <TopTokens tableData={tokenListData} tokenLoading={tokenLoading} />
      )}
      {["pools", "overview"].includes(dimension) && (
        <Pools
          poolLoading={poolLoading}
          tableData={poolListData}
          title="Top Pools"
        />
      )}
      {["transactions", "overview"].includes(dimension) && <Transactions />}
    </div>
  );
};
