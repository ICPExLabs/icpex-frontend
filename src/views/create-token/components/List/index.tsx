import React, { useEffect, useImperativeHandle, useState } from "react";
import { SettingOutlined } from "@ant-design/icons";
import { observer } from "mobx-react";
import { Image, Spin } from "antd";
import TunableParametersModal from "../TunableParametersModal";
import styles from "./index.module.less";
import { CommonTable, Copy, Share } from "@/components";
import appStore from "@/store/app";
import { formatBigNumberDisplay, sleep } from "@/utils/common";
import { getHolders, getUserTokenList } from "@/utils/token";
import type { UserToken } from "@/types/token";
import { truncateString } from "@/utils/principal";
import { getPrincipalDashboardURL } from "@/utils/urls";
import { getICRC2Holders } from "@/utils/create-token";
import Big from "big.js";

const Header: React.FC<{
  propRef: React.Ref<any>;
}> = ({ propRef }) => {
  const [visible, setVisible] = useState(false);
  const [list, setList] = useState<Record<string, any>[]>([]);
  const [checkTokenInfo, setCheckTokenInfo] = useState<UserToken>();
  const [loading, setLoading] = useState(false);

  const { userId } = appStore;

  const getList = async (delay?: number) => {
    setLoading(true);
    await sleep(delay || 0);
    try {
      const tokenList = await getUserTokenList(appStore.userId);
      setList(tokenList);
      const holdersList = await Promise.all(
        tokenList?.map((el) =>
          el.protocol === "ICRC-2"
            ? getICRC2Holders(el.canisterId)
            : getHolders(el.canisterId)
        )
      );
      const list = tokenList.map((el, index) => ({
        ...el,
        holder: holdersList[index],
      }));

      setList(list);
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = () => {
    getList();
  };

  useEffect(() => {
    if (!userId) return;

    getList();
  }, [userId]);

  useImperativeHandle(propRef, () => ({
    getList,
    refreshToken,
  }));

  const handleOpen = (row: UserToken) => {
    setVisible(true);
    setCheckTokenInfo(row);
  };

  const handleCancel = () => {
    setVisible(false);
    getList();
  };

  const columns: any[] = [
    {
      title: "Token",
      dataIndex: "token",
      with: 200,
      render: (_: any, { logo, symbol, name }: UserToken) => {
        return (
          <div className={styles.pair}>
            <div className={styles.logos}>
              <Image className={styles["quote-logo"]} src={logo} alt="logo" />
              <div>
                <div>{symbol}</div>
                <div>{name}</div>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: "Canister ID",
      dataIndex: "canisterId",
      render: (_: any, { canisterId }: UserToken) => {
        return (
          <div className={styles.ellipsis}>
            {truncateString(canisterId)}
            <span className={styles.space}>
              <Share href={getPrincipalDashboardURL(canisterId)} />
            </span>
            <Copy text={canisterId} />
          </div>
        );
      },
    },
    {
      title: "Total Supply",
      dataIndex: "total_supply",
      render: (_: any, { totalSupply }: UserToken) => {
        return (
          <div className={styles.fee}>
            <div className={styles.rate}>
              {formatBigNumberDisplay(totalSupply)}
            </div>
          </div>
        );
      },
    },
    {
      title: "Burn Fee",
      dataIndex: "transfer",
      render: (_: any, { isBurnFeeFixed, burnFee }: UserToken) => {
        return (
          <div className={styles.tvl}>
            {isBurnFeeFixed
              ? `${burnFee}`
              : `${Big(burnFee).mul(100).toString()}%`}
          </div>
        );
      },
    },
    {
      title: "Transfer Fee",
      dataIndex: "transfer",
      render: (_: any, { isTransferFeeFixed, transferFee }: UserToken) => {
        return (
          <div className={styles.tvl}>
            {isTransferFeeFixed
              ? `${transferFee}`
              : `${Big(transferFee).mul(100).toString()}%`}
          </div>
        );
      },
    },
    {
      title: "Holders",
      dataIndex: "holders",
      render: (_: any, { holder }: any) => {
        return (
          <div className={styles.volumn}>{Number.parseFloat(holder || 0)}</div>
        );
      },
    },
    {
      title: "Setting",
      dataIndex: "setting",
      render: (_: any, row: any) => {
        return (
          <SettingOutlined color="#5D52DE" onClick={() => handleOpen(row)} />
        );
      },
    },
  ];

  return (
    <>
      <Spin spinning={loading}>
        <div className={styles.list}>
          <CommonTable
            columns={columns}
            dataSource={list}
            rowKey="canisterId"
            headerRender={<div>My Token List</div>}
          />
        </div>
      </Spin>
      <TunableParametersModal
        visible={visible}
        data={checkTokenInfo}
        onCancel={handleCancel}
      />
    </>
  );
};

export default observer(Header);
