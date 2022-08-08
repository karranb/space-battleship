import 'phaser'

import { SCENES } from 'utils/constants'

import AboutUI from './ui'

class AboutScene extends Phaser.Scene {
  private UI?: AboutUI

  constructor() {
    super(SCENES.About)
  }

  init(): void {
    this.UI = new AboutUI(this, {
      handleBackClick: () => this.scene.start(SCENES.Identification),
    })
  }
}

export default AboutScene
