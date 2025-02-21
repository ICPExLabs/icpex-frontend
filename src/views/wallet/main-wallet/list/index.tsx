import type { FC } from "react";
import React, { useCallback, useState } from "react";
import { FileTextOutlined } from "@ant-design/icons";
import GhostButton from "../../ghost-button";
import styles from "./index.module.less";
import { CommonTable, TokenDisplay, TokenTag } from "@/components";
import type { WalletTokenBig } from "@/types/token";
import { formatAmountByUnit, truncateDecimal } from "@/utils/common";
import TransferTokenModal from "@/views/wallet/transfer-token-modal";
import Big from "big.js";

interface TokenListProps {
  data: WalletTokenBig[];
  loading: boolean;
  handleTransfer?: () => void;
  refreshHandler?: () => void;
}

const TokenList: FC<TokenListProps> = ({ data, loading, refreshHandler }) => {
  const [open, setOpen] = useState(false);
  const [tokenInfo, setTokenInfo] = useState({});

  const columns: any[] = [
    {
      title: "Token",
      dataIndex: "token",
      width: 100,
      render: (_: any, { symbol, name, logo, canisterId }: WalletTokenBig) => {
        return (
          <TokenDisplay
            logo={logo}
            name={name}
            symbol={symbol}
            canisterId={canisterId}
          />
        );
      },
    },
    {
      title: "Standard",
      dataIndex: "standard",
      width: 100,
      render: (_: any, { protocol }: WalletTokenBig) => {
        return <TokenTag protocol={protocol} />;
      },
    },
    {
      title: "Balance",
      dataIndex: "balance",
      width: 100,
      render: (_: any, { balance, price }: WalletTokenBig) => {
        return (
          <>
            <div className={styles.balance}>
              {balance.eq(Big(0))
                ? "0"
                : formatAmountByUnit(balance.toString())}
            </div>
            <div className={styles.value}>
              ≈$
              {balance.eq(Big(0))
                ? "0"
                : formatAmountByUnit(balance.mul(price).toString())}
            </div>
          </>
        );
      },
    },
    {
      title: "Price",
      dataIndex: "price",
      width: 100,
      render: (_: any, { price }: WalletTokenBig) => {
        return <div className={styles.price}>${formatAmountByUnit(price)}</div>;
      },
    },
    {
      title: "Details",
      dataIndex: "details",
      width: 100,
      render: (_: any, tokenInfo: WalletTokenBig) => {
        return (
          <GhostButton
            className={styles.customclass}
            onClick={() => handleTransfer(tokenInfo)}
          >
            Send
          </GhostButton>
        );
      },
    },
  ];
  const handleTransfer = (tokenInfo: WalletTokenBig) => {
    setOpen(true);
    setTokenInfo(tokenInfo);
  };
  const closeModal = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <>
      <CommonTable
        className={styles.table}
        columns={columns}
        dataSource={data}
        pagination={false}
        loading={loading}
        rowKey="canisterId"
      />
      <TransferTokenModal
        open={open}
        tokenInfo={tokenInfo}
        closeModal={closeModal}
        refreshHandler={refreshHandler}
      />
    </>
  );
};

export default TokenList;
