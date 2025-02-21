import type { ChangeEvent, FC } from "react";
import React, { useEffect, useState } from "react";
import { Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import styles from "./index.module.less";

interface AddressParameterProps {
  value?: string;
  onSearch?: (value: string) => void;
}

const AddressParameter: FC<AddressParameterProps> = ({ value, onSearch }) => {
  const [innerValue, setInnerValue] = useState(value);
  useEffect(() => {
    if (innerValue !== value) setInnerValue(value);
  }, [value]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.trim();
    setInnerValue(value);
    onSearch && onSearch(value || "");
  };
  const [placeholder, setPlaceholder] = useState("Search by pool canister id");
  return (
    <div className={styles.content}>
      <Input
        value={innerValue}
        className={styles.input}
        onBlur={() => setPlaceholder("Search by pool canister id")}
        onFocus={() => setPlaceholder("")}
        allowClear
        bordered={false}
        size="large"
        placeholder={placeholder}
        prefix={<SearchOutlined className={styles.search} />}
        onChange={handleChange}
      />
    </div>
  );
};

export default AddressParameter;
