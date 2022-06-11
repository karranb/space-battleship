import 'phaser'
import { Socket } from 'socket.io-client'
import { SCENES } from 'utils/constants'
import spaceshipImage from 'assets/blue-still.png'
import Fasty from 'models/spaceships/fasty'
import BaseSpaceship from 'models/spaceships/base'

class ShipsSelect extends Phaser.Scene {
  private elements: BaseSpaceship[] = []
  private texts: Phaser.GameObjects.Text[] = []
  private challenger?: boolean
  private webSocketClient?: Socket
  private enemy?: string

  constructor() {
    super(SCENES.ShipsSelect)
  }

  preload(): void {
    this.load.image('spaceship', spaceshipImage)
  }

  init(data: { webSocketClient: Socket; enemy: string; challenger: boolean }): void {
    this.webSocketClient = data.webSocketClient
    this.enemy = data.enemy
    this.challenger = data.challenger
  }

  create(): void {
    this.texts.push(
      this.add.text(10, 10, 'Select the spaceship 1', {
        font: '16px Courier',
        color: 'white',
      })
    )

    this.elements.push(new Fasty({ scene: this, x: 70, y: 70, angle: 90, texture: 'spaceship' }))
    this.add.text(30, 110, 'Name: Fasty', { font: '12px Courier', color: 'white' })
    this.add.text(30, 130, 'Shield: 400', { font: '12px Courier', color: 'white' })
    this.add.text(30, 150, 'Speed: 1000', { font: '12px Courier', color: 'white' })

    this.elements.push(new Fasty({ scene: this, x: 210, y: 70, angle: 90, texture: 'spaceship' }))
    this.add.text(160, 110, 'Name: Averagy', { font: '12px Courier', color: 'white' })
    this.add.text(160, 130, 'Shield: 700', { font: '12px Courier', color: 'white' })
    this.add.text(160, 150, 'Speed: 700', { font: '12px Courier', color: 'white' })

    this.elements.push(new Fasty({ scene: this, x: 350, y: 70, angle: 90, texture: 'spaceship' }))
    this.add.text(310, 110, 'Name: Slowy', { font: '12px Courier', color: 'white' })
    this.add.text(310, 130, 'Shield: 1000', { font: '12px Courier', color: 'white' })
    this.add.text(310, 150, 'Speed: 400', { font: '12px Courier', color: 'white' })

    this.add.text(10, 200, 'Select the spaceship 1 weapon', {
      font: '16px Courier',
      color: 'white',
    })
    this.add.text(10, 220, 'Select the spaceship 2', {
      font: '16px Courier',
      color: 'white',
    })
    this.add.text(10, 240, 'Select the spaceship 2 weapon', {
      font: '16px Courier',
      color: 'white',
    })

    this.add.text(10, 260, 'Select the spaceship 3', {
      font: '16px Courier',
      color: 'white',
    })
    this.add.text(10, 280, 'Select the spaceship 3 weapon', {
      font: '16px Courier',
      color: 'white',
    })
    this.add
      .text(740, 340, 'START', {
        font: '16px Courier',
        color: 'green',
      })
      .setInteractive()
      .on('pointerdown', () => {
        this.children.destroy()
        this.scene.launch(SCENES.Game, {
          webSocketClient: this.webSocketClient,
          enemy: this.enemy,
          challenger: this.challenger,
        })
      })
  }

  update(): void {
    this.elements.forEach(element => (element.rotation += 0.02))
  }
}

export default ShipsSelect
