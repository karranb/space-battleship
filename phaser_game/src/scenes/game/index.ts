import 'phaser'

import { HEIGHT, SCENES, WIDTH } from 'utils/constants'

import Player from 'models/player'
import SingleBullet from 'models/weapons/single-bullet'
import BaseSpaceship from 'models/spaceships/base'

import { Socket } from 'socket.io-client'
import GameSocketHandler from './socket'
import { Commands, MAX_ROUNDS } from 'interfaces/shared'
import GameUI, { ResultTypes } from './ui'

class Game extends Phaser.Scene {
  UI?: GameUI
  players: Player[] = []
  bullets: SingleBullet[] = []
  bulletColliders: Phaser.Physics.Arcade.Collider[] = []
  spaceships: BaseSpaceship[] = []
  state: 'STOPPED' | 'MOVING' | 'WAITING' = 'STOPPED'
  finalOverlap = undefined
  rounds = 0
  challenger?: string
  challenged?: string
  choices?: unknown
  socketHandler?: GameSocketHandler
  challengedName?: string
  challengerName?: string
  returnKey?: Phaser.Input.Keyboard.Key
  timer?: Phaser.GameObjects.Text

  constructor() {
    super(SCENES.Game)
  }

  clear() {
    this.players = []
    this.bullets = []
    this.bulletColliders = []
    this.spaceships = []
    this.state = 'STOPPED'
    this.finalOverlap = undefined
    this.rounds = 0
    this.challenger = undefined
    this.challenged = undefined
    this.choices = undefined
    this.challengedName = undefined
    this.challengerName = undefined
    this.timer = undefined
  }

  init(data: {
    webSocketClient: Socket
    enemy: string
    challenger: string
    challenged: string
    challengerName: string
    challengedName: string
    choices: unknown
  }): void {
    this.socketHandler = new GameSocketHandler(data.webSocketClient)
    const isChallenger = this.socketHandler?.isMe(data.challenger)
    this.challenger = data.challenger
    this.challenged = data.challenged
    this.challengerName = data.challengerName
    this.challengedName = data.challengedName
    this.choices = data.choices

    this.returnKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)

    this.returnKey?.on('down', () => {
      this.UI?.sendMessage()
    })

    const handleSubmitReady = () => {
      this.socketHandler?.sendPlayerReady()
      this.UI?.setisWaitingOponent(true)
      this.players.forEach(player => {
        player.setIsEditable(false)
      })
    }

    this.UI = new GameUI(this, {
      isChallenger,
      challengedName: data.challengedName,
      challengerName: data.challengerName,
      messages: [],
      handleSubmitMessage: (message: string) => this.socketHandler?.sendPrivateMessage(message),
      handleSubmitReady: () => handleSubmitReady(),
    })
  }

  getPlayer(socketId: string): Player | undefined {
    return this.players.find(player => player.getSocketId() === socketId)
  }

  addExplosion(x: number, y: number) {
    this.anims.create({
      key: 'explosion-animation',
      frames: this.anims.generateFrameNames('explosion'),
      repeat: 0,
    })
    const explosion = this.add.sprite(x, y, 'explosion')
    explosion.setScale(0.5)
    explosion.play('explosion-animation')
    explosion.once('animationcomplete', () => {
      explosion.destroy()
    })
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

  createTimer(): void {
    if (this.timer) {
      return
    }

    this.timer = this.add.text(550, 20, '30', {
      color: '#fff',
      font: '16px neuropol',
    })

    const interval = this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (this.timer && Number(this.timer.text) > 0) {
          this.timer?.setText(`${Number(this.timer.text) - 1}`)
        } else {
          interval.remove()
        }
      },
      loop: true,
    })
  }

  create(): void {
    this.anims.create({
      key: 'spaceship1-red-moving',
      frames: this.anims.generateFrameNames('spaceship1-red').slice(0, -1),
      frameRate: 20,
      repeat: -1,
    })

    this.anims.create({
      key: 'spaceship1-red-stopped',
      frames: this.anims.generateFrameNames('spaceship1-red').slice(-1),
    })

    this.anims.create({
      key: 'spaceship1-blue-moving',
      frames: this.anims.generateFrameNames('spaceship1-blue').slice(0, -1),
      frameRate: 20,
      repeat: -1,
    })

    this.anims.create({
      key: 'spaceship1-blue-stopped',
      frames: this.anims.generateFrameNames('spaceship1-blue').slice(-1),
    })

    const background = this.add.image(WIDTH / 2, HEIGHT / 2, 'shipSelectBackgroundImage')
    background.setScale(0.5)

    this.createTimer()

    const onSpaceshipClick: (player: Player) => (spaceship: BaseSpaceship) => void = (
      player: Player
    ) => {
      return player.createReachableArea
    }

    const handlePrivateMessage = (value: string) => {
      const { id, message } = JSON.parse(value)
      const name = this.challenger === id ? this.challengerName : this.challengedName
      this.UI?.addMessage({ message: message, name })
    }

    const handleCommandProcessed = (value: string) => {
      const handleSetTarget = (message: string) => {
        const { x, y, spaceship: spaceshipId } = JSON.parse(message)
        const player = this.getPlayer(this.socketHandler?.getWebSocketClient().id ?? '')
        const spaceship = player?.getSpaceships().find(sp => sp.getId() === spaceshipId)
        if (spaceship) {
          const targetSprite = this.add.sprite(x, y, 'target')
          player?.setSpaceshipTarget(spaceship, x, y, targetSprite)
        }
      }

      const handleSetDestination = (message: string) => {
        const { x, y, spaceship: spaceshipId } = JSON.parse(message)
        const player = this.getPlayer(this.socketHandler?.getWebSocketClient().id ?? '')
        const spaceship = player?.getSpaceships().find(sp => sp.getId() === spaceshipId)
        if (spaceship) {
          player?.setSpaceshipDestination(spaceship, x, y)
        }
      }

      const { command, ...message } = JSON.parse(value)
      if (command === Commands.SET_SPACESHIP_TARGET) {
        handleSetTarget(JSON.stringify(message))
        return
      }
      if (command === Commands.SET_SPACESHIP_DESTINATION) {
        handleSetDestination(JSON.stringify(message))
        return
      }
    }

    const handleSetPlayerReady = (message: string) => {
      const choices = JSON.parse(message) as Record<
        string,
        Record<string, { destination: { x: number; y: number }; target: { x: number; y: number } }>
      >
      Object.entries(choices).forEach(([socketId, spaceshipsChoices]) => {
        if (this.timer) {
          this.timer.destroy()
          this.timer = undefined
        }
        const player = this.players.find(p => p.getSocketId() === socketId)
        Object.entries(spaceshipsChoices).forEach(([spaceshipId, spaceshipChoices]) => {
          const { x: destinationX, y: destinationY } = spaceshipChoices.destination ?? {}
          const { x: targetX, y: targetY } = spaceshipChoices.target ?? {}
          const spaceship = player
            ?.getSpaceships()
            .find(spaceship => spaceship.getId() === Number(spaceshipId))
          if (spaceship && destinationX !== undefined && destinationY !== undefined) {
            player?.setSpaceshipDestination(spaceship, destinationX, destinationY)
          }
          if (spaceship && targetX !== undefined && targetY !== undefined) {
            player?.setSpaceshipTarget(spaceship, targetX, targetY)
          }
        })
      })
      this.startRound()
    }

    const handleRoundStarted = () => {
      this.players.forEach(player => {
        player.setIsEditable(true)
      })
      this.UI?.setisWaitingOponent(false)
      this.createTimer()
    }

    const handleCloseGame = (message: string) => {
      const { reason } = JSON.parse(message) as { reason: string }
      if (
        !this.socketHandler?.isMe(reason) &&
        [this.challenged, this.challenger].includes(reason)
      ) {
        this.UI?.setBadge(ResultTypes.victory)
      }

      this.time.addEvent({
        delay: 3000,
        callback: () => {
          this.clear()
          this.scene.start(SCENES.Room, {
            webSocketClient: this.socketHandler?.getWebSocketClient(),
          })
        },
      })
    }

    const handleDisconnect = () => {
      this.scene.start(SCENES.Identification)
    }

    this.socketHandler?.createGameSocketHandler({
      handleCommandProcessed,
      handleSetPlayerReady,
      handlePrivateMessage,
      handleCloseGame,
      handleRoundStarted,
      handleDisconnect,
    })

    const onTargetClick: (
      spaceship: BaseSpaceship,
      x: number,
      y: number,
      targetSprite: Phaser.GameObjects.Sprite
    ) => void = (spaceship: BaseSpaceship, x: number, y: number) => {
      this.socketHandler?.sendSetTarget(spaceship.getId() ?? -1, x, y)
    }

    const onReachableAreaClick: (spaceship: BaseSpaceship, x: number, y: number) => void = (
      spaceship: BaseSpaceship,
      x: number,
      y: number
    ) => {
      this.socketHandler?.sendSetDestination(spaceship.getId() ?? -1, x, y)
    }

    this.players.push(
      new Player(
        this,
        !!this.socketHandler?.isMe(this.challenger ?? ''),
        'TOP',
        this.challenger ?? '',
        onTargetClick,
        onReachableAreaClick,
        onSpaceshipClick
      )
    )
    this.players.push(
      new Player(
        this,
        !!this.socketHandler?.isMe(this.challenged ?? ''),
        'BOTTOM',
        this.challenged ?? '',
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
            this.checkHasEnded()
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
  }

  checkHasEnded(): void {
    const looser = this.players.filter(player => !player.getSpaceships().length)
    if (looser.length || this.rounds === MAX_ROUNDS) {
      if (looser.length === 1) {
        if (this.socketHandler?.isMe(looser[0].getSocketId())) {
          this.UI?.setBadge(ResultTypes.defeat)
        } else {
          this.UI?.setBadge(ResultTypes.victory)
        }
      } else if (looser.length === 2 || this.rounds === MAX_ROUNDS) {
        this.UI?.setBadge(ResultTypes.draw)
      }
      this.socketHandler?.sendClose()
    }
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
    this.socketHandler?.sendRoundStarted()
    this.checkHasEnded()
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
