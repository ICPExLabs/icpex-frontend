import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import classNames from "classnames";
import styles from "./index.module.less";
import { CommonTable } from "@/components";
import { formatAmountByUnit } from "@/utils/common.ts";
import TokensParameter from "./tokens-parameter";
import { Token, UserToken } from "@/types/token";
import { Checkbox, CheckboxProps, Tooltip } from "antd";
import { QuestionCircleFilled } from "@ant-design/icons";

interface PoolsIProps {
  tableData: any;
  title: string;
  detailType?: boolean;
  poolLoading: boolean;
}
export interface TokensParameterProps {
  tokenOne?: Token;
  tokenTwo?: Token;
  onSelect?: (order: string, token: UserToken) => void;
}
const Pools: React.FC<PoolsIProps> = (props) => {
  let { tableData, title, poolLoading } = props;
  const tempdata = tableData;
  const [tableDataState, settableDataState] = useState([]);
  const [tokenOne, setTokeOne] = useState<Token>();
  const [tokenTwo, setTokeTwo] = useState<Token>();
  const [isofficial_tokens, setisofficial_tokens] = useState(false);
  const navigate = useNavigate();
  tableData.sort((a, b) => {
    return b.volume24h - a.volume24h;
  });
  tableData.forEach((item, index) => {
    item.sortedIndex = index + 1;
  });
  let specialtemp: any = [];
  const special_onChange: CheckboxProps["onChange"] = (e) => {
    setisofficial_tokens(e.target.checked);
  };
  const getTableColumns = () => {
    const columns = [
      {
        title: "#",
        dataIndex: "pool",
        render: (_: any, record: { sortedIndex: number }) => {
          return record.sortedIndex;
        },
      },
      {
        title: "Pool",
        dataIndex: "poolId",
        width: 200,
        render: (_: string, record: any) => {
          const {
            baseTokenUrl,
            quoteTokenUrl,
            baseSymbol,
            quoteSymbol,
            poolId,
          } = record;
          return (
            <div
              className={styles.tokenContainer}
              onClick={() => {
                window.location.href = `/pool/detail/${poolId}`;
              }}
            >
              <img className={styles.tokenIcon} src={baseTokenUrl} />
              <img
                className={classNames(styles.tokenIcon, styles.lastToken)}
                src={quoteTokenUrl}
              />
              <span className={styles.tokenText}>
                {baseSymbol}/{quoteSymbol}
              </span>
            </div>
          );
        },
      },
      {
        title: "Trading Fee Rate",
        dataIndex: "fee",
        width: 200,
        // defaultSortOrder: 'descend',
        sorter: (a: { fee: number }, b: { fee: number }) => a.fee - b.fee,
        render: (value: number) => {
          return value ? `${(value / 10 ** 18) * 100}%` : "";
        },
      },

      {
        title: "TVL",
        dataIndex: "tvl",
        // width: 100,
        // defaultSortOrder: 'descend',
        sorter: (a: { tvl: number }, b: { tvl: number }) => a.tvl - b.tvl,
        render: (value: number | null) => {
          return (value ?? "") !== "" ? `$${formatAmountByUnit(value)}` : "--";
        },
      },
      {
        title: "Volume 24H",
        dataIndex: "volume24h",
        width: 150,
        // defaultSortOrder: 'descend',
        sorter: (a: { volume24h: number }, b: { volume24h: number }) =>
          a.volume24h - b.volume24h,
        render: (value: number | null) => {
          return (value ?? "") !== "" ? `$${formatAmountByUnit(value)}` : "--";
        },
      },
      {
        title: "Volume 7D",
        dataIndex: "volume7d",
        width: 150,
        // defaultSortOrder: 'descend',
        sorter: (a: { volume7d: number }, b: { volume7d: number }) =>
          a.volume7d - b.volume7d,
        render: (value: number | null) => {
          return (value ?? "") !== "" ? `$${formatAmountByUnit(value)}` : "--";
        },
      },
      {
        title: "APR",
        dataIndex: "apr",
        // width: 100,
        // defaultSortOrder: 'descend',
        sorter: (a: { apr: number }, b: { apr: number }) => a.apr - b.apr,
        render: (value: number | null) => {
          return (value ?? "") !== "" ? `${(value! * 100).toFixed(2)}%` : "--";
        },
      },
    ];
    // if(!detailType) {
    //   columns.splice(3, 0, {
    //     title: 'Token Amount A',
    //     dataIndex: 'tokenAmountA',
    //     width: 200,
    //     defaultSortOrder: 'descend',
    //     sorter: (a: { tokenAmountA: number }, b: { tokenAmountA: number }) => a.tokenAmountA - b.tokenAmountA,
    //     render: (value: number | null) => {
    //       return ((value ?? '') !== '') ? `$${combineCountData(value)}K` : ''
    //     }
    //   },)
    // }
    return columns;
  };
  const handleSelectToken: TokensParameterProps["onSelect"] = (
    order,
    token
  ) => {
    switch (order) {
      case "one":
        if (token.canisterId === tokenTwo?.canisterId) setTokeTwo(tokenOne);
        setTokeOne(token);
        break;
      case "two":
        if (token.canisterId === tokenOne?.canisterId) setTokeOne(tokenTwo);
        setTokeTwo(token);
        break;
    }
  };
  const handleClear = (value: string) => {
    if (value == "one") {
      setTokeOne(undefined);
    } else {
      setTokeTwo(undefined);
    }
  };
  useEffect(() => {
    const filteredData = tableData.filter((row) => {
      const matchesTokenOne = tokenOne
        ? row.baseToken == tokenOne.canisterId ||
          row.quoteToken == tokenOne.canisterId
        : true;
      const matchesTokenTwo = tokenTwo
        ? row.quoteToken == tokenTwo.canisterId ||
          row.baseToken == tokenTwo.canisterId
        : true;
      const matchesIsOfficialTokens = isofficial_tokens
        ? row.basePtype == "CERTIFICATION" && row.quotePtype == "CERTIFICATION"
        : true;
      return matchesTokenOne && matchesTokenTwo && matchesIsOfficialTokens;
    });
    settableDataState(filteredData);
  }, [tokenOne, tokenTwo, isofficial_tokens]);
  return (
    <div className={styles.pools}>
      <header className={styles.header}>
        <div className={styles["header-left"]}> {title}</div>
        <div className={styles.selectTokens}>
          <TokensParameter
            tokenOne={tokenOne}
            tokenTwo={tokenTwo}
            onSelect={handleSelectToken}
            onClear={handleClear}
          />
        </div>
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
        columns={getTableColumns()}
        dataSource={
          tableDataState.length != 0 || tokenOne || tokenTwo
            ? tableDataState
            : tableData
        }
        rowKey="poolId"
        loading={poolLoading}
      />
    </div>
  );
};

export default Pools;
