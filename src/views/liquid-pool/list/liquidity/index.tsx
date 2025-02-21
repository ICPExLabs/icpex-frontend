import type { TablePaginationConfig } from "antd";
import { Table } from "antd";
import type { FC } from "react";
import classNames from "classnames";
import React from "react";
import { observer } from "mobx-react";
import {
  LockOutlined,
  MinusOutlined,
  PlusOutlined,
  SendOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import styles from "./index.module.less";
import { CommonButton, CommonTable, Copy, Share } from "@/components";
import type { Pool } from "@/types/pool";
import { truncateString } from "@/utils/principal";
import {
  capitalizeFirstLetter,
  divide,
  formatAmountByUnit,
  truncateDecimal,
} from "@/utils/common";
import singleLogo from "@/assets/single.svg";
import appStore from "@/store/app";
import { getPrincipalDashboardURL, getTokenDetailUrl } from "@/utils/urls";

const { Column } = Table;

interface PoolListProps {
  data?: Pool[];
  onAdd?: (pool: Pool) => void;
  onRemove?: (pool: Pool) => void;
  onEdit?: (pool: Pool) => void;
  onLock?: (pool: Pool) => void;
  onTransferLP?: (pool: Pool) => void;
}

const pagination: TablePaginationConfig = {
  pageSize: 10,
  position: ["bottomCenter"],
  showSizeChanger: false,
};

const LiquidityPoolList: FC<PoolListProps> = observer(
  ({ data, onAdd, onRemove, onEdit, onLock, onTransferLP }) => {
    const handleAdd: PoolListProps["onAdd"] = (pool) => {
      onAdd && onAdd(pool);
    };
    const handleRemove: PoolListProps["onRemove"] = (pool) => {
      onRemove && onRemove(pool);
    };
    const handleEdit: PoolListProps["onEdit"] = (pool) => {
      onEdit && onEdit(pool);
    };
    const handleLock: PoolListProps["onLock"] = (pool) => {
      onLock && onLock(pool);
    };
    const handletransferLP: PoolListProps["onLock"] = (pool) => {
      onTransferLP && onTransferLP(pool);
    };
    return (
      <>
        <CommonTable
          dataSource={data}
          rowKey="canisterId"
          pagination={pagination}
        >
          <Column
            title="Pool"
            dataIndex="pool"
            width={190}
            render={(_: any, { canisterId, type }: Pool) => (
              <div className={styles.pool}>
                <div className={styles.address}>
                  <a
                    className={styles.pooltext}
                    target="_blank"
                    rel="noreferrer"
                    href={`/pool/detail/${canisterId}`}
                  >
                    {truncateString(canisterId)}
                  </a>
                  <Share href={getPrincipalDashboardURL(canisterId)} />
                  <Copy text={canisterId} />
                </div>
                <div className={styles.tag}>
                  {capitalizeFirstLetter(type)} Pool
                </div>
              </div>
            )}
          />
          <Column
            title="Trading Pair"
            dataIndex="pair"
            width={180}
            render={(_: any, { base, quote }: Pool) => (
              <div className={styles.pair}>
                <div className={styles.logos}>
                  <div className={styles.logo}>
                    {base.logo ? <img src={base.logo} alt="logo" /> : null}
                  </div>
                  <div
                    className={classNames(styles.logo, styles["quote-logo"])}
                  >
                    {quote.logo ? <img src={quote.logo} alt="logo" /> : null}
                  </div>
                  {base.symbol}/{quote.symbol}
                </div>
              </div>
            )}
          />
          <Column
            title="Trading Fee Rate"
            dataIndex="rate"
            width={160}
            render={(_: any, { fee }: Pool) => (
              <div className={styles.fee}>
                <div className={styles.rate}>{fee * 100}%</div>
              </div>
            )}
          />
          <Column
            title="Token Amount"
            dataIndex="amount"
            width={170}
            render={(_: any, { isSingle, base, quote }: Pool) => {
              const total = base.reserve + quote.reserve;
              let baseProportion = 0;
              let quoteProportion = 0;
              if (total !== 0) {
                baseProportion = truncateDecimal((base.reserve / total) * 100);
                quoteProportion = truncateDecimal(100 - baseProportion);
              }
              return (
                <div className={styles.tvl}>
                  <div className={styles.quantity}>
                    <div
                      className={`${styles["quantity-token"]} ${styles["quantity-base"]}`}
                    >
                      {formatAmountByUnit(base.reserve)} {base.symbol} (
                      {baseProportion.toFixed(2)}%)
                    </div>
                    {!isSingle ? (
                      <div
                        className={`${styles["quantity-token"]} ${styles["quantity-quote"]}`}
                      >
                        {formatAmountByUnit(quote.reserve)} {quote.symbol} (
                        {quoteProportion.toFixed(2)}%)
                      </div>
                    ) : null}
                    {isSingle ? (
                      <div className={styles.single}>
                        <img src={singleLogo} alt="single" />
                        Single
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            }}
          />
          <Column
            title="Your Liquidity"
            dataIndex="liquidity"
            width={170}
            render={(_: any, pool: Pool) => {
              const { userLp, totalSupply } = pool;
              const lp = formatAmountByUnit(userLp);
              const rate =
                totalSupply === 0
                  ? 0
                  : divide((userLp * 100) / totalSupply, 1, 2);
              return (
                <div className={styles.liquidity}>
                  <div className={styles["liquidity-info"]}>
                    {pool.type !== "private" ? (
                      <>
                        <div>
                          LP Tokens <span>{lp}</span> ({rate} %)
                        </div>
                        <div>
                          Fees Earned{" "}
                          <span>
                            ${formatAmountByUnit(pool.userEarnedFee, 2)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div>
                        Fees Earned{" "}
                        <span>
                          ${formatAmountByUnit(pool.userEarnedFee, 2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            }}
          />
          <Column
            title="Action"
            dataIndex="action"
            width={130}
            render={(_: any, pool: Pool) => (
              <div className={styles.action}>
                {appStore.userId ? (
                  <>
                    <div className={styles.top}>
                      <CommonButton
                        className={styles.item}
                        type="primary"
                        shape="circle"
                        size="small"
                        onClick={() => handleAdd(pool)}
                      >
                        <PlusOutlined />
                      </CommonButton>
                      <CommonButton
                        className={styles.item}
                        type="primary"
                        shape="circle"
                        size="small"
                        onClick={() => handleRemove(pool)}
                      >
                        <MinusOutlined />
                      </CommonButton>
                    </div>
                    <div className={styles.btm}>
                      {pool.type === "private" ? (
                        <CommonButton
                          className={styles.item}
                          type="primary"
                          shape="circle"
                          size="small"
                          onClick={() => handleEdit(pool)}
                        >
                          <SettingOutlined />
                        </CommonButton>
                      ) : (
                        <CommonButton
                          className={styles.item}
                          type="primary"
                          shape="circle"
                          size="small"
                          onClick={() => handleLock(pool)}
                        >
                          <LockOutlined />
                        </CommonButton>
                      )}
                      <CommonButton
                        className={styles.item}
                        type="primary"
                        shape="circle"
                        size="small"
                        onClick={() => handletransferLP(pool)}
                      >
                        <SendOutlined />
                      </CommonButton>
                    </div>
                  </>
                ) : null}
              </div>
            )}
          />
        </CommonTable>
      </>
    );
  }
);

export default LiquidityPoolList;
