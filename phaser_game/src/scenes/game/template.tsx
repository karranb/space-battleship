import React, { useRef } from 'react'

import { TextInput } from 'components/input'
import { HEIGHT, WIDTH } from 'utils/constants'
import buttonBackground from 'assets/button-background.png'
import spaceshipArrowImage from 'assets/spaceship-select-arrow.png'

import styles from './styles.module.css'

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
  badge?: string
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
  return (
    <>
      <div
        className={styles.rightPanel}
        style={{ left: `${WIDTH - domWidth}px`, width: `${domWidth}px`, height: `${HEIGHT}px` }}
      >
        <div className={styles.boxWrapper}>
          <div className={styles.challengerBox}>
            <span>{isChallenger ? 'You' : challengerName}</span>
          </div>

          <div className={styles.challengedBox}>
            <span>{isChallenger ? challengedName : 'You'}</span>
          </div>
        </div>

        <div className={styles.separator} />

        <span className={styles.tutorial}>
          1. Click on one of your spaceships
          <br />
          2. Select a destination inside the reachable area
          <br />
          3. Click on a place to shoot
          <br />
          4. Repeat steps 1-3 to the other spaceships
          <br />
          5. Press Done
        </span>
        {!isWaitingOponent ? (
          <div className={styles.doneButton} onClick={() => handleSubmitReady?.()}>
            DONE
            <img src={buttonBackground} className={styles.buttonBackground} />
          </div>
        ) : (
          <span className={styles.waiting}>WAITING OPONENT</span>
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
          />
          <img
            src={spaceshipArrowImage}
            className={styles.submit}
            onClick={() => {
              handleSubmitMessage?.(inputRef.current?.value ?? '')
              if (inputRef.current) {
                inputRef.current.value = ''
              }
            }}
          />
        </div>
      </div>
      {badge && (
        <div
          className={styles.badgeContainer}
          style={{ width: `${WIDTH}px`, height: `${HEIGHT}px` }}
        >
          <img src={badge} className={styles.badge} />
        </div>
      )}
    </>
  )
}
