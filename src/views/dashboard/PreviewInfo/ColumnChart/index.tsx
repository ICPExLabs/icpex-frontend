import React, { useCallback, useEffect, useRef, useState } from "react";
import { Column } from "@antv/g2plot";
import Header from "../Header";
import styles from "../index.module.less";
import { changeArrFormat } from "@/utils/dashboard";
import { formatAmountByUnit } from "@/utils/common.ts";

interface ColumnChartIProps {
  data: any;
  type: string;
  headerTitle: string;
  headerTitleComment?: string;
  headerNode?: any;
}

const ColumnChart: React.FC<ColumnChartIProps> = (props) => {
  const { data, type, headerTitle, headerTitleComment } = props;
  const [columnChart, setColumnChart] = useState(null);
  const [curData, setCurData] = useState("");
  const [curTm, setCurTm] = useState("");

  const chart = useRef<any>(null);

  const typeMap = {
    price: "price",
    volume: "volume",
    tvl: "tvl",
    transactions: "transactionsNum",
  };

  const renderColumnChart = () => {
    if (!columnChart) {
      chart.current = new Column("columnContainer", {
        width: 400,
        height: 180,
        data: changeArrFormat(data),
        xField: "ts",
        yField: typeMap[type],
        tooltip: false,
      });
      setColumnChart(chart.current);
    } else {
      chart.current = columnChart;
    }
    chart.current.options = {
      data: changeArrFormat(data),
      xField: "ts",
      yField: typeMap[type],
      width: 400,
      height: 180,
      color: "#8572ff",
      padding: 20,
      // label: {
      //     position: 'bottom', // 'top', 'bottom', 'middle',
      //     style: {
      //         fill: '#FFFFFF',
      //         opacity: 0.6,
      //     },
      // },
      label: false,
      xAxis: {
        label: {
          autoHide: true,
          autoRotate: false,
        },
      },
      yAxis: {
        grid: null,
        label: null,
      },
      tooltip: {
        formatter: (datum: any) => {
          const tempValue = formatAmountByUnit(datum[typeMap[type]]);
          return {
            name: datum.ts,
            value:
              (tempValue ?? "") !== ""
                ? type !== "transactions"
                  ? `$${tempValue}`
                  : tempValue
                : "",
          };
        },
      },
    };

    chart.current.render();
  };

  const onTooltipChange = useCallback((ev: any) => {
    setCurData(`${ev?.data?.items?.[0]?.value}`);
    const tempTitle = ev?.data?.items?.[0]?.title || "";
    setCurTm(ev?.data?.items?.[0]?.data?.timeStr?.[tempTitle] || "");
  }, []);

  const resetTooltipChange = useCallback((ev: any) => {
    setCurData("");
    setCurTm("");
  }, []);

  useEffect(() => {
    if (data?.length > 0) {
      renderColumnChart();
      chart.current?.on("tooltip:change", onTooltipChange);
      // chart.current?.on('tooltip:hide', resetTooltipChange)
      chart.current?.on("mouseleave", resetTooltipChange);
    }

    return () => {
      chart.current?.off("tooltip:change", onTooltipChange);
      // chart.current?.off('tooltip:hide', resetTooltipChange)
      chart.current?.off("mouseleave", resetTooltipChange);
    };
  }, [data, type, curTm]);

  return (
    <div className={styles.previewContainer}>
      <Header
        headerType={typeMap[type]}
        headerData={data}
        headerTitle={headerTitle}
        headerNode={props.headerNode}
        curData={curData}
        curTm={curTm}
        headerTitleComment={headerTitleComment}
      />
      <div id={"columnContainer"} />
    </div>
  );
};

export default ColumnChart;
