import type { FC, ReactNode } from "react";
import React from "react";
import styles from "./index.module.less";
import warnImg from "@/assets/warn-red.png";

interface CenterTitleProps {
  title?: string;
  children?: ReactNode;
  isAlarm: boolean;
}
const CenterTitle: FC<CenterTitleProps> = ({ title, isAlarm, children }) => {
  return (
    <>
      {isAlarm && (
        <div
          className={styles["warn-img"]}
          style={{ backgroundImage: `url(${warnImg})` }}
        />
      )}
      <div className={styles.title}>{children || title}</div>
    </>
  );
};

export default CenterTitle;
