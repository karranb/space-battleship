import 'phaser'

import { SCENES } from 'utils/constants'
import targetImage from 'assets/target_cursor.png'
import bulletImage from 'assets/bullet.png'
import backgroundImage from 'assets/background.png'
import identificationBackground from 'assets/identification_background.png'
import multiplayerButton from 'assets/multiplayer_button.png'
import red1 from 'assets/spritesheet_red_1.png'
import red1Atlas from 'assets/spritesheet_red_1.json'
import explosion from 'assets/explosion_spritesheet.png'
import explosionAtlas from 'assets/explosion_spritesheet.json'
import backgroundMenu from 'assets/background_menu.png'

import blue1 from 'assets/spritesheet_blue_1.png'
import blue1Atlas from 'assets/spritesheet_blue_1.json'
import shipSelectBackgroundImage from 'assets/ships-select-background.png'


import logoImage from 'assets/logo.png'

class Boot extends Phaser.Scene {
  constructor() {
    super(SCENES.Boot)
  }

  preload(): void {
    this.add.text(370, 175, 'Loading...')

    this.load.image('target', targetImage)
    this.load.image('bullet', bulletImage)
    this.load.image('backgroundImage', backgroundImage)
    this.load.image('backgroundMenu', backgroundMenu)
    this.load.image('shipSelectBackgroundImage', shipSelectBackgroundImage)
    this.load.image('identificationBackground', identificationBackground)
    this.load.image('multiplayerButton', multiplayerButton)
    this.load.atlas('spaceship1-red', red1, red1Atlas)
    this.load.atlas('explosion', explosion, explosionAtlas)
    this.load.atlas('spaceship1-blue', blue1, blue1Atlas)
    this.scale.lockOrientation(`${Phaser.Scale.Orientation.LANDSCAPE}`)
    this.load.image('logo', logoImage)

    this.load.on('complete', () => {
      this.children.destroy()
      this.scene.start(SCENES.Identification, {})
      // this.scene.start(SCENES.Game, {})
    })
  }
}

export default Boot
