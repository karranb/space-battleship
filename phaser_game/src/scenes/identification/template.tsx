import 'antd/dist/antd.css'
import { notification } from 'antd'
import cx from 'classnames'
import React, { useEffect, useRef } from 'react'

import mainMenuButton from 'assets/main-menu-button.png'
import { Container } from 'components/container'
import { TextInput } from 'components/input'
import i18next from 'i18n'
import { ErrorTypes } from 'utils/constants'

import styles from './styles.module.css'

export type IdentificationTemplateProps = {
  handleSubmit: (value: string) => void
  defaultName?: string
  showLoading?: boolean
  error?: ErrorTypes
  handleCloseMessage?: () => void
  handleVersusComputerClick: () => void
  handleAboutClick: () => void
}

export const IdentificationTemplate = ({
  defaultName = 'Guest',
  showLoading = false,
  handleSubmit,
  handleCloseMessage,
  handleAboutClick,
  error,
  handleVersusComputerClick,
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
        description: `${i18next.t(
          'You were not able to connect to the server. Check your connection and try to update the game'
        )}`,
        onClose: handleCloseMessage,
      })
    }
  }, [error])
  return (
    <Container className={styles.container}>
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
          className={styles.joinButton}
          onClick={() => handleSubmit(inputRef.current?.value ?? '')}
        >
          <span className={styles.joinButtonText}>{`${i18next.t('MULTIPLAYER')}`}</span>
          <img src={mainMenuButton} className={styles.joinButtonImage} />
        </div>
        <div className={styles.versusComputer} onClick={() => handleVersusComputerClick()}>
          {`${i18next.t('TRAIN')}`}
        </div>
        <div className={styles.versusComputer} onClick={() => handleAboutClick()}>
          {`${i18next.t('ABOUT')}`}
        </div>
      </div>
      <div className={cx(!showLoading && styles.hide)}>
        <p className={styles.connecting}>{`${i18next.t('Connecting')}:...`}</p>
      </div>
    </Container>
  )
}
