import React, { useEffect, useRef } from 'react'
import cx from 'classnames'
import 'antd/dist/antd.css'
import { notification } from 'antd'

import { Container } from 'components/container'
import { TextInput } from 'components/input'
import { ErrorTypes } from 'utils/constants'
import i18next from 'i18n'

import styles from './styles.module.css'

export type IdentificationTemplateProps = {
  handleSubmit: (value: string) => void
  defaultName?: string
  showLoading?: boolean
  error?: ErrorTypes
  handleCloseMessage?: () => void
}

export const IdentificationTemplate = ({
  defaultName = 'Guest',
  showLoading = false,
  handleSubmit,
  handleCloseMessage,
  error,
}: IdentificationTemplateProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (error === ErrorTypes.disconnected) {
      notification.error({
        message: `${i18next.t('Disconnected')}`,
        description: `${i18next.t('You disconnected from the server.')}`,
        onClose: handleCloseMessage,
      })
    }

    if (error === ErrorTypes.not_able_to_connect) {
      notification.error({
        message: `${i18next.t('Not able to connect')}`,
        description: `${'You were not able to connect to the server.'}`,
        onClose: handleCloseMessage,
      })
    }
  }, [error])
  return (
    <Container className={styles.container}>
      <div>
        <div className={cx(showLoading && styles.hide, styles.formWrapper)}>
          <TextInput
            labelText={`${i18next.t('Nickname')}:`}
            defaultValue={defaultName}
            inputClassName={styles.input}
            ref={inputRef}
            id="input"
            autoComplete="off"
          />
          <div
            className={styles.button}
            onClick={() => handleSubmit(inputRef.current?.value ?? '')}
          ></div>
        </div>
      </div>
      <div className={cx(!showLoading && styles.hide)}>
        <p className={styles.connecting}>{`${i18next.t('Connecting')}:...`}</p>
      </div>
    </Container>
  )
}
