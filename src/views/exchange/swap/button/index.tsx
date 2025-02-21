import classNames from "classnames";
import type { CSSProperties, FC, ReactNode } from "react";
import React from "react";
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import styles from "./index.module.less";

export interface ActionButtonProps {
  status?: "normal" | "warning" | "danger";
  disabled?: boolean;
  loading?: boolean;
  children?: ReactNode;
  style?: CSSProperties;
  onClick?: () => void;
}
const ActionButton: FC<ActionButtonProps> = ({
  status = "normal",
  loading = false,
  disabled = false,
  children,
  style,
  onClick,
}) => {
  const handleClick = () => {
    onClick && onClick();
  };
  return (
    <button
      className={classNames(styles.button, styles[status])}
      disabled={disabled}
      onClick={handleClick}
      style={style}
    >
      {loading ? (
        <Spin className={styles.loading} indicator={<LoadingOutlined spin />} />
      ) : null}
      {children}
    </button>
  );
};

export default ActionButton;
