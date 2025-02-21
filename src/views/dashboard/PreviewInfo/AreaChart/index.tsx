import React, { useCallback, useEffect, useRef, useState } from "react";
import { Area } from "@antv/g2plot";
import Header from "../Header";
import styles from "../index.module.less";
import { changeArrFormat, getCountUnit } from "@/utils/dashboard";
import { formatAmountByUnit } from "@/utils/common.ts";

interface AreaChartIProps {
  data: any;
  type: string;
  headerTitle: string;
  headerTitleComment: string;
}

const AreaChart: React.FC<AreaChartIProps> = (props) => {
  const { data, headerTitle, type, headerTitleComment } = props;
  const [areaChart, setAreaChart] = useState(null);
  const [curData, setCurData] = useState("");
  const [curTm, setCurTm] = useState("");

  const chart = useRef<any>(null);

  const renderAreaChart = () => {
    if (!areaChart) {
      chart.current = new Area("areaContainer", {
        width: 400,
        height: 180,
        data: changeArrFormat(data),
      });
      setAreaChart(chart.current);
    } else {
      chart.current = areaChart;
    }
    chart.current.options = {
      data: changeArrFormat(data),
      xField: "ts",
      yField: "tvl",
      xAxis: {
        range: [0, 1],
      },
      yAxis: {
        grid: null,
        label: null,
      },
      smooth: true,
      padding: 20,
      areaStyle: {
        stroke: "#8572ff",
        lineWidth: 2,
      },
      tooltip: {
        formatter: (datum: any) => {
          const tempValue = formatAmountByUnit(datum.tvl);
          return {
            name: datum.ts,
            value: (tempValue ?? "") !== "" ? `$${tempValue}` : "",
          };
        },
        // showContent: false,
        // showCrosshairs: false,
        // showTitle: false,
        containerTpl:
          '<div class="g2-tooltip" style="background: #aaa"><div class="g2-tooltip-title" style="margin:10px 0;"></div><ul class="g2-tooltip-list"></ul></div>',
      },
      // interactions: [
      //   // {
      //   //   type: 'element-active'
      //   // },
      //   {
      //     type: 'brush'
      //   }
      // ],
    };
    // chart.current.tooltip(false)
    chart.current.render();
  };

  const onTooltipChange = useCallback((ev: any) => {
    setCurData(ev?.data?.items?.[0]?.value);
    const tempTitle = ev?.data?.items?.[0]?.title || "";
    setCurTm(ev?.data?.items?.[0]?.data?.timeStr?.[tempTitle] || "");
  }, []);

  const resetTooltipChange = useCallback((ev: any) => {
    setCurData("");
    setCurTm("");
  }, []);

  useEffect(() => {
    if (data?.length > 0) {
      renderAreaChart();

      chart.current?.on("tooltip:change", onTooltipChange);
      chart.current?.on("tooltip:hide", resetTooltipChange);
    }
    return () => {
      chart.current?.off("tooltip:change", onTooltipChange);
      chart.current?.off("tooltip:hide", resetTooltipChange);
    };
  }, [data]);

  return (
    <div className={styles.previewContainer}>
      <Header
        headerType={type}
        headerData={data}
        headerTitle={headerTitle}
        curData={curData}
        curTm={curTm}
        headerTitleComment={headerTitleComment}
      />
      <div id={"areaContainer"} />
    </div>
  );
};

export default AreaChart;
