import type { ChangeEvent, FC } from "react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CloseOutlined,
  ExclamationCircleFilled,
  PlusOutlined,
  QuestionCircleFilled,
} from "@ant-design/icons";
import { Checkbox, CheckboxProps, Input, Tooltip, notification } from "antd";
import { observer } from "mobx-react";
import { Principal } from "@dfinity/principal";
import classNames from "classnames";
import type { SelectorOption } from "../selector";
import Selector from "../selector";
import type { ApprovalModalRef } from "../approval-modal";
import ProgressModal from "../approval-modal";
import type { ContentLeftProps } from "../content-left";
import styles from "./index.module.less";
import TokenSelect from "./token-select";
import type {
  TradingFeeRateModalRef,
  TradingFeeRateOption,
} from "@/components/pool/trading-fee-rate-modal";
import {
  CommonButton,
  ParameterItem,
  TokenListModal,
  TradingFeeRateModal,
  VolatilityEoefficientModal,
} from "@/components";
import type {
  VolatilityEoefficientModalRef,
  VolatilityEoefficientOption,
} from "@/components/pool/volatility-eoefficient-modal";
import { TokenUsage } from "@/types/token";
import type { UserTokenUse } from "@/types/token";
import type {
  TokenListModalProps,
  TokenListModalRef,
} from "@/components/token/list-modal";
import appStore from "@/store/app";
import type { PoolTemplate, PoolType } from "@/types/pool";
import {
  coinbase_icp_price,
  connectWebSocket,
  divide,
  generateDeadline,
  isValidAmount,
  isZero,
  multiplyAndConvertToBigInt,
  transferToNumber,
} from "@/utils/common";
import { DECIMALS } from "@/utils/constants";
import tokenStore from "@/store/token";
import type { ConnectWalletModallRef } from "@/components/layout/ConnectWalletModal";
import ConnectWalletModal from "@/components/layout/ConnectWalletModal";
import { useNavigate } from "react-router-dom";
import Big from "big.js";
import warnred from "@/assets/warn-red.png";

const poolTypes: SelectorOption<PoolType>[] = [
  {
    label: "Public Pool",
    value: "public",
  },
  {
    label: "Private Pool",
    value: "private",
  },
  {
    label: "Anchored Pool",
    value: "anchored",
  },
];
const poolTemplates: SelectorOption<PoolTemplate>[] = [
  {
    label: "Standard",
    value: "standard",
  },
  {
    label: "Single-Token",
    value: "single",
  },
];

interface ContentRightProps {
  onChange?: (type: ContentLeftProps["type"]) => void;
}
const ContentRight: FC<ContentRightProps> = ({ onChange }) => {
  const navigate = useNavigate();
  const [poolType, setPoolType] = useState<PoolType>("public");
  const [poolTemplate, setPoolTemplate] = useState<PoolTemplate>("standard");
  const [baseToken, setBaseToken] = useState<UserTokenUse>();
  const [quoteToken, setQuoteToken] = useState<UserTokenUse>();
  const [initPrice, setInitPrice] = useState("");
  const isPublic = useMemo(() => poolType === "public", [poolType]);
  const isSingle = useMemo(() => poolTemplate === "single", [poolTemplate]);
  const [baseDangerFlag, setBaseDangerFlag] = useState(false);
  const [quoteDangerFlag, setQuoteDangerFlag] = useState(false);
  const [initDangerFlag, setInitDangerFlag] = useState(false);
  // const [messageApi, contextHolder] = message.useMessage()
  const infoIcon = useMemo(
    () => (
      <div className={styles["icon-wrapper"]}>
        <ExclamationCircleFilled
          className={classNames(styles.icon, styles["icon-error"])}
        />
      </div>
    ),
    []
  );
  const [api, contextHolder] = notification.useNotification();
  const [priceInputFontSize, setpriceInputFontSize] = useState<string>("24px");
  const [isownership, setisownership] = useState(false);
  const openNotification = (message: string) => {
    api.info({
      icon: infoIcon,
      message: <div className={styles.customMessageContent}>{message}</div>,
      placement: "topRight",
      closeIcon: <CloseOutlined className={styles.customCloseIcon} />,
    });
  };
  const standardInitPrice = useMemo(() => {
    if (
      isPublic &&
      poolTemplate === "standard" &&
      baseToken &&
      quoteToken &&
      !isZero(baseToken.amountToUse) &&
      !isZero(quoteToken.amountToUse)
    ) {
      return `1 ${baseToken.symbol} = ${divide(
        Number(quoteToken.amountToUse),
        Number(baseToken.amountToUse)
      )} ${quoteToken.symbol}`;
    }
    return "";
  }, [isPublic, poolTemplate, baseToken?.amountToUse, quoteToken?.amountToUse]);

  useEffect(() => {
    const type =
      poolType === "public" ? `${poolType}-${poolTemplate}` : poolType;
    onChange && onChange(type as ContentLeftProps["type"]);
  }, [poolType, poolTemplate]);

  useEffect(() => {
    setTimeout(coinbase_icp_price, 1000);
    connectWebSocket();
    // const interval = setInterval(() => {
    //   getCurICP()
    // }, 3000)
    // return () => {
    //   clearInterval(interval)
    // }
  }, []);
  let tempType = "public";
  const handleType = useCallback((value: string) => {
    if (tempType === "public" && value === "anchored") {
      setInitPrice("");
      if (baseToken && quoteToken) {
        setBaseToken({ ...baseToken, amountToUse: "0" });
        setQuoteToken({ ...quoteToken, amountToUse: "0" });
      }
    }
    if (value !== "public") {
      if (quoteToken) {
        if (new Big(1).gt(new Big(10).pow(-quoteToken.decimals))) {
          setinputvalue_gt_quoteTokentip(false);
        } else {
          setinputvalue_gt_quoteTokentip(true);
        }
      }
      setInitPrice("1");
    }
    if (
      tempType === "public" &&
      (value === "private" || value === "anchored")
    ) {
      setInitPrice("");
    }
    tempType = value;
    setPoolType(value as PoolType);
    setinputvalue_gt_quoteTokentip(false);
  }, []);

  const onAmountChange = (usage: TokenUsage, value: string) => {
    switch (usage) {
      case TokenUsage.BASE:
        value && setBaseDangerFlag(false);
        baseToken && setBaseToken({ ...baseToken, amountToUse: value });
        if (poolType === "anchored" && initPrice) {
          quoteToken &&
            setQuoteToken({
              ...quoteToken,
              amountToUse: `${Number(initPrice) * Number(value)}`,
            });
        }
        break;
      case TokenUsage.QUOTE:
        value && setQuoteDangerFlag(false);
        quoteToken && setQuoteToken({ ...quoteToken, amountToUse: value });
        if (poolType === "anchored" && initPrice) {
          baseToken &&
            setBaseToken({
              ...baseToken,
              amountToUse: `${Math.round(Number(value) / Number(initPrice))}`,
            });
        }
        break;
    }
  };
  const initPriceRef = useRef<any>(null);
  const [inputvalue_gt_quoteTokentip, setinputvalue_gt_quoteTokentip] =
    useState(false);
  const handleInitPriceChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value) {
      if (
        new Big(value).gte(new Big(10).pow(-quoteToken?.decimals!)) &&
        new Big(value).lte(
          new Big(10).pow(baseToken ? baseToken.decimals : 18).toString()
        )
      ) {
        setinputvalue_gt_quoteTokentip(false);
      } else {
        setinputvalue_gt_quoteTokentip(true);
      }
    } else {
      setinputvalue_gt_quoteTokentip(false);
    }
    if (isValidAmount(value) && initPriceRef.current) {
      if (
        event.target.value.length * 18.5 <=
        initPriceRef.current.input.offsetWidth
      ) {
        setpriceInputFontSize("24px");
      } else if (
        event.target.value.length * 12.5 <
        initPriceRef.current.input.offsetWidth
      ) {
        setpriceInputFontSize("18px");
      } else if (
        event.target.value.length * 9.5 <
        initPriceRef.current.input.offsetWidth
      ) {
        setpriceInputFontSize("14px");
      } else {
        setpriceInputFontSize("10px");
      }
      setInitPrice(value);
      setInitDangerFlag(false);
    }
    if (poolType === "anchored" && value && baseToken && quoteToken) {
      setQuoteToken({
        ...quoteToken,
        amountToUse: `${Number(value) * Number(baseToken.amountToUse)}`,
      });
    }
  };
  useEffect(() => {
    if (initPriceRef.current) {
      console.log("initPriceRef.current is set");
    } else {
      console.log("uninitPriceRef.current is set");
    }
  }, []);
  const setLatestBalanceOfToken = (
    target: UserTokenUse,
    func: React.Dispatch<UserTokenUse>
  ) => {
    if (!target) return;
    const newToken = appStore.tokens.find(
      (token) => token.canisterId === target.canisterId
    );
    if (!newToken) return;
    if (newToken.balance.eq(target.balance)) return;
    func({ ...newToken, amountToUse: target.amountToUse });
  };

  useEffect(() => {
    if (appStore.tokens.length === 0) return;
    baseToken && setLatestBalanceOfToken(baseToken, setBaseToken);
    quoteToken && setLatestBalanceOfToken(quoteToken, setQuoteToken);
  }, [appStore.tokens]);

  const currentTokenUsage = useRef<TokenUsage>();
  const tokenListModalRef = useRef<TokenListModalRef>(null);
  const openTokenListModal = (usage: TokenUsage) => {
    tokenListModalRef.current?.showModal();
    currentTokenUsage.current = usage;
  };

  const handleSelect: TokenListModalProps["onSelect"] = (newToken) => {
    switch (currentTokenUsage.current) {
      case TokenUsage.BASE:
        setBaseDangerFlag(false);
        if (quoteToken && newToken.canisterId === quoteToken.canisterId) {
          setBaseToken(quoteToken);
          setQuoteToken(baseToken);
          return;
        }
        setBaseToken({
          ...newToken,
          amountToUse: baseToken ? baseToken.amountToUse : "",
        });
        break;
      case TokenUsage.QUOTE:
        setQuoteDangerFlag(false);
        if (baseToken && newToken.canisterId === baseToken.canisterId) {
          setQuoteToken(baseToken);
          setBaseToken(quoteToken);
          return;
        }
        setQuoteToken({
          ...newToken,
          amountToUse: quoteToken ? quoteToken.amountToUse : "",
        });
        break;
    }
  };

  const [volatilityEoefficientOption, setVolatilityEoefficientOption] =
    useState<VolatilityEoefficientOption>({
      key: "Medium",
      value: "0.5",
    });
  const volatilityEoefficientModalRef =
    useRef<VolatilityEoefficientModalRef>(null);
  const handleVolatilityCofficient = () => {
    volatilityEoefficientModalRef.current?.showModal(
      volatilityEoefficientOption
    );
  };

  const [tradingFeeRateOption, setTradingFeeRateOption] =
    useState<TradingFeeRateOption>({
      key: "Low level",
      value: "0.3",
    });

  useEffect(() => {
    setPoolTemplate("standard");
    setVolatilityEoefficientOption(
      poolType === "anchored"
        ? {
            key: "Medium",
            value: "0.05",
          }
        : {
            key: "Medium",
            value: "0.5",
          }
    );
  }, [poolType]);
  const tradingFeeRateModalRef = useRef<TradingFeeRateModalRef>(null);
  const handleTradingFeeRate = () => {
    tradingFeeRateModalRef.current?.showModal(tradingFeeRateOption);
  };

  const approvalProgressModalRef = useRef<ApprovalModalRef>(null);
  const openApprovalProgressModal = () => {
    if (!baseToken || !quoteToken) return;

    const methodName = {
      public: "createCommonPool",
      private: "createPrivatePool",
      anchored: "createStablePool",
    }[poolType];
    const base_token = Principal.fromText(baseToken.canisterId);
    const quote_token = Principal.fromText(quoteToken.canisterId);
    const base_in_amount = multiplyAndConvertToBigInt(
      baseToken.amountToUse,
      baseToken.decimals
    );
    const quote_in_amount = isSingle
      ? 0n
      : multiplyAndConvertToBigInt(quoteToken.amountToUse, quoteToken.decimals);
    const fee_rate = multiplyAndConvertToBigInt(
      Number(tradingFeeRateOption.value) / 100,
      DECIMALS
    );
    const i = multiplyAndConvertToBigInt(initPrice, DECIMALS);
    const k = multiplyAndConvertToBigInt(
      volatilityEoefficientOption.value,
      DECIMALS
    );
    const deadline = generateDeadline();
    const ownership = isownership;
    const pool = {
      isSingle,
      methodName,
      args: [
        base_token,
        quote_token,
        base_in_amount,
        quote_in_amount,
        fee_rate,
        i,
        k,
        deadline,
        [ownership],
      ],
    };
    // console.log(pool);

    try {
      approvalProgressModalRef.current?.showModal(
        { ...baseToken },
        { ...quoteToken },
        pool
      );
    } catch (error) {
      console.error(error);
    }
  };

  const connectWalletModalRef = useRef<ConnectWalletModallRef>(null);
  const openConnectModal = () => {
    connectWalletModalRef.current?.showModal();
  };
  const handleClick = () => {
    if (!appStore.userId) {
      openConnectModal();
      return;
    }
    if (!baseToken || !quoteToken) {
      !baseToken && setBaseDangerFlag(true);
      !quoteToken && setQuoteDangerFlag(true);
      openNotification("Please select token.");
      return;
    }
    let i_u128;
    if (poolTemplate === "standard") {
      if (isZero(baseToken.amountToUse) || isZero(quoteToken.amountToUse)) {
        isZero(baseToken.amountToUse) && setBaseDangerFlag(true);
        isZero(quoteToken.amountToUse) && setQuoteDangerFlag(true);
        openNotification("Please enter the amount.");
        return;
      }
      if (
        Big(baseToken?.amountToUse || "0").gt(baseToken.max) ||
        Big(quoteToken.amountToUse).gt(quoteToken.max)
      ) {
        Big(baseToken?.amountToUse || "0").gt(baseToken.max) &&
          setBaseDangerFlag(true);
        Big(quoteToken?.amountToUse || "0").gt(quoteToken.max) &&
          setQuoteDangerFlag(true);
        openNotification("The value cannot be greater than the balance.");
        return;
      }
    }
    if (poolTemplate === "single") {
      if (isZero(baseToken.amountToUse)) {
        openNotification("Please enter the amount.");
        setBaseDangerFlag(true);
        return;
      }
      if (Big(baseToken?.amountToUse || "0").gt(baseToken.max)) {
        openNotification("The value cannot be greater than the balance.");
        setBaseDangerFlag(true);
        return;
      }
    }
    if (
      (poolType === "public" && poolTemplate === "single") ||
      poolType !== "public"
    ) {
      if (!Number(initPrice)) {
        openNotification("The Init Price must be greater than 0.");
        setInitDangerFlag(true);
        return;
      }
    }
    if (poolType == "public" && poolTemplate === "standard") {
      i_u128 = new Big(100000)
        .mul(new Big(10).pow(quoteToken.decimals))
        .div(new Big(10).pow(baseToken.decimals));
      console.log(i_u128.toString(), isZero(i_u128.toString()), 1);
    } else {
      const i = multiplyAndConvertToBigInt(initPrice, DECIMALS);
      i_u128 = new Big(i.toString())
        .mul(new Big(10).pow(quoteToken.decimals))
        .div(new Big(10).pow(baseToken.decimals));
      console.log(i_u128.toString(), isZero(i_u128.toString()), 2);
    }
    if (i_u128.lte(new Big(1)) || i_u128.gte(new Big(10).pow(36))) {
      openNotification(
        `Pool creation failed, the value of i(${i_u128}) is out of range. Please try swapping the base/quote token or adjusting the pricing.`
      );
      return;
    }
    openApprovalProgressModal();
  };
  const isActiveBtn = () => {
    if (!baseToken || !quoteToken) return false;
    if (
      poolTemplate === "standard" &&
      (isZero(baseToken.amountToUse) || isZero(quoteToken.amountToUse))
    )
      return false;
    if (poolTemplate === "single" && isZero(baseToken.amountToUse))
      return false;
    if (
      ((poolType === "public" && poolTemplate === "single") ||
        poolType !== "public") &&
      !Number(initPrice)
    )
      return false;
    return true;
  };

  const handleSuccess = () => {
    baseToken && setBaseToken({ ...baseToken, amountToUse: "" });
    quoteToken && setQuoteToken({ ...quoteToken, amountToUse: "" });
  };
  const btnToSubwallet = () => {
    navigate("/wallet", {
      state: {
        subWallet: true,
      },
    });
  };
  function formatBigNumber(value: string | number, decimals: number) {
    const result = new Big(value).pow(-decimals);
    const resultString = result.toString();
    if (resultString.indexOf("e") !== -1) {
      return result.toFixed(decimals);
    }
    console.log(resultString);

    return resultString;
  }
  const btnpoolTemplate = (value: string) => {
    if (poolType == "public" && value == "single") {
      setInitPrice("");
    }
    setPoolTemplate(value as PoolTemplate);
    setinputvalue_gt_quoteTokentip(false);
  };
  const special_onChange: CheckboxProps["onChange"] = (e) => {
    setisownership(e.target.checked);
    // console.log(`checked = ${e.target.checked}`);
  };
  const handleClaer = (val: boolean) => {
    if (val) {
      setBaseToken(undefined);
    } else {
      setQuoteToken(undefined);
    }
  };

  return (
    <div className={styles.content}>
      {contextHolder}
      <div
        className={classNames(
          styles.arguments,
          isSingle ? styles.argumentsisSingle : ""
        )}
      >
        <div className={styles.title}>Create a pool</div>
        <div className={styles.subtitle}>
          <span>01</span> Choose Pool Type
        </div>
        <Selector value={poolType} options={poolTypes} onChange={handleType} />
        {isPublic ? (
          <>
            <div className={styles.subtitle}>
              <span>02</span> Choose Pool Template
            </div>
            <Selector
              value={poolTemplate}
              options={poolTemplates}
              onChange={btnpoolTemplate}
            />
          </>
        ) : null}
        <div className={styles.subtitle}>
          <span>{isPublic ? "03" : "02"}</span> Supply Initial Tokens
        </div>
        <div>
          <TokenSelect
            token={baseToken}
            dangerFlag={baseDangerFlag}
            isbase={true}
            onSelect={() => openTokenListModal(TokenUsage.BASE)}
            onChange={(value) => onAmountChange(TokenUsage.BASE, value)}
            onClear={handleClaer}
          />
        </div>
        <div className={styles.plus}>
          <PlusOutlined />
        </div>
        <div style={{ marginTop: isSingle ? "25px" : "-12px" }}>
          <TokenSelect
            token={quoteToken}
            dangerFlag={quoteDangerFlag}
            isbase={false}
            type={isSingle ? "only-select" : "both"}
            onSelect={() => openTokenListModal(TokenUsage.QUOTE)}
            onChange={(value) => onAmountChange(TokenUsage.QUOTE, value)}
            onClear={handleClaer}
          />
        </div>
        {standardInitPrice ? (
          <div className={styles.standardInit}>
            Init Price
            <Tooltip title="The initial swap price after the pool is created.">
              <QuestionCircleFilled className={styles.question} />
            </Tooltip>
            {standardInitPrice}
          </div>
        ) : null}
        <div className={styles.subtitle}>
          <span>{isPublic ? "04" : "03"}</span> Parameters
        </div>
        {isPublic && isSingle ? (
          <>
            <ParameterItem
              label="Init Price"
              direction="col"
              tooltipTitle="Set the minimum selling price for single-token pool."
              style={{ marginBottom: "10px" }}
            >
              <div
                className={classNames(
                  styles.price,
                  initDangerFlag && styles.dangerStyle
                )}
                style={{
                  border: inputvalue_gt_quoteTokentip ? "2px solid red" : "",
                }}
              >
                {baseToken && quoteToken ? (
                  <>
                    <span>1 {baseToken.symbol} = </span>
                    <Input
                      ref={initPriceRef}
                      style={{ fontSize: priceInputFontSize }}
                      className={styles.priceInput}
                      bordered={false}
                      value={initPrice}
                      onChange={handleInitPriceChange}
                    />
                    {quoteToken.symbol}
                  </>
                ) : (
                  <div className={styles.placeholder}>
                    Please select token first
                  </div>
                )}
              </div>
            </ParameterItem>
            <div
              className={styles.initialpricetip}
              style={{ display: inputvalue_gt_quoteTokentip ? "" : "none" }}
            >
              The initial price needs to be greater than{" "}
              {formatBigNumber(
                10,
                Number(quoteToken ? quoteToken.decimals : 18)
              )}{" "}
              and less than{" "}
              {new Big(10).pow(baseToken ? baseToken.decimals : 18).toString()}
            </div>
          </>
        ) : null}
        {poolType === "private" ? (
          <ParameterItem
            label="Mid Price"
            tooltipTitle="Set the mid price you want to provide liquidity."
            direction="col"
            style={{ marginBottom: "16px" }}
          >
            <div
              className={styles.price}
              style={{
                border: inputvalue_gt_quoteTokentip ? "2px solid red" : "",
              }}
            >
              {baseToken && quoteToken ? (
                <>
                  <span>1 {baseToken.symbol} = </span>
                  <Input
                    className={styles.priceInput}
                    style={{ fontSize: priceInputFontSize }}
                    ref={initPriceRef}
                    bordered={false}
                    value={initPrice}
                    onChange={handleInitPriceChange}
                  />
                  {quoteToken.symbol}
                </>
              ) : (
                <div className={styles.placeholder}>
                  Please select token first
                </div>
              )}
            </div>
            <div
              className={styles.initialpricetip}
              style={{ display: inputvalue_gt_quoteTokentip ? "" : "none" }}
            >
              The initial price needs to be greater than{" "}
              {formatBigNumber(
                10,
                Number(quoteToken ? quoteToken.decimals : 18)
              )}{" "}
              and less than{" "}
              {new Big(10).pow(baseToken ? baseToken.decimals : 18).toString()}
            </div>
          </ParameterItem>
        ) : null}
        {poolType === "anchored" ? (
          <ParameterItem
            label="Anchored Exchange Rate"
            tooltipTitle="The anchored exchange rate refers to the exchange rate between two token assets where one's value is anchored by the other. For example, the anchored exchange rate between the US Dollar and USDT is 1."
            direction="col"
            style={{ marginBottom: "16px" }}
          >
            <div className={styles.price}>
              {baseToken && quoteToken ? (
                <>
                  <span>1 {baseToken.symbol} = </span>
                  <Input
                    ref={initPriceRef}
                    style={{ fontSize: priceInputFontSize }}
                    className={styles.priceInput}
                    bordered={false}
                    value={initPrice}
                    onChange={handleInitPriceChange}
                  />
                  {quoteToken.symbol}
                </>
              ) : (
                <div className={styles.placeholder}>
                  Please select token first
                </div>
              )}
            </div>
            <div
              className={styles.initialpricetip}
              style={{ display: inputvalue_gt_quoteTokentip ? "" : "none" }}
            >
              {`The initial price needs to be greater than ${formatBigNumber(
                10,
                Number(quoteToken ? quoteToken.decimals : 18)
              )} and less than ${new Big(10)
                .pow(baseToken ? baseToken?.decimals : 18)
                .toString()}`}
            </div>
          </ParameterItem>
        ) : null}
        <ParameterItem
          label="Trading Fee Rate"
          tooltipTitle="Pools with lower trading fees will attract more traders."
          value={tradingFeeRateOption.value}
          unit="%"
          onEdit={handleTradingFeeRate}
        />
        <ParameterItem
          label="Volatility Coefficient"
          tooltipTitle="The smaller the volatility coefficient, the smaller the volatility of the trading market and the deeper the market depth."
          value={volatilityEoefficientOption.value}
          onEdit={handleVolatilityCofficient}
        />
        <div className={styles.subtitle}>
          <span>{isPublic ? "05" : "04"}</span> Special Features
        </div>
        <Checkbox onChange={special_onChange}>
          Relinquish pool ownership
        </Checkbox>
        <div
          className={styles.ownershiptip}
          style={{ display: isownership ? "" : "none" }}
        >
          <img src={warnred} className={styles.ownershipimg} />
          <div>
            The control of the pool will be transferred to a black hole account
            (aaaaa-aa). Once confirmed, this change is irreversible.
          </div>
        </div>
      </div>
      <CommonButton
        type={isActiveBtn() ? "primary" : "default"}
        className={styles.create}
        disabled={inputvalue_gt_quoteTokentip}
        size="large"
        block
        onClick={handleClick}
      >
        <div>{appStore.userId ? "Create a pool" : "Connect"}</div>
        <div className={styles.small}>
          Service Fees: {Number(tokenStore.dollar2ICP) * 3}ICP
        </div>
      </CommonButton>
      <div className={styles.subwallet}>
        <span onClick={btnToSubwallet}>
          Issues with tokens after pool creation? Check your sub-wallet here
        </span>
        <Tooltip
          overlayStyle={{ maxWidth: "350px" }}
          placement="bottom"
          title={`ICPEx has proprietary safety measures enabled to take care of your funds' safety. If issues arise during swaps, creating pools and adding liquidity, check under ‘Wallet - Sub Wallet’ to reclaim your tokens there.`}
        >
          <QuestionCircleFilled style={{ marginLeft: "5px" }} />
        </Tooltip>
      </div>
      <TokenListModal ref={tokenListModalRef} onSelect={handleSelect} />
      <VolatilityEoefficientModal
        ref={volatilityEoefficientModalRef}
        poolType={poolType}
        poolTemplate={poolTemplate}
        onConfirm={setVolatilityEoefficientOption}
      />
      <TradingFeeRateModal
        ref={tradingFeeRateModalRef}
        onConfirm={setTradingFeeRateOption}
      />
      <ProgressModal ref={approvalProgressModalRef} onSuccess={handleSuccess} />
      <ConnectWalletModal ref={connectWalletModalRef} />
    </div>
  );
};

export default observer(ContentRight);
