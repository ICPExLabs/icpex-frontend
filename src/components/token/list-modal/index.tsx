import { Input, Modal, Spin, Switch, Tooltip } from "antd";
import type { ChangeEvent, MouseEvent } from "react";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  ExclamationCircleOutlined,
  SearchOutlined,
  StarFilled,
  StarOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { observer } from "mobx-react";
import TokenTag from "../tag";
import styles from "./index.module.less";
import { useTokens } from "@/hooks/use-tokens";
import type { UserToken } from "@/types/token";
import CenterTitle from "@/components/modal/center-title";
import tokenStore from "@/store/token";
import manualPng from "@/assets/manual.png";
import GhostButton from "@/views/wallet/ghost-button";
import type { ImportTokenModalRef } from "@/views/wallet/import-token-modal";
import ImportTokenModal from "@/views/wallet/import-token-modal";
import appStore from "@/store/app";
import AddTokenModal from "@/views/wallet/add-token-modal";
import type { AddTokenModalRef } from "@/views/wallet/add-token-modal";
import { formatBigNumberDisplay, sortTokens } from "@/utils/common.ts";
import Big from "big.js";

export interface TokenListModalRef {
  showModal: () => void;
}

export interface TokenListModalProps {
  onSelect?: (token: UserToken) => void;
}
const TokenListModal = forwardRef<TokenListModalRef, TokenListModalProps>(
  ({ onSelect }, ref) => {
    const [open, setOpen] = useState(false);
    const [searchText, setSearchText] = useState("");
    const {
      tokens,
      loading,
      updateBalance,
      refresh: getList,
      tokensRef,
    } = useTokens();
    const [searchTokens, setSearchTokens] = useState<UserToken[]>([]);
    const [hide, setHide] = useState(false);
    const handleHideChange = (value: boolean) => {
      setHide(value);
    };
    const showModal = () => {
      setSearchText("");
      setOpen(true);
      updateBalance();
    };
    const handleCancel = () => {
      setOpen(false);
    };

    useImperativeHandle(ref, () => ({
      showModal,
    }));

    useEffect(() => {
      const lowerValue = searchText.toLowerCase();
      const pinnedTokens: UserToken[] = [];
      tokenStore.pinTokens.forEach((tokenId) => {
        const index = tokens.findIndex((token) => token.canisterId === tokenId);
        if (index > -1) {
          pinnedTokens.push(tokens.splice(index, 1)[0]);
        }
      });
      let filterTokens = pinnedTokens.concat(sortTokens(tokens));
      filterTokens = filterTokens.filter((token) => {
        const filter_rule =
          token.source === "CERTIFICATION" ||
          tokenStore.addTokens.includes(token.canisterId);
        const include =
          token.symbol.toLowerCase().includes(lowerValue) ||
          token.name.toLowerCase().includes(lowerValue) ||
          token.canisterId.includes(lowerValue);
        const isHideZero = hide && token.balance.eq(Big(0));
        return include && !isHideZero && filter_rule;
      });
      setSearchTokens(filterTokens);
    }, [tokens, searchText, hide]);

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value.trim();
      setSearchText(value);
    };

    const handleClick: TokenListModalProps["onSelect"] = (token) => {
      onSelect &&
        onSelect({
          ...token,
        });
      handleCancel();
    };

    const generateToolTip = (source: UserToken["source"]) => {
      if (source === "CERTIFICATION") {
        return "This is an official token.";
      }
      return "This token is a manually imported token. Please check the information carefully before trading to ensure its security, ICPEx does not assume any responsibility for this.";
    };

    const handlePin = (e: MouseEvent, tokenId: string) => {
      e.stopPropagation();
      tokenStore.addPinToken(tokenId);
    };
    const addTokenModalRef = useRef<AddTokenModalRef>(null);
    const handleAdd = () => {
      if (!appStore.userId) return;
      addTokenModalRef.current?.show(appStore.userId);
    };
    const importTokenRef = useRef<ImportTokenModalRef>(null);

    return (
      <>
        <Modal
          open={open}
          zIndex={800}
          className={styles.searchModal}
          wrapClassName={styles.wrapClassName}
          title={<CenterTitle title="Select Token" />}
          footer={false}
          onCancel={handleCancel}
        >
          <div className={styles.body}>
            <div className={styles.search}>
              <Input
                value={searchText}
                allowClear
                bordered={false}
                size="large"
                placeholder="Search by symbol or canister id"
                prefix={<SearchOutlined className={styles.icon} />}
                onChange={handleChange}
              />
            </div>
            <div className={styles.hide}>
              Hide Zero Balance{" "}
              <Switch
                className={styles.switch}
                size="small"
                checked={hide}
                onChange={handleHideChange}
              />
            </div>
            <Spin spinning={loading}>
              <div className={styles.list}>
                {searchTokens.map((token) => {
                  return (
                    <div
                      className={styles.token}
                      key={token.canisterId}
                      onClick={() => handleClick(token)}
                    >
                      <div
                        className={styles.collect}
                        onClick={(e) => handlePin(e, token.canisterId)}
                      >
                        {tokenStore.pinTokens.includes(token.canisterId) ? (
                          <StarFilled />
                        ) : (
                          <StarOutlined />
                        )}
                      </div>
                      <div className={styles.content}>
                        <Tooltip title={token.canisterId}>
                          <div className={styles.logo}>
                            {token.logo ? (
                              <img src={token.logo} alt="logo" />
                            ) : null}
                          </div>
                        </Tooltip>
                        <div className={styles.info}>
                          <div className={styles.base}>
                            <div className={styles.name}>
                              <div className={styles.nameText}>
                                {token.symbol}
                              </div>
                              {token.source !== "CERTIFICATION" ? (
                                <img
                                  className={styles.manual}
                                  src={manualPng}
                                  alt="manual"
                                />
                              ) : null}
                            </div>
                            <div className={styles.symbol}>
                              <div className={styles.symbolName}>
                                {token.name}
                              </div>
                              <Tooltip title={generateToolTip(token.source)}>
                                <ExclamationCircleOutlined
                                  className={styles.tip}
                                />
                              </Tooltip>
                            </div>
                          </div>
                          <div className={styles.tag}>
                            <TokenTag protocol={token.protocol} />
                          </div>
                          <div className={styles.balance}>
                            {formatBigNumberDisplay(token.balance)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Spin>
            <div className={styles.import}>
              <GhostButton icon={<UploadOutlined />} onClick={handleAdd}>
                Add Token
              </GhostButton>
            </div>
          </div>
        </Modal>
        <ImportTokenModal ref={importTokenRef} onSuccess={getList} />
        <AddTokenModal ref={addTokenModalRef} onRefresh={getList} />
      </>
    );
  }
);

TokenListModal.displayName = "TokenListModal";

export default observer(TokenListModal);
