import React, { useCallback, useRef } from 'react'

import { TextInput } from 'components/input'
import { HEIGHT, WIDTH } from 'utils/constants'
import buttonBackground from 'assets/button-background.png'
import spaceshipArrowImage from 'assets/spaceship-select-arrow.png'

import styles from './styles.module.css'
import debounce from 'lodash/debounce'
import i18next from 'i18n'
import { ResultTypes } from './ui'

import victoryBadge from 'assets/victory_badge2.png'
import notVictoryBadge from 'assets/not_victory_badge.png'

export type Message = {
  name?: string
  message?: string
}

export type GameTemplateProps = {
  challengerName: string
  challengedName: string
  isChallenger: boolean
  messages: Message[]
  isWaitingOponent?: boolean
  badge?: ResultTypes
  handleSubmitMessage?: (message: string) => void
  handleSubmitReady?: () => void
}

const domWidth = 220

export const GameTemplate = ({
  isChallenger,
  challengerName,
  challengedName,
  isWaitingOponent,
  badge,
  messages,
  handleSubmitMessage,
  handleSubmitReady,
}: GameTemplateProps) => {
  const inputRef = useRef<HTMLInputElement>(null)

  const debounceSendMessageClick = useCallback(
    debounce(
      () => {
        handleSubmitMessage?.(inputRef.current?.value ?? '')
        if (inputRef.current) {
          inputRef.current.value = ''
        }
      },
      300,
      { leading: true, trailing: false }
    ),
    []
  )

  const isNotVictoryBadge = badge ? [ResultTypes.defeat, ResultTypes.draw].includes(badge) : false

  const badgeText =
    badge === ResultTypes.victory
      ? i18next.t('VICTORY')
      : badge === ResultTypes.defeat
      ? i18next.t('DEFEAT')
      : i18next.t('DRAW')

  return (
    <>
      <div
        className={styles.rightPanel}
        style={{ left: `${WIDTH - domWidth}px`, width: `${domWidth}px`, height: `${HEIGHT}px` }}
      >
        <div className={styles.boxWrapper}>
          <div className={styles.challengerBox}>
            <span>{isChallenger ? <>{i18next.t('You')}</> : challengerName}</span>
          </div>

          <div className={styles.challengedBox}>
            <span>{isChallenger ? challengedName : <>{i18next.t('You')}</>}</span>
          </div>
        </div>

        <div className={styles.separator} />

        <p className={styles.tutorial}>
          <>1. {i18next.t('Click on one of your spaceships')}</>
          <br />
          <>2. {i18next.t('Select a destination inside the reachable area')}</>
          <br />
          <>3. {i18next.t('Click on a place to shoot')}</>
          <br />
          <>4. {i18next.t('Repeat steps 1-3 to the other spaceships')}</>
          <br />
          <>5. {i18next.t('Press Done')}</>
        </p>
        {!isWaitingOponent ? (
          <div className={styles.doneButton} onClick={() => handleSubmitReady?.()}>
            <>{i18next.t('DONE')}</>
            <img src={buttonBackground} className={styles.buttonBackground} />
          </div>
        ) : (
          <span className={styles.waiting}>
            <>{i18next.t('WAITING OPONENT')}</>
          </span>
        )}

        <div className={styles.separator} />
        <div className={styles.chat} id="messages">
          {messages.map((message, i) => (
            <span className={styles.message} key={`message-${i}`}>
              <span className={styles.messageName}>{message.name}:</span> {message.message}
            </span>
          ))}
        </div>
        <div className={styles.inputWrapper}>
          <TextInput
            className={styles.inputContainer}
            inputClassName={styles.input}
            ref={inputRef}
            id="input"
            autoComplete="off"
          />
          <img
            src={spaceshipArrowImage}
            className={styles.submit}
            onClick={debounceSendMessageClick}
          />
        </div>
      </div>
      {badge && (
        <div
          className={styles.badgeContainer}
          style={{ width: `${WIDTH}px`, height: `${HEIGHT}px` }}
        >
          <span
            className={isNotVictoryBadge ? styles.notVictoryBadgeText : styles.victoryBadgeText}
          >
            {badgeText}
          </span>
          <img src={isNotVictoryBadge ? notVictoryBadge : victoryBadge} className={styles.badge} />
        </div>
      )}
    </>
  )
}
