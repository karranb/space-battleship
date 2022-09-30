import BaseUIHandler from 'utils/ui'

import { IdentificationTemplate, IdentificationTemplateProps } from './template'

class IdentificationUI extends BaseUIHandler {
  public constructor(scene: Phaser.Scene, props: IdentificationTemplateProps) {
    super(scene)
    this.createTemplate(IdentificationTemplate as React.FC, props)
  }

  submit() {
    const input = document.querySelector('#input') as HTMLInputElement
    const handleSubmit = this.props?.handleSubmit as (message: string) => void
    handleSubmit(input.value)
    input.value = ''
  }
}

export default IdentificationUI
