import { Button, Spin } from 'antd'
import { CaretDownOutlined, CaretUpOutlined } from '@ant-design/icons'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { observer } from 'mobx-react'
import { Principal } from '@dfinity/principal'
import classNames from 'classnames'
import axios from 'axios'
import styles from './index.module.less'
import SpecialFeaturesForm from './specialFeaturesForm'
import SpecialFeaturesICRCForm from './specialFeaturesICRCForm'
import EnterTokenForm from './enterTokenForm'
import { createToken } from '@/utils/create-token'
import { canisterId, idlFactory } from '@/canisters/icpl_icpl'
import { canisterId as canisterIdBackend } from '@/canisters/icpl_backend'
import appStore from '@/store/app'
import tokenStore from '@/store/token'
import { DimensionSelector, Notification } from '@/components'
import type { NotificationType } from '@/components/notification'
import type { UserToken } from '@/types/token'
import { canisterId as icrc2CanisterId, idlFactory as icrc2IdlFactory } from '@/canisters/icrc2_ledger'
import { coinbase_icp_price, connectWebSocket, transferToNumber } from '@/utils/common'
import { BatchTransact } from "artemis-web3-adapter";
import { artemisWalletAdapter, verifyConnectionAndAgent } from "@/utils/wallet/connect.ts";
import ConnectWalletModal, { ConnectWalletModallRef } from "@/components/layout/ConnectWalletModal";
import Big from 'big.js'

const dimentions = [
  {
    value: 'ICRC-2',
    label: 'ICRC-2',
    style: {
      width: '143px',
    },
  },
]

const StepCreate: React.FC<{
  onOk: () => void
}> = ({ onOk }) => {
  const [loading, setLoading] = useState(false)
  // const [cacheTotalSupply, setCacheTotalSupply] = useState(1)

  const [mainCompleteData, setMainCompleteData] = useState<{ total_supply?: number; symbol?: string; url: string } | null>(null)
  const [isMainComplete, setIsMainComplete] = useState<boolean>(false)
  const [showMore, setShowMore] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [notificationType, setNotificationType] = useState<NotificationType>('loading')
  const [notificationMessage, setNotificationMessage] = useState<string>('')
  const [dimension, setDimension] = useState('ICRC-2')
  const [isbtn, setisbtn] = useState(true)

  // const [infoMessage, setInfoMessage] = useState('')

  const enterTokenFormRef = useRef<any>()
  const specialFeaturesFormRef = useRef<any>()
  const specialFeaturesICRCFormRef = useRef<any>()

  useEffect(() => {
    setTimeout(coinbase_icp_price, 1000);
    connectWebSocket()
  }, [])

  const reset = () => {
    enterTokenFormRef.current?.clear()
    specialFeaturesFormRef.current?.clear()
  }

  const clearErr = () => {

  }

  const notificationConfig = useMemo(() => {
    return {
      loading: { message: 'Token Creating...' },
      success: { message: 'Token created successful', action: reset },
      error: { message: notificationMessage || 'Token creation failed', action: clearErr },
      // info: { message: infoMessage },
    }
  }, [notificationType, notificationMessage])

  const fetchCreate = useCallback(async (params: Record<string, any>) => {
    const {
      name, imgSrc, symbol, burn_on, transfer_on, mint_on, flat_fee, flat_burn_fee, fee, burn_rate,
    } = params
    const decimals = ~~(params.decimals || 8)

    const feeFormat = (!transfer_on) ? BigInt(0) : (flat_fee ? BigInt(new Big(fee).times(Math.pow(10, decimals)).toString()) : BigInt(new Big(fee).times(Math.pow(10, 18)).div(100).toString()))
    const burnRateFormat = (!burn_on) ? BigInt(0) : (flat_burn_fee ? BigInt(new Big(burn_rate).times(Math.pow(10, decimals)).toString()) : BigInt(new Big(burn_rate).times(Math.pow(10, 18)).div(100).toString()))

    try {
      const res = await createToken(
        name || symbol,
        imgSrc,
        symbol,
        decimals,
        BigInt(new Big(params.total_supply || 1).times(Math.pow(10, decimals)).toString()),
        feeFormat,
        mint_on || false,
        burnRateFormat,
        flat_fee || false,
        flat_burn_fee || false,
        dimension,
        []
      )
      if (res?.Ok) {
        reset()

        setNotificationType('success')
        return
      }
      setNotificationMessage(res?.Err)
      setNotificationType('error')
    } catch (err) {
      console.log(err);
      setNotificationMessage('')
      setNotificationType('error')
      throw err
    }
  }, [dimension])

  const handleShowMore = () => {
    setShowMore(!showMore)
  }

  const handleSupplyChange = (v: any) => {
    // setCacheTotalSupply(v)
  }

  const handleMainCompleteChange = (v: { total_supply?: number; symbol?: string; url: string }) => {
    setMainCompleteData(v)
    setIsMainComplete(!!v.symbol && !!v.total_supply && !!v.url)
  }

  const submitDip20 = async (platToken: UserToken, formValues: Record<string, any>) => {
    console.log(`create dip20`)
    console.log(canisterIdBackend)

    const amount = tokenStore.dollar2ICP ? Math.ceil(Number(tokenStore.dollar2ICP) * (10 ** 8) * 1.1 * 3) : 30
    new BatchTransact([
      {
        idl: icrc2IdlFactory,
        canisterId: icrc2CanisterId,
        methodName: 'icrc2_approve',
        args: [{
          amount,
          created_at_time: [],
          expected_allowance: [],
          expires_at: [],
          fee: [],
          from_subaccount: [],
          memo: [],
          spender: {
            owner: Principal.fromText(canisterIdBackend!),
            subaccount: [],
          },
        }],
        onSuccess: async () => {
          try {
            await fetchCreate(formValues)
          }
          catch (err: any) {
            console.warn('create request error:', err)
            setNotificationType('error')
          }
          finally {
            onOk?.()
            setLoading(false)
          }
        },
        onFail: (err: any) => {
          console.error('wallet error:', err)
          setLoading(false)
          setNotificationType('error')
        },
      } as any,
    ], artemisWalletAdapter).execute()
  }

  const submitICRC2 = async (platToken: UserToken, formValues: Record<string, any>) => {
    console.log('create ICRC2')
    // console.log(canisterIdBackend)

    const amount = tokenStore.dollar2ICP ? Math.ceil(Number(tokenStore.dollar2ICP) * (10 ** 8) * 1.1 * 3) : 30

    await new BatchTransact([
      {
        idl: icrc2IdlFactory,
        canisterId: icrc2CanisterId,
        methodName: 'icrc2_approve',
        args: [{
          amount,
          created_at_time: [],
          expected_allowance: [],
          expires_at: [],
          fee: [],
          from_subaccount: [],
          memo: [],
          spender: {
            owner: Principal.fromText(canisterIdBackend!),
            subaccount: [],
          },
        }],
        onSuccess: async () => {
          try {
            await fetchCreate(formValues)
          }
          catch (err: any) {
            console.warn('create request error:', err)
            setNotificationType('error')
          }
          finally {
            onOk?.()
            setLoading(false)
          }
        },
        onFail: (err: any) => {
          console.error('plug error:', err)
          setLoading(false)
          setNotificationType('error')
        },
      } as any,
    ], artemisWalletAdapter).execute()
  }

  const handleChangeTab = (v) => {
    console.log(v)
    setDimension(v)
  }

  const connectWalletModalRef = useRef<ConnectWalletModallRef>(null)
  const openConnectModal = () => {
    connectWalletModalRef.current?.showModal()
  }

  const handleSubmit = async () => {
    if (!appStore.userId) {
      openConnectModal()
      return
    }
    const step1V = enterTokenFormRef.current?.getFormData() || {}
    const step2V = specialFeaturesFormRef.current?.getFormData() || {}
    const step2VICRC2 = specialFeaturesICRCFormRef.current?.getFormData() || {}
    const formValues = {
      ...step1V,
      ...(dimension === 'ICRC-2' ? step2VICRC2 : step2V),
    }

    const emptyKeys = Object.keys(step1V).filter(el => formValues[el] === undefined)

    if (emptyKeys?.length) {
      setNotificationOpen(false)
      setLoading(false)

      return
    }

    const platToken = appStore.platToken
    if (!platToken) {
      setNotificationOpen(true)
      setNotificationMessage('')
      setNotificationType('error')
      return
    }

    setLoading(true)
    setNotificationType('loading')
    setNotificationOpen(true)

    const fn = dimension === 'ICRC-2' ? submitICRC2 : submitDip20

    try {
      await fn(platToken, formValues)
    } catch (err) {
      setNotificationType('error')
      setLoading(false)
      throw err
    }
  }
  const handleIsemptChange = (v1: any, v2: any, checkedList: any) => {
    console.log(v1, v2, checkedList);
    if (checkedList.length > 1) {
      if (v1 && (v2)) {
        setisbtn(false)
      } else {
        setisbtn(true)
        console.log(22);

      }
    } else {
      if (checkedList[0] == "supportBurn" && !v2) {
        setisbtn(true)
      } else if (checkedList[0] == 'supportTransfer' && !v1) {
        setisbtn(true)
      } else {
        setisbtn(false)
      }
    }

    // setisbtn(newIsemptValue);
  };
  return (<>
    {notificationConfig && <Notification open={notificationOpen} type={notificationType} config={notificationConfig} closeIcon={notificationType !== 'loading'} />}

    <Spin spinning={loading}>
      <div className={styles.section}>
        <div className={styles.header}>
          Token Standard
        </div>
        <div className={styles['tab-content']}>
          <DimensionSelector className={styles.dsl} value={dimension} options={dimentions} onChange={handleChangeTab} />
        </div>

        <div className={styles.header}>
          Enter Token Parameters
          <div className={styles.unfold} onClick={handleShowMore}>
            More {showMore ? <CaretUpOutlined style={{ fontSize: '12px' }} /> : <CaretDownOutlined style={{ fontSize: '12px' }} />}
          </div>
        </div>

        <div className={styles.content}>
          <EnterTokenForm visible propRef={enterTokenFormRef} showMore={showMore} onSupplyChange={handleSupplyChange} onMainCompleteChange={handleMainCompleteChange} />
        </div>

        <div className={classNames(styles.header, styles.header2)}>
          Special Features
        </div>

        <div className={styles.content}>
          {
            dimension === 'ICRC-2'
              ? <SpecialFeaturesICRCForm visible supply={mainCompleteData?.total_supply || 0} propRef={specialFeaturesICRCFormRef} isempt={isbtn} onIsemptChange={handleIsemptChange} />
              : <SpecialFeaturesForm visible supply={mainCompleteData?.total_supply || 0} propRef={specialFeaturesFormRef} isempt={isbtn} onIsemptChange={handleIsemptChange} />
          }

        </div>
        <ConnectWalletModal ref={connectWalletModalRef} />
      </div>
    </Spin>
    <Button disabled={loading || !isMainComplete || isbtn} className={classNames(styles.btn, isMainComplete ? styles.usual : '')} onClick={handleSubmit}>
      <div>Create a token</div>
      <div className={styles.small}>Service Fees: {Number(tokenStore.dollar2ICP) * 3}ICP</div>

    </Button>
  </>
  )
}

export default observer(StepCreate)
