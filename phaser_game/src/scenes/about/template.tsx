import React from 'react'
import 'antd/dist/antd.css'

import { Container } from 'components/container'
import i18next from 'i18n'
import styles from './styles.module.css'

import buttonBackground from 'assets/button-background.png'

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
      </p>
      <div className={styles.messageButton} onClick={handleBackClick}>
        <>{i18next.t('BACK')}</>
        <img src={buttonBackground} className={styles.buttonImage} />
      </div>
    </Container>
  )
}
