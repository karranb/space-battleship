import React, { useEffect, useRef } from 'react'
import cx from 'classnames'
import 'antd/dist/antd.css'
import { notification } from 'antd'

import { Container } from 'components/container'
import styles from './styles.module.css'
import { TextInput } from 'components/input'
import { ErrorTypes } from 'utils/constants'

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
        message: 'Disconnect',
        description: 'You disconnected from the server.',
        onClose: handleCloseMessage,
      })
    }

    if (error === ErrorTypes.not_able_to_connect) {
      notification.error({
        message: 'Not able to connect',
        description: 'You were not able to connect to the server.',
        onClose: handleCloseMessage,
      })
    }
  }, [error])
  return (
    <Container className={styles.container}>
      <div>
        <div className={cx(showLoading && styles.hide, styles.formWrapper)}>
          <TextInput
            labelText="Nickname:"
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
        <p className={styles.connecting}>Connecting...</p>
      </div>
    </Container>
  )
}
