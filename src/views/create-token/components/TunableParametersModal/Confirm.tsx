import { Button, Checkbox, Modal, Spin } from 'antd'
import React, { useEffect, useMemo, useState } from 'react'
import { Principal } from '@dfinity/principal'
import { observer } from 'mobx-react'
import { ModalType } from './constant'
import styles from './index.module.less'
import { addToken, removeToken, setICRC2Owner, setOwner } from '@/utils/create-token'
import { canisterId as canisterIdBackend } from '@/canisters/icpl_backend'
import { canisterId as icrc2CanisterId, idlFactory as icrc2IdlFactory } from '@/canisters/icrc2_ledger'
import appStore from '@/store/app'
import tokenStore from '@/store/token'
import type { UserToken } from '@/types/token'
import { Notification } from '@/components'
import type { NotificationProps, NotificationType } from '@/components/notification'
import warnImg from '@/assets/warn-red.png'
import { BatchTransact } from "artemis-web3-adapter";
import { artemisWalletAdapter } from "@/utils/wallet/connect.ts";
import Big from 'big.js'
import { formatBigNumberDisplay } from '@/utils/common'

const ConfirmModal: React.FC<{
  type: number | null
  addValue: string
  baseData?: UserToken
  isSneed: boolean
  onCancel: () => void
}> = ({ type, baseData, addValue, isSneed, onCancel }) => {
  const [loading, setLoading] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [notificationType, setNotificationType] = useState<NotificationType>('loading')
  const [notificationConfig, setNotificationConfig] = useState<NotificationProps['config']>()
  const [checked, setChecked] = useState(true)

  useEffect(() => {
    const isAdd = type === ModalType.ADD
    if (type === ModalType.REMOVE)
      setChecked(false)
    else
      setChecked(true)
    if (!type)
      return
    setNotificationConfig({
      loading: { message: isAdd ? 'Tokens are issuing...' : 'Token ownership relinquishing...' },
      success: { message: isAdd ? 'Tokens issued successful' : 'Token ownership relinquished successful', action: onCancel },
      error: { message: isAdd ? 'Tokens issued failed' : 'Token ownership relinquished failed', action: onCancel },
      info: { message: isAdd ? '' : 'You need to check Sure first' },
    })
  }, [type])

  const dataInfo = useMemo(() => {
    return type === ModalType.ADD
      ? {
        title: <div className={styles.title}>Confirm the additiona lissuance of the token?</div>,
        content: (<>

          <div>Additional tokens issued: {addValue}</div>
          {
            baseData
              ? <div>The total supply after the issuance: {formatBigNumberDisplay(baseData.totalSupply.plus(Big(addValue)))}</div>
              : null
          }
        </>),
      }
      : {
        title: <div>
          <div className={styles['warn-img']} style={{ backgroundImage: `url(${warnImg})` }} />
          <div className={styles.title}>Are you sure you want to relinquish</div>
          <div className={styles.title}>ownership of this token?</div>
        </div>,
        content: (isSneed ? <div>You can relinquish ownership of the tokens by transferring control of the token canister to <span style={{ color: 'red' }}>Sneed DAO(fp274-iaaaa-aaaaq-aacha-cai)</span>. Once confirmed, this change is irreversible.</div> : <div>You can relinquish ownership of the tokens by transferring control of the token canister to the <span style={{ color: 'red' }}>Black Hole(aaaaa-aa)</span>. Once confirmed, this change is irreversible.</div>),
      }
  }, [type, addValue, baseData])

  const onAddToken = async () => {
    if (!baseData)
      return
    const { decimals, owner, canisterId } = baseData

    setLoading(true)

    try {
      await addToken(Principal.fromText(canisterId), Principal.fromText(owner), BigInt(Number(addValue) * 10 ** decimals))

      setNotificationType('success')
    }
    catch (err) {
      setNotificationType('error')
      throw err
    }
    finally {
      setLoading(false)
      onCancel?.()
    }
  }
  const onAdd = async () => {
    const platToken = appStore.platToken
    if (!platToken)
      return

    setNotificationType('loading')
    setNotificationOpen(true)

    try {
      setLoading(true)

      const amount = tokenStore.dollar2ICP ? Math.ceil(Number(tokenStore.dollar2ICP) * (10 ** 8) * 1.1) : 10
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
            onAddToken()
          },
          onFail: (err: any) => {
            console.error('plug error:', err)
            setLoading(false)
            setNotificationType('error')
          },
        } as any,
      ], artemisWalletAdapter).execute()
    } catch (err) {
      setLoading(false)
      setNotificationType('error')
      throw err
    }
  }

  const onRemove = async () => {
    if (!baseData)
      return
    setNotificationType('loading')
    setNotificationOpen(true)
    if (!checked) {
      setNotificationOpen(false)
      return
    }

    try {
      setLoading(true)
      const amount = Math.ceil(Number(tokenStore.dollar2ICP) * (10 ** 8) * 1.1)
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
          },
          onFail: (err: any) => {
            console.error('error:', err)
            setLoading(false)
            setNotificationType('error')
          },
        } as any,
      ], artemisWalletAdapter).execute()
      if (isSneed) {
        await removeToken(Principal.fromText(baseData.canisterId), [Principal.fromText('fp274-iaaaa-aaaaq-aacha-cai')])
      } else {
        await removeToken(Principal.fromText(baseData.canisterId), [])
      }

      console.log('remove success')
      try {
        if (baseData?.protocol === 'ICRC-2') {
          setNotificationType('success')
        } else {
          await setOwner(baseData.canisterId)
          setNotificationType('success')
        }
      } catch (err) {
        console.log('set owner:', err)
      }
    }
    catch (err) {
      setNotificationType('error')
      throw err
    }
    finally {
      setLoading(false)
      onCancel?.()
    }
  }

  const handleCancel = () => {
    onCancel?.()
  }

  const handleOk = async () => {
    if (type === ModalType.ADD) {
      onAdd()
      return
    }
    console.log('onRemove');

    onRemove()
  }

  const handleCheckboxChange = () => {
    if (checked === true)
      setChecked(false)
    else
      setChecked(true)
  }



  return (
    <>
      {notificationConfig && <Notification open={notificationOpen} type={notificationType} config={notificationConfig} />}
      <Modal width={680} title={dataInfo?.title} open={Boolean(type)} centered maskClosable={false} footer={false} onCancel={handleCancel}>
        <Spin spinning={loading}>
          <div className={styles.body}>
            <div className={styles['confirm-content']}>
              {dataInfo?.content}
            </div>

            <div className={styles.supply}>
              <span>Service Fee</span>
              <span>{tokenStore.dollar2ICP} ICP</span>
            </div>

            {
              type === ModalType.REMOVE
              && <div className={styles['checkbox-box']}>
                <Checkbox.Group onChange={handleCheckboxChange} value={[checked]}>
                  <Checkbox value className={styles.checkbox}>Yes, I am sure</Checkbox>
                </Checkbox.Group>
              </div>
            }

            <div className={styles['confirm-footer']}>
              <Button className={styles.ok} disabled={!checked} onClick={handleOk}>Confirm</Button>
            </div>
          </div>
        </Spin>
      </Modal>
    </>
  )
}

export default observer(ConfirmModal)
