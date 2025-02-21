import React, { ChangeEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Checkbox, CheckboxProps, Input, Space, Tooltip } from "antd";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  QuestionCircleFilled,
  SearchOutlined,
} from "@ant-design/icons";
import classNames from "classnames";
import styles from "./index.module.less";
import {
  getPriceChangeRate,
  getScientificNotation,
  getCountUnit,
} from "@/utils/dashboard";
import { CommonTable } from "@/components";
import { formatAmountByUnit } from "@/utils/common.ts";
import { observer } from "mobx-react";

interface TopTokensIProps {
  tableData: any[];
  tokenLoading: boolean;
}
const TopTokens: React.FC<TopTokensIProps> = observer((props) => {
  let { tableData, tokenLoading } = props;
  const [tableDataState, settableDataState] = useState([]);
  const tempdata = tableData;
  const [innerValue, setinnerValue] = useState("");
  const navigate = useNavigate();
  const [isofficial_tokens, setisofficial_tokens] = useState(false);
  tableData.sort((a, b) => {
    return b.volume24h - a.volume24h;
  });
  tableData.forEach((item, index) => {
    item.sortedIndex = index + 1;
  });
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.trim();
    setinnerValue(value);
  };
  const columns = [
    {
      title: "#",
      dataIndex: "index",
      render: (_: any, record: { sortedIndex: number }) => {
        return record.sortedIndex;
      },
    },
    {
      title: "Name",
      dataIndex: "symbol",
      // width: 100,
      render: (text: string, record: any) => {
        // console.log(record);

        const { tokenId, iconUrl } = record;
        return (
          <div
            onClick={() => navigate(`/token/detail/${tokenId}`)}
            className={styles.iconContainer}
          >
            <img src={iconUrl} className={styles.coinIconStyle} />
            <span className={styles.coinText}>{text}</span>
            <span style={{ marginLeft: "5px" }}>
              {tokenId == "7tx3o-zyaaa-aaaak-aes6q-cai" ? "🚀" : ""}
            </span>
            <div
              style={{
                display: tokenId == "7tx3o-zyaaa-aaaak-aes6q-cai" ? "" : "none",
                color: "#ffc900",
              }}
            >
              <span className={styles.SNS}>SNS T</span>ransition
            </div>
          </div>
        );
      },
    },
    {
      title: "Standard",
      dataIndex: "tokenType",
      // width: 100,
    },
    {
      title: "Price",
      dataIndex: "price",
      // defaultSortOrder: 'descend',
      sorter: (a: { price: number }, b: { price: number }) => a.price - b.price,
      render: (value: number | string | null) => {
        return (value ?? "") !== "" ? `$${formatAmountByUnit(value!)}` : "";
      },
    },
    {
      title: "Price Change",
      dataIndex: "priceChange",
      // defaultSortOrder: 'descend',
      sorter: (
        a: { priceChange: number; price: number },
        b: { priceChange: number; price: number }
      ) => {
        let a_rate = Number.parseFloat(
          getPriceChangeRate(a.price, a.priceChange)
        );
        let b_rate = Number.parseFloat(
          getPriceChangeRate(b.price, b.priceChange)
        );
        if (Number.isNaN(a_rate)) {
          a_rate = 0;
        }
        if (Number.isNaN(b_rate)) {
          b_rate = 0;
        }
        return a_rate - b_rate;
      },
      render: (_: number | null, record: any) => {
        const { price, priceChange } = record;
        const curRate = getPriceChangeRate(price, priceChange);
        if (curRate) {
          const increaseFlag = Number(curRate) > 0;
          return (
            <Space>
              <span
                className={classNames({
                  [styles.increaseColor]: increaseFlag,
                  [styles.descreaseColor]: !increaseFlag,
                })}
              >{`${curRate}%`}</span>
              {increaseFlag ? (
                <ArrowUpOutlined
                  className={classNames({
                    [styles.increaseColor]: increaseFlag,
                  })}
                />
              ) : (
                <ArrowDownOutlined
                  className={classNames({
                    [styles.descreaseColor]: !increaseFlag,
                  })}
                />
              )}
            </Space>
          );
        } else {
          return "--";
        }
      },
    },
    {
      title: "Volume 24H",
      dataIndex: "volume24h",
      // width: 100,
      // defaultSortOrder: 'descend',
      sorter: (a: { volume24h: number }, b: { volume24h: number }) =>
        a.volume24h - b.volume24h,
      render: (value: number | null) => {
        return (value ?? "") !== "" ? `$${formatAmountByUnit(value)}` : "--";
      },
    },
    {
      title: "TVL",
      dataIndex: "tvl",
      // defaultSortOrder: 'descend',
      sorter: (a: { tvl: number }, b: { tvl: number }) => a.tvl - b.tvl,
      render: (value: number | null) => {
        return (value ?? "") !== "" ? `$${formatAmountByUnit(value)}` : "--";
      },
    },
  ];
  const special_onChange: CheckboxProps["onChange"] = (e) => {
    setisofficial_tokens(e.target.checked);
  };
  const [placeholder, setPlaceholder] = useState(
    "Search by symbol or canister id"
  );
  useEffect(() => {
    const filteredData = tableData.filter((row) => {
      const matchesTokenOne = innerValue
        ? row.tokenId.includes(innerValue)
        : true;
      const matchesIsOfficialTokens = isofficial_tokens
        ? row.ptype == "CERTIFICATION"
        : true;
      const symbolToken = innerValue ? row.symbol.includes(innerValue) : true;
      return (matchesTokenOne || symbolToken) && matchesIsOfficialTokens;
    });
    settableDataState(filteredData);
  }, [isofficial_tokens, innerValue]);
  return (
    <div className={styles.pools}>
      <header className={styles.header}>
        <div className={styles["header-left"]}>Top Tokens</div>
        <Input
          value={innerValue}
          className={styles.input}
          onBlur={() => setPlaceholder("Search by symbol or canister id")}
          onFocus={() => setPlaceholder("")}
          allowClear
          bordered={false}
          size="large"
          placeholder={placeholder}
          prefix={<SearchOutlined className={styles.search} />}
          onChange={handleChange}
        />
        <div>
          <Checkbox
            className={styles.officialtoken}
            onChange={special_onChange}
          >
            Only show official tokens
          </Checkbox>
          <Tooltip
            title={
              "The official token here refers to a token whose issuance is recognized by a certain project. ICPEx is not responsible for the safety of this project. Please DYOR!"
            }
          >
            <QuestionCircleFilled className={styles.question} />
          </Tooltip>
        </div>
      </header>
      <CommonTable
        className={styles.table}
        columns={columns}
        dataSource={
          tableDataState.length == 0 && !innerValue ? tableData : tableDataState
        }
        rowKey="tokenId"
        loading={tokenLoading}
      />
    </div>
  );
});
export default TopTokens;
