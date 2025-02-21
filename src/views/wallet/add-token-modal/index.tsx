import { Input, Modal } from "antd";
import type { ChangeEvent } from "react";
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { SearchOutlined } from "@ant-design/icons";
import type { ImportTokenModalRef } from "../import-token-modal";
import ImportTokenModal from "../import-token-modal";
import TokenList from "./token-list";
import styles from "./index.module.less";
import { getAddedTokens } from "@/utils/token";
import type { ImportToken } from "@/types/token";
import { CenterTitle } from "@/components";

export interface AddTokenModalRef {
  show: (userId: string, default_search?: string) => void;
  close: () => void;
}

export interface AddTokenModalProps {
  onRefresh?: () => void;
}

const AddTokenModal = forwardRef<AddTokenModalRef, AddTokenModalProps>(
  (_, ref) => {
    const [open, setOpen] = useState(false);
    const [tokens, setTokens] = useState<ImportToken[]>([]);
    const [searchToken, setSearchToken] = useState("");
    const [loading, setLoading] = useState(false);
    const id = useRef<string>();

    const filterTokens = useMemo(() => {
      const lowerSearchTokens = searchToken
        .split(",")
        .map((token) => token.trim().toLowerCase())
        .filter((token) => token.trim() !== "");
      return tokens.filter((token) => {
        const { canisterId, name, symbol } = token;
        const lowerCanisterId = canisterId.toLowerCase();
        const lowerName = name.toLowerCase();
        const lowerSymbol = symbol.toLowerCase();
        if (lowerSearchTokens.length === 0) return true;
        return lowerSearchTokens.some((subQuery) => {
          return (
            lowerCanisterId.includes(subQuery) ||
            lowerName.includes(subQuery) ||
            lowerSymbol.includes(subQuery)
          );
        });
      });
    }, [searchToken, tokens]);

    const getList = useCallback(async () => {
      setLoading(true);
      const tokens = await getAddedTokens();
      setLoading(false);
      setTokens(tokens);
    }, []);

    const close = () => {
      setOpen(false);
      _?.onRefresh && _.onRefresh();
    };
    const show: AddTokenModalRef["show"] = (userId, default_search = "") => {
      setSearchToken(default_search);
      setOpen(true);
      id.current = userId;
      getList();
    };
    useImperativeHandle(ref, () => ({
      close,
      show,
    }));

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.trim();
      setSearchToken(value);
    };

    const importTokenRef = useRef<ImportTokenModalRef>(null);
    const handleImport = () => {
      importTokenRef.current?.show(id.current!);
    };

    return (
      <>
        <Modal
          width={700}
          zIndex={800}
          title={<CenterTitle title="Add Token" />}
          open={open}
          centered
          maskClosable={false}
          footer={false}
          onCancel={close}
        >
          <Input
            className={styles.input}
            value={searchToken}
            allowClear
            size="large"
            placeholder="Search by symbol or canister id"
            prefix={<SearchOutlined className={styles.icon} />}
            onChange={handleChange}
          />
          {searchToken && filterTokens.length === 0 ? (
            <div className={styles.error}>
              {searchToken} token is not issued yet! Please beware of fake
              token!
            </div>
          ) : null}
          <TokenList
            loading={loading}
            data={filterTokens}
            onImport={handleImport}
          />
        </Modal>
        <ImportTokenModal ref={importTokenRef} onSuccess={getList} />
      </>
    );
  }
);

AddTokenModal.displayName = "AddTokenModal";
export default AddTokenModal;
