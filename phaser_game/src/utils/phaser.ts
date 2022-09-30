import { SCENES } from './constants'

class BaseScene extends Phaser.Scene {
  clearData() {
    return
  }

  redirect(scene: SCENES, data?: object) {
    this.clearData()
    this.scene.start(scene, data)
  }
}

export default BaseScene
