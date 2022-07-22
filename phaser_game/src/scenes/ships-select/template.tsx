import React from 'react'

import { Container } from 'components/container'
import styles from './styles.module.css'
import titleImage from 'assets/ships-select-title.png'
import spaceshipArrowImage from 'assets/spaceship-select-arrow.png'
import blue1Image from 'assets/blue-1.png'
import red1Image from 'assets/red-1.png'
import levelOnImage from 'assets/level-on.png'
import levelOffImage from 'assets/level-off.png'
import armoryItem1Image from 'assets/armory-item-1.png'
import buttonBackground from 'assets/button-background.png'

export type ShipsSelectTemplateProps = {
  handleSubmit: () => void
  handleGiveUp: () => void
  isChallenger?: boolean
  waitingOponent?: boolean
  timer: number
}

export const ShipsSelectTemplate = ({
  isChallenger,
  waitingOponent,
  handleGiveUp,
  handleSubmit,
  timer,
}: ShipsSelectTemplateProps) => {
  return (
    <Container className={styles.container}>
      <>
        <img src={titleImage} className={styles.title} />
        <span className={styles.timer} id="timer">
          {timer}
        </span>
        {Array(3)
          .fill(null)
          .map((_, i) => (
            <React.Fragment key={`row-${i}`}>
              <div className={styles.row}>
                <div className={styles.shipSelect}>
                  <img src={spaceshipArrowImage} className={styles.leftArrow} />
                  <div className={styles.frame}>
                    <img src={isChallenger ? red1Image : blue1Image} className={styles.spaceship} />
                  </div>
                  <img src={spaceshipArrowImage} className={styles.rightArrow} />
                </div>
                <div className={styles.shipDetail}>
                  <div className={styles.keys}>
                    <span>Name:</span>
                    <span>Speed:</span>
                    <span>Shield:</span>
                  </div>
                  <div className={styles.values}>
                    <span>Spaceship 1</span>
                    <div className={styles.levelWrapper}>
                      <img src={levelOnImage} className={styles.level} />
                      <img src={levelOnImage} className={styles.level} />
                      <img src={levelOnImage} className={styles.level} />
                      <img src={levelOffImage} className={styles.level} />
                      <img src={levelOffImage} className={styles.level} />
                    </div>
                    <div className={styles.levelWrapper}>
                      <img src={levelOnImage} className={styles.level} />
                      <img src={levelOnImage} className={styles.level} />
                      <img src={levelOnImage} className={styles.level} />
                      <img src={levelOffImage} className={styles.level} />
                      <img src={levelOffImage} className={styles.level} />
                    </div>
                  </div>
                </div>
                <div className={styles.armoryWrapper}>
                  <span className={styles.armoryTitle}>ARMORY</span>
                  <div className={styles.armories}>
                    <img src={armoryItem1Image} className={styles.armory} />
                  </div>
                </div>
              </div>
            </React.Fragment>
          ))}

        <div className={styles.overlay}>
          <div className={styles.dialog}>
            There's no other spaceship/armory option available now, please press done to continue
          </div>
        </div>

        <div className={styles.footer}>
          <div className={styles.giveUpButton} id="giveUpButton" onClick={handleGiveUp}>
            GIVE UP
            <img className={styles.giveUpButtonImage} src={buttonBackground} />
          </div>

          {!waitingOponent ? (
            <div className={styles.doneButton} id="doneButton" onClick={handleSubmit}>
              DONE
              <img src={buttonBackground} className={styles.doneButtonImage} />
            </div>
          ) : (
            <span className={styles.waitingOponent}>WAITING OPONENT</span>
          )}
        </div>
      </>
    </Container>
  )
}
