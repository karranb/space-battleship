import 'antd/dist/antd.css'
import React from 'react'

import buttonBackground from 'assets/button-background.png'
import { Container } from 'components/container'
import i18next from 'i18n'

import styles from './styles.module.css'

export type AboutTemplateProps = {
  handleBackClick: () => void
}

export const AboutTemplate = ({ handleBackClick }: AboutTemplateProps) => {
  return (
    <Container className={styles.container}>
      <p>
        {`${i18next.t('Game developed by Karran.')}`}
        <br />
        {`${i18next.t('Suggestions / Bugs can be sent to karranrb@gmail.com')}`}
        <br />
        {`${i18next.t('Theme Music: "A few jumps away" by Arthur Vyncke')}`}
        <br />
        {`${i18next.t('Assets: ')}`}
        <a href="https://craftpix.net/product/asteroids-crusher-2d-game-kit/?num=2&count=65&sq=space&pos=1">
          CraftPix
        </a>
      </p>
      <div className={styles.messageButton} onClick={handleBackClick}>
        <>{i18next.t('BACK')}</>
        <img src={buttonBackground} className={styles.buttonImage} />
      </div>
    </Container>
  )
}
