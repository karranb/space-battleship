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
import { Tooltip } from 'antd'
import { TooltipPlacement } from 'antd/lib/tooltip'
import GameSocketHandler from './socket'

export type Message = {
  name?: string
  message?: string
}

export type ToolTipProps = {
  x: number
  y: number
  placement?: TooltipPlacement
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
  spaceshipClickTooltip?: ToolTipProps
  reachableAreaTooltip?: ToolTipProps
  targetTooltip?: ToolTipProps
  repeatTooltip?: ToolTipProps
  socketHandler?: GameSocketHandler
  handleGiveUpClick?: () => void
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
  spaceshipClickTooltip,
  reachableAreaTooltip,
  targetTooltip,
  repeatTooltip,
  socketHandler,
  handleGiveUpClick,
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
      {spaceshipClickTooltip && (
        <Tooltip
          placement={spaceshipClickTooltip?.placement ?? 'top'}
          title={<span>{`${i18next.t('Click on one of your spaceships')}`}</span>}
          visible={!!spaceshipClickTooltip}
          color="blue"
        >
          <div
            style={{
              position: 'absolute',
              left: `${spaceshipClickTooltip?.x}px`,
              top: `${spaceshipClickTooltip?.y}px`,
            }}
          />
        </Tooltip>
      )}

      {reachableAreaTooltip && (
        <Tooltip
          placement={reachableAreaTooltip?.placement ?? 'top'}
          title={<span>{`${i18next.t('Click where you want to move the spaceship to')}`}</span>}
          visible={!!reachableAreaTooltip}
          color="blue"
        >
          <div
            style={{
              position: 'absolute',
              left: `${reachableAreaTooltip?.x}px`,
              top: `${reachableAreaTooltip?.y}px`,
            }}
          />
        </Tooltip>
      )}

      {targetTooltip && (
        <Tooltip
          placement={targetTooltip?.placement ?? 'top'}
          title={<span>{`${i18next.t('Click where you want your spaceship to shoot at')}`}</span>}
          visible={!!targetTooltip}
          color="blue"
        >
          <div
            style={{
              position: 'absolute',
              left: `${targetTooltip?.x}px`,
              top: `${targetTooltip?.y}px`,
            }}
          />
        </Tooltip>
      )}

      {repeatTooltip && (
        <Tooltip
          placement={repeatTooltip?.placement ?? 'top'}
          title={
            <span>{`${i18next.t(
              'Repeat the process with the other spaceships and press DONE'
            )}`}</span>
          }
          visible={!!repeatTooltip}
          color="blue"
        >
          <div
            style={{
              position: 'absolute',
              left: `${repeatTooltip?.x}px`,
              top: `${repeatTooltip?.y}px`,
            }}
          />
        </Tooltip>
      )}

      <div
        className={styles.rightPanel}
        style={{ left: `${WIDTH - domWidth}px`, width: `${domWidth}px`, height: `${HEIGHT}px` }}
      >
        <div className={styles.giveUpButton} onClick={() => handleGiveUpClick?.()}>
          <>X{' - '}{i18next.t('GIVE UP')}</>
          <img src={buttonBackground} className={styles.buttonBackground} />
        </div>
        <div className={styles.boxWrapper}>
          <div className={styles.challengerBox}>
            <span>{isChallenger ? <>{i18next.t('You')}</> : challengerName}</span>
          </div>

          <div className={styles.challengedBox}>
            <span>{isChallenger ? challengedName : <>{i18next.t('You')}</>}</span>
          </div>
        </div>

        <div className={styles.separator} />

        {/* <p className={styles.tutorial}>
          <>1. {i18next.t('Click on one of your spaceships')}</>
          <br />
          <>2. {i18next.t('Select a destination inside the reachable area')}</>
          <br />
          <>3. {i18next.t('Click on a place to shoot')}</>
          <br />
          <>4. {i18next.t('Repeat steps 1-3 to the other spaceships')}</>
          <br />
          <>5. {i18next.t('Press Done')}</>
        </p> */}
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

        {socketHandler && (
          <>
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
            </div>{' '}
          </>
        )}
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
