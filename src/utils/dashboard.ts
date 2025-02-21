import { Principal } from "@dfinity/principal";
import dayjs from "dayjs";
import { icpl_backend } from "@/canisters/icpl_backend";
import { icpl_router } from "@/canisters/icpl_router";
import { icpl_icpl } from "@/canisters/icpl_icpl";
import {
  getPoolChartData,
  getSimpleTokenList,
  getTokenChart,
  getTokenMarketInfo,
  getTokenPoolList,
  getTopTokenList,
  getTransactionList,
} from "@/utils/service/token";
import { getVolumn } from "@/utils/service/pool";
import type { PoolType } from "@/types/pool";
import {
  getBalanceBase,
  getCycles,
  getDIP20TotalSupply,
  getHolders,
  getICRC2Holders,
  getICRC2PlusCycles,
  getICRCTotalSupply,
  getTokenLogo,
} from "@/utils/token";
import { ANONYMOUS_PRINCIPAL_ID, TOKEN_PROTOCOLS } from "@/utils/constants";
import { handleTask } from "@/utils/catch.ts";
import { divide, formatAmountByUnit } from "@/utils/common.ts";
import type { TokenInfo } from "@/canisters/icpl_backend/icpl_backend.did";
import appStore from "@/store/app.ts";

interface TypeProps {
  [prop: string]: string;
}

const combineTimeData = (time: string, headerType: boolean = true) => {
  if (!time) return "";
  const tempMonth = dayjs(time).month();
  const tempYear = dayjs(time).year();
  const tempDay = dayjs(time).date();
  const monthMap: TypeProps = {
    0: "Jan",
    1: "Feb",
    2: "Mar",
    3: "Apr",
    4: "May",
    5: "Jun",
    6: "Jul",
    7: "Aug",
    8: "Sep",
    9: "Oct",
    10: "Nov",
    11: "Dec",
  };
  let result = `${monthMap[tempMonth]} ${tempDay},${tempYear}`;
  if (!headerType) {
    result = `${monthMap[tempMonth]} ${tempDay}`;
  }
  return {
    timeStr: `${monthMap[tempMonth]} ${tempDay}`,
    resultStr: `${monthMap[tempMonth]} ${tempDay},${tempYear}`,
    result,
  };
};

const combineCountData = (sourceData: any) => {
  let count = sourceData;
  if ((count ?? "") !== "") {
    count = typeof sourceData === "string" ? Number(count) * 1000 : count;
    const result = count.toLocaleString();
    return result;
  } else {
    return "";
  }
};

const changeArrFormat = (sourceArr: any) => {
  const resultArr = [] as any;
  sourceArr.forEach((sourceItem: any) => {
    const resultObj = {} as any;
    Object.keys(sourceItem).forEach((item: any) => {
      switch (item) {
        case "ts":
          const splitArr = sourceItem[item]?.split(" ") || [];
          const { result, timeStr, resultStr } = combineTimeData(
            splitArr?.[0] || "",
            false
          );
          resultObj[item] = result;
          resultObj.timeStr = {
            [timeStr]: resultStr,
          };
          break;
        default:
          resultObj[item] = sourceItem[item];
          break;
      }
    });
    resultArr.push(resultObj);
  });
  return resultArr;
};

// explore Token list
async function getTokenListData() {
  const [err, result] = await getTopTokenList();
  let listData = [] as any;
  if (!err) {
    listData = result?.data?.data || [];
  }

  const iconResult = await getLogoList(
    listData.map((item: any) => item.tokenId)
  );
  iconResult.map((item, index) => {
    listData[index].iconUrl = item;
    listData[index].index = index;
  });
  return listData;
}
const getTokenListDataSimple = async () => {
  const [err, result] = await getTopTokenList();
  if (err) {
    return [];
  }
  const list = (result.data.data as any).map((item: any, index: number) => {
    return {
      ...item,
      index,
      iconUrl: getTokenLogo(item.tokenId),
    };
  });
  return list;
};

const getLogoList = async (sourceData: any) => {
  const promiseArr = sourceData.map((item: any) =>
    icpl_backend.getTokenLogo(Principal.fromText(item))
  );
  const result = await Promise.all(promiseArr);
  return result;
};

async function getPoolListData(tokenId = "") {
  const [err, result] = await getTokenPoolList({ tokenId });
  let listData = [] as any;
  if (!err) {
    listData = result?.data?.data || [];
  }
  const baseList = await getLogoList(
    listData.map((item: any) => item.baseToken)
  );
  const quoteList = await getLogoList(
    listData.map((item: any) => item.quoteToken)
  );
  listData.map((item, index) => {
    listData[index].baseTokenUrl = baseList[index];
    listData[index].quoteTokenUrl = quoteList[index];
    item.index = index;
  });
  return listData;
}

const getPoolListDataSimple = async (tokenId = "") => {
  const [err, result] = await getTokenPoolList({ tokenId });
  if (err) {
    return [];
  }
  const list = (result.data.data as any).map((item: any, index: number) => {
    return {
      ...item,
      index,
      baseTokenUrl: getTokenLogo(item.baseToken),
      quoteTokenUrl: getTokenLogo(item.quoteToken),
    };
  });
  return list;
};

async function getPoolChartInfo(poolId: string = "") {
  const [err, result] = await getPoolChartData({ poolId });
  let listData = [] as any;
  if (!err) {
    listData = result?.data?.data || [];
  }
  return listData.reverse();
}

async function getMarketInfoData(tokenId: string) {
  const [err, result] = await getTokenMarketInfo({ tokenId });
  let listData = {} as any;
  if (!err) {
    listData = result?.data?.data || {};
  }
  const tempResult = changeDataFormat(listData);
  return tempResult;
}

const changeDataFormat = (sourceConfig: any) => {
  const titleMap = {
    tvl: "TVL",
    volume7d: "Volume 7D",
    volume24h: "Volume 24H",
  };
  const resultArr = [] as any;
  Object.keys(sourceConfig).forEach((item) => {
    switch (item) {
      case "tvl":
      case "volume7d":
      case "volume24h":
        const tempValue = formatAmountByUnit(sourceConfig[item]);
        resultArr.push({
          label: titleMap[item],
          unionMoney: tempValue ? `$${tempValue}` : "$0.00",
          rate: combineRateData(sourceConfig[item], sourceConfig[`${item}Old`]),
        });
        break;
    }
  });
  return resultArr;
};

const combineRateData = (newValue: any, oldValue: any) => {
  let resultRate = null;
  if (!oldValue) {
    resultRate = "--";
  } else {
    resultRate = Number((((newValue - oldValue) / oldValue) * 100).toFixed(2));
  }
  return resultRate;
};

const getTokenBasicInfo = async (tokenId: any) => {
  // const result = await icpl_backend.getToken((Principal.fromText(tokenId)))
  const result = await icpl_backend.getToken(Principal.fromText(tokenId));
  const protocol = result.token_type;
  const cycleFn = protocol !== "DIP20" ? getICRC2PlusCycles : getCycles;
  const holdersFn = protocol !== "DIP20" ? getICRC2Holders : getHolders;
  const totalSupplyFn =
    protocol !== "DIP20" ? getICRCTotalSupply : getDIP20TotalSupply;
  const [holders, cycles, total_supply] = await Promise.all([
    handleTask(holdersFn(tokenId), null),
    handleTask(cycleFn(tokenId), "--"),
    handleTask(totalSupplyFn(tokenId), BigInt(0)),
  ]);
  const blackBalance = await getBalanceBase({
    protocol,
    canisterId: tokenId,
    userId: "aaaaa-aa",
  });
  const total_supply_new = Number(total_supply - blackBalance);
  return {
    ...result,
    holders,
    cycles: cycles === "--" ? cycles : formatAmountByUnit(Number(cycles)),
    total_supply: total_supply_new,
  };
};

const getTokenBasicInfoMore = async (res: TokenInfo) => {
  const protocol = res.token_type;
  const tokenId = res.address.toText();
  if (!TOKEN_PROTOCOLS.includes(protocol))
    return {
      holders: "--",
      cycles: "--",
      total_supply: "--",
    };
  try {
    const cycleFn = protocol !== "DIP20" ? getICRC2PlusCycles : getCycles;
    const holdersFn = protocol !== "DIP20" ? getICRC2Holders : getHolders;
    const totalSupplyFn =
      protocol !== "DIP20" ? getICRCTotalSupply : getDIP20TotalSupply;
    const [holders, cycles, total_supply] = await Promise.all([
      handleTask(holdersFn(tokenId), BigInt(0)),
      handleTask(cycleFn(tokenId), BigInt(0)),
      handleTask(totalSupplyFn(tokenId), BigInt(0)),
    ]);
    const blackBalance = await getBalanceBase({
      protocol,
      canisterId: tokenId,
      userId: "aaaaa-aa",
    });
    const total_supply_new = divide(
      total_supply - blackBalance,
      10 ** Number(res.decimals),
      18
    );
    return {
      holders,
      cycles: formatAmountByUnit(Number(cycles)),
      total_supply: formatAmountByUnit(total_supply_new),
    };
  } catch (e) {
    return {
      holders: "--",
      cycles: "--",
      total_supply: "--",
    };
  }
};

const getPoolBasicInfo = async (poolId: string) => {
  const [result, cycleResult, midPriceBigint] = await Promise.all([
    icpl_router.getPoolInfo(
      Principal.fromText(poolId),
      Principal.fromText(ANONYMOUS_PRINCIPAL_ID)
    ),
    handleTask(getCycles(poolId), 0),
    handleTask(icpl_router.getMidPrice(Principal.fromText(poolId)), 0),
  ]);
  const resultDecimals = result.quote_token_decimals;
  const midPrice = Number(midPriceBigint);
  const baseToQuote =
    midPrice === 0
      ? "--"
      : formatAmountByUnit(Number(midPrice) / 10 ** Number(resultDecimals));
  const quoteToBase =
    midPrice === 0
      ? "--"
      : formatAmountByUnit(
          1 / (Number(midPrice) / 10 ** Number(resultDecimals))
        );
  const [baseUrl, quotoUrl] = [
    getTokenLogo(result.base_token.toText()),
    getTokenLogo(result.quote_token.toText()),
  ];
  const transformer: { [key: string]: PoolType } = {
    lpc: "public",
    lpp: "private",
    lps: "anchored",
  };
  const type = transformer[result.pool_type.toLowerCase()] || "public";
  const baseReserveValue =
    Number(result.base_reserve) / 10 ** result.base_token_decimals;
  const quoteReserveValue =
    Number(result.quote_reserve) / 10 ** result.quote_token_decimals;
  const totalValue = baseReserveValue + quoteReserveValue;
  const tempBaseReserve = formatAmountByUnit(baseReserveValue);
  const tempQuoteReserve = formatAmountByUnit(quoteReserveValue);
  const tempBaseReserveLock = formatAmountByUnit(
    (baseReserveValue * Number(result.lp_lock)) / Number(result.total_supply)
  );
  const tempQuoteReserveLock = formatAmountByUnit(
    (quoteReserveValue * Number(result.lp_lock)) / Number(result.total_supply)
  );
  const baseReserveRate =
    totalValue === 0
      ? "0"
      : (
          (baseReserveValue / (baseReserveValue + quoteReserveValue)) *
          100
        ).toFixed(2);
  const quoteReserveRate =
    totalValue === 0
      ? "0"
      : (
          (quoteReserveValue / (baseReserveValue + quoteReserveValue)) *
          100
        ).toFixed(2);
  const [tempBaseResult, tempqutoteResult] = await Promise.all([
    handleTask(
      icpl_backend.getToken(Principal.fromText(result.base_token.toText())),
      null
    ),
    handleTask(
      icpl_backend.getToken(Principal.fromText(result.quote_token.toText())),
      null
    ),
  ]);
  return {
    ...result,
    cycles: formatAmountByUnit(Number(cycleResult)),
    baseToQuote,
    quoteToBase,
    pool_addr: result.pool_addr,
    owner: result.owner,
    baseUrl: baseUrl || "",
    quoteUrl: quotoUrl || "",
    // baseSymbol: tempBaseResult.symbol || '',
    // quoteSymbol: tempqutoteResult.symbol || '',
    type,
    transFee: ((Number(result.lp_fee_rate) / 10 ** 18) * 100).toFixed(2),
    baseReserve: tempBaseReserve,
    nobaseReserve: baseReserveValue,
    nobaseReserveLock:
      (baseReserveValue * Number(result.lp_lock)) / Number(result.total_supply),
    notempQuoteReserve: quoteReserveValue,
    notempQuoteReserveLock:
      (quoteReserveValue * Number(result.lp_lock)) /
      Number(result.total_supply),
    quoteReserve: tempQuoteReserve,
    baseReserveRate,
    quoteReserveRate,
    baseReserveLock: tempBaseReserveLock,
    quoteReserveLock: tempQuoteReserveLock,
    baseSymbol: tempBaseResult?.symbol || "",
    quoteSymbol: tempqutoteResult?.symbol || "",
    base_token: result.base_token.toText(),
    quote_token: result.quote_token.toText(),
  };
};

async function getTokenChartDetail(tokenId: string) {
  const [err, result] = await getTokenChart({ tokenId });
  let listData = {} as any;
  if (!err) {
    listData = result?.data?.data || {};
  }
  return listData?.reverse() || [];
}

async function getPoolMarketInfo(poolId: string) {
  const [err, result] = await getVolumn(poolId);
  let listData = {} as any;
  if (!err) {
    listData = result?.data?.data || {};
  }
  return listData;
}

async function getPoolTransactionInfo(poolId: string) {
  const [err, result] = await getTransactionList(poolId);
  let listData = {} as any;
  if (!err) {
    listData = result?.data?.data || {};
  }
  return listData;
}

const getCountUnit = (
  sourceCount: any,
  cycleFlag = true,
  decimal = 0,
  integerFlag = false
) => {
  // K 10**3
  // M 10 ** 6
  // B 10 ** 9
  let tempCount = sourceCount;
  let result = "";
  const unitMap = {
    0: "",
    1: "K",
    2: "M",
    3: "B",
    4: "T",
  };
  let unitCount = 0;
  if ((sourceCount ?? "") !== "") {
    if (
      Number.isNaN(Number(tempCount)) ||
      Number(tempCount) === 0 ||
      !Number.isFinite(Number(tempCount))
    ) {
      return "0";
    }
    const unitLength = cycleFlag ? 1 : 1000;
    const decimalLength = decimal || (cycleFlag ? 4 : 2);
    while (tempCount >= unitLength) {
      tempCount = tempCount / 10 ** 3;
      unitCount += 1;
    }
    result = integerFlag
      ? toThousands(Math.floor(Number(tempCount)))
      : toThousands(Number(tempCount).toFixed(decimalLength));
    const tempUnit = unitMap[unitCount] || (unitCount > 4 ? "T" : "");
    return `${result} ${tempUnit}`;
  } else {
    return "--";
  }
};

const toThousands = (sourceNum) => {
  let num = (sourceNum || 0).toString();
  let result = "";
  let prefixStr = "";
  if (num.includes(".")) {
    const splitArr = num.split(".");
    num = splitArr[0];
    prefixStr = splitArr[1];
  }
  while (num.length > 3) {
    result = `,${num.slice(-3)}${result}`;
    num = num.slice(0, num.length - 3);
  }
  if (num) {
    const tempResult = num + result;
    result = prefixStr ? `${tempResult}.${prefixStr}` : tempResult;
  }
  return result;
};

const getPriceChangeRate = (
  sourceRrice: number | null,
  destPrice: number | null
) => {
  let result = "";
  if ((sourceRrice ?? "") === "") {
    return "";
  }
  if (destPrice) {
    result = (((sourceRrice - destPrice) / destPrice) * 100).toFixed(2);
  }
  return result;
};

const validCheck = (value: number | null) => {
  return (value ?? "") !== "";
};

const getScientificNotation = (sourceNumber: number | string) => {
  const tempCount = 10 ** -6;
  let result: any;
  if (typeof sourceNumber === "string") {
    sourceNumber = Number.parseInt(sourceNumber);
  }
  if (sourceNumber > 1) {
    // result = toThousands(sourceNumber)
    result = sourceNumber.toFixed(2);
  } else {
    result =
      sourceNumber > tempCount
        ? sourceNumber.toFixed(6)
        : sourceNumber === 0
        ? sourceNumber.toFixed(2)
        : sourceNumber.toExponential(2);
  }

  return result;
};

const getEllipsisText = (text: string) => {
  return text?.length > 4 ? `${text?.slice(0, 4)}...` : text;
};

export {
  combineTimeData,
  combineCountData,
  changeArrFormat,
  getTokenListData,
  getPoolListData,
  getPoolChartInfo,
  getMarketInfoData,
  getTokenBasicInfo,
  getPoolBasicInfo,
  getTokenChartDetail,
  getPoolMarketInfo,
  getPoolTransactionInfo,
  getPriceChangeRate,
  validCheck,
  getScientificNotation,
  toThousands,
  getCountUnit,
  getTokenListDataSimple,
  getPoolListDataSimple,
  getPoolListDataWhole,
  getTokenBasicInfoMore,
  getEllipsisText,
};
