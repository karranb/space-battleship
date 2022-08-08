import { AboutTemplate, AboutTemplateProps } from './template'
import BaseUIHandler from 'utils/ui'

class AboutUI extends BaseUIHandler {
  public constructor(scene: Phaser.Scene, props: AboutTemplateProps) {
    super(scene)
    this.createTemplate(AboutTemplate as React.FC, props)
  }
}

export default AboutUI
