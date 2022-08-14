import React, { useCallback, useEffect, useRef, useState } from 'react'
import cx from 'classnames'

import buttonBackground from 'assets/button-background.png'
import tab from 'assets/tab.png'

import { Container } from 'components/container'
import { TextInput } from 'components/input'
import i18next from 'i18n'

import styles from './styles.module.css'
import debounce from 'lodash/debounce'
import { Dropdown, Menu, Modal, notification } from 'antd'
import { MenuOutlined, CloseOutlined, DownOutlined } from '@ant-design/icons'
import { COUNTRIES } from 'utils/constants'

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
  users: Record<string, { name: string; isPlaying: boolean; countryCode: string }>
  messages: Message[]
  handleSubmitMessage: (message?: string) => void
  handleSubmitChallenge: (userId?: string) => void
  handleRefuseChallengeClick?: (challengeId: string) => void
  handleAcceptChallengeClick?: (challengeId: string) => void
  handleCloseChallengeClick?: (challengeId: string) => void
  handleGoBack?: () => void
  handleCloseMessage: () => void
  handleUpdateFlag: (countryCode: string) => void
  reason?: string
  countryCode: string
}

const debounceOptions = { leading: true, trailing: false }
const debounceTime = 300

export const RoomTemplate = ({
  countryCode,
  users = {},
  messages = [],
  handleSubmitMessage,
  handleSubmitChallenge,
  handleRefuseChallengeClick,
  handleAcceptChallengeClick,
  handleCloseChallengeClick,
  handleUpdateFlag,
  handleGoBack,
  reason,
  handleCloseMessage,
}: RoomTemplateProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedUser, setSelectedUser] = useState<string | undefined>(undefined)

  const debouncedChallengeClick = useCallback(
    debounce(() => handleSubmitChallenge(selectedUser), debounceTime, debounceOptions),
    [selectedUser]
  )

  const country = COUNTRIES[countryCode?.toUpperCase() ?? '']

  const menu = (
    <Menu
      selectable
      className={styles.menu}
      onClick={countryCode => handleUpdateFlag(countryCode.key)}
      items={Object.entries(COUNTRIES)
        .map(([code, { name, image }]) => ({
          label: name,
          key: code,
          icon: <img width="15px" src={image} />,
        }))
        .sort((a: { label: string }, b: { label: string }) =>
          a.label < b.label ? -1 : a.label > b.label ? 1 : 0
        )}
    />
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

  const [isModalVisible, setIsModalVisible] = useState(false)
  const modalMaskStyle = { background: 'rgba(0,0,0,0.7)' }
  const modalBodyStyle = {
    background: '#112123',
    color: '#b2f1e8',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontFamily: 'neuropol',
  } as React.CSSProperties
  return (
    <Container className={styles.container}>
      <MenuOutlined className={styles.menu} onClick={() => setIsModalVisible(true)} />
      <Modal
        title={null}
        footer={null}
        visible={isModalVisible}
        mask
        maskStyle={modalMaskStyle}
        closeIcon={
          <CloseOutlined
            style={{
              color: '#b2f1e8',
            }}
            className={styles.closeIcon}
            onClick={() => setIsModalVisible(false)}
          />
        }
        bodyStyle={modalBodyStyle}
      >
        <span className={styles.modalTitle}>{`${i18next.t('SETTINGS')}`}</span>
        <Dropdown className={styles.dropdown} overlay={menu} trigger={['click']}>
          <div className={styles.dropdownContentWrapper}>
            <span className={styles.dropdownLabel}>{`${i18next.t('CHANGE FLAG')}`}:</span>
            {country ? (
              <img width="15px" src={country.image} className={styles.dropdownContent} />
            ) : null}
            <span className={styles.dropdownContent}>{country.name}</span>
            <DownOutlined className={styles.dropdownContent} />
          </div>
        </Dropdown>
        <span
          onClick={() => {
            setIsModalVisible(false)
            handleGoBack?.()
          }}
          className={styles.modalButton}
        >{`${i18next.t('BACK TO MAIN MENU')}`}</span>
      </Modal>
      <div className={styles.topPanelsWrapper}>
        <div className={styles.leftColumn}>
          <div className={styles.usersWrapper}>
            <div className={styles.tabContainer}>
              <span className={styles.tabText}>{`${i18next.t('Users')}`}</span>
              <img src={tab} className={styles.tab} />
            </div>
            <div className={styles.users}>
              {Object.entries(users).map(([id, user]) => {
                const imgUrl = user.countryCode ? COUNTRIES[user.countryCode].image : ''

                return (
                  <div
                    key={id}
                    className={cx(styles.user, selectedUser === id && styles.userSelected)}
                    onClick={() => setSelectedUser(id)}
                  >
                    {imgUrl ? <img src={imgUrl} className={styles.flag} /> : null}
                    {user.name}
                    {user.isPlaying ? ` - (${i18next.t('in a game')})` : null}
                  </div>
                )
              })}
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
