import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { FC } from "react";
import type { MenuProps, RadioChangeEvent, UploadProps } from "antd";
import { Dropdown, Radio } from "antd";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import AceEditor from "react-ace";
import Dragger from "antd/es/upload/Dragger";
import { InboxOutlined, LeftOutlined } from "@ant-design/icons";
import Big from "big.js";
import styles from "./index.module.less";
import TokenSelect from "./token-select";
import airdropImg from "@/assets/create-adorn.png";
import type { UserTokenUse } from "@/types/token";
import type {
  TokenListModalProps,
  TokenListModalRef,
} from "@/components/token/list-modal";
import { TokenListModal } from "@/components";
import appStore from "@/store/app";
import {
  connectWebSocket,
  divideAndConvertToBig,
  divideAndConvertToNumber,
  generateDeadline,
  isValidAmountNull,
  isValidPrincipal,
  multiplyAndConvertToBigInt,
} from "@/utils/common";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-monokai";
import { computeFeeBig } from "@/utils/fee";
import { artemisWalletAdapter, localVerity } from "@/utils/wallet/connect";
import { Principal } from "@dfinity/principal";
import {
  airdropdip20Transfer,
  airdropicp,
  airdropicrc1Transfer,
  airdropicrc2Transfer,
  dip20Transfer,
  dip20TransferWithTarget,
  icrc1Transfer,
  icrc2Transfer,
  icrcTransferWithTarget,
} from "@/utils/wallet/transaction";
import tokenStore from "@/store/token";
import { observer } from "mobx-react";
import { BatchTransact } from "artemis-web3-adapter";
import { Notification } from "@/components";
import { NotificationType } from "@/components/notification";
import AirdropModal, { SwapModalRef } from "./airdrop-modal";
import { airdrop, getSubaccount } from "@/utils/actors/icpl_faucet";
import { useTokens } from "@/hooks/use-tokens";
import {
  getBalanceByDip20,
  getBalanceByIcrc1,
  getBalanceByIcrc2,
} from "@/utils/token";
import { canisterId as icrc2CanisterId } from "@/canisters/icrc2_ledger";
interface ValidationResult {
  validEntries: { address: string; amount: string }[];
  invalidEntries: { address: string; amount: string }[];
  allEntries: any[];
  addressSet?: { [key: string]: number };
}

const airdropCampaign: FC = () => {
  enum TokenUsage {
    PAY = "pay",
    RECEIVE = "receive",
  }
  const [isDanger, setIsDanger] = useState(false);
  const [payToken, setPayToken] = useState<UserTokenUse>();
  const tokenListModalRef = useRef<TokenListModalRef>(null);
  const currentTokenUsage = useRef<TokenUsage>();
  const [receiveToken, setReceiveToken] = useState<UserTokenUse>();
  const [value, setValue] = useState(2);
  const [validEntries, setvalidEntries] = useState<
    { address: string; amount: string }[]
  >([]);
  const [invalidEntries, setinvalidEntries] = useState<
    Record<string, string | number>[]
  >([]);
  const [NextText, setNextText] = useState("Next");
  const [allEntries, setallEntries] = useState<string[]>();
  const [editorContent, setEditorContent] = useState<string>("");
  const editorRef = useRef<AceEditor>(null);
  const [sumAmount, setsumAmount] = useState<string>("0");
  const [sumToken, setsumToken] = useState<string>("0");
  const [curSuccessTokenNum, setcurSuccessTokenNum] = useState(1);
  const [showSend, setshowSend] = useState(false);
  const [notificationType, setNotificationType] =
    useState<NotificationType>("loading");
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [curlodingAdd, setcurlodingAdd] = useState("");
  const airdropModalRef = useRef<SwapModalRef>(null);
  const [airdroplength, setairdroplength] = useState(false);
  const [addressSet, setaddressSet] = useState(false);
  // const [notificationConfig, setNotificationConfig] = useState({
  //   loading: { message: 'airdro...' },
  //   success: { message: 'Transfer successfully' },
  //   error: { message: 'Transfer failed' },
  // });
  const notificationConfig = useMemo(() => {
    return {
      loading: {
        message: `Airdrop in progress`,
        actionText: "View progress",
        action: () => {
          airdropModalRef.current?.showModal();
        },
      },
      success: {
        message: "Airdrop successfully",
        actionText: "",
        // action: () => { goTransactions() },
      },
      error: {
        message: "Airdrop failed",
      },
    };
  }, [
    curSuccessTokenNum,
    curlodingAdd,
    validEntries.length,
    notificationType,
    notificationOpen,
  ]);
  const openTokenListModal = (usage: TokenUsage) => {
    tokenListModalRef.current?.showModal();
    currentTokenUsage.current = usage;
  };
  const handleChange = (value: string) => {
    if ((value === "0" || value.trim() === "") && receiveToken?.amountToUse) {
      receiveToken.amountToUse = "0";
    }
    setPayToken({
      ...payToken!,
      amountToUse: value,
    });
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
  const onChange = (e: RadioChangeEvent) => {
    setValue(e.target.value);
  };
  const props: UploadProps = {
    name: "file",
    multiple: true,
    showUploadList: false,
    beforeUpload(file: File) {
      validateFileData(file, (result) => {
        setvalidEntries(result.validEntries);
        setinvalidEntries(result.invalidEntries);
        setallEntries(result.allEntries);
        if (result.allEntries.length > 100) {
          setairdroplength(true);
        } else {
          setairdroplength(false);
        }
        setEditorContent(result.allEntries.join("\n"));
        setValue(1);
        // console.log('Valid Entries:', result.validEntries)
        // console.log('Invalid Entries:', result.invalidEntries)
        // console.log('allEntries', result.allEntries)
      });
      return false;
    },
    onDrop(e: React.DragEvent<HTMLDivElement>) {
      console.log("Dropped files");
    },
  };
  const validateFileData = (
    file: File,
    callback: (result: ValidationResult) => void
  ): void => {
    const fileType = file.type;
    const reader = new FileReader();

    reader.onload = (e: ProgressEvent<FileReader>) => {
      const data = e.target?.result;

      if (fileType.includes("text/csv") || file.name.endsWith(".csv")) {
        const csvData = Papa.parse(data as string, { header: false });
        const result = extractAndValidateData(csvData.data as any[][]);
        callback(result);
      } else if (
        fileType.includes("spreadsheetml") ||
        file.name.endsWith(".xlsx") ||
        file.name.endsWith(".xls")
      ) {
        const workbook = XLSX.read(data, { type: "binary" });
        let allData: any[][] = [];
        workbook.SheetNames.forEach((sheetName) => {
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          allData = allData.concat(jsonData);
        });
        const result = extractAndValidateData(allData);
        callback(result);
      } else if (
        fileType.includes("text/plain") ||
        file.name.endsWith(".txt")
      ) {
        const textData = data as string;
        const result = extractAndValidateTextData(textData);
        callback(result);
      }
    };

    if (
      fileType.includes("spreadsheetml") ||
      file.name.endsWith(".xlsx") ||
      file.name.endsWith(".xls")
    ) {
      reader.readAsBinaryString(file);
    } else {
      reader.readAsText(file);
    }
  };
  const extractAndValidateData = (data: any[][]): ValidationResult => {
    const validEntries: { address: string; amount: string }[] = [];
    const invalidEntries: {
      address: string;
      amount: string;
      errorDetails: string;
    }[] = [];
    const allEntries: any[] = data.map((item) => {
      return item.join(",");
    });
    data.forEach((row, index) => {
      let address = "";
      let amount = "";

      if (row.length > 1) {
        address = row[0];
        amount = row[1];
      }
      let errorDetails = `Line ${index + 1}:`;

      if (!isValidPrincipal(address)) {
        errorDetails += ` Invalid address (${address}).`;
        setNextText("Insufficient address");
      }

      if (!isValidAmountNull(amount)) {
        errorDetails += ` Invalid amount (${amount}).`;
        setNextText("Insufficient amount");
      }
      if (isValidPrincipal(address) && isValidAmountNull(amount)) {
        validEntries.push({ address, amount });
      } else {
        invalidEntries.push({ address, amount, errorDetails });
      }
    });
    return { validEntries, invalidEntries, allEntries };
  };
  const ValidateData = (data: any[]): ValidationResult => {
    const validEntries: { address: string; amount: string }[] = [];
    const invalidEntries: {
      address: string;
      amount: string;
      errorDetails: string;
      index: string;
    }[] = [];
    const allEntries: any[] = [];
    const addressSet: { [key: string]: number } = {};
    setaddressSet(false);
    data.forEach((row, index) => {
      let address = "";
      let amount = "";
      if (row.length > 1) {
        address = row.split(",")[0];
        amount = row.split(",")[1];
      }
      let errorDetails = `Line ${index + 1}:`;

      if (!isValidPrincipal(address)) {
        errorDetails += ` Invalid address (${address}).`;
        setNextText("Insufficient address");
      }
      if (!amount || !isValidAmountNull(amount) || amount == "0") {
        errorDetails += ` Invalid amount (${amount || ""}).`;
        setNextText("Insufficient amount");
      }

      if (address in addressSet) {
        if (address.trim()) {
          setaddressSet(true);
          errorDetails += ` Duplicate address (${address}).`;
          setNextText("Duplicate address");
        }
      } else {
        addressSet[address] = index;
      }
      if (
        isValidPrincipal(address) &&
        isValidAmountNull(amount) &&
        amount != "0" &&
        !(address in addressSet && addressSet[address] !== index)
      ) {
        validEntries.push({ address, amount });
      } else {
        invalidEntries.push({
          address,
          amount,
          errorDetails,
          index: String(index),
        });
      }
    });

    return { validEntries, invalidEntries, allEntries, addressSet };
  };

  // handleTXT
  const extractAndValidateTextData = (text: string): ValidationResult => {
    const lines = text.split(/\r?\n/);
    const data = lines.map((line) => line.split(/\s+/));
    return extractAndValidateData(data);
  };
  const handleEditorChange = (newValue: string) => {
    setEditorContent(newValue);
    const newArray = newValue.split("\n");
    setallEntries(newArray);
    if (newArray.length > 100) {
      setairdroplength(true);
    } else {
      setairdroplength(false);
    }
    if (!newValue) {
      setinvalidEntries([]);
      setvalidEntries([]);
      return;
    }
    const res = ValidateData(newArray);
    setinvalidEntries(res.invalidEntries);
    setvalidEntries(res.validEntries);
  };
  const items: MenuProps["items"] = [
    {
      key: "1",
      label: (
        <a rel="noopener noreferrer" onClick={() => selectChange("Excel")}>
          Excel
        </a>
      ),
    },
    {
      key: "2",
      label: (
        <a rel="noopener noreferrer" onClick={() => selectChange("CSV")}>
          CSV
        </a>
      ),
    },
    {
      key: "3",
      label: (
        <a rel="noopener noreferrer" onClick={() => selectChange("Text")}>
          Text
        </a>
      ),
    },
  ];
  const selectChange = (val: string) => {
    const arr = [
      [
        "c3cu5-3q7om-zawmq-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx",
        "10",
      ],
      [
        "3q7om-3q7om-zawmq-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx",
        "40",
      ],
    ];
    if (val == "Text") {
      const textContent = arr.map((row) => row.join(",")).join("\n");
      const blob = new Blob([textContent], {
        type: "text/plain;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "Example.txt";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else if (val == "CSV") {
      const csv = Papa.unparse(arr);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "Example.csv");
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } else if (val == "Excel") {
      const worksheet = XLSX.utils.aoa_to_sheet(arr);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "Example.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };
  const btnNext = () => {
    if (!payToken) {
      setNextText("Please select token");
    } else {
      let sum = new Big(0);
      validEntries.forEach((item) => {
        sum = sum.plus(item.amount);
      });
      setsumToken(sum.toString());
      let payTokenTransferAmount = Big(0);
      let payTokenBurnAmount = Big(0);
      payTokenTransferAmount = computeFeeBig({
        amount: sum,
        isFixed: payToken.isTransferFeeFixed,
        fee: payToken.transferFee,
      });
      if (payToken.protocol === "ICRC-1") {
        payTokenTransferAmount = payTokenTransferAmount.mul(2);
      }
      payTokenBurnAmount = computeFeeBig({
        amount: sum,
        isFixed: payToken.isBurnFeeFixed,
        fee: payToken.burnFee,
      });
      const amount = payTokenTransferAmount
        .plus(payTokenBurnAmount)
        .plus(sum)
        .times(new Big(10).pow(payToken.decimals));
      // console.log(amount.toString());

      setsumAmount(amount.toString());
      if (
        amount.gt(
          new Big(
            multiplyAndConvertToBigInt(
              payToken.balance.toString(),
              payToken.decimals
            ).toString()
          )
        )
      ) {
        setNextText("Insufficient balance");
        return;
      }
      setshowSend(true);
    }
  };

  const btnSend = async () => {
    if (payToken && validEntries) {
      airdropModalRef.current?.showModal(payToken, validEntries);
    }
    setNotificationOpen(true);
    setNotificationType("loading");
    try {
      const transaction = createTransaction();
      if (payToken?.protocol == "ICRC-1") {
        transaction.then((res: any) => {
          const icpapproe = airdropicp(
            {
              canisterId: "",
              amout: new Big(tokenStore.dollar2ICP!)
                .times(1.3)
                .times(new Big(10).pow(8))
                .toString(),
            },
            handleSuccess,
            handleFail
          );
          const batchTransactionObject = new BatchTransact(
            payToken.canisterId === icrc2CanisterId ? [res] : [res, icpapproe],
            artemisWalletAdapter
          );
          batchTransactionObject
            .execute()
            .then((result: any) => {
              if (!result) {
                handleFail();
              }
            })
            .catch((error: any) => {
              console.log(error);
              handleFail();
            });
        });
      } else {
        const icpapproe = airdropicp(
          {
            canisterId: "",
            amout: new Big(tokenStore.dollar2ICP!)
              .times(1.3)
              .times(new Big(10).pow(8))
              .toString(),
          },
          handleSuccess,
          handleFail
        );
        const batchTransactionObject = new BatchTransact(
          payToken!.canisterId === icrc2CanisterId
            ? [transaction]
            : [transaction, icpapproe],
          artemisWalletAdapter
        );
        batchTransactionObject
          .execute()
          .then((result: any) => {
            if (!result) {
              handleFail();
            }
          })
          .catch((error: any) => {
            console.log(error);
            handleFail();
          });
      }
    } catch (err) {
      console.log(err);
      handleFail();
    }
  };
  const btnback = () => {
    setshowSend(false);
  };
  function toNonExponential(num: any) {
    const m = num.toExponential().match(/\d(?:\.(\d*))?e([+-]\d+)/);
    return num.toFixed(Math.max(0, (m[1] || "").length - m[2]));
  }
  const createTransaction = useCallback(() => {
    if (!payToken) {
      return;
    }
    // setcurlodingAdd(curtoken.address)
    const handleSuccess = (res: any) => {
      if ("Ok" in res) {
        // setcurlodingAdd(curtoken.address);
        // setcurSuccessTokenNum((pre) => {
        //   if (pre < validEntries.length) {
        //     return pre + 1
        //   } else {
        //     return validEntries.length
        //   }
        // })
        if (payToken.canisterId === icrc2CanisterId) {
          airdropModalRef.current?.successTip();
          reqAirdrop();
        }
      } else {
        console.error(res.Err);
        handleFail();
      }
    };
    // const handleError = () => {
    //   setNotificationType('error')
    //   airdropModalRef.current?.closeModal()
    // }
    const curAmount =
      payToken.canisterId === icrc2CanisterId
        ? new Big(tokenStore.dollar2ICP!)
            .times(1.3)
            .times(new Big(10).pow(8))
            .plus(sumAmount)
        : sumAmount;

    const transferParams: any = {
      ...payToken,
      amount: new Big(curAmount).div(new Big(10).pow(payToken.decimals)),
      serverfee: new Big(tokenStore.dollar2ICP!)
        .times(1.3)
        .times(new Big(10).pow(8)),
    };

    const transactionMap = {
      DIP20: airdropdip20Transfer,
      "ICRC-1": airdropicrc1Transfer,
      "ICRC-2": airdropicrc2Transfer,
    };
    return transactionMap[payToken.protocol](
      transferParams,
      handleSuccess,
      handleFail
    );
  }, [payToken, sumAmount]);
  const { updateBalance } = useTokens();
  const reqAirdrop = async () => {
    if (!payToken) {
      return;
    }
    let params: Array<[Principal, bigint]> = [];
    validEntries.forEach((item) => {
      params.push([
        Principal.fromText(item.address),
        BigInt(
          new Big(item.amount)
            .times(new Big(10).pow(payToken.decimals))
            .toString()
        ),
      ]);
    });
    try {
      const res = await airdrop([
        params,
        Principal.fromText(payToken?.canisterId!),
        payToken.protocol,
      ]);
      if ("Ok" in res) {
        // console.log(res['Ok']);
        if (res["Ok"].length == 0) {
          airdropModalRef.current?.successTip();
          setNotificationType("success");
          setTimeout(async () => {
            airdropModalRef.current?.closeModal();
            const balanceMap = {
              DIP20: getBalanceByDip20,
              "ICRC-1": getBalanceByIcrc1,
              "ICRC-2": getBalanceByIcrc2,
            };
            const res = await balanceMap[payToken.protocol]({
              userId: appStore.userId,
              canisterId: payToken.canisterId,
            });
            setPayToken({
              ...payToken!,
              balance: divideAndConvertToBig(res, payToken.decimals),
            });
            updateBalance();
          }, 1000);
          setshowSend(false);
        } else {
          airdropModalRef.current?.closeModal();
          setNotificationType("error");
          const errList = res["Ok"].map((item) => {
            return [
              item[0].toString(),
              new Big(item[1].toString()).div(
                new Big(10).pow(payToken.decimals)
              ),
            ];
          });
          const csv = Papa.unparse(errList);
          const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
          const link = document.createElement("a");
          if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "List of failed airdrop.csv");
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        }
      } else if ("Err" in res) {
        console.log(res["Err"]);
        airdropModalRef.current?.closeModal();
        setNotificationType("error");
        const errList = allEntries!.map((item) => {
          return [item.split(",")[0], item.split(",")[1]];
        });
        const csv = Papa.unparse(errList);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        if (link.download !== undefined) {
          const url = URL.createObjectURL(blob);
          link.setAttribute("href", url);
          link.setAttribute("download", "List of failed airdrop.csv");
          link.style.visibility = "hidden";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    } catch (err) {
      console.log(err);
      setNotificationType("error");
      airdropModalRef.current?.closeModal();
    }
  };

  const balanceNull = () => {
    if (!payToken) {
      return;
    }
    let sum = new Big(0);
    validEntries.forEach((item) => {
      sum = sum.plus(item.amount);
    });
    let payTokenTransferAmount = Big(0);
    let payTokenBurnAmount = Big(0);

    payTokenTransferAmount = computeFeeBig({
      amount: sum,
      isFixed: payToken.isTransferFeeFixed,
      fee: payToken.transferFee,
    });
    if (payToken.protocol === "ICRC-1") {
      payTokenTransferAmount = payTokenTransferAmount.mul(2);
    }
    payTokenBurnAmount = computeFeeBig({
      amount: sum,
      isFixed: payToken.isBurnFeeFixed,
      fee: payToken.burnFee,
    });
    const amount = payTokenTransferAmount
      .plus(payTokenBurnAmount)
      .plus(sum)
      .times(new Big(10).pow(payToken.decimals));
    setsumAmount(amount.toString());
    // console.log(payToken, amount.plus(new Big(10).pow(payToken.decimals)).gt(new Big(multiplyAndConvertToBigInt(payToken.balance.toString(), payToken.decimals).toString())) || amount == new Big(0));
    // console.log((payToken && (amount.minus(new Big(10).pow(payToken.decimals)).gt(new Big(multiplyAndConvertToBigInt(payToken.balance.toString(), payToken.decimals).toString())) || amount == new Big(0))));

    if (
      payToken &&
      (amount.gt(
        new Big(
          multiplyAndConvertToBigInt(
            payToken.balance.toString(),
            payToken.decimals
          ).toString()
        )
      ) ||
        amount == new Big(0))
    ) {
      setNextText("Insufficient balance");
      return;
    }
    if (!allEntries || allEntries?.length == 0 || editorContent == "") {
      setNextText("Please fill out the airdrop list");
    }
  };
  const handleSuccess = async () => {
    airdropModalRef.current?.successTip();
    reqAirdrop();
  };
  const handleFail = () => {
    setNotificationType("error");
    airdropModalRef.current?.closeModal();
  };
  const oncloseAirdropModal = () => {
    setNotificationOpen(false);
  };
  const deletethem = () => {
    const invalidIndexes = invalidEntries.map((entry) => entry.index);
    const updatedAllEntries = allEntries!.filter(
      (_, index) => !invalidIndexes.includes(index.toString())
    );
    if (updatedAllEntries.length > 100) {
      setairdroplength(true);
    } else {
      setairdroplength(false);
    }
    setallEntries(updatedAllEntries);
    const res = ValidateData(updatedAllEntries);
    setvalidEntries(res.validEntries);
    setEditorContent(updatedAllEntries.join("\n"));
    setinvalidEntries([]);
  };
  const deleteDuplicate = (option: string) => {
    const addressMap: {
      [key: string]: { amount: number; firstIndex: number };
    } = {};

    const updatedEntries: string[] = [];

    allEntries!.forEach((entry, index) => {
      const [address, amountStr] = entry.split(",");
      const amount = parseFloat(isNaN(parseFloat(amountStr)) ? "0" : amountStr);

      if (!addressMap[address]) {
        addressMap[address] = { amount: amount, firstIndex: index };
        updatedEntries.push(entry);
      } else {
        if (option === "Combinebalances") {
          addressMap[address].amount += amount;
          updatedEntries[addressMap[address].firstIndex] = address
            ? `${address},${addressMap[address].amount}`
            : "";
        }
      }
    });

    if (updatedEntries.length > 100) {
      setairdroplength(true);
    } else {
      setairdroplength(false);
    }
    const res = ValidateData(updatedEntries);
    setallEntries(updatedEntries);
    setvalidEntries(res.validEntries);
    setEditorContent(updatedEntries.join("\n"));
    setinvalidEntries(res.invalidEntries);
    if (!res.invalidEntries) {
      setaddressSet(false);
    }
  };
  useEffect(() => {
    updateBalance();
    connectWebSocket();
    if (!allEntries || allEntries?.length == 0 || editorContent == "") {
      setNextText("Please fill out the airdrop list");
    }
  }, []);
  useEffect(() => {
    if (payToken) {
      if (!allEntries || allEntries?.length == 0 || editorContent == "") {
        setNextText("Please fill out the airdrop list");
      } else if (addressSet) {
        setNextText("Duplicate address");
      } else if (invalidEntries.length == 0) {
        setNextText("Next");
      }
    } else {
      setNextText("Please select token");
    }
    balanceNull();
  }, [payToken]);
  useEffect(() => {
    if (value == 1) {
      if (editorRef.current) {
        const editor = editorRef.current.editor;
        editor.setValue(editorContent);
        editor.selection.clearSelection();
      }
    }
  }, [value]);
  useEffect(() => {
    if (!allEntries || allEntries?.length == 0 || editorContent == "") {
      setNextText("Please fill out the airdrop list");
    } else if (addressSet) {
      setNextText("Duplicate address");
    } else if (invalidEntries?.length == 0) {
      setNextText("Next");
      balanceNull();
    }
  }, [validEntries, invalidEntries]);
  useEffect(() => {
    if (!appStore.userId || !payToken) {
      setIsDanger(false);
      return;
    }
    if (Number(payToken.amountToUse) > payToken.max.toNumber()) {
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
  useEffect(() => {
    if (validEntries.length != 0) {
      setcurlodingAdd(validEntries[curSuccessTokenNum - 1].address);
    }
    // setNotificationConfig({
    //   loading: {
    //     message: `airdro ${curlodingAdd} send ${curSuccessTokenNum} / ${validEntries.length} in progress`,
    //   },
    //   success: {
    //     message: 'Transfer successfully',
    //   },
    //   error: {
    //     message: 'Transfer failed',
    //   },
    // });
  }, [
    curSuccessTokenNum,
    curlodingAdd,
    validEntries.length,
    notificationType,
    notificationOpen,
  ]);
  return (
    <div className={styles.main}>
      <div className={styles.header}>
        <div className={styles.left}>
          <div className={styles.title}>
            Create an airdrop campaign with one click.
          </div>
        </div>
        <img src={airdropImg} alt="" />
      </div>
      <div
        className={styles.miancontent}
        style={{ display: showSend ? "none" : "" }}
      >
        <TokenSelect
          label="Pay"
          danger={isDanger}
          token={payToken}
          onSelect={() => openTokenListModal(TokenUsage.PAY)}
          onChange={handleChange}
        />
        <div className={styles.addresses}>
          <div className={styles.addressesheader}>
            <div className={styles.addressesleft}>Addresses with Amounts</div>
            <div className={styles.addressesright}>
              <Radio.Group onChange={onChange} value={value}>
                <Radio value={1}>Insert manually</Radio>
                <Radio value={2}>Upload file</Radio>
              </Radio.Group>
            </div>
          </div>
          <div className={styles.upload}>
            <Dragger
              {...props}
              style={{
                backgroundColor: "#1F2946",
                border: "0",
                display: value == 2 ? "" : "none",
              }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                Drop your files here or click to upload
              </p>
            </Dragger>
            <AceEditor
              ref={editorRef}
              style={{
                display: value == 1 ? "" : "none",
                backgroundColor: "#1F2946",
                color: "#fff",
              }}
              mode="text"
              name="code_editor"
              height="100%"
              width="100%"
              value={editorContent}
              onChange={handleEditorChange}
              editorProps={{ $blockScrolling: true }}
              setOptions={{
                highlightActiveLine: true,
                showLineNumbers: true,
                fontSize: 16,
              }}
            />
          </div>
          <div className={styles.buttomaddresses}>
            <div className={styles.buttomleft}>Accepted: CSV / Excel / Txt</div>
            <Dropdown
              className={styles.buttomrright}
              menu={{ items }}
              placement="bottomLeft"
            >
              <span>Example files</span>
            </Dropdown>
            {/* <div className={styles.buttomrright}>Example files</div> */}
          </div>
        </div>
        <div
          className={styles.uploadfileErr}
          style={{ display: invalidEntries.length != 0 ? "" : "none" }}
        >
          <div className={styles.errheader}>
            <div className={styles.errleft}>
              The below addresses cannot be processed
            </div>
            <div style={{ display: "flex" }}>
              <div
                className={styles.errright}
                style={{ display: addressSet ? "" : "none" }}
                onClick={() => {
                  deleteDuplicate("Keepfirst");
                }}
              >
                Keep the first one |
              </div>
              <div
                className={styles.errright}
                style={{ display: addressSet ? "" : "none" }}
                onClick={() => {
                  deleteDuplicate("Combinebalances");
                }}
              >
                Combine balances |
              </div>
              <div className={styles.errright} onClick={deletethem}>
                Delete them
              </div>
            </div>
          </div>
          <div className={styles.errList}>
            {invalidEntries?.map((item, index) => {
              return (
                <div
                  key={`${item.address + index.toString()}`}
                  className={styles.errItem}
                >
                  {item.errorDetails}
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ marginTop: "30px" }}>
          <div
            className={styles.errr}
            style={{ display: airdroplength ? "" : "none" }}
          >
            The number of addresses exceeds the limit. Currently, a maximum of
            100 addresses can be airdropped at a time.
          </div>
          <div
            className={styles.next}
            onClick={btnNext}
            style={{
              pointerEvents:
                NextText == "Next" && !airdroplength ? "unset" : "none",
              backgroundImage: airdroplength
                ? "linear-gradient(270deg, #1f2946 0%, #1f2946 100%)"
                : NextText == "Next"
                ? "linear-gradient(270deg, #8572FF 0%, #5D52DE 100%)"
                : "linear-gradient(270deg, #1f2946 0%, #1f2946 100%)",
              color: airdroplength
                ? "#8b9ac9"
                : NextText == "Next"
                ? "#fff"
                : "#8b9ac9",
            }}
          >
            {NextText}
          </div>
        </div>
      </div>
      <div
        className={styles.btmSummary}
        style={{ display: showSend ? "" : "none" }}
      >
        <div className={styles.Summaryheader}>Summary</div>
        <div className={styles.SummaryDetail}>
          <div className={styles.DetailItem}>
            <div className={styles.top}>
              {allEntries ? allEntries.length : "0"}
            </div>
            <div className={styles.btm}>Total number of addresses</div>
          </div>
          <div className={styles.DetailItem}>
            <div className={styles.top}>{sumToken}</div>
            <div className={styles.btm}>Total number of tokens to be sent</div>
          </div>
          <div className={styles.DetailItem}>
            <div className={styles.top}>
              {divideAndConvertToBig(
                sumAmount,
                payToken ? payToken.decimals : 8
              ).toString()}
            </div>
            <div className={styles.btm}>
              Approximate token cost of operation
            </div>
          </div>
          <div className={styles.DetailItem}>
            <div className={styles.top}>
              {payToken ? payToken.balance.toString() : "0"}
            </div>
            <div className={styles.btm}>Your token balance</div>
          </div>
        </div>
        <div className={styles.sendToken}>
          <LeftOutlined className={styles.backArr} onClick={btnback} />
          <div className={styles.send} onClick={btnSend}>
            <span>SEND</span>
            <span>service fee:{tokenStore.dollar2ICP}ICP</span>
          </div>
        </div>
      </div>
      <TokenListModal ref={tokenListModalRef} onSelect={handleSelect} />
      <Notification
        open={notificationOpen}
        type={notificationType}
        config={notificationConfig}
        closeIcon
        onClose={oncloseAirdropModal}
      />
      <AirdropModal
        ref={airdropModalRef}
        onSuccess={handleSuccess}
        onFail={handleFail}
      />
    </div>
  );
};
export default observer(airdropCampaign);
