import React from 'react'

import { Container } from 'components/container'
import styles from './styles.module.css'
// import titleImage from 'assets/ships-select-title.png'
import titleBackground from 'assets/title-bg.png'
import spaceshipArrowImage from 'assets/spaceship-select-arrow.png'
import blue1Image from 'assets/blue-1.png'
import red1Image from 'assets/red-1.png'
import levelOnImage from 'assets/level-on.png'
import levelOffImage from 'assets/level-off.png'
import armoryItem1Image from 'assets/armory-item-1.png'
import buttonBackground from 'assets/button-background.png'
import i18next from 'i18n'

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
        <div className={styles.titleContainer}>
          <span>{`${i18next.t('Spaceship & Armory')}`}</span>
          <img src={titleBackground} className={styles.titleBackground} />
        </div>
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
                    <span>XF-43</span>
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
                  <span className={styles.armoryTitle}>
                    <>{i18next.t('ARMORY')}</>
                  </span>
                  <div className={styles.armories}>
                    <img src={armoryItem1Image} className={styles.armory} />
                  </div>
                </div>
              </div>
            </React.Fragment>
          ))}

        <div className={styles.overlay}>
          <div className={styles.dialog}>
            <>
              {i18next.t(
                `There's no other spaceship/armory option available now, please press done to continue`
              )}
            </>
          </div>
        </div>

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
