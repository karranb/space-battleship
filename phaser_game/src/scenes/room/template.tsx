import React, { useCallback, useEffect, useRef, useState } from 'react'
import cx from 'classnames'

import buttonBackground from 'assets/button-background.png'
import tab from 'assets/tab.png'

import { Container } from 'components/container'
import { TextInput } from 'components/input'
import i18next from 'i18n'

import styles from './styles.module.css'
import debounce from 'lodash/debounce'
import { notification } from 'antd'

export enum MessageType {
  USER = 'USER',
  QUITTED = 'QUITTED',
  JOINED = 'JOINED',
  CHALLENGER = 'CHALLENGER',
  CHALLENGED = 'CHALLENGED',
  ERROR = 'ERROR',
  IS_PLAYING = 'IS_PLAYING',
  IS_BACK_FROM_GAME = 'IS_BACK_FROM_GAME',
}

export type Message = {
  message?: string
  type: MessageType
  name?: string
  id?: string
  time?: number
  inactiveReason?: string
}

export type RoomTemplateProps = {
  users: Record<string, { name: string; isPlaying: boolean }>
  messages: Message[]
  handleSubmitMessage: (message?: string) => void
  handleSubmitChallenge: (userId?: string) => void
  handleRefuseChallengeClick?: (challengeId: string) => void
  handleAcceptChallengeClick?: (challengeId: string) => void
  handleCloseChallengeClick?: (challengeId: string) => void
  handleCloseMessage: () => void
  reason?: string
}

const debounceOptions = { leading: true, trailing: false }
const debounceTime = 300

export const RoomTemplate = ({
  users = {},
  messages = [],
  handleSubmitMessage,
  handleSubmitChallenge,
  handleRefuseChallengeClick,
  handleAcceptChallengeClick,
  handleCloseChallengeClick,
  reason,
  handleCloseMessage,
}: RoomTemplateProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedUser, setSelectedUser] = useState<string | undefined>(undefined)

  const debouncedChallengeClick = useCallback(
    debounce(() => handleSubmitChallenge(selectedUser), debounceTime, debounceOptions),
    [selectedUser]
  )

  const debounceSendMessageClick = useCallback(
    debounce(
      () => {
        handleSubmitMessage(inputRef.current?.value)
        if (inputRef.current) {
          inputRef.current.value = ''
        }
      },
      debounceTime,
      debounceOptions
    ),
    []
  )

  useEffect(() => {
    if (reason === 'ENEMY_GAVE_UP') {
      notification.info({
        message: `${i18next.t('Enemy gave up')}`,
        description: `${i18next.t('Your enemy gave up.')}`,
        onClose: handleCloseMessage,
      })
    }
  }, [reason])

  return (
    <Container className={styles.container}>
      <div className={styles.topPanelsWrapper}>
        <div className={styles.leftColumn}>
          <div className={styles.usersWrapper}>
            <div className={styles.tabContainer}>
              <span className={styles.tabText}>{`${i18next.t('Users')}`}</span>
              <img src={tab} className={styles.tab} />
            </div>
            <div className={styles.users}>
              {Object.entries(users).map(([id, user]) => (
                <div
                  key={id}
                  className={cx(styles.user, selectedUser === id && styles.userSelected)}
                  onClick={() => setSelectedUser(id)}
                >
                  {user.name}
                  {user.isPlaying ? ` - (${i18next.t('in a game')})` : null}
                </div>
              ))}
            </div>
          </div>
          <div className={styles.sendChallengeButton} onClick={debouncedChallengeClick}>
            <>{i18next.t('CHALLENGE')}</>
            <img src={buttonBackground} className={styles.buttonImage} />
          </div>
        </div>
        <div className={styles.rightColumn}>
          <div className={styles.tabContainer}>
            <span className={styles.tabText}>{`${i18next.t('Messages')}`}</span>
            <img src={tab} className={styles.tab} />
          </div>

          <div className={styles.messages} id="messages">
            {messages.map((message, i) => (
              <span className={styles.message} key={`message-${i}`}>
                {message.type === MessageType.JOINED ? (
                  <>
                    <span className={styles.messageName}>{message.name}</span>{' '}
                    {i18next.t('joined =)')}
                  </>
                ) : message.type === MessageType.QUITTED ? (
                  <>
                    <span className={styles.messageName}>{message.name}</span>{' '}
                    {i18next.t('quited =(')}
                  </>
                ) : message.type === MessageType.USER ? (
                  <>
                    <span className={styles.messageName}>{message.name}:</span> {message.message}
                  </>
                ) : message.type === MessageType.ERROR ? (
                  message.message
                ) : message.type === MessageType.CHALLENGED ? (
                  <>
                    {i18next.t('The user')}{' '}
                    <span className={styles.messageName}>{`${message.name} `}</span>
                    {i18next.t('challenged you')} -{' '}
                    {message.inactiveReason ? (
                      message.inactiveReason
                    ) : (
                      <>
                        <span
                          className={styles.challengeButton}
                          onClick={() => handleAcceptChallengeClick?.(message.id ?? '')}
                        >
                          <>{i18next.t('Accept')}</>
                        </span>{' '}
                        |{' '}
                        <span
                          className={styles.challengeButton}
                          onClick={() => handleRefuseChallengeClick?.(message.id ?? '')}
                        >
                          <>{i18next.t('Refuse')}</>
                        </span>{' '}
                        - {message.time}
                      </>
                    )}
                  </>
                ) : message.type === MessageType.CHALLENGER ? (
                  <>
                    {i18next.t('You challenged')}{' '}
                    <span className={styles.messageName}>{message.name}:</span> -{' '}
                    {message.inactiveReason ? (
                      message.inactiveReason
                    ) : (
                      <>
                        <span
                          className={styles.challengeButton}
                          onClick={() => handleCloseChallengeClick?.(message.id ?? '')}
                        >
                          <>{i18next.t('Cancel')}</>
                        </span>{' '}
                        - {message.time}
                      </>
                    )}
                  </>
                ) : message.type === MessageType.IS_PLAYING ? (
                  <>
                    <span className={styles.messageName}>
                      <>
                        {message.name} {i18next.t('entered a game')}
                      </>
                    </span>
                  </>
                ) : message.type === MessageType.IS_BACK_FROM_GAME ? (
                  <>
                    <span className={styles.messageName}>
                      <>
                        {message.name} {i18next.t('is back from the game')}
                      </>
                    </span>
                  </>
                ) : null}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className={styles.messageWrapper}>
        <TextInput
          placeholder={i18next.t('Enter your message')}
          autoComplete="off"
          ref={inputRef}
          className={styles.input}
          id="input"
        />
        <div className={styles.messageButton} onClick={debounceSendMessageClick}>
          <>{i18next.t('SEND')}</>
          <img src={buttonBackground} className={styles.buttonImage} />
        </div>
      </div>
    </Container>
  )
}
