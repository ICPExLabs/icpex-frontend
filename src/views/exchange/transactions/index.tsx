import type { FC } from "react";
import React, { useEffect, useState } from "react";
import type { RadioChangeEvent, TablePaginationConfig } from "antd";
import { Radio, Spin } from "antd";
import { observer } from "mobx-react";
import styles from "./index.module.less";
import { CommonTable } from "@/components";
import type { Transaction } from "@/utils/service/pool";
import { getTransactions } from "@/utils/service/pool";
import { formatAmountByUnit } from "@/utils/common";
import { Pagination } from "antd";
import appStore from "@/store/app";
import classNames from "classnames";

const types = [
  {
    label: "All",
    value: "All",
  },
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
    width: 110,
    render: (totalValue: number) => {
      return `$${formatAmountByUnit(totalValue)}`;
    },
  },
  {
    title: "Token Amount A",
    dataIndex: "tokenAmountA",
    width: 150,
    render: (tokenAmountA: number, { tokenSymbolA }: Transaction) => {
      return `${formatAmountByUnit(tokenAmountA)} ${tokenSymbolA}`;
    },
  },
  {
    title: "Token Amount B",
    dataIndex: "tokenAmountB",
    width: 150,
    render: (tokenAmountB: number, { tokenSymbolB }: Transaction) => {
      return `${formatAmountByUnit(tokenAmountB)} ${tokenSymbolB}`;
    },
  },
  {
    title: "Time(UTC)",
    dataIndex: "ts",
    width: 180,
  },
];

const Transactions: FC = () => {
  const [type, setType] = useState<Transaction["operation"]>("All");
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<Transaction[]>([]);

  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
    position: ["bottomCenter"],
    showSizeChanger: true,
  });

  const getList = async () => {
    setLoading(true);
    const [err, res] = await getTransactions({
      operation: type,
      caller: appStore.userId,
      pageNum: pagination.current,
      pageSize: pagination.pageSize,
    });
    if (!err) {
      const { data, totalCount } = res.data;
      const handledList = data.map((item) => {
        const { ts, ...rest } = item;
        return {
          ts: ts.split(".")[0],
          ...rest,
        };
      });
      setList(handledList);
      setPagination({
        ...pagination,
        total: totalCount,
      });
    }
    setLoading(false);
  };

  const handleType = (e: RadioChangeEvent) => {
    setType(e.target.value);
    setPagination({
      ...pagination,
      current: 1,
    });
  };

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    setPagination({
      ...pagination,
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });
    return pagination;
  };
  const TablePhoneHandleTableChange = (page: number, pageSize: number) => {
    setPagination({ ...pagination, current: page, pageSize: pageSize });
    return pagination;
  };
  const itemRender = (
    current: number,
    type: string,
    originalElement: React.ReactNode
  ) => {
    if (type === "page") {
      if (
        current === 1 ||
        current === 2 ||
        current === 5 ||
        current === 6 ||
        (current >= 3 && current <= 4 && Math.abs(current - 3) <= 1)
      ) {
        return originalElement;
      }
      if (current === 3 || current === 4) {
        return <span>...</span>;
      }
      return null;
    }
    return originalElement;
  };
  useEffect(() => {
    if (appStore.userId) getList();
  }, [appStore.userId, type, pagination.current, pagination.pageSize]);

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
        dataSource={list}
        loading={loading}
        pagination={pagination}
        rowKey="ts"
        onChange={handleTableChange}
      />
      <div className={styles.TablePhone}>
        <Spin spinning={loading}>
          {list?.map((filterList) => {
            return (
              <div className={styles.DataCard} key={filterList.action}>
                <div className={styles.Buttom}>
                  <div className={styles.left}>
                    <div className={styles.btm}>
                      <span className={styles.label}>Action</span>
                      <span className={styles.value}>{filterList.action}</span>
                    </div>
                    <div className={styles.top}>
                      <span className={styles.label}>Token Amount A</span>
                      <span className={styles.value}>
                        {formatAmountByUnit(filterList.tokenAmountA)}{" "}
                        {filterList.tokenSymbolA}
                      </span>
                    </div>
                  </div>
                  <div className={styles.right}>
                    <div className={styles.btm}>
                      <span className={styles.label}>Volume</span>
                      <span className={styles.value}>
                        ${formatAmountByUnit(filterList.totalValue)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className={styles.title}>
                  <span className={styles.label}>Token Amount B</span>
                  <span className={styles.value}>
                    {formatAmountByUnit(filterList.tokenAmountB)}{" "}
                    {filterList.tokenSymbolB}
                  </span>
                </div>
                <div className={styles.title}>
                  <span className={styles.label}>Time</span>
                  <span className={styles.value}>{filterList.ts}</span>
                </div>
              </div>
            );
          })}
          <Pagination
            itemRender={itemRender}
            className={classNames(styles.table)}
            onChange={TablePhoneHandleTableChange}
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "5px",
            }}
            {...pagination}
          />
        </Spin>
      </div>
    </div>
  );
};

export default observer(Transactions);
