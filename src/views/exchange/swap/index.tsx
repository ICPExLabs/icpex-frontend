import type { FC } from "react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ExclamationCircleFilled,
  QuestionCircleFilled,
  ReloadOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { Principal } from "@dfinity/principal";
import { useDebounceFn } from "ahooks";
import { Tooltip } from "antd";
import { observer } from "mobx-react";
import classNames from "classnames";
import { useNavigate, useSearchParams } from "react-router-dom";
import styles from "./index.module.less";
import { Parameter } from "./parameter";
import type { SettingRef } from "./setting";
import Setting from "./setting";
import type { SwapModalRef } from "./swap-modal";
import SwapModal from "./swap-modal";
import TokenSelect from "./token-select";
import type { ActionButtonProps } from "./button";
import ActionButton from "./button";
import { TokenListModal } from "@/components";
import type { UserTokenUse } from "@/types/token";
import arrowPng from "@/assets/arrow.png";
import swapPng from "@/assets/swap.png";
import type {
  TokenListModalProps,
  TokenListModalRef,
} from "@/components/token/list-modal";
import {
  divide,
  divideAndConvertToBig,
  divideAndConvertToNumber,
  executionInterrupt,
  formatBigNumberDisplay,
  generateDeadline,
  multiplyAndConvertToBigInt,
  truncateDecimal,
} from "@/utils/common";
import { getDeviationRate, queryReceiveAmountAndPath } from "@/utils/swap";
import { to } from "@/utils/catch";
import appStore from "@/store/app";
import { computeFee, computeFeeBig } from "@/utils/fee";
import { PLAT_TOKEN_CANISTER_ID } from "@/utils/constants";
import type { ConnectWalletModallRef } from "@/components/layout/ConnectWalletModal";
import ConnectWalletModal from "@/components/layout/ConnectWalletModal";
import {
  getBalance,
  getBalanceBig,
  getSelectableTokens,
} from "@/utils/token.ts";
import type { AddTokenModalRef } from "@/views/wallet/add-token-modal";
import AddTokenModal from "@/views/wallet/add-token-modal";
import type { RiskWarningModalRef } from "@/views/liquid-pool/risk-warning-modal";
import RiskWarningModal from "@/views/liquid-pool/risk-warning-modal";
import tokenStore from "@/store/token.ts";
import { icpl_router } from "@/canisters/icpl_router";
import Big from "big.js";

enum TokenUsage {
  PAY = "pay",
  RECEIVE = "receive",
}

type Mode = "normal" | "expert";

const defaultButtonMap: Record<string, ActionButtonProps> = {
  connect: {
    status: "normal",
    disabled: false,
    children: "Connect",
  },
  select: {
    status: "normal",
    disabled: true,
    children: "Select Token",
  },
  enter: {
    // enter base token amount
    status: "normal",
    disabled: true,
    children: "Enter an amount to see more trading details",
  },
  enterLessThanServiceFee: {
    // enter amount must bigger than service fee
    status: "normal",
    disabled: true,
    children: "Enter an amount to see more trading details",
  },
  enterBiggerThanBalance: {
    // enter amount must less than balance
    status: "danger",
    disabled: true,
    children: "Insufficient xxx balance",
  },
  matching: {
    // match the exchange
    status: "normal",
    disabled: true,
    children: "loading",
  },
  notMatched: {
    status: "danger",
    disabled: true,
    children: "Insufficient liquidity for this trade",
  },
  backendError: {
    status: "danger",
    disabled: true,
    children: "Unavailable Order",
  },
  review: {
    status: "normal",
    disabled: false,
    children: "Review Order",
  },
  confirm: {
    status: "normal",
    disabled: false,
    children: "Confirm Order",
  },
  unknownError: {
    status: "danger",
    disabled: false,
    children: "unknown error",
  },
};
const highButtonMap: Record<string, ActionButtonProps> = {
  swap: {
    status: "warning",
    disabled: false,
    children: "Swap Anyway",
  },
  confirm: {
    status: "warning",
    disabled: false,
    children: "Confirm Order",
  },
};
const dangerButtonMap: Record<string, ActionButtonProps> = {
  turnOnExpert: {
    status: "danger",
    disabled: false,
    children: "Turn on expert mode to ignore high price deviation",
  },
};

const Swap: FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("normal");
  const [payToken, setPayToken] = useState<UserTokenUse>();
  const [receiveToken, setReceiveToken] = useState<UserTokenUse>();
  const [slippage, setSlippage] = useState("0.5");
  const [priceDeviation, setPriceDeviation] = useState(0);
  const [buttonConfig, setButtonConfig] = useState(defaultButtonMap.connect);
  const [loading, setLoading] = useState(false);
  const [isDanger, setIsDanger] = useState(false);
  const currentTokenUsage = useRef<TokenUsage>();
  const [searchParams] = useSearchParams();

  const [tradingFee, setTradingFee] = useState(Big(0));
  const [exchangeRatioDirection, setExchangeRatioDirection] =
    useState("forward");
  const [isriskWarningModalRefOpen, setIsriskWarningModalRefOpen] =
    useState(false);

  const settingsRef = useRef<SettingRef>(null);
  const riskWarningModalRef = useRef<RiskWarningModalRef>(null);

  const isReviewed = useMemo(() => {
    return buttonConfig.children?.toString().includes("Confirm Order");
  }, [buttonConfig]);

  const isExpertMode = useMemo(() => {
    return mode === "expert";
  }, [mode]);

  const isHigh = useMemo(() => {
    return priceDeviation >= 15;
  }, [priceDeviation]);

  const setIsExpertMode = (value: boolean) => {
    const mode = value ? "expert" : "normal";
    setMode(mode);
    if (isReviewButtonFunc()) {
      if (value) {
        if (isHigh) {
          setButtonConfig(highButtonMap.swap);
        }
      }
      setButtonConfigByModeAndPriceDeviation(mode, priceDeviation);
    }
  };

  const addTokenModalRef = useRef<AddTokenModalRef>(null);

  const handleExchangeRadioDirection = useCallback(() => {
    setExchangeRatioDirection(
      exchangeRatioDirection === "forward" ? "reverse" : "forward"
    );
  }, [exchangeRatioDirection]);

  // fees
  const minimumReceive = useMemo(() => {
    if (!receiveToken) return "--";
    if (!receiveToken.amountToUse) return `0 ${receiveToken.symbol}`;
    const amount = truncateDecimal(
      Number(receiveToken.amountToUse) * (1 - Number(slippage) / 100),
      6
    );
    return `${amount} ${receiveToken.symbol}`;
  }, [receiveToken?.symbol, receiveToken?.amountToUse, slippage]);

  const platServiceFee = useMemo(() => {
    if (!receiveToken) return Big(0);
    const receiveAmount = Big(receiveToken?.amountToUse?.trim() || "0").mul(
      0.001
    );
    return receiveAmount;
  }, [receiveToken?.amountToUse]);

  const payTokenFees = useMemo(() => {
    if (!payToken || Number(payToken.amountToUse) === 0)
      return { transferFee: Big(0), burnFee: Big(0) };
    let payTokenTransferAmount = Big(0);
    let payTokenBurnAmount = Big(0);
    const baseAmount = Big(payToken?.amountToUse || "0");
    payTokenTransferAmount = computeFeeBig({
      amount: baseAmount,
      isFixed: payToken.isTransferFeeFixed,
      fee: payToken.transferFee,
    });
    if (payToken.protocol === "ICRC-1") {
      payTokenTransferAmount = payTokenTransferAmount.mul(2);
    }
    payTokenBurnAmount = computeFeeBig({
      amount: baseAmount,
      isFixed: payToken.isBurnFeeFixed,
      fee: payToken.burnFee,
    });
    return {
      transferFee: payTokenTransferAmount,
      burnFee: payTokenBurnAmount,
    };
  }, [payToken]);

  const receiveTokenFees = useMemo(() => {
    if (!receiveToken || Number(receiveToken.amountToUse) === 0)
      return { transferFee: Big(0), burnFee: Big(0) };
    let receiveTokenTransferAmount = Big(0);
    let receiveTokenBurnAmount = Big(0);
    const quoteAmount = Big(receiveToken.amountToUse || "0");
    receiveTokenTransferAmount = computeFeeBig({
      amount: quoteAmount,
      isFixed: receiveToken.isTransferFeeFixed,
      fee: receiveToken.transferFee,
    });
    receiveTokenBurnAmount = computeFeeBig({
      amount: quoteAmount,
      isFixed: receiveToken.isBurnFeeFixed,
      fee: receiveToken.burnFee,
    });
    return {
      transferFee: receiveTokenTransferAmount,
      burnFee: receiveTokenBurnAmount,
    };
  }, [receiveToken]);

  const ServiceFee = useMemo(() => {
    if (!payToken || !receiveToken) return null;
    const receiveSymbol = receiveToken.symbol;
    return (
      <div className={styles.serviceFee}>
        <div className={styles["serviceFee-desc"]}>
          Service fee includes trading fee (set by the liquidity pool) , ICPEx
          service fee (0.1%) , burn fee and transfer fee (set by the token
          creator):
        </div>
        <div className={styles["serviceFee-item"]}>
          Trading Fee:{" "}
          <div>
            {formatBigNumberDisplay(tradingFee)} {receiveSymbol}
          </div>
        </div>
        <div className={styles["serviceFee-item"]}>
          ICPEx Service Fee:{" "}
          <div>
            {formatBigNumberDisplay(platServiceFee)} {receiveSymbol}
          </div>
        </div>
        <div className={styles["serviceFee-item"]}>
          Burn Fee:{" "}
          <div className={styles["serviceFee-item-fee"]}>
            {formatBigNumberDisplay(payTokenFees.burnFee)} {payToken.symbol}{" "}
            <div className={styles["serviceFee-item-fee-trail"]}>
              {formatBigNumberDisplay(receiveTokenFees.burnFee)}{" "}
              {receiveToken.symbol}
            </div>
          </div>
        </div>
        <div className={styles["serviceFee-item"]}>
          Transfer Fee:{" "}
          <div className={styles["serviceFee-item-fee"]}>
            {formatBigNumberDisplay(payTokenFees.transferFee)} {payToken.symbol}{" "}
            <div className={styles["serviceFee-item-fee-trail"]}>
              {formatBigNumberDisplay(receiveTokenFees.transferFee)}{" "}
              {receiveToken.symbol}
            </div>
          </div>
        </div>
      </div>
    );
  }, [
    payToken?.symbol,
    receiveToken?.symbol,
    payTokenFees,
    receiveTokenFees,
    tradingFee,
    platServiceFee,
  ]);

  const exchangeRate = useMemo(() => {
    if (!payToken || !receiveToken) return 0;
    if (!payToken.amountToUse || !receiveToken.amountToUse) return 0;
    if (exchangeRatioDirection === "forward") {
      return divide(
        Number(receiveToken.amountToUse),
        Number(payToken.amountToUse)
      );
    }
    return divide(
      Number(payToken.amountToUse),
      Number(receiveToken.amountToUse)
    );
  }, [payToken, receiveToken, exchangeRatioDirection]);

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

  useEffect(() => {
    if (payToken || receiveToken || appStore.tokens.length === 0) {
      return;
    }
    const target = appStore.tokens.find(
      (item) => item.canisterId === PLAT_TOKEN_CANISTER_ID
    );
    if (target) {
      setPayToken({ ...target, amountToUse: "" });
    }
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
    if (
      (isPayTokenNotOffcial || isReceiveTokenNotOffcial) &&
      !isriskWarningModalRefOpen
    ) {
      riskWarningModalRef.current?.showModal();
      setIsriskWarningModalRefOpen(true);
    } else {
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
    }
  }, [appStore.platToken, appStore.tokens]);
  useEffect(() => {
    if (searchParams.get("payToken") && searchParams.get("receiveToken")) {
      handlerPayTokenAndReceiveToken();
    }
  }, []);
  const setLatestBalanceOfToken = async (
    target: UserTokenUse,
    func: React.Dispatch<UserTokenUse>
  ) => {
    const newToken = appStore.tokens.find(
      (token) => token.canisterId === target.canisterId
    );
    if (!newToken) return;
    if (newToken.balance.eq(target.balance)) return;
    newToken.balance = await getBalanceBig({
      protocol: target.protocol,
      canisterId: target.canisterId,
      decimals: target.decimals,
      userId: appStore.userId,
    });
    func({ ...newToken, amountToUse: target.amountToUse });
  };
  useEffect(() => {
    if (appStore.tokens.length === 0) return;
    payToken && setLatestBalanceOfToken(payToken, setPayToken);
    receiveToken && setLatestBalanceOfToken(receiveToken, setReceiveToken);
  }, [appStore.tokens]);

  const refres_receive_token = async () => {
    if (receiveToken?.canisterId) {
      const receive_token_type =
        await icpl_router.get_token_type_by_principal_without_refresh(
          Principal.fromText(receiveToken?.canisterId)
        );
      if ("UNKOWN" in receive_token_type) {
        console.info("unknow receive canister refresh");
        await icpl_router.get_token_type_by_principal_with_refresh(
          Principal.fromText(receiveToken?.canisterId)
        );
      }
    }
    if (payToken?.canisterId) {
      const pay_token_type =
        await icpl_router.get_token_type_by_principal_without_refresh(
          Principal.fromText(payToken?.canisterId)
        );
      if ("UNKOWN" in pay_token_type) {
        console.info("unknow  pay canister refresh");
        await icpl_router.get_token_type_by_principal_with_refresh(
          Principal.fromText(payToken?.canisterId)
        );
      }
    }
  };
  useEffect(() => {
    refres_receive_token();
  }, [receiveToken?.canisterId, payToken?.canisterId]);

  const tokenListModalRef = useRef<TokenListModalRef>(null);
  const openTokenListModal = (usage: TokenUsage) => {
    tokenListModalRef.current?.showModal();
    currentTokenUsage.current = usage;
  };
  const handleSelect: TokenListModalProps["onSelect"] = (token) => {
    switch (currentTokenUsage.current) {
      case TokenUsage.PAY:
        setPayToken((preState) => {
          return {
            amountToUse: "",
            ...preState,
            ...token,
          };
        });
        if (token.canisterId === receiveToken?.canisterId)
          setReceiveToken(undefined);
        break;
      case TokenUsage.RECEIVE:
        setReceiveToken((preState) => {
          return {
            amountToUse: "",
            ...preState,
            ...token,
          };
        });
        if (token.canisterId === payToken?.canisterId) setPayToken(undefined);
        break;
    }
  };

  const handleChange = (value: string) => {
    if ((value === "0" || value.trim() === "") && receiveToken?.amountToUse) {
      receiveToken.amountToUse = "0";
    }
    const payTarget = appStore.tokens.find(
      (item) => item.canisterId === payToken?.canisterId
    );
    // const tokens = newTokens.slice(0).filter(token => token.source === 'CERTIFICATION' || tokenStore.addTokens.includes(token.canisterId))
    // const payTarget = tokens.find(item => item.canisterId === searchPayToken)
    setPayToken({
      ...payToken!,
      ...payTarget,
      amountToUse: value,
    });
  };
  const handleExchange = () => {
    if (!payToken || !receiveToken) {
      return false;
    }
    setPayToken(receiveToken);
    setReceiveToken({ ...payToken, amountToUse: "" });
  };

  const resetReceiveToken = () => {
    if (!receiveToken) return;
    setReceiveToken({
      ...receiveToken,
      amountToUse: "",
    });
  };

  const isReviewButtonFunc = () => {
    if (!appStore.userId) {
      setButtonConfig(defaultButtonMap.connect);
      return false;
    }
    if (!payToken || !receiveToken) {
      setButtonConfig(defaultButtonMap.select);
      return false;
    }
    if (!Number(payToken.amountToUse)) {
      setButtonConfig(defaultButtonMap.enter);
      return false;
    }
    if (Big(payToken?.amountToUse?.trim() || "0").gt(payToken.max)) {
      setButtonConfig({
        ...defaultButtonMap.enterBiggerThanBalance,
        children: `Insufficient ${payToken.symbol} balance`,
      });
      return false;
    }
    if (
      Big(payToken?.amountToUse?.trim() || "0").lte(
        payTokenFees.burnFee.plus(payTokenFees.transferFee)
      )
    ) {
      setButtonConfig({
        ...defaultButtonMap.enterLessThanServiceFee,
        children: `${payToken.symbol} amount should greater than service fee`,
      });
      return false;
    }
    return true;
  };

  useEffect(() => {
    if (!receiveToken) return;
    if (receiveToken.amountToUse !== "") {
      if (Big(receiveToken.amountToUse) <= tradingFee.plus(platServiceFee)) {
        setButtonConfig({
          ...defaultButtonMap.enterLessThanServiceFee,
          children: `${receiveToken.symbol} amount should greater than service fee`,
        });
      }
    }
  }, [receiveToken?.amountToUse, receiveTokenFees, tradingFee, platServiceFee]);

  useEffect(() => {
    if (isReviewButtonFunc()) {
      getReceiveAmount();
    }
  }, [
    appStore.userId,
    payToken?.canisterId,
    payToken?.balance,
    payToken?.amountToUse,
    receiveToken?.canisterId,
    payTokenFees,
  ]);
  useEffect(() => {
    if (!appStore.userId || !payToken || !payToken.max) {
      setIsDanger(false);
      return;
    }
    if (Big(payToken?.amountToUse?.trim() || "0").gt(payToken.max)) {
      setIsDanger(true);
      return;
    }
    setIsDanger(false);
  }, [
    appStore.userId,
    payToken?.canisterId,
    payToken?.balance,
    payToken?.amountToUse,
  ]);
  // trade
  const queryRatioAndPath = useMemo(() => {
    return executionInterrupt(queryReceiveAmountAndPath);
  }, []);

  const setButtonConfigByModeAndPriceDeviation = (
    mode: Mode,
    priceDeviation: number
  ) => {
    if (mode === "normal") {
      if (priceDeviation <= 10) {
        setButtonConfig(defaultButtonMap.review);
        return;
      }
      if (priceDeviation <= 15) {
        setButtonConfig(highButtonMap.swap);
        return;
      }
      setButtonConfig(dangerButtonMap.turnOnExpert);
      return;
    }
    if (mode === "expert") {
      if (priceDeviation <= 10) {
        setButtonConfig(defaultButtonMap.review);
        return;
      }
      setButtonConfig(highButtonMap.swap);
    }
  };
  const getPriceDeviation = async (params: {
    payAmount: bigint;
    receiveAmount: bigint;
    poolId: Principal;
    direction: bigint;
  }) => {
    const res = await getDeviationRate(
      params.payAmount,
      params.receiveAmount,
      params.poolId,
      params.direction
    );
    if ("Ok" in res) {
      const priceDeviation = Number((res.Ok * 100).toFixed(2));
      setPriceDeviation(priceDeviation);
      setButtonConfigByModeAndPriceDeviation(mode, priceDeviation);
    } else {
      setPriceDeviation(0);
      setButtonConfig(defaultButtonMap.unknownError);
    }
  };

  const path = useRef<{
    pools: Principal[];
    direction: bigint;
  }>();
  const { run: getReceiveAmount } = useDebounceFn(
    async () => {
      if (!payToken || !receiveToken) return;
      if (Number(payToken.amountToUse || "") === 0) {
        resetReceiveToken();
        return;
      }
      if (Big(payToken?.amountToUse?.trim() || "0").gt(payToken.max)) return;
      if (
        Big(payToken.amountToUse).lt(
          payTokenFees.burnFee.plus(payTokenFees.transferFee)
        )
      ) {
        setReceiveToken({
          ...receiveToken,
          amountToUse: "",
        });
        return;
      }
      setLoading(true);
      setButtonConfig(defaultButtonMap.matching);
      const payPrincipal = Principal.fromText(payToken.canisterId);
      const receivePrincipal = Principal.fromText(receiveToken.canisterId);
      const payAmount = multiplyAndConvertToBigInt(
        payToken.amountToUse,
        payToken.decimals
      );
      const deadline = generateDeadline();
      await refres_receive_token();
      const [err, res] = await to(
        queryRatioAndPath(payPrincipal, receivePrincipal, payAmount, deadline)
      );
      setLoading(false);
      if (!err) {
        if ("Ok" in res) {
          const { decimals } = receiveToken;
          const [amount, pools, direction, _, poolTradingFee] = res.Ok;
          setTradingFee(divideAndConvertToBig(poolTradingFee, decimals, 18));
          const amountOfNumber = divideAndConvertToBig(
            amount,
            receiveToken.decimals,
            18
          );
          setReceiveToken({
            ...receiveToken,
            amountToUse: `${amountOfNumber}`,
          });
          path.current = {
            pools,
            direction: BigInt(direction),
          };
          const poolBalance = await getBalanceBig({
            protocol: receiveToken?.protocol,
            canisterId: receiveToken?.canisterId,
            decimals: receiveToken?.decimals,
            userId: pools[0].toText(),
          });
          if (amountOfNumber.gt(poolBalance)) {
            setButtonConfig(defaultButtonMap.notMatched);
            return false;
          }
          getPriceDeviation({
            payAmount,
            receiveAmount: amount,
            poolId: pools[0],
            direction: BigInt(direction),
          });
        } else {
          console.error(res.Err);
          setButtonConfig(defaultButtonMap.notMatched);
          setTradingFee(Big(0));
          resetReceiveToken();
        }
      } else {
        setButtonConfig(defaultButtonMap.backendError);
        setTradingFee(Big(0));
        resetReceiveToken();
      }
    },
    {
      wait: 300,
    }
  );

  const swapModalRef = useRef<SwapModalRef>(null);

  const connectWalletModalRef = useRef<ConnectWalletModallRef>(null);
  const openConnectModal = () => {
    connectWalletModalRef.current?.showModal();
  };
  const handleClick = async (disabled = false, loading = false) => {
    if (!appStore.userId) {
      openConnectModal();
      return;
    }
    if (disabled || loading) {
      return;
    }
    if (!payToken || !receiveToken || !path.current) {
      return;
    }
    // if (Number(payToken.amountToUse) < (payTokenFees.burnFee + payTokenFees.transferFee)) {
    //   return
    // }
    // if (Number(receiveToken.amountToUse) < (tradingFee + platServiceFee + receiveTokenFees.burnFee + receiveTokenFees.transferFee)) {
    //   return
    // }
    if (!isExpertMode && isHigh) {
      // open expert mode
      settingsRef.current?.openSettings();
      return;
    }
    if (!isReviewed) {
      setButtonConfig(
        priceDeviation <= 10 ? defaultButtonMap.confirm : highButtonMap.confirm
      );
      return;
    }
    setLoading(true);
    const payPrincipal = Principal.fromText(payToken.canisterId);
    const receivePrincipal = Principal.fromText(receiveToken.canisterId);
    const payAmount = multiplyAndConvertToBigInt(
      payToken.amountToUse,
      payToken.decimals
    );
    // if minimunReceiveAmount equals to zero, means ignore slippage
    const minimunReceiveAmount =
      priceDeviation > 10 || isExpertMode
        ? BigInt(0)
        : multiplyAndConvertToBigInt(
            Number(receiveToken.amountToUse) * (1 - Number(slippage) / 100),
            receiveToken.decimals
          );
    const deadline = generateDeadline();
    swapModalRef.current?.showModal(payToken, receiveToken, [
      payPrincipal,
      receivePrincipal,
      payAmount,
      minimunReceiveAmount,
      path.current.pools,
      path.current.direction,
      deadline,
    ]);
  };

  const resetAll = () => {
    setLoading(false);
    setPriceDeviation(0);
    path.current = undefined;
    setPayToken({
      ...payToken!,
      amountToUse: "",
    });
    setReceiveToken({
      ...receiveToken!,
      amountToUse: "",
    });
  };
  const handleSuccess = async () => {
    resetAll();
  };
  const handleFail = () => {
    resetAll();
  };
  const btnToSubwallet = () => {
    navigate("/wallet", {
      state: {
        subWallet: true,
      },
    });
  };
  return (
    <>
      <div className={styles.swap}>
        <div className={styles.header}>
          Swap
          <div className={styles.operations}>
            <ReloadOutlined
              className={classNames(
                styles.anticon,
                loading ? styles.loading : null
              )}
              onClick={getReceiveAmount}
            />
            <Setting
              ref={settingsRef}
              slippage={slippage}
              onSlippage={setSlippage}
              isExpertMode={isExpertMode}
              onMode={setIsExpertMode}
              className={styles.anticon}
            />
          </div>
        </div>
        <div className={styles.content}>
          <TokenSelect
            label="Pay"
            danger={isDanger}
            token={payToken}
            onSelect={() => openTokenListModal(TokenUsage.PAY)}
            onChange={handleChange}
          />
          <div className={styles.icon}>
            <img src={arrowPng} alt="swap" onClick={handleExchange} />
          </div>
          <TokenSelect
            label="Receive(Estimated)"
            locked={isReviewed}
            inputDisabled
            showMax={false}
            token={receiveToken}
            onSelect={() => openTokenListModal(TokenUsage.RECEIVE)}
          />
          <div className={styles.rate}>
            {receiveToken &&
            receiveToken.amountToUse !== "" &&
            receiveToken.amountToUse !== "0" ? (
              loading ? (
                "Find the best exchange route…"
              ) : (
                <>
                  {exchangeRatioDirection === "forward" ? (
                    <>
                      1 {payToken?.symbol} = {exchangeRate}{" "}
                      {receiveToken?.symbol}
                    </>
                  ) : (
                    <>
                      1 {receiveToken?.symbol} = {exchangeRate}{" "}
                      {payToken?.symbol}
                    </>
                  )}
                  <img
                    src={swapPng}
                    className={styles.exchange}
                    onClick={handleExchangeRadioDirection}
                  />
                  <Tooltip
                    overlayStyle={{ maxWidth: "350px" }}
                    placement="bottom"
                    title={ServiceFee}
                  >
                    <ExclamationCircleFilled />
                  </Tooltip>
                </>
              )
            ) : null}
          </div>
          {isExpertMode ? (
            <ActionButton
              status="warning"
              disabled
              style={{ marginBottom: "10px" }}
            >
              <WarningOutlined />
              Your are in expert mode
            </ActionButton>
          ) : priceDeviation >= 15 ? (
            <ActionButton
              status="danger"
              disabled
              style={{ marginBottom: "10px" }}
            >
              <WarningOutlined />
              Very High Price Deviation
            </ActionButton>
          ) : priceDeviation >= 10 ? (
            <ActionButton
              status="warning"
              disabled
              style={{ marginBottom: "10px" }}
            >
              <WarningOutlined />
              High Price Deviation
            </ActionButton>
          ) : null}
          <ActionButton
            status={buttonConfig.status}
            disabled={buttonConfig.disabled}
            loading={loading}
            onClick={() => handleClick(buttonConfig.disabled, loading)}
          >
            {buttonConfig.children}
          </ActionButton>
          <div>
            <Parameter
              className={styles.tip}
              label="Price Deviation"
              tooltipTitle="Deviation between market price and strike price due to trade size."
              value={`${priceDeviation} %`}
            />
            <Parameter
              className={styles.tip}
              label="Slippage Tolerance"
              tooltipTitle="The slippage tolerance you set, it can be modified by going to the settings."
              value={`${slippage} %`}
            />
            <Parameter
              className={styles.tip}
              label="Minimum Received"
              tooltipTitle="The minimum amount of assets you can exchange under the current situation."
              value={minimumReceive}
            />
          </div>
        </div>
        <div className={styles.subwallet}>
          <span onClick={btnToSubwallet}>
            Issues with tokens after the swap? Check your sub-wallet here.
          </span>
          <Tooltip
            overlayStyle={{ maxWidth: "350px" }}
            placement="bottom"
            title={`ICPEx has proprietary safety measures enabled to take care of your funds' safety. If issues arise during swaps, creating pools and adding liquidity, check under ‘Wallet - Sub Wallet’ to reclaim your tokens there.`}
          >
            <QuestionCircleFilled style={{ marginLeft: "5px" }} />
          </Tooltip>
        </div>
      </div>
      <TokenListModal ref={tokenListModalRef} onSelect={handleSelect} />
      <SwapModal
        ref={swapModalRef}
        onSuccess={handleSuccess}
        onFail={handleFail}
      />
      <ConnectWalletModal ref={connectWalletModalRef} />
      <AddTokenModal
        ref={addTokenModalRef}
        onRefresh={handlerPayTokenAndReceiveToken}
      />
      <RiskWarningModal
        ref={riskWarningModalRef}
        buttonName="Confirm"
        customCheck
        customCheckText="Yes,I am sure"
        isAlarm
        onAgrees={onAgree}
        titleName="Add Token Risk Warning"
        content="The system detected that the trading pair contains the following manually imported tokens. Please check the information carefully before trading to ensure security. ICPEx does not assume any responsibility for this. If you have confirmed the token information, you can add the token to your token list with one click to continue trading."
      />
    </>
  );
};

export default observer(Swap);
