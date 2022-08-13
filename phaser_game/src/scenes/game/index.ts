import 'phaser'

import { ErrorTypes, HEIGHT, SCENES, WIDTH } from 'utils/constants'

import Player from 'models/player'
import SingleBullet from 'models/weapons/single-bullet'
import BaseSpaceship from 'models/spaceships/base'

import { Socket } from 'socket.io-client'
import GameSocketHandler from './socket'
import { Commands, MAX_ROUNDS, SpaceshipsTypes, WeaponTypes } from 'interfaces/shared'
import GameUI, { ResultTypes } from './ui'
import debounce from 'lodash/debounce'
import { getRandomItem } from 'utils/array'
import { randomNumber } from 'utils/number'
import { polygonIntersects } from 'utils/collision'

const GAME_ENDED = 'GAME_ENDED'

export type SpaceshipChoice = {
  spaceship: SpaceshipsTypes
  weapon: WeaponTypes
}
export type PlayerChoices = Record<'0' | '1' | '2', SpaceshipChoice>
export type Choices = { challenger: PlayerChoices; challenged: PlayerChoices }

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
  choices?: Choices
  socketHandler?: GameSocketHandler
  challengedName?: string
  challengerName?: string
  returnKey?: Phaser.Input.Keyboard.Key
  timer?: Phaser.GameObjects.Text
  isChallenger?: boolean

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
    webSocketClient?: Socket
    enemy: string
    challenger?: string
    challenged?: string
    challengerName: string
    challengedName: string
    choices: Choices
    isChallenger?: boolean
  }): void {
    if (data.webSocketClient && data.challenged && data.challenger) {
      this.socketHandler = new GameSocketHandler(data.webSocketClient)
      this.isChallenger = this.socketHandler?.isMe(data.challenger)
      this.challenger = data.challenger
      this.challenged = data.challenged
      this.challengerName = data.challengerName
      this.challengedName = data.challengedName
      this.choices = data.choices

      this.returnKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)

      this.returnKey?.on(
        'down',
        debounce(
          () => {
            this.UI?.sendMessage()
          },
          300,
          { leading: true, trailing: false }
        )
      )

      const handleSubmitReady = () => {
        this.socketHandler?.sendPlayerReady()
        this.UI?.setisWaitingOponent(true)
        this.UI?.updateProps({
          spaceshipClickTooltip: undefined,
          reachableAreaTooltip: undefined,
          targetTooltip: undefined,
          repeatTooltip: undefined,
        })
        this.players.forEach(player => {
          player.setIsEditable(false)
        })
      }

      this.UI = new GameUI(this, {
        isChallenger: this.isChallenger,
        challengedName: data.challengedName,
        challengerName: data.challengerName,
        messages: [],
        handleSubmitMessage: (message: string) => this.socketHandler?.sendPrivateMessage(message),
        handleSubmitReady: () => handleSubmitReady(),
        handleGiveUpClick: () => {
          this.UI?.updateProps({
            spaceshipClickTooltip: undefined,
            reachableAreaTooltip: undefined,
            targetTooltip: undefined,
            repeatTooltip: undefined,
            badge: ResultTypes.defeat,
          })
          this.time.addEvent({
            delay: 3000,
            callback: () => {
              this.clear()
              this.scene.start(SCENES.Room, {
                webSocketClient: this.socketHandler?.getWebSocketClient(),
              })
            },
          })
          this.socketHandler?.sendGiveUp()
        },
        socketHandler: this.socketHandler,
        spaceshipClickTooltip: localStorage.getItem('tutorialDone')
          ? undefined
          : this.isChallenger
          ? { x: 140, y: 85, placement: 'right' }
          : { x: WIDTH - 140 - 220, y: HEIGHT - 100, placement: 'left' },
      })
      localStorage.setItem('tutorialDone', 'done')
    } else {
      this.isChallenger = data.isChallenger
      this.challengerName = data.challengerName
      this.challengedName = data.challengedName
      this.choices = data.choices
      this.UI = new GameUI(this, {
        isChallenger: !!data.isChallenger,
        challengedName: data.challengedName,
        challengerName: data.challengerName,
        messages: [],
        handleGiveUpClick: () => {
          this.clear()
          this.UI?.updateProps({
            spaceshipClickTooltip: undefined,
            reachableAreaTooltip: undefined,
            targetTooltip: undefined,
            repeatTooltip: undefined,
          })
          this.scene.start(SCENES.Identification)
        },
        handleSubmitReady: () => {
          this.UI?.updateProps({
            spaceshipClickTooltip: undefined,
            reachableAreaTooltip: undefined,
            targetTooltip: undefined,
            repeatTooltip: undefined,
          })
          this.setIAPlay()
        },
        spaceshipClickTooltip: this.isChallenger
          ? { x: 140, y: 85, placement: 'right' }
          : { x: WIDTH - 140 - 220, y: HEIGHT - 100, placement: 'left' },
      })
    }
  }

  setIAPlay() {
    this.UI?.setisWaitingOponent(true)
    const player = this.players.find(player => !player.getIsMe())
    if (!player) {
      return
    }
    const enemy = this.getMePlayer()
    const enemySpaceships = enemy?.getSpaceships() ?? []
    const spaceships = player?.getSpaceships() ?? []
    const polygons: {
      x: number
      y: number
    }[][] = spaceships.map(spaceship => [
      { x: spaceship.x + 15, y: spaceship.y + 15 },
      { x: spaceship.x - 15, y: spaceship.y - 15 },
      { x: spaceship.x - 15, y: spaceship.y + 15 },
      { x: spaceship.x + 15, y: spaceship.y - 15 },
    ])
    spaceships.forEach((spaceship, index) => {
      const enemySpaceship = getRandomItem(enemySpaceships)
      const enemyReachX = enemySpaceship.getReach() - enemySpaceship.getDisplayWidth() / 2
      const enemyReachY = enemySpaceship.getReach() - enemySpaceship.getDisplayHeight() / 2
      const spaceshipReachX = spaceship.getReach() - spaceship.getDisplayWidth() / 2
      const spaceshipReachY = spaceship.getReach() - spaceship.getDisplayHeight() / 2
      const aimX = randomNumber(
        Math.max(enemySpaceship.x - enemyReachX, 10),
        Math.min(enemySpaceship.x + enemyReachX, 605)
      )

      const aimY = randomNumber(
        Math.max(enemySpaceship.y - enemyReachX, 10),
        Math.min(enemySpaceship.y + enemyReachY, 385)
      )

      for (let i = 0; i < 50; i++) {
        const destinationX = randomNumber(
          Math.max(spaceship.x - spaceshipReachX, 10),
          Math.min(spaceship.x + spaceshipReachX, 605)
        )
        const destinationY = randomNumber(
          Math.max(spaceship.y - spaceshipReachY, 10),
          Math.min(spaceship.y + spaceshipReachY, 385)
        )

        const angle = Phaser.Math.Angle.Between(
          spaceship.x,
          spaceship.y,
          destinationX,
          destinationY
        )
        const vx = (spaceship.getDisplayWidth() / 2) * Math.cos(Phaser.Math.RadToDeg(angle))
        const vy = (spaceship.getDisplayHeight() / 2) * Math.sin(Phaser.Math.RadToDeg(angle))

        const points = [
          { x: spaceship.x + vx, y: spaceship.y + vy },
          { x: spaceship.x - vx, y: spaceship.y - vy },
          { x: spaceship.x - vx, y: spaceship.y + vy },
          { x: spaceship.x + vx, y: spaceship.y - vy },
          { x: destinationX + vx, y: destinationY + vy },
          { x: destinationX - vx, y: destinationY - vy },
          { x: destinationX + vx, y: destinationY - vy },
          { x: destinationX - vx, y: destinationY + vy },
        ]
        if (!polygons.some((polygon, y) => y !== index && polygonIntersects(points, polygon))) {
          polygons[index] = points
          player.setSpaceshipDestination(spaceship, destinationX, destinationY)
          // const fakeSpaceship = this.add.graphics()
          // fakeSpaceship.fillStyle(index === 0 ? 0xffffff : index === 1 ? 0x111666 : 0xaaa213)
          // fakeSpaceship.beginPath()
          // fakeSpaceship.fillPoint(points[0].x, points[0].y, 4)
          // fakeSpaceship.fillPoint(points[1].x, points[1].y, 4)
          // fakeSpaceship.fillPoint(points[2].x, points[2].y, 4)
          // fakeSpaceship.fillPoint(points[3].x, points[3].y, 4)
          // fakeSpaceship.fillPoint(points[4].x, points[4].y, 4)
          // fakeSpaceship.fillPoint(points[5].x, points[5].y, 4)
          // fakeSpaceship.fillPoint(points[6].x, points[6].y, 4)
          // fakeSpaceship.fillPoint(points[7].x, points[7].y, 4)
          break
        }
      }
      player.setSpaceshipTarget(spaceship, aimX, aimY)
    })

    this.startRound()
  }

  getPlayer(socketId: string): Player | undefined {
    if (this.socketHandler) {
      return this.players.find(player => player.getSocketId() === socketId)
    }
  }

  getMePlayer(): Player | undefined {
    return this.players.find(player => player.getIsMe())
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

  createAnimations() {
    this.anims.create({
      key: `${SpaceshipsTypes.FAST}-red-moving`,
      frames: this.anims.generateFrameNames(`${SpaceshipsTypes.FAST}-red`).slice(0, -1),
      frameRate: 20,
      repeat: -1,
    })

    this.anims.create({
      key: `${SpaceshipsTypes.FAST}-red-stopped`,
      frames: this.anims.generateFrameNames(`${SpaceshipsTypes.FAST}-red`).slice(-1),
    })

    this.anims.create({
      key: `${SpaceshipsTypes.FAST}-blue-moving`,
      frames: this.anims.generateFrameNames(`${SpaceshipsTypes.FAST}-blue`).slice(0, -1),
      frameRate: 20,
      repeat: -1,
    })

    this.anims.create({
      key: `${SpaceshipsTypes.FAST}-blue-stopped`,
      frames: this.anims.generateFrameNames(`${SpaceshipsTypes.FAST}-blue`).slice(-1),
    })

    this.anims.create({
      key: `${SpaceshipsTypes.REGULAR}-red-moving`,
      frames: this.anims.generateFrameNames(`${SpaceshipsTypes.REGULAR}-red`).slice(0, -1),
      frameRate: 20,
      repeat: -1,
    })

    this.anims.create({
      key: `${SpaceshipsTypes.REGULAR}-red-stopped`,
      frames: this.anims.generateFrameNames(`${SpaceshipsTypes.REGULAR}-red`).slice(-1),
    })

    this.anims.create({
      key: `${SpaceshipsTypes.REGULAR}-blue-moving`,
      frames: this.anims.generateFrameNames(`${SpaceshipsTypes.REGULAR}-blue`).slice(0, -1),
      frameRate: 20,
      repeat: -1,
    })

    this.anims.create({
      key: `${SpaceshipsTypes.REGULAR}-blue-stopped`,
      frames: this.anims.generateFrameNames(`${SpaceshipsTypes.REGULAR}-blue`).slice(-1),
    })

    this.anims.create({
      key: `${SpaceshipsTypes.SLOW}-red-moving`,
      frames: this.anims.generateFrameNames(`${SpaceshipsTypes.SLOW}-red`).slice(0, -1),
      frameRate: 20,
      repeat: -1,
    })

    this.anims.create({
      key: `${SpaceshipsTypes.SLOW}-red-stopped`,
      frames: this.anims.generateFrameNames(`${SpaceshipsTypes.SLOW}-red`).slice(-1),
    })

    this.anims.create({
      key: `${SpaceshipsTypes.SLOW}-blue-moving`,
      frames: this.anims.generateFrameNames(`${SpaceshipsTypes.SLOW}-blue`).slice(0, -1),
      frameRate: 20,
      repeat: -1,
    })

    this.anims.create({
      key: `${SpaceshipsTypes.SLOW}-blue-stopped`,
      frames: this.anims.generateFrameNames(`${SpaceshipsTypes.SLOW}-blue`).slice(-1),
    })
  }

  create(): void {
    this.createAnimations()
    const background = this.add.image(WIDTH / 2, HEIGHT / 2, 'shipSelectBackgroundImage')
    background.setScale(0.5)
    if (this.socketHandler) {
      this.createTimer()
    }

    const onSpaceshipClick = (player: Player, spaceship: BaseSpaceship) => {
      if (this.UI?.getProps()?.spaceshipClickTooltip) {
        this.UI?.updateProps({
          spaceshipClickTooltip: undefined,
          reachableAreaTooltip: {
            x: spaceship.x < 200 ? spaceship.x + 120 : spaceship.x - 120,
            y: spaceship.y,
            placement: spaceship.x < 200 ? 'right' : 'left',
          },
        })
      }
      if (this.UI?.getProps()?.repeatTooltip) {
        this.UI?.updateProps({
          repeatTooltip: undefined,
        })
      }
      player.createReachableArea(spaceship)
    }

    const handlePrivateMessage = (value: string) => {
      const { id, message } = JSON.parse(value)
      const name = this.challenger === id ? this.challengerName : this.challengedName
      this.UI?.addMessage({ message: message, name })
    }

    const setSpaceshipTarget = (player: Player, spaceship: BaseSpaceship, x: number, y: number) => {
      player?.destroyTarget()
      const targetSprite = this.add.sprite(x, y, 'target')
      player?.setSpaceshipTarget(spaceship, x, y, targetSprite)
    }

    const setSpaceshipDestination = (
      player: Player,
      spaceship: BaseSpaceship,
      x: number,
      y: number
    ) => {
      player?.setSpaceshipDestination(spaceship, x, y)
      player?.destroyReachableArea()
      player?.createTarget(spaceship)
    }

    const handleCommandProcessed = (value: string) => {
      const handleSetTarget = (message: string) => {
        const { x, y, spaceship: spaceshipId } = JSON.parse(message)
        const player = this.getPlayer(this.socketHandler?.getWebSocketClient().id ?? '')
        const spaceship = player?.getSpaceships().find(sp => sp.getId() === spaceshipId)
        if (player && spaceship) {
          setSpaceshipTarget(player, spaceship, x, y)
        }
      }

      const handleSetDestination = (message: string) => {
        const { x, y, spaceship: spaceshipId } = JSON.parse(message)
        const player = this.getPlayer(this.socketHandler?.getWebSocketClient().id ?? '')
        const spaceship = player?.getSpaceships().find(sp => sp.getId() === spaceshipId)
        if (player && spaceship) {
          setSpaceshipDestination(player, spaceship, x, y)
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
      if (message) {
        const { reason } = JSON.parse(message)
        if (reason === GAME_ENDED) {
          return
        }
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
      if (!this.UI?.getProps()?.badge) {
        this.UI?.setBadge(ResultTypes.victory)
      }
    }

    const handleDisconnect = () => {
      this.clear()
      this.scene.start(SCENES.Identification, { error: ErrorTypes.disconnected })
    }

    this.socketHandler?.createGameSocketHandler({
      handleCommandProcessed,
      handleSetPlayerReady,
      handlePrivateMessage,
      handleCloseGame,
      handleRoundStarted,
      handleDisconnect,
    })

    const onTargetClick: (spaceship: BaseSpaceship, x: number, y: number) => void = (
      spaceship: BaseSpaceship,
      x: number,
      y: number
    ) => {
      if (this.socketHandler) {
        this.socketHandler?.sendSetTarget(spaceship.getId() ?? -1, x, y)
      } else {
        const player = this.getMePlayer()
        if (player) {
          setSpaceshipTarget(player, spaceship, x, y)
        }
      }

      if (this.UI?.getProps()?.targetTooltip) {
        this.UI?.updateProps({
          targetTooltip: undefined,
          repeatTooltip: { x: (WIDTH - 220) / 2, y: 10, placement: 'top' },
        })
      }
    }

    const onReachableAreaClick: (spaceship: BaseSpaceship, x: number, y: number) => void = (
      spaceship: BaseSpaceship,
      x: number,
      y: number
    ) => {
      if (this.socketHandler) {
        this.socketHandler?.sendSetDestination(spaceship.getId() ?? -1, x, y)
      } else {
        const player = this.getMePlayer()
        if (player) {
          setSpaceshipDestination(player, spaceship, x, y)
        }
      }
      if (this.UI?.getProps()?.reachableAreaTooltip) {
        this.UI?.updateProps({
          reachableAreaTooltip: undefined,
          targetTooltip: { x: (WIDTH - 220) / 2, y: 10, placement: 'top' },
        })
      }
    }

    this.players.push(
      new Player(
        this,
        this.isChallenger ?? true,
        'TOP',
        this.challenger ?? '',
        this.choices?.challenger,
        onTargetClick,
        onReachableAreaClick,
        onSpaceshipClick
      )
    )
    this.players.push(
      new Player(
        this,
        !this.isChallenger,
        'BOTTOM',
        this.challenged ?? '',
        this.choices?.challenged,
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

  checkHasEnded(): boolean {
    const looser = this.players.filter(player => !player.getSpaceships().length)
    if (looser.length || this.rounds === MAX_ROUNDS) {
      if (looser.length === 1) {
        if (looser[0].getIsMe()) {
          this.UI?.setBadge(ResultTypes.defeat)
        } else {
          this.UI?.setBadge(ResultTypes.victory)
        }
      } else if (looser.length === 2 || this.rounds === MAX_ROUNDS) {
        this.UI?.setBadge(ResultTypes.draw)
      }
      if (this.socketHandler) {
        this.socketHandler?.sendClose(JSON.stringify({ reason: GAME_ENDED }))
        this.time.addEvent({
          delay: 3000,
          callback: () => {
            this.clear()
            this.scene.start(SCENES.Room, {
              webSocketClient: this.socketHandler?.getWebSocketClient(),
            })
          },
        })
      } else {
        this.time.addEvent({
          delay: 3000,
          callback: () => {
            this.clear()
            this.scene.start(SCENES.Identification)
          },
        })
      }
      return true
    }
    return false
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
    if (this.socketHandler) {
      this.socketHandler?.sendRoundStarted()
    }

    const ended = this.checkHasEnded()
    if (!ended && !this.socketHandler) {
      this.players.forEach(player => {
        player.setIsEditable(true)
      })
      this.UI?.setisWaitingOponent(false)
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
