import React from 'react'
import cx from 'classnames'

import { HEIGHT, WIDTH } from 'utils/constants'
import styles from './styles.module.css'

type ContainerProps = {
  children: JSX.Element | JSX.Element[]
  className?: string
}

export const Container = ({ children, className }: ContainerProps) => (
  <div
    style={{
      width: WIDTH,
      height: HEIGHT,
    }}
    className={cx(styles.container, className)}
  >
    {children}
  </div>
)
