import { Modal, Spin } from "antd";
import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDebounceFn, useUpdateEffect } from "ahooks";
import { Principal } from "@dfinity/principal";
import type { TokenSequence } from "../micro-operation";
import styles from "./index.module.less";
import Percentage from "./percentage";
import type { TokensProps } from "./tokens";
import Tokens from "./tokens";
import type { Pool, TokenInPool } from "@/types/pool";
import { truncateString } from "@/utils/principal";
import { CommonButton, Share } from "@/components";
import type { UserTokenUse } from "@/types/token";
import { TokenUsage } from "@/types/token";
import appStore from "@/store/app";
import {
  divideAndConvertToNumber,
  multiplyAndConvertToBigInt,
} from "@/utils/common";
import {
  queryRatioByBase,
  queryRatioByQuote,
  queryTokensAmount,
} from "@/utils/pool";
import { DECIMALS } from "@/utils/constants";
import { getBalanceAndMax, getTokenInfo } from "@/utils/token";
import { getPrincipalDashboardURL } from "@/utils/urls";
import { to } from "@/utils/catch.ts";
import { lockLiquidity } from "@/utils/create-pool.ts";
import type { NotificationType } from "@/components/notification";
import Notification from "@/components/notification";
import type { RiskWarningModalRef } from "@/views/liquid-pool/risk-warning-modal";
import RiskWarningModal from "@/views/liquid-pool/risk-warning-modal";

export interface LockLiquidityModalRef {
  showModal: (pool: Pool) => void;
  closeModal: () => void;
}
export interface LockLiquidityModalProps {
  onRefresh?: () => void;
}

const LockLiquidityModal = forwardRef<
  LockLiquidityModalRef,
  LockLiquidityModalProps
>(({ onRefresh }, ref) => {
  const [open, setOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationType, setNotificationType] =
    useState<NotificationType>("loading");
  const [sequence, setSequence] = useState<TokenSequence>("base-quote");
  const [pool, setPool] = useState<Pool>({} as Pool);
  const [baseToken, setBaseToken] = useState<UserTokenUse>({} as UserTokenUse);
  const [quoteToken, setQuoteToken] = useState<UserTokenUse>(
    {} as UserTokenUse
  );
  const [loading, setLoading] = useState(false);
  const [selectedToken, setSelectedToken] =
    useState<TokensProps["selectedToken"]>("base");

  const riskWarningModalRef = useRef<RiskWarningModalRef>(null);

  const isPrivate = useMemo(() => {
    return pool.type === "private";
  }, [pool.type]);

  const isSingle = useMemo(() => {
    return !!pool.isSingle;
  }, [pool.isSingle]);

  const [spinning, setSpinning] = useState(false);
  const [percentage, setPercentage] = useState(0);
  const [amount, setAmount] = useState({
    base: 0,
    quote: 0,
  });
  const { run: queryAmount } = useDebounceFn(
    async (percentage: number) => {
      if (percentage === 0) {
        setAmount({
          base: 0,
          quote: 0,
        });
        return;
      }
      setSpinning(true);
      const [baseAmount, quoteAmount] = await queryTokensAmount(
        pool,
        appStore.userId,
        multiplyAndConvertToBigInt(percentage / 100, DECIMALS)
      );
      setAmount({
        base: baseAmount,
        quote: quoteAmount,
      });
      setSpinning(false);
    },
    {
      wait: 300,
    }
  );
  const notificationConfig = useMemo(() => {
    return {
      loading: { message: "Pool liquidity locking..." },
      success: { message: "Liquidity locked successfully" },
      error: { message: "Liquidity lock failed" },
      // info: { message: infoMessage },
    };
  }, [notificationType]);

  const handlePercentage = (percentage: number) => {
    setPercentage(percentage);
    queryAmount(percentage);
  };

  const [tokensRatio, setTokensRatio] = useState(0);
  const handleRatio = async () => {
    if (pool.type === "private" || isSingle) return;
    const queryFunc =
      sequence === "base-quote" ? queryRatioByBase : queryRatioByQuote;
    const [quantityBigint] = await queryFunc(
      pool.canisterId,
      multiplyAndConvertToBigInt(
        1,
        sequence === "base-quote" ? baseToken.decimals : quoteToken.decimals
      )
    );
    const ratio = divideAndConvertToNumber(
      quantityBigint,
      sequence === "base-quote" ? quoteToken.decimals : baseToken.decimals
    );
    setTokensRatio(ratio);
  };
  useUpdateEffect(() => {
    if (open && pool.canisterId && baseToken.decimals && quoteToken.decimals) {
      handleRatio();
      queryAmount(percentage);
    }
  }, [open, sequence, pool.canisterId, baseToken, quoteToken]);

  const [slippage, setSlippage] = useState("3");

  const getBalanceByUsage = async (
    token: TokenInPool,
    tokenUsage: TokenUsage
  ) => {
    const balanceAndMax = await getBalanceAndMax({
      ...token,
      userId: appStore.userId,
    });
    const userToken: UserTokenUse = {
      ...token,
      ...balanceAndMax,
      amountToUse: "",
    };
    switch (tokenUsage) {
      case TokenUsage.BASE:
        setBaseToken(userToken);
        break;
      case TokenUsage.QUOTE:
        setQuoteToken(userToken);
        break;
    }
  };
  const [isConfirmed, setIsConfirmed] = useState(false);
  const closeModal = () => {
    setOpen(false);
    setLoading(false);
  };

  const showModal: LockLiquidityModalRef["showModal"] = async (pool) => {
    setOpen(true);
    setIsConfirmed(false);
    setPercentage(0);
    setTokensRatio(0);
    setSequence("base-quote");
    setPool(pool);
    if (appStore.userId) {
      const tokenInfoBase = await getTokenInfo(pool.base.canisterId);
      const tokenInfoQuote = await getTokenInfo(pool.quote.canisterId);
      pool.base = { ...pool.base, ...tokenInfoBase };
      pool.quote = { ...pool.quote, ...tokenInfoQuote };
      getBalanceByUsage(pool.base, TokenUsage.BASE);
      getBalanceByUsage(pool.quote, TokenUsage.QUOTE);
    }
  };

  useImperativeHandle(ref, () => ({
    showModal,
    closeModal,
  }));

  const openProgressModal = () => {
    const p = multiplyAndConvertToBigInt(percentage / 100, DECIMALS);
    const poolCanister = Principal.fromText(pool.canisterId);
    setNotificationType("loading");
    setNotificationOpen(true);
    setLoading(true);
    handleLock(p, poolCanister, BigInt(0));
  };
  const handleSuccess = () => {
    setNotificationType("success");
    setNotificationOpen(true);
    closeModal();
    onRefresh && onRefresh();
  };

  const handleFail = () => {
    setNotificationType("error");
    setOpen(false);
  };

  const handleLock = async (
    percentage: bigint,
    poolCanister: Principal,
    expireTime: bigint
  ) => {
    const [err] = await to(lockLiquidity(poolCanister, percentage, expireTime));
    if (!err) {
      handleSuccess();
    } else {
      handleFail();
      console.error(err);
    }
  };

  const handleConfirm = () => {
    riskWarningModalRef.current?.showModal();
  };

  const onAgree = () => {
    if (percentage === 0) return;
    if (!slippage) return;
    openProgressModal();
  };

  const titleComponent = useMemo(() => {
    return (
      <div className={styles.title}>
        Lock Liquidity
        <div className={styles.canister}>
          {truncateString(pool.canisterId)}
          <Share href={getPrincipalDashboardURL(pool.canisterId)} />
        </div>
      </div>
    );
  }, [pool.canisterId]);

  return (
    <>
      <Modal
        width={532}
        title={titleComponent}
        open={open}
        centered
        maskClosable={false}
        footer={false}
        onCancel={closeModal}
        zIndex={800}
      >
        <Spin spinning={spinning}>
          <div className={styles.body}>
            <Percentage value={percentage} onChange={handlePercentage} />
            <Tokens
              isPrivate={isPrivate}
              baseToken={baseToken}
              quoteToken={quoteToken}
              amount={amount}
              selectedToken={selectedToken}
              isConfirmed={isConfirmed}
              onChange={setSelectedToken}
            />
            {percentage > 0 ? (
              isConfirmed ? (
                <CommonButton
                  type="primary"
                  size="large"
                  block
                  className={styles.confirm}
                  loading={loading}
                  onClick={handleConfirm}
                >
                  Confirm
                </CommonButton>
              ) : (
                <CommonButton
                  type="primary"
                  size="large"
                  block
                  className={styles.warn}
                  onClick={() => setIsConfirmed(true)}
                >
                  Lock
                </CommonButton>
              )
            ) : (
              <CommonButton
                size="large"
                disabled
                block
                className={styles.confirm}
              >
                Select the percentage
              </CommonButton>
            )}
          </div>
        </Spin>
      </Modal>
      <Notification
        open={notificationOpen}
        type={notificationType}
        config={notificationConfig}
      />
      <RiskWarningModal
        ref={riskWarningModalRef}
        buttonName="Confirm"
        customCheck
        customCheckText="Yes,I am sure"
        isAlarm
        onAgrees={onAgree}
        titleName="Are you sure you want to lock liquidity?"
        content="You can transfer LP tokens to the black hole account (aaaaa_aa) to permanently lock the liquidity. Once confirmed, this change is irreversible."
      />
    </>
  );
});

LockLiquidityModal.displayName = "LockLiquidityModal";

export default LockLiquidityModal;
