import type { ReactNode } from 'react'
import React, { useEffect, useState } from 'react'
import styles from './index.module.less'
import { combineTimeData, getCountUnit } from '@/utils/dashboard'
import { formatAmountByUnit } from "@/utils/common.ts";
import { QuestionCircleFilled } from "@ant-design/icons";
import { Tooltip } from "antd";

interface HeaderIProps {
  headerType: string
  headerData: any
  headerTitle: string
  headerNode?: ReactNode
  curData?: string
  curTm?: string
  typeMap?: any
  headerTitleComment?: string
}

const PreviewInfo: React.FC<HeaderIProps> = (props) => {
  const { headerType, headerData, headerTitle, curData, curTm, headerTitleComment } = props
  const [resultTime, setResultTime] = useState('')
  const [resultCount, setResultCount] = useState('')

  useEffect(() => {
    if (!headerData?.length)
      return
    const resultObj = headerData?.[headerData.length - 1] || {}
    const tempTime = resultObj?.ts || ''
    const { result } = combineTimeData(tempTime)
    setResultTime(result)
    const tempCount = formatAmountByUnit(resultObj[headerType])
    setResultCount(tempCount)
  }, [headerData, headerType])

  const getCount = () => {
    if (curData)
      return curData
    if (!resultCount)
      return '--'
    return headerType === 'transactionsNum' ? Math.floor(+resultCount) : `$${resultCount}`
  }

  return (
    <div className={styles.headerContainer}>
      <div className={styles.textContainer}>
        <div className={styles.textName}>{headerTitle}&nbsp;{<Tooltip title={headerTitleComment}>
          <QuestionCircleFilled className={styles.question} />
        </Tooltip>}</div>
        <div className={styles.textCount}>{getCount()}</div>
        <div className={styles.textTime}>{curTm || resultTime || '--'}</div>
      </div>
      {
        props.headerNode ? props.headerNode : <></>
      }
    </div>
  )
}

export default PreviewInfo
