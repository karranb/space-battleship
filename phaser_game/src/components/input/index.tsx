import cx from 'classnames'
import React from 'react'

import styles from './styles.module.css'

export type TextInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  className?: string
  labelText?: string
  labelClassName?: string
  inputClassName?: string
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ className, labelText, labelClassName, inputClassName, ...props }, ref) => (
    <div className={cx(styles.container, className)}>
      {labelText && <label className={cx(styles.label, labelClassName)}>{labelText}</label>}
      <input type="text" className={cx(styles.input, inputClassName)} {...props} ref={ref} />
    </div>
  )
)
