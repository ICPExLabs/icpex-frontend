import type { FC } from "react";
import {
  CaretDownOutlined,
  CloseCircleFilled,
  CloseCircleOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import React, { useRef } from "react";
import styles from "./index.module.less";
import type { Token, UserToken } from "@/types/token";
import { TokenListModal } from "@/components";
import type {
  TokenListModalProps,
  TokenListModalRef,
} from "@/components/token/list-modal";

export interface TokensParameterProps {
  tokenOne?: Token;
  tokenTwo?: Token;
  onSelect?: (order: string, token: UserToken) => void;
  onClear: (value: string) => void;
}
const TokensParameter: FC<TokensParameterProps> = ({
  tokenOne,
  tokenTwo,
  onSelect,
  onClear,
}) => {
  const tokenListModalRef = useRef<TokenListModalRef>(null);
  const orderRef = useRef("one");
  const handleClick = (order: "one" | "two") => {
    orderRef.current = order;
    tokenListModalRef.current?.showModal();
  };
  const handleSelect: TokenListModalProps["onSelect"] = (token) => {
    onSelect && onSelect(orderRef.current, token);
  };
  const handleClickClear = (
    e: React.MouseEvent<HTMLSpanElement, MouseEvent>,
    value: "one" | "two"
  ) => {
    e.stopPropagation();
    onClear(value);
  };
  return (
    <div className={styles.content}>
      <div className={styles.select} onClick={() => handleClick("one")}>
        <div className={styles.token}>
          {tokenOne ? (
            <>
              <div className={styles.logo}>
                <img src={tokenOne.logo} alt="logo" />
              </div>
              {tokenOne.symbol}
            </>
          ) : (
            "Select Token"
          )}
        </div>
        <CloseCircleFilled
          style={{
            marginLeft: "2pX",
            fontSize: "14px",
            color: "rgba(139, 154, 201, 0.65)",
            scale: "0.95",
            display: tokenOne ? "" : "none",
          }}
          onClick={(e) => handleClickClear(e, "one")}
        />
        <CaretDownOutlined />
      </div>
      <PlusOutlined className={styles.plus} />
      <div className={styles.select} onClick={() => handleClick("two")}>
        <div className={styles.token}>
          {tokenTwo ? (
            <>
              <div className={styles.logo}>
                <img src={tokenTwo.logo} alt="logo" />
              </div>
              {tokenTwo.symbol}
            </>
          ) : (
            "Select Token"
          )}
        </div>
        <CloseCircleFilled
          style={{
            marginLeft: "2pX",
            fontSize: "14px",
            color: "rgba(139, 154, 201, 0.65)",
            scale: "0.95",
            display: tokenTwo ? "" : "none",
          }}
          onClick={(e) => handleClickClear(e, "two")}
        />
        <CaretDownOutlined />
      </div>
      <TokenListModal ref={tokenListModalRef} onSelect={handleSelect} />
    </div>
  );
};

export default TokensParameter;
