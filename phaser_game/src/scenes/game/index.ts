import 'phaser'
import { TooltipPlacement } from 'antd/lib/tooltip'
import { Socket } from 'socket.io-client'

import { Commands, MAX_ROUNDS, SpaceshipsTypes, WeaponTypes } from 'interfaces/shared'
import Player from 'models/player'
import BaseSpaceship, { SpaceshipColors, SpaceshipStates } from 'models/spaceships/base'
import { PlayerPosition } from 'models/spaceships/factory'
import SingleBullet from 'models/weapons/single-bullet'
import { ErrorTypes, HEIGHT, SCENES, WIDTH } from 'utils/constants'
import BaseScene from 'utils/phaser'
import { getFromLocalStorage, setToLocalStorage } from 'utils/storage'
import { debounce } from 'utils/ui'

import { setAIPlay } from './ai'
import GameSocketHandler from './socket'
import GameUI, { ResultTypes } from './ui'

const GAME_ENDED = 'GAME_ENDED'

export type SpaceshipChoice = {
  spaceship: SpaceshipsTypes
  weapon: WeaponTypes
}
export type SpaceshipIndexes = '0' | '1' | '2'
export type PlayerChoices = Record<SpaceshipIndexes, SpaceshipChoice>
export type Choices = { challenger: PlayerChoices; challenged: PlayerChoices }
export enum GameState {
  STOPPED = 'STOPPED',
  MOVING = 'MOVING',
  WAITING = 'WAITING',
}

class Game extends BaseScene {
  UI?: GameUI
  players: Player[] = []
  bullets: SingleBullet[] = []
  bulletColliders: Phaser.Physics.Arcade.Collider[] = []
  spaceships: BaseSpaceship[] = []
  state: GameState = GameState.STOPPED
  finalOverlap = undefined
  rounds = 0
  challenger?: string
  challenged?: string
  choices?: Choices
  socketHandler?: GameSocketHandler
  challengedName?: string
  challengerName?: string
  timer?: Phaser.GameObjects.Text
  isChallenger?: boolean

  constructor() {
    super(SCENES.Game)
  }

  clearData() {
    this.players = []
    this.bullets = []
    this.bulletColliders = []
    this.spaceships = []
    this.state = GameState.STOPPED
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
    isChallenger: boolean
  }): void {
    this.challengerName = data.challengerName
    this.challengedName = data.challengedName
    this.choices = data.choices
    this.isChallenger = data.isChallenger
    this.challenger = data.challenger
    this.challenged = data.challenged

    if (data.webSocketClient) {
      this.socketHandler = new GameSocketHandler(data.webSocketClient)
    }
    this.setupUI()
  }

  setupMultiplayerUI() {
    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER).on(
      'down',
      debounce(() => this.UI?.sendMessage())
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
      this.players.forEach(player => player.setIsEditable(false))
    }

    const handleSubmitMessage = (message: string) => this.socketHandler?.sendPrivateMessage(message)

    const handleGiveUpClick = () => {
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
          this.redirect(SCENES.Room, {
            webSocketClient: this.socketHandler?.getWebSocketClient(),
          })
        },
      })
      this.socketHandler?.sendGiveUp()
    }

    this.UI = new GameUI(this, {
      isChallenger: this.isChallenger as boolean,
      challengedName: this.challengedName as string,
      challengerName: this.challengerName as string,
      messages: [],
      handleSubmitMessage,
      handleSubmitReady,
      handleGiveUpClick,
      socketHandler: this.socketHandler,
      spaceshipClickTooltip: getFromLocalStorage('tutorialDone')
        ? undefined
        : this.getSpaceshipClickTooltip(),
    })
    setToLocalStorage('tutorialDone', 'done')
  }

  setupCampaingUI() {
    const handleGiveUpClick = () => {
      this.UI?.updateProps({
        spaceshipClickTooltip: undefined,
        reachableAreaTooltip: undefined,
        targetTooltip: undefined,
        repeatTooltip: undefined,
      })
      this.redirect(SCENES.Identification)
    }

    const handleSubmitReady = async () => {
      this.UI?.updateProps({
        spaceshipClickTooltip: undefined,
        reachableAreaTooltip: undefined,
        targetTooltip: undefined,
        repeatTooltip: undefined,
      })
      this.UI?.setisWaitingOponent(true)
      const player = this.players.find(player => !player.getIsMe())
      const enemy = this.getMePlayer()
      if (player && enemy) {
        setAIPlay(player, enemy)
      }
      this.startRound()
    }

    this.UI = new GameUI(this, {
      isChallenger: this.isChallenger as boolean,
      challengedName: this.challengedName as string,
      challengerName: this.challengerName as string,
      messages: [],
      handleGiveUpClick,
      handleSubmitReady,
      spaceshipClickTooltip: this.getSpaceshipClickTooltip(),
    })
  }

  getSpaceshipClickTooltip() {
    const rightTooltip = { x: 140, y: 85, placement: 'right' as TooltipPlacement }
    const leftTooltip = {
      x: WIDTH - 140 - 220,
      y: HEIGHT - 100,
      placement: 'left' as TooltipPlacement,
    }
    return this.isChallenger ? rightTooltip : leftTooltip
  }

  async setupUI() {
    if (this.socketHandler) {
      this.setupMultiplayerUI()
      return
    }
    this.setupCampaingUI()
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
    const explosion = this.add.sprite(x, y, 'explosion')
    explosion.setScale(0.5)
    explosion.play('explosion-animation')
    explosion.once('animationcomplete', () => {
      explosion.destroy()
    })
  }

  prepareRound(): void {
    this.players.forEach(player => player.setIsEditable(true))
    this.UI?.setisWaitingOponent(false)
  }

  setBulletsCollisions() {
    this.spaceships.forEach(spaceship =>
      this.bullets
        .filter(bullet => bullet.getOwner() !== spaceship)
        .forEach(bullet => {
          const collider = this.physics.add.overlap(spaceship, bullet, () => {
            spaceship.setDamage(bullet.getDamage())
            bullet.destroy()
          })
          this.bulletColliders.push(collider)
        })
    )
  }

  shoot() {
    this.bullets = this.spaceships.reduce((acc, spaceship) => {
      const bullet = spaceship.shoot()
      return bullet ? [...acc, bullet] : acc
    }, [] as SingleBullet[])
  }

  startRound(): void {
    this.state = GameState.MOVING
    this.rounds += 1
    this.shoot()
    this.setBulletsCollisions()
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
        const notEnded = this.timer && Number(this.timer.text) > 0
        if (notEnded) {
          this.timer?.setText(`${Number(this.timer.text) - 1}`)
          return
        }
        interval.remove()
      },
      loop: true,
    })
  }

  createAnimations() {
    Object.values(SpaceshipsTypes).forEach(type => {
      Object.values(SpaceshipColors).forEach(color => {
        const prefix = `${type}-${color}`
        this.anims.create({
          key: `${prefix}-moving`,
          frames: this.anims.generateFrameNames(prefix).slice(0, -1),
          frameRate: 20,
          repeat: -1,
        })
        this.anims.create({
          key: `${prefix}-stopped`,
          frames: this.anims.generateFrameNames(prefix).slice(-1),
        })
      })
    })
    this.anims.create({
      key: 'explosion-animation',
      frames: this.anims.generateFrameNames('explosion'),
      repeat: 0,
    })
  }

  setSpaceshipTarget(player: Player, spaceship: BaseSpaceship, x: number, y: number) {
    player?.destroyTarget()
    const targetSprite = this.add.sprite(x, y, 'target')
    player?.setSpaceshipTarget(spaceship, x, y, targetSprite)
  }

  setSpaceshipDestination(player: Player, spaceship: BaseSpaceship, x: number, y: number) {
    player?.setSpaceshipDestination(spaceship, x, y)
    player?.destroyReachableArea()
    player?.createTarget(spaceship)
  }

  createSocketHandler() {
    const handlePrivateMessage = (value: unknown) => {
      const { id, message } = value as { id: string; message: string }
      const name = this.challenger === id ? this.challengerName : this.challengedName
      this.UI?.addMessage({ message: message, name })
    }

    const handleCommandProcessed = (value: unknown) => {
      const handleSetTarget = (message: unknown) => {
        const {
          x,
          y,
          spaceship: spaceshipId,
        } = message as { x: number; y: number; spaceship: number }
        const player = this.getPlayer(this.socketHandler?.getWebSocketClient().id ?? '')
        const spaceship = player?.getSpaceships().find(sp => sp.getId() === spaceshipId)
        if (player && spaceship) {
          this.setSpaceshipTarget(player, spaceship, x, y)
        }
      }

      const handleSetDestination = (message: unknown) => {
        const {
          x,
          y,
          spaceship: spaceshipId,
        } = message as { x: number; y: number; spaceship: number }
        const player = this.getPlayer(this.socketHandler?.getWebSocketClient().id ?? '')
        const spaceship = player?.getSpaceships().find(sp => sp.getId() === spaceshipId)
        if (player && spaceship) {
          this.setSpaceshipDestination(player, spaceship, x, y)
        }
      }

      const { command, ...message } = value as {
        command: string
        x: number
        y: number
        spaceship: number
      }
      if (command === Commands.SET_SPACESHIP_TARGET) {
        handleSetTarget(message)
        return
      }
      if (command === Commands.SET_SPACESHIP_DESTINATION) {
        handleSetDestination(message)
        return
      }
    }

    const handleSetPlayerReady = (message: unknown) => {
      const choices = message as Record<
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
      this.prepareRound()
      this.createTimer()
    }

    const handleCloseGame = (message: unknown) => {
      if (message) {
        const { reason } = message as { reason: string }
        if (reason === GAME_ENDED) {
          return
        }
      }
      this.time.addEvent({
        delay: 3000,
        callback: () => {
          this.redirect(SCENES.Room, {
            webSocketClient: this.socketHandler?.getWebSocketClient(),
          })
        },
      })
      if (!this.UI?.getProps()?.badge) {
        this.UI?.setBadge(ResultTypes.victory)
      }
    }

    const handleDisconnect = () =>
      this.redirect(SCENES.Identification, { error: ErrorTypes.disconnected })

    this.socketHandler?.createGameSocketHandler({
      handleCommandProcessed,
      handleSetPlayerReady,
      handlePrivateMessage,
      handleCloseGame,
      handleRoundStarted,
      handleDisconnect,
    })
  }

  createPlayers() {
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

    const onTargetClick: (spaceship: BaseSpaceship, x: number, y: number) => void = (
      spaceship: BaseSpaceship,
      x: number,
      y: number
    ) => {
      if (this.UI?.getProps()?.targetTooltip) {
        this.UI?.updateProps({
          targetTooltip: undefined,
          repeatTooltip: { x: (WIDTH - 220) / 2, y: 10, placement: 'top' },
        })
      }
      if (this.socketHandler) {
        this.socketHandler?.sendSetTarget(spaceship.getId() ?? -1, x, y)
        return
      }
      const player = this.getMePlayer()
      if (player) {
        this.setSpaceshipTarget(player, spaceship, x, y)
      }
    }

    const onReachableAreaClick: (spaceship: BaseSpaceship, x: number, y: number) => void = (
      spaceship: BaseSpaceship,
      x: number,
      y: number
    ) => {
      if (this.UI?.getProps()?.reachableAreaTooltip) {
        this.UI?.updateProps({
          reachableAreaTooltip: undefined,
          targetTooltip: { x: (WIDTH - 220) / 2, y: 10, placement: 'top' },
        })
      }
      if (this.socketHandler) {
        this.socketHandler?.sendSetDestination(spaceship.getId() ?? -1, x, y)
        return
      }

      const player = this.getMePlayer()
      if (player) {

        this.setSpaceshipDestination(player, spaceship, x, y)
      }
    }

    this.players.push(
      new Player({
        scene: this,
        isMe: !!this.isChallenger,
        position: PlayerPosition.TOP,
        socketId: this.challenger,
        choices: this.choices?.challenger as PlayerChoices,
        onTargetClick,
        onReachableAreaClick,
        onSpaceshipClick,
      })
    )
    this.players.push(
      new Player({
        scene: this,
        isMe: !this.isChallenger,
        position: PlayerPosition.BOTTOM,
        socketId: this.challenged,
        choices: this.choices?.challenged as PlayerChoices,
        onTargetClick,
        onReachableAreaClick,
        onSpaceshipClick,
      })
    )
  }

  createBackground() {
    const background = this.add.image(WIDTH / 2, HEIGHT / 2, 'shipSelectBackgroundImage')
    background.setScale(0.5)
  }

  setupSpaceships() {
    this.spaceships = this.players.reduce(
      (acc, player) => [...acc, ...player.getSpaceships()],
      [] as BaseSpaceship[]
    )
    this.setSpaceshipsCollisionsHandlers()
  }

  create(): void {
    this.createAnimations()
    this.createBackground()
    if (this.socketHandler) {
      this.createTimer()
      this.createSocketHandler()
    }

    this.createPlayers()
    this.setupSpaceships()
  }

  setSpaceshipsCollisionsHandlers() {
    const collisionDamage = 75
    const collisionDamageThrottle = 300
    for (let i = 0; i < this.spaceships.length - 1; i++) {
      for (let j = i + 1; j < this.spaceships.length; j++) {
        let contactInterval: Phaser.Time.TimerEvent | undefined

        this.physics.add.overlap(this.spaceships[i], this.spaceships[j], (object1, object2) => {
          const spaceship1 = object1 as BaseSpaceship
          const spaceship2 = object2 as BaseSpaceship
          if (this.state === GameState.STOPPED) {
            spaceship1.destroy()
            spaceship2.destroy()
            this.checkGameHasEnded()
            return
          }
          if (contactInterval) {
            return
          }
          spaceship1.setDamage(collisionDamage)
          spaceship2.setDamage(collisionDamage)
          contactInterval = this.time.addEvent({
            delay: collisionDamageThrottle,
            callback: () => {
              contactInterval = undefined
            },
          })
        })
      }
    }
  }

  setEndBadge(losers: Player[]) {
    if (losers.length === 1) {
      this.UI?.setBadge(losers[0].getIsMe() ? ResultTypes.defeat : ResultTypes.victory)
      return
    }
    this.UI?.setBadge(ResultTypes.draw)
  }

  handleSocketGameEnded() {
    this.socketHandler?.sendClose({ reason: GAME_ENDED })
    this.time.addEvent({
      delay: 3000,
      callback: () =>
        this.redirect(SCENES.Room, {
          webSocketClient: this.socketHandler?.getWebSocketClient(),
        }),
    })
  }

  handleCampaingGameEndeed() {
    this.time.addEvent({
      delay: 3000,
      callback: () => this.redirect(SCENES.Identification),
    })
  }

  checkGameHasEnded(): boolean {
    const losers = this.players.filter(player => !player.getSpaceships().length)
    if (!losers.length && this.rounds < MAX_ROUNDS) {
      return false
    }
    this.setEndBadge(losers)
    this.socketHandler ? this.handleSocketGameEnded() : this.handleCampaingGameEndeed()
    return true
  }

  finishRound(): void {
    this.state = GameState.STOPPED
    this.bulletColliders.forEach(collider => collider.destroy())
    this.bulletColliders = []
    this.bullets = []
    this.players.forEach(player => player.finishRound())
    this.spaceships = this.spaceships.filter(
      spaceship => spaceship.state !== SpaceshipStates.DESTROYED
    )

    if (this.socketHandler) {
      this.socketHandler?.sendRoundStarted()
    }

    const hasGameEnded = this.checkGameHasEnded()
    if (!hasGameEnded && !this.socketHandler) {
      this.prepareRound()
    }
  }

  update(): void {
    this.players.forEach(player => player.update())
    this.bullets.forEach(bullet => bullet.update())
    if (
      this.state === GameState.MOVING &&
      this.spaceships.every(spaceship => spaceship.state !== SpaceshipStates.MOVING) &&
      this.bullets.every(bullet => bullet.getIsDestroyed())
    ) {
      this.finishRound()
    }
  }
}

export default Game
