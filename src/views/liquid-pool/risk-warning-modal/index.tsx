import { Checkbox, Modal } from 'antd'
import React, { forwardRef, useImperativeHandle, useState } from 'react'
import type { CheckboxChangeEvent } from 'antd/es/checkbox'
import styles from './index.module.less'
import { CenterTitle, CommonButton } from '@/components'

export interface RiskWarningModalRef {
  showModal: () => void
  closeModal: () => void
}

export interface RiskWarningModalProps {
  onAgrees?: () => void
  titleName?: string
  content?: string
  isAlarm: boolean
  customCheck?: boolean
  customCheckText?: string
  buttonName: string
}
const RiskWarningModal = forwardRef<RiskWarningModalRef, RiskWarningModalProps>(({ onAgrees, titleName, content, isAlarm, customCheck, customCheckText, buttonName }, ref) => {
  const [open, setOpen] = useState(false)
  const [checked, setChecked] = useState(false)
  const handleCancel = () => {
    setOpen(false)
  }
  const showModal: RiskWarningModalRef['showModal'] = () => {
    setOpen(true)
  }
  useImperativeHandle(ref, () => ({
    showModal,
    closeModal: handleCancel,
  }))

  const handleChange = (e: CheckboxChangeEvent) => {
    setChecked(e.target.checked)
  }

  const handleContinue = () => {
    if (!checked)
      return
    handleCancel()
    setChecked(false)
    onAgrees && onAgrees()
  }

  return (
    <>
      <Modal width={532} title={<CenterTitle isAlarm={isAlarm}> {titleName} </CenterTitle>} open={open} centered maskClosable={false} footer={false} onCancel={handleCancel}>
        <div className={styles.statement}>
          {content}
        </div>
        {customCheck
          ? (
            <div className={styles.service}>
              <Checkbox checked={checked} onChange={handleChange} /> <span className={styles.servicechecked}>{customCheckText}</span>
            </div>
          )
          : (
            <div className={styles.service}>
              <Checkbox checked={checked} onChange={handleChange} />
              <span className={styles.servicechecked}>I have read, understand and agree to the  <a href="https://docs.icpex.org/legal-and-privacy/terms-of-service" target="_blank" rel="noreferrer">Terms of Service</a>.</span>
            </div>
          )}
        <CommonButton type="primary" size="large" block disabled={!checked} onClick={handleContinue}>{buttonName}</CommonButton>
      </Modal>
    </>
  )
})

RiskWarningModal.displayName = 'RiskWarningModal'

export default RiskWarningModal
