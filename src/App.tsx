import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import React, { useEffect, useState } from 'react'
import { observer } from 'mobx-react'
import type { Locale } from 'antd/es/locale'
import enUS from 'antd/locale/en_US'
import dayjs from 'dayjs'
import { Guide } from './views'
import appStore from './store/app'
import { AppStoreProvider, Empty, Layout } from '@/components'

dayjs.locale('en')

const App = () => {
  const [locale] = useState<Locale>(enUS)
  useEffect(() => {
    appStore.setPlatToken()
  }, [])

  return (
    <ConfigProvider
      locale={ locale }
      theme={{
        token: {
          fontFamily: '"Nunito Sans"',
          colorPrimary: '#5d52de',
          colorBgElevated: '#1f2946',
          colorBgSpotlight: '#324377',
          colorFillAlter: '#fff',
          colorTextHeading: 'rgba(255, 255,255, 1)',
          colorText: '#8b9ac9',
          borderRadius: 8,
          colorTextTertiary: 'rgba(139,154,201,0.65)',
          colorTextQuaternary: 'rgba(139,154,201,0.45)',
        },
        components: {
          Button: {
            fontWeight: 600,
            controlHeightLG: 48,
            controlHeightSM: 32,
            controlHeightXS: 24,
            controlHeight: 40,
            fontSize: 16,
            colorPrimaryHover: '#fff',
            colorPrimaryBorderHover: 'transparent',
            colorBgContainer: '#1f2946',
            colorPrimary: '#8572ff',
            colorBgContainerDisabled: '#1f2946',
            colorBorder: '#1f2946',
            colorTextDisabled: '#8b9ac9',
          },
          Input: {
            colorBgContainer: '#1f2946',
            colorBorder: '#1f2946',
            colorPrimaryHover: '#1f2946',
            colorTextPlaceholder: 'rgba(139,154,201,0.65)', // holder
            controlOutline: 'rgba(139,154,201,0.65)',
            paddingXXS: 8, // prefix margin-inline-end
          },
          Radio: {
            colorBgContainer: 'transparent',
            colorBorder: 'rgba(139,154,201,1)',
            radioSize: 12,
          },
          Modal: {
            colorBgElevated: '#121935',
            titleFontSize: 24,
          },
          Tooltip: {
            fontSize: 12,
          },
          Spin: {
            colorBgContainer: 'transparent',
          },
          Dropdown: {
            controlItemBgHover: '#303c60',
            controlItemBgActive: '#303c60',
            controlItemBgActiveHover: '#303c60',
          },
          Alert: {
            fontSizeHeading3: 14,
            colorText: '#bca442',
            colorWarning: '#bca442',
            colorWarningBg: 'rgba(89,80,43,0.25)',
            colorWarningBorder: '#59502b',
            paddingContentHorizontalLG: 12,
          },
          Table: {
            colorBgContainer: '#121935',
            colorFillAlter: '#1f2946', // tr hover cell color
            colorTextHeading: '#8b9ac9', // header text color
            padding: 12,
          },
          Pagination:{
            screenSM: 300
          }
        },
      }}
      renderEmpty={ () => <Empty /> }
      >
      <AppStoreProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={ <Guide /> } />
            <Route path="*" element={ <Layout /> } />
          </Routes>

        </BrowserRouter>
      </AppStoreProvider>
    </ConfigProvider>
  )
}

export default observer(App)
