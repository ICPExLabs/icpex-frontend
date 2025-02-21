import React, { useState, useEffect } from 'react'
import styles from './index.module.less'
import Selector from './selector'
import ColumnChart from '@/views/dashboard/PreviewInfo/ColumnChart'

interface PreviewInfoProps {
    detailType: string;
    chartInfo: any[];
}

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
];

const PreviewInfo: React.FC<PreviewInfoProps> = (props) => {
    const { detailType, chartInfo } = props;
    const [viewType, setViewType] = useState(detailType === 'token' ? 'Price' : 'Volume');
    const [typeList, setTypeList] = useState(viewTypeList);

    useEffect(() => {
        if (detailType !== 'token') {
            setTypeList(typeList.filter(item => item.label !== 'Price'));
        }
    }, [detailType])

    return (
        <div className={styles.previewContainer}>
            <ColumnChart headerTitle={viewType} type={viewType.toLocaleLowerCase()} data={chartInfo} headerNode={
                <Selector value={viewType} options={typeList} onChange={value => setViewType(value)} />
            } />

        </div>
    )
}

export default PreviewInfo