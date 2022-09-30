import 'phaser'

import backgroundImage from 'assets/background.png'
import backgroundMenu from 'assets/background_menu.png'
import bulletImage from 'assets/bullet.png'
import explosionAtlas from 'assets/explosion_spritesheet.json'
import explosion from 'assets/explosion_spritesheet.png'
import identificationBackground from 'assets/identification_background.png'
import logoImage from 'assets/logo.png'
import multiplayerButton from 'assets/multiplayer_button.png'
import shipSelectBackgroundImage from 'assets/ships-select-background.png'
import blue1Atlas from 'assets/spritesheet_blue_1.json'
import blue1 from 'assets/spritesheet_blue_1.png'
import blue2Atlas from 'assets/spritesheet_blue_2.json'
import blue2 from 'assets/spritesheet_blue_2.png'
import blue3Atlas from 'assets/spritesheet_blue_3.json'
import blue3 from 'assets/spritesheet_blue_3.png'
import red1Atlas from 'assets/spritesheet_red_1.json'
import red1 from 'assets/spritesheet_red_1.png'
import red2Atlas from 'assets/spritesheet_red_2.json'
import red2 from 'assets/spritesheet_red_2.png'
import red3Atlas from 'assets/spritesheet_red_3.json'
import red3 from 'assets/spritesheet_red_3.png'
import targetImage from 'assets/target_cursor.png'
import { SpaceshipsTypes } from 'interfaces/shared'
import { SCENES } from 'utils/constants'

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
    this.load.atlas('explosion', explosion, explosionAtlas)
    this.load.atlas(`${SpaceshipsTypes.FAST}-red`, red3, red3Atlas)
    this.load.atlas(`${SpaceshipsTypes.FAST}-blue`, blue3, blue3Atlas)
    this.load.atlas(`${SpaceshipsTypes.REGULAR}-red`, red1, red1Atlas)
    this.load.atlas(`${SpaceshipsTypes.REGULAR}-blue`, blue1, blue1Atlas)
    this.load.atlas(`${SpaceshipsTypes.SLOW}-red`, red2, red2Atlas)
    this.load.atlas(`${SpaceshipsTypes.SLOW}-blue`, blue2, blue2Atlas)

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
