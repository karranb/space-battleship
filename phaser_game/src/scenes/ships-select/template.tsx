import cx from 'classnames'
import React from 'react'

import armoryItem1Image from 'assets/armory-item-1.png'
import blue2Image from 'assets/blue-1.png'
import blue3Image from 'assets/blue-2.png'
import blue1Image from 'assets/blue-3.png'
import buttonBackground from 'assets/button-background.png'
import levelOffImage from 'assets/level-off.png'
import levelOnImage from 'assets/level-on.png'
import red2Image from 'assets/red-1.png'
import red3Image from 'assets/red-2.png'
import red1Image from 'assets/red-3.png'
import spaceshipArrowImage from 'assets/spaceship-select-arrow.png'
import titleBackground from 'assets/title-bg.png'
import { Container } from 'components/container'
import i18next from 'i18n'

import styles from './styles.module.css'

export type ShipsSelectTemplateProps = {
  handleSubmit: () => void
  handleGiveUp: () => void
  isChallenger?: boolean
  waitingOponent?: boolean
  timer: number
  spaceships: Record<string, number>
  onSpaceshipChange: (index: string, value: number) => void
}

export const ShipsSelectTemplate = ({
  isChallenger,
  waitingOponent,
  handleGiveUp,
  handleSubmit,
  timer,
  spaceships,
  onSpaceshipChange,
}: ShipsSelectTemplateProps) => {
  return (
    <Container className={styles.container}>
      <>
        <div className={styles.titleContainer}>
          <span>{`${i18next.t('Spaceship & Armory')}`}</span>
          <img src={titleBackground} className={styles.titleBackground} />
        </div>
        {!!timer && (
          <span className={styles.timer} id="timer">
            {timer}
          </span>
        )}
        {Array(3)
          .fill(null)
          .map((_, i) => {
            const spaceship =
              spaceships[i] === 0
                ? {
                    name: 'Fast',
                    speed: 5,
                    shield: 1,
                    redImage: red1Image,
                    blueImage: blue1Image,
                  }
                : spaceships[i] === 1
                ? {
                    name: 'Regular',
                    speed: 3,
                    shield: 3,
                    redImage: red2Image,
                    blueImage: blue2Image,
                  }
                : {
                    name: 'Slow',
                    speed: 1,
                    shield: 5,
                    redImage: red3Image,
                    blueImage: blue3Image,
                  }
            return (
              <React.Fragment key={`row-${i}`}>
                <div className={styles.row}>
                  <div className={styles.shipSelect}>
                    <img
                      src={spaceshipArrowImage}
                      className={cx(styles.leftArrow, spaceships[i] === 0 && styles.disabledArrow)}
                      onClick={() => onSpaceshipChange(`${i}`, spaceships[i] - 1)}
                    />
                    <div className={styles.frame}>
                      <img
                        src={isChallenger ? spaceship.redImage : spaceship.blueImage}
                        className={styles.spaceship}
                      />
                    </div>
                    <img
                      src={spaceshipArrowImage}
                      className={cx(styles.rightArrow, spaceships[i] === 2 && styles.disabledArrow)}
                      onClick={() => onSpaceshipChange(`${i}`, spaceships[i] + 1)}
                    />
                  </div>
                  <div className={styles.shipDetail}>
                    <div className={styles.keys}>
                      <span>
                        <>{i18next.t('Name')}:</>
                      </span>
                      <span>
                        <>{i18next.t('Speed')}:</>
                      </span>
                      <span>
                        <>{i18next.t('Shield')}:</>
                      </span>
                    </div>
                    <div className={styles.values}>
                      <span>{spaceship.name}</span>
                      <div className={styles.levelWrapper}>
                        {Array(spaceship.speed)
                          .fill(null)
                          .map((_, j) => (
                            <img
                              key={`speed-on-${j}`}
                              src={levelOnImage}
                              className={styles.level}
                            />
                          ))}
                        {Array(5 - spaceship.speed)
                          .fill(null)
                          .map((_, j) => (
                            <img
                              key={`speed-off-${j}`}
                              src={levelOffImage}
                              className={styles.level}
                            />
                          ))}
                      </div>
                      <div className={styles.levelWrapper}>
                        {Array(spaceship.shield)
                          .fill(null)
                          .map((_, j) => (
                            <img
                              key={`shield-on-${j}`}
                              src={levelOnImage}
                              className={styles.level}
                            />
                          ))}
                        {Array(5 - spaceship.shield)
                          .fill(null)
                          .map((_, j) => (
                            <img
                              key={`shield-off-${j}`}
                              src={levelOffImage}
                              className={styles.level}
                            />
                          ))}
                      </div>
                    </div>
                  </div>
                  <div className={styles.armoryWrapper}>
                    <span className={styles.armoryTitle}>
                      <>{i18next.t('ARMORY')}</>
                    </span>
                    <div className={styles.armories}>
                      <img src={armoryItem1Image} className={styles.armory} />
                    </div>
                  </div>
                </div>
              </React.Fragment>
            )
          })}

        <div className={styles.footer}>
          <div className={styles.giveUpButton} id="giveUpButton" onClick={handleGiveUp}>
            <>{i18next.t('GIVE UP')}</>
            <img className={styles.giveUpButtonImage} src={buttonBackground} />
          </div>

          {!waitingOponent ? (
            <div className={styles.doneButton} id="doneButton" onClick={handleSubmit}>
              <>{i18next.t('DONE')}</>
              <img src={buttonBackground} className={styles.doneButtonImage} />
            </div>
          ) : (
            <span className={styles.waitingOponent}>
              <>{i18next.t('WAITING OPONENT')}</>
            </span>
          )}
        </div>
      </>
    </Container>
  )
}
