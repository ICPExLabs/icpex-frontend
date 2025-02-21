import type { FC } from "react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { observer } from "mobx-react";
import { Button } from "antd";
import styles from "./index.module.less";
import CategorySelector from "./category-selector";
import Alert from "./alert";
import TypeParameter from "./type-parameter";
import type { TokensParameterProps } from "./tokens-parameter";
import TokensParameter from "./tokens-parameter";
import AddressParameter from "./address-parameter";
import type { AddLiquidityModalRef } from "./add-liquidity-modal";
import AddLiquidityModal from "./add-liquidity-modal";
import type { TunableParameterModalRef } from "./tunable-parameter-modal";
import TunableParameterModal from "./tunable-parameter-modal";
import type { RiskWarningModalRef } from "./risk-warning-modal";
import RiskWarningModal from "./risk-warning-modal";
import type { RemoveLiquidityModalRef } from "./remove-liquidity-modal";
import RemoveLiquidityModal from "./remove-liquidity-modal";
import ExplorePoolList from "./list/explore";
import LiquidityPoolList from "./list/liquidity";
import { CommonButton, DimensionSelector, Empty } from "@/components";
import type { Token } from "@/types/token";
import type { FilterFunction } from "@/hooks/use-explore-pools";
import { useExplorePools } from "@/hooks/use-explore-pools";
import appStore from "@/store/app";
import type { Pool } from "@/types/pool";
import { useTokens } from "@/hooks/use-tokens";
import type { ConnectWalletModallRef } from "@/components/layout/ConnectWalletModal";
import ConnectWalletModal from "@/components/layout/ConnectWalletModal";
import type { LockLiquidityModalRef } from "@/views/liquid-pool/lock-liquidity-modal";
import LockLiquidityModal from "@/views/liquid-pool/lock-liquidity-modal";
import AddTokenModal, {
  AddTokenModalRef,
} from "@/views/wallet/add-token-modal";
import { getSelectableTokens } from "@/utils/token.ts";
import tokenStore from "@/store/token.ts";
import LpLiquidityModal from "./lp-liquidity-modal";

const dimentions = [
  {
    value: "explore",
    label: "Explore",
    style: {
      width: "143px",
    },
  },
  {
    value: "your",
    label: "Your Liquidity",
    style: {
      width: "181px",
    },
  },
];

const LiquidPool: FC = () => {
  const navigate = useNavigate();
  const [dimension, setDimension] = useState("explore");
  const [category, setCategory] = useState("type");
  const [poolType, setPoolType] = useState("all");
  const [tokenOne, setTokeOne] = useState<Token>();
  const [tokenTwo, setTokeTwo] = useState<Token>();
  const [address, setAddress] = useState<string>();
  const [searchParams] = useSearchParams();
  const { tokens } = useTokens();
  const [
    isAddTokenRiskWarningModalRefOpen,
    setAddTokenRiskWarningModalRefOpen,
  ] = useState(false);

  const addTokenModalRef = useRef<AddTokenModalRef>(null);

  const handlerPayTokenAndReceiveToken = async () => {
    const newTokens = await getSelectableTokens();
    const tokens = newTokens
      .slice(0)
      .filter(
        (token) =>
          token.source === "CERTIFICATION" ||
          tokenStore.addTokens.includes(token.canisterId)
      );
    const searchPayToken = searchParams.get("payToken");
    const searchReceiveToken = searchParams.get("receiveToken");
    const payTarget = tokens.find((item) => item.canisterId === searchPayToken);
    const receiveTarget = tokens.find(
      (item) => item.canisterId === searchReceiveToken
    );
    payTarget?.canisterId &&
      setPayToken({
        ...payTarget,
        amountToUse: "",
      });
    receiveTarget?.canisterId &&
      setReceiveToken({
        ...receiveTarget,
        amountToUse: "",
      });
  };
  const onAgree = () => {
    const searchPayToken = searchParams.get("payToken");
    const searchReceiveToken = searchParams.get("receiveToken");
    const payTarget = appStore.tokens.find(
      (item) => item.canisterId === searchPayToken
    );
    const receiveTarget = appStore.tokens.find(
      (item) => item.canisterId === searchReceiveToken
    );
    const isPayTokenNotOffcial =
      searchPayToken !== null && payTarget === undefined;
    const isReceiveTokenNotOffcial =
      searchReceiveToken !== null && receiveTarget === undefined;
    if (!appStore.userId) return;
    let seachText = "";
    if (isPayTokenNotOffcial) seachText = `${seachText + searchPayToken},`;
    if (isReceiveTokenNotOffcial)
      seachText = `${seachText + searchReceiveToken}`;
    if (seachText.endsWith(",")) {
      seachText = seachText.slice(0, -1); // Remove the last character (comma)
    }
    addTokenModalRef.current?.show(appStore.userId, seachText);
  };
  useEffect(() => {
    const tempType = searchParams.get("categoryType");
    if (tempType) {
      setCategory(tempType);
    }
  }, [searchParams]);

  const filterFunc: FilterFunction = useCallback(
    (pool) => {
      if (dimension === "your") {
        if (!appStore.userId) {
          return false;
        } else {
          if (!pool.hasLiquidity) return false;
        }
      }
      if (category === "type") {
        if (poolType === "all") return true;
        return pool.type === poolType;
      }
      if (category === "tokens") {
        const tokenMap = {
          [pool.base.canisterId]: true,
          [pool.quote.canisterId]: true,
        };
        if (tokenOne && tokenTwo)
          return tokenMap[tokenOne.canisterId] && tokenMap[tokenTwo.canisterId];
        if (tokenOne) return tokenMap[tokenOne.canisterId];
        if (tokenTwo) return tokenMap[tokenTwo.canisterId];
      }
      if (category === "address") {
        if (address) return pool.canisterId.includes(address.toLowerCase());
      }
      return true;
    },
    [
      appStore.userId,
      dimension,
      category,
      poolType,
      tokenOne,
      tokenTwo,
      address,
    ]
  );

  const { pools, filterPools, loadings, updatePool } =
    useExplorePools(filterFunc);

  const handleSearch = (value: string) => {
    setAddress(value);
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

  const handleCreatePool = () => {
    navigate("/createPool");
  };

  const addLiquidityPoolRef = useRef<Pool>();
  const riskWarningModalRef = useRef<RiskWarningModalRef>(null);
  const addTokenriskWarningModalRef = useRef<RiskWarningModalRef>(null);
  const handleRisk = (pool: Pool) => {
    addLiquidityPoolRef.current = pool;
    riskWarningModalRef.current?.showModal();
  };

  const addLiquidityModalRef = useRef<AddLiquidityModalRef>(null);
  const handleAgree = () => {
    localStorage.setItem("agreeRisk", "true");
    addLiquidityModalRef.current?.showModal(addLiquidityPoolRef.current!);
  };

  const handleAddLiquidity = (pool: Pool) => {
    const isAgreed = localStorage.getItem("agreeRisk") === "true";
    if (!isAgreed) {
      handleRisk(pool);
      return;
    }
    addLiquidityModalRef.current?.showModal(pool);
  };

  const removeLiquidityModalRef = useRef<RemoveLiquidityModalRef>(null);
  const handleRemove = (pool: Pool) => {
    removeLiquidityModalRef.current?.showModal(pool);
  };

  const tunableParameterModalRef = useRef<TunableParameterModalRef>(null);
  const handleTunable = (pool: Pool) => {
    tunableParameterModalRef.current?.showModal(pool);
  };
  const lockLiquidityModalRef = useRef<LockLiquidityModalRef>(null);
  const handleLock = (pool: Pool) => {
    lockLiquidityModalRef.current?.showModal(pool);
  };
  const lpLiquidityModalRef = useRef<LockLiquidityModalRef>(null);
  const handleTransferLP = (pool: Pool) => {
    lpLiquidityModalRef.current?.showModal(pool);
  };

  const connectWalletModalRef = useRef<ConnectWalletModallRef>(null);
  const openConnectModal = () => {
    connectWalletModalRef.current?.showModal();
  };
  const handleClear = (value: string) => {
    if (value == "one") {
      setTokeOne(undefined);
    } else {
      setTokeTwo(undefined);
    }
  };
  useEffect(() => {
    const searchPayToken = searchParams.get("payToken");
    const searchReceiveToken = searchParams.get("receiveToken");
    if (!tokens?.length) return;
    const payTarget = tokens.find((item) => item.canisterId === searchPayToken);
    const receiveTarget = tokens.find(
      (item) => item.canisterId === searchReceiveToken
    );
    const isPayTokenNotOffcial =
      searchPayToken !== null && payTarget === undefined;
    const isReceiveTokenNotOffcial =
      searchReceiveToken !== null && receiveTarget === undefined;
    if (
      (isPayTokenNotOffcial || isReceiveTokenNotOffcial) &&
      !isAddTokenRiskWarningModalRefOpen
    ) {
      addTokenriskWarningModalRef.current?.showModal();
      setAddTokenRiskWarningModalRefOpen(true);
    } else {
      payTarget?.canisterId && setTokeOne(payTarget);
      receiveTarget?.canisterId && setTokeTwo(receiveTarget);
    }
  }, [searchParams, tokens]);

  const getContent = () => {
    if (dimension === "your") {
      if (!appStore.userId) {
        return (
          <div className={styles.personal}>
            <Alert
              message="Incentives for Liquidity Providers"
              description="Liquidity providers will receive trading fee incentives in all transactions, and the value of the trading fee rate is defined by the creator of the liquidity pool. The amount of incentive you get is proportional to your share in the liquidity pool. The trading fee will be injected into the liquidity pool, and you can obtain the corresponding incentive quota by withdrawing your liquidity."
              closable
            />
            <Empty className={styles.empty} />
            <div className={styles.tip}>
              Your liquidity positions will appear here
            </div>
            <ConnectWalletModal ref={connectWalletModalRef} />
            <CommonButton
              type="primary"
              size="large"
              className={styles.btn}
              onClick={openConnectModal}
            >
              Connect
            </CommonButton>
          </div>
        );
      }
      const participate = pools.find((pool) => pool.hasLiquidity);
      if (!participate) {
        return (
          <div className={styles.personal}>
            <Alert
              message="Incentives for Liquidity Providers"
              description="Liquidity providers will receive trading fee incentives in all transactions, and the value of the trading fee rate is defined by the creator of the liquidity pool. The amount of incentive you get is proportional to your share in the liquidity pool. The trading fee will be injected into the liquidity pool, and you can obtain the corresponding incentive quota by withdrawing your liquidity."
              closable
            />
            <Empty className={styles.empty} />
            <div className={styles.tip}>
              You don&apos;t have any liquidity positions yet, click the button
              below to add.
            </div>
            <CommonButton
              type="primary"
              size="large"
              className={styles.btn}
              onClick={handleCreatePool}
            >
              Add Liquidity
            </CommonButton>
          </div>
        );
      }
    }
    return (
      <>
        <CategorySelector activeKey={category} onChange={setCategory} />
        <div className={styles.condition}>
          {category === "type" ? (
            <TypeParameter value={poolType} onChange={setPoolType} />
          ) : category === "tokens" ? (
            <TokensParameter
              tokenOne={tokenOne}
              tokenTwo={tokenTwo}
              onClear={handleClear}
              onSelect={handleSelectToken}
            />
          ) : (
            <AddressParameter value={address} onSearch={handleSearch} />
          )}
          <Button
            type="primary"
            className={styles.create}
            onClick={handleCreatePool}
          >
            Create Pools
          </Button>
        </div>
        {dimension === "explore" ? (
          <ExplorePoolList data={filterPools} onAdd={handleAddLiquidity} />
        ) : (
          <LiquidityPoolList
            data={filterPools}
            onAdd={handleAddLiquidity}
            onRemove={handleRemove}
            onEdit={handleTunable}
            onLock={handleLock}
            onTransferLP={handleTransferLP}
          />
        )}
        <RiskWarningModal
          buttonName="Continue"
          customCheck={false}
          isAlarm={false}
          ref={riskWarningModalRef}
          onAgrees={handleAgree}
          titleName="Add capital risk warning"
          content="Adding assets to a liquidity pool and becoming a liquidity provider is not risk-free. When the market price of the token fluctuates greatly, the income of adding assets may be lower than the income of ordinary holding the token, and may even cause losses."
        />
        <RiskWarningModal
          ref={addTokenriskWarningModalRef}
          buttonName="Confirm"
          customCheck
          customCheckText="Yes,I am sure"
          isAlarm
          onAgrees={onAgree}
          titleName="Add Token Risk Warning"
          content="The system detected that the trading pair contains the following manually imported tokens. Please check the information carefully before trading to ensure security. ICPEx does not assume any responsibility for this. If you have confirmed the token information, you can add the token to your token list with one click to continue trading."
        />

        <AddLiquidityModal ref={addLiquidityModalRef} onSuccess={updatePool} />
        <RemoveLiquidityModal
          ref={removeLiquidityModalRef}
          onRefresh={updatePool}
        />
        <TunableParameterModal
          ref={tunableParameterModalRef}
          onRefresh={updatePool}
        />
        <LockLiquidityModal
          ref={lockLiquidityModalRef}
          onRefresh={updatePool}
        />
        <LpLiquidityModal
          ref={lpLiquidityModalRef}
          onRefresh={updatePool}
        ></LpLiquidityModal>
        <AddTokenModal
          ref={addTokenModalRef}
          onRefresh={handlerPayTokenAndReceiveToken}
        />
      </>
    );
  };

  return (
    <div className={styles.content}>
      <DimensionSelector
        value={dimension}
        options={dimentions}
        onChange={setDimension}
      />
      {getContent()}
    </div>
  );
};

export default observer(LiquidPool);
