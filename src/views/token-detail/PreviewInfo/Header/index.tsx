import type { FC } from 'react'
import React, { useState } from 'react'
import styles from './index.module.less'
import Selector from '../selector'

const PreviewInfo: FC = () => {
const [viewType,setViewType] = useState('Price')


  const viewTypeList = [
    {
      label: 'Price',
      value: 'Price',
    },
    {
      label: 'Volume',
      value: 'Volume',
    },
    {
      label: 'TVL',
      value: 'TVL',
    },
    {
      label: 'Transactions',
      value: 'Transactions',
    },
  ]

  return (
    <div className={styles.headerContainer}>
      <div className={styles.textContainer}>
        <div className={styles.textName}>{viewType}</div>
        <div className={styles.textCount}>{'$314.42K'}</div>
        <div className={styles.textTime}>{'May 26,2023'}</div>
      </div>
      <Selector value={viewType} options={viewTypeList} onChange={value => setViewType(value)} />
    </div>
  )
}

export default PreviewInfo