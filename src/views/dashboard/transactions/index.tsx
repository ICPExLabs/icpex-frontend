import type { FC } from "react";
import React, { useEffect, useMemo, useState } from "react";
import type { CheckboxProps, RadioChangeEvent } from "antd";
import { Checkbox, Radio, Table, Tooltip } from "antd";
import styles from "./index.module.less";
import { CommonTable } from "@/components";
import type { Transaction } from "@/utils/service/pool";
import { getTransactions } from "@/utils/service/pool";
import { formatAmountByUnit } from "@/utils/common";
import { truncateString } from "@/utils/principal";
import type { TablePaginationConfig } from "antd/es/table";
import { QuestionCircleFilled } from "@ant-design/icons";

interface TableParams {
  pagination?: TablePaginationConfig;
  type: Transaction["operation"];
}

interface TransactionProps {
  curId?: string;
  detailType?: string;
}

const types = [
  {
    label: "Swaps",
    value: "Swap",
  },
  {
    label: "Adds",
    value: "AddLiquidity",
  },
  {
    label: "Removes",
    value: "RemoveLiquidity",
  },
];

const columns: any[] = [
  {
    title: "Action",
    dataIndex: "action",
    width: 180,
  },
  {
    title: "Total Value",
    dataIndex: "totalValue",
    width: 150,
    render: (totalValue: number) => {
      return `$${formatAmountByUnit(totalValue)}`;
    },
    sorter: (a: { totalValue: number }, b: { totalValue: number }) =>
      a.totalValue - b.totalValue,
  },
  {
    title: "Token Amount A",
    dataIndex: "tokenAmountA",
    width: 200,
    render: (tokenAmountA: number, { tokenSymbolA }: Transaction) => {
      return `${formatAmountByUnit(tokenAmountA)} ${tokenSymbolA}`;
    },
    sorter: (a: { tokenAmountA: number }, b: { tokenAmountA: number }) =>
      a.tokenAmountA - b.tokenAmountA,
  },
  {
    title: "Token Amount B",
    dataIndex: "tokenAmountB",
    width: 200,
    render: (tokenAmountB: number, { tokenSymbolB }: Transaction) => {
      return `${formatAmountByUnit(tokenAmountB)} ${tokenSymbolB}`;
    },
    sorter: (a: { tokenAmountB: number }, b: { tokenAmountB: number }) =>
      a.tokenAmountB - b.tokenAmountB,
  },
  {
    title: "Principal ID",
    dataIndex: "principleId",
    width: 180,
    render: (_: any, record: any) => {
      const { principleId } = record;
      return (
        <div className={styles.ellipsis}>{truncateString(principleId)}</div>
      );
    },
  },
  {
    title: "Time(UTC)",
    dataIndex: "ts",
    width: 200,
  },
];
const Transactions: FC<TransactionProps> = (props) => {
  const [type, setType] = useState<Transaction["operation"]>("Swap");
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<Transaction[]>([]);
  const [tableParams, setTableParams] = useState<TableParams>({
    pagination: {
      current: 1,
      pageSize: 10,
    },
    type: "Swap",
  });
  const { detailType = "", curId = "" } = props;

  const filterList = useMemo(() => {
    setLoading(true);
    if (type === "All") {
      setLoading(false);
      return list;
    } else {
      setLoading(false);
      return list.filter((item) => item.operation === type);
    }
  }, [type, list]);
  const handleType = (e: RadioChangeEvent) => {
    setType(e.target.value);
    setTableParams({
      ...tableParams,
      pagination: {
        ...tableParams.pagination,
        current: 1,
        pageSize: 10,
      },
      type: e.target.value,
    });
  };

  const getList = async () => {
    setLoading(true);
    const sendConfig = {
      operation: tableParams.type,
      pageNum: tableParams?.pagination?.current || 1,
      pageSize: tableParams?.pagination?.pageSize || 10,
    };
    const typeMap = {
      token: "tokenId",
      pool: "poolId",
    };
    if (detailType && curId) {
      sendConfig[typeMap[detailType]] = curId;
    }
    const [err, res] = await getTransactions(sendConfig);
    if (!err) {
      const handledList = res.data.data.map((item) => {
        const { ts, ...rest } = item;
        return {
          ts: ts.split(".")[0],
          ...rest,
        };
      });
      setTableParams({
        ...tableParams,
        pagination: {
          ...tableParams.pagination,
          total: res.data.totalCount,
        },
      });
      setList(handledList);
    }
    setLoading(false);
  };

  useEffect(() => {
    getList();
  }, [JSON.stringify(tableParams)]);

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setTableParams({
      ...tableParams,
      pagination,
    });
  };
  return (
    <div className={styles.transactions}>
      <header className={styles.header}>
        <div className={styles["header-left"]}>Transactions</div>
        <div className={styles["header-right"]}>
          <Radio.Group
            name="radiogroup"
            size="small"
            value={type}
            onChange={handleType}
          >
            {types.map((item) => {
              return (
                <Radio value={item.value} key={item.value}>
                  {item.label}
                </Radio>
              );
            })}
          </Radio.Group>
        </div>
      </header>
      <CommonTable
        className={styles.table}
        columns={columns}
        dataSource={filterList}
        loading={loading}
        rowKey="ts"
        pagination={{ ...tableParams.pagination, showSizeChanger: true }}
        onChange={handleTableChange}
      />
    </div>
  );
};

export default Transactions;
