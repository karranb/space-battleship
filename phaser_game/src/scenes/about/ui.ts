import BaseUIHandler from 'utils/ui'

import { AboutTemplate, AboutTemplateProps } from './template'

class AboutUI extends BaseUIHandler {
  public constructor(scene: Phaser.Scene, props: AboutTemplateProps) {
    super(scene)
    this.createTemplate(AboutTemplate as React.FC, props)
  }
}

export default AboutUI
