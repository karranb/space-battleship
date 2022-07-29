import React, { useCallback, useRef, useState } from 'react'
import cx from 'classnames'

import sendButton from 'assets/send_button.png'
import challengeButton from 'assets/challenge_button.png'
import usersTab from 'assets/users_tab.png'
import messagesTab from 'assets/messages_tab.png'

import { Container } from 'components/container'
import { TextInput } from 'components/input'

import styles from './styles.module.css'
import debounce from 'lodash/debounce'

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

  return (
    <Container className={styles.container}>
      <div className={styles.topPanelsWrapper}>
        <div className={styles.leftColumn}>
          <div className={styles.usersWrapper}>
            <img src={usersTab} className={styles.panelTitle} />
            <div className={styles.users}>
              {Object.entries(users).map(([id, user]) => (
                <div
                  key={id}
                  className={cx(styles.user, selectedUser === id && styles.userSelected)}
                  onClick={() => setSelectedUser(id)}
                >
                  {user.name}
                  {user.isPlaying ? ' - (in a game)' : null}
                </div>
              ))}
            </div>
          </div>
          <img
            src={challengeButton}
            className={styles.challengeButton}
            onClick={debouncedChallengeClick}
          />
        </div>
        <div className={styles.rightColumn}>
          <img src={messagesTab} className={styles.panelTitle} />
          <div className={styles.messages} id="messages">
            {messages.map((message, i) => (
              <span className={styles.message} key={`message-${i}`}>
                {message.type === MessageType.JOINED ? (
                  <>
                    <span className={styles.messageName}>{message.name}</span> joined =)
                  </>
                ) : message.type === MessageType.QUITTED ? (
                  <>
                    <span className={styles.messageName}>{message.name}</span> quited =(
                  </>
                ) : message.type === MessageType.USER ? (
                  <>
                    <span className={styles.messageName}>{message.name}:</span> {message.message}
                  </>
                ) : message.type === MessageType.ERROR ? (
                  message.message
                ) : message.type === MessageType.CHALLENGED ? (
                  <>
                    The user <span className={styles.messageName}>{message.name}</span> challenged
                    you -{' '}
                    {message.inactiveReason ? (
                      message.inactiveReason
                    ) : (
                      <>
                        <span
                          className={styles.challengeButton}
                          onClick={() => handleAcceptChallengeClick?.(message.id ?? '')}
                        >
                          Accept
                        </span>{' '}
                        |{' '}
                        <span
                          className={styles.challengeButton}
                          onClick={() => handleRefuseChallengeClick?.(message.id ?? '')}
                        >
                          Refuse
                        </span>{' '}
                        - {message.time}
                      </>
                    )}
                  </>
                ) : message.type === MessageType.CHALLENGER ? (
                  <>
                    You challenged <span className={styles.messageName}>{message.name}:</span> -{' '}
                    {message.inactiveReason ? (
                      message.inactiveReason
                    ) : (
                      <>
                        <span
                          className={styles.challengeButton}
                          onClick={() => handleCloseChallengeClick?.(message.id ?? '')}
                        >
                          Cancel
                        </span>{' '}
                        - {message.time}
                      </>
                    )}
                  </>
                ) : message.type === MessageType.IS_PLAYING ? (
                  <>
                    <span className={styles.messageName}>{message.name} entered a game</span>
                  </>
                ) : message.type === MessageType.IS_BACK_FROM_GAME ? (
                  <>
                    <span className={styles.messageName}>{message.name} is back from the game</span>
                  </>
                ) : null}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className={styles.messageWrapper}>
        <TextInput
          placeholder="Enter your message"
          autoComplete="off"
          ref={inputRef}
          className={styles.input}
          id="input"
        />
        <img src={sendButton} className={styles.messageButton} onClick={debounceSendMessageClick} />
      </div>
    </Container>
  )
}
