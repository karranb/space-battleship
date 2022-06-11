import 'phaser'

import { SCENES } from 'utils/constants'
import spaceshipImage from 'assets/blue-still.png'
import targetImage from 'assets/target-cursor.png'
import bulletImage from 'assets/bullet.png'

import Player from 'models/player'
import SingleBullet from 'models/weapons/single-bullet'
import BaseSpaceship from 'models/spaceships/base'

import GameDOMHandler from './dom'
import { Socket } from 'socket.io-client'
import { Commands } from 'shared'

class Game extends Phaser.Scene {
  private webSocketClient?: Socket
  private enemy?: string
  gameHandler: GameDOMHandler | undefined
  players: Player[] = []
  bullets: SingleBullet[] = []
  bulletColliders: Phaser.Physics.Arcade.Collider[] = []
  spaceships: BaseSpaceship[] = []
  state: 'STOPPED' | 'MOVING' = 'STOPPED'
  finalOverlap = undefined
  rounds = 0
  challenger?: boolean

  constructor() {
    super(SCENES.Game)
  }

  preload(): void {
    this.load.image('spaceship', spaceshipImage)
    this.load.image('target', targetImage)
    this.load.image('bullet', bulletImage)
  }

  init(data: { webSocketClient: Socket; enemy: string; challenger: boolean }): void {
    this.gameHandler = new GameDOMHandler(this)
    this.webSocketClient = data.webSocketClient
    this.enemy = data.enemy
    this.challenger = data.challenger
  }

  startRound(): void {
    this.state = 'MOVING'
    this.rounds += 1
    this.bullets = this.spaceships.reduce((acc, spaceship) => {
      const bullet = spaceship.shoot()
      return bullet ? [...acc, bullet] : acc
    }, [] as SingleBullet[])

    this.spaceships.forEach(spaceship => {
      this.bullets
        .filter(bullet => bullet.getOwner() !== spaceship)
        .forEach(bullet => {
          const collider = this.physics.add.overlap(spaceship, bullet, () => {
            spaceship.setDamage(bullet.getDamage())
            bullet.destroy()
          })
          this.bulletColliders.push(collider)
        })
    })
    this.players.forEach(player => player.startRound())
  }

  create(): void {
    this.add
      .text(700, 10, 'START')
      .setInteractive()
      .on('pointerdown', () => {
        if (this.state === 'STOPPED') {
          this.webSocketClient?.emit(Commands.SET_PLAYER_READY)
        }
      })

    const onSpaceshipClick: (player: Player) => (spaceship: BaseSpaceship) => void = (
      player: Player
    ) => {
      return player.createReachableArea
    }

    const onTargetClick: (
      player: Player
    ) => (
      spaceship: BaseSpaceship,
      x: number,
      y: number,
      targetSprite: Phaser.GameObjects.Sprite
    ) => void =
      (player: Player) =>
      (spaceship: BaseSpaceship, x: number, y: number, targetSprite: Phaser.GameObjects.Sprite) => {
        this.webSocketClient?.emit(
          Commands.SET_SPACESHIP_TARGET,
          JSON.stringify({ spaceship: spaceship.getId(), x, y })
        )
        return player.setSpaceshipTarget(spaceship, x, y, targetSprite)
      }

    const onReachableAreaClick: (
      player: Player
    ) => (spaceship: BaseSpaceship, x: number, y: number) => void =
      (player: Player) => (spaceship: BaseSpaceship, x: number, y: number) => {
        this.webSocketClient?.emit(
          Commands.SET_SPACESHIP_DESTINATION,
          JSON.stringify({ spaceship: spaceship.getId(), x, y })
        )
        return player.setSpaceshipDestination(spaceship, x, y)
      }

    this.players.push(
      new Player(
        this,
        !!this.challenger,
        'TOP',
        onTargetClick,
        onReachableAreaClick,
        onSpaceshipClick
      )
    )
    this.players.push(
      new Player(
        this,
        !this.challenger,
        'BOTTOM',
        onTargetClick,
        onReachableAreaClick,
        onSpaceshipClick
      )
    )

    this.spaceships = this.players.reduce(
      (acc, player) => [...acc, ...player.getSpaceships()],
      [] as BaseSpaceship[]
    )

    for (let i = 0; i < this.spaceships.length - 1; i++) {
      for (let j = i + 1; j < this.spaceships.length; j++) {
        let contactInterval: Phaser.Time.TimerEvent | undefined

        this.physics.add.overlap(this.spaceships[i], this.spaceships[j], (object1, object2) => {
          const spaceship1 = object1 as BaseSpaceship
          const spaceship2 = object2 as BaseSpaceship
          if (this.state === 'STOPPED') {
            spaceship1.destroy()
            spaceship2.destroy()
            return
          }
          if (contactInterval) {
            return
          }
          spaceship1.setDamage(75)
          spaceship2.setDamage(75)
          contactInterval = this.time.addEvent({
            delay: 300,
            callback: () => {
              contactInterval = undefined
            },
          })
        })
      }
    }

    this.webSocketClient?.on(Commands.SET_SPACESHIP_DESTINATION, message => {
      console.log(message)
    })

    this.webSocketClient?.on(Commands.SET_SPACESHIP_TARGET, message => {
      console.log(message)
    })

    this.webSocketClient?.on(Commands.SET_PLAYER_READY, message => {
      const coordinates = JSON.parse(message)
      const enemy = this.players.find(player => !player.getIsMe())
      Object.entries(coordinates).forEach(([key, values]) => {
        const [id, command] = key.split('-')
        const { x, y } = values as { x: number; y: number }
        const spaceship = enemy?.getSpaceships().find(spaceship => spaceship.getId() === Number(id))
        if (command === 'destination' && spaceship) {
          enemy?.setSpaceshipDestination(spaceship, x, y)
        }
        if (command === 'target' && spaceship) {
          enemy?.setSpaceshipTarget(spaceship, x, y)
        }
      })
      this.startRound()
    })
  }

  finishRound(): void {
    this.state = 'STOPPED'
    this.bulletColliders.forEach(collider => {
      collider.destroy()
    })
    this.bulletColliders = []

    this.players.forEach(player => {
      player.finishRound()
    })

    this.bullets = []
    this.spaceships = this.spaceships.filter(spaceship => spaceship.state !== 'DESTROYED')

    const looser = this.players.filter(player => !player.getSpaceships().length)

    if (looser.length || this.rounds === 10) {
      this.children.destroy()
      return
    }
  }

  update(): void {
    this.players.forEach(player => player.update())
    this.bullets.forEach(bullet => bullet.update())
    if (
      this.state === 'MOVING' &&
      this.spaceships.every(spaceship => spaceship.state !== 'MOVING') &&
      this.bullets.every(bullet => bullet.getIsDestroyed())
    ) {
      this.finishRound()
    }
  }
}

export default Game
