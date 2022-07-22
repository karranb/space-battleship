import React, { useRef } from 'react'
import cx from 'classnames'

import { Container } from 'components/container'
import styles from './styles.module.css'
import { TextInput } from 'components/input'

export type IdentificationTemplateProps = {
  handleSubmit: (value: string) => void
  defaultName?: string
  showLoading?: boolean
}

export const IdentificationTemplate = ({
  defaultName = 'Guest',
  showLoading = false,
  handleSubmit,
}: IdentificationTemplateProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <Container className={styles.container}>
      <div>
        <div className={cx(showLoading && styles.hide, styles.formWrapper)}>
          <TextInput
            labelText="Nickname:"
            defaultValue={defaultName}
            inputClassName={styles.input}
            ref={inputRef}
            id="input"
            autoComplete="off"
          />
          <div
            className={styles.button}
            onClick={() => handleSubmit(inputRef.current?.value ?? '')}
          ></div>
        </div>
      </div>
      <div className={cx(!showLoading && styles.hide)}>
        <p className={styles.connecting}>Connecting...</p>
      </div>
    </Container>
  )
}
