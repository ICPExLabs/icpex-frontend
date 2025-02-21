import React, { useEffect } from "react";
import { Table } from "antd";
import classNames from "classnames";

import type { TableProps } from "antd/lib";
import styles from "./index.module.less";
import { observer } from "mobx-react";
// import { useLocation } from 'react-router-dom'

const CommonTable: React.FC<
  TableProps<any> & {
    className?: string;
    headerRender?: React.ReactElement;
  }
> = observer((props) => {
  const { className, headerRender } = props;
  return (
    <>
      {headerRender ? (
        <div className={styles.header}>{headerRender}</div>
      ) : null}
      <Table {...props} className={classNames(styles.table, className)} />
    </>
  );
});

export default CommonTable;
