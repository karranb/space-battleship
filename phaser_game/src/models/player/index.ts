import BaseSpaceship from 'models/spaceships/base'
import { createSpaceships, PlayerPosition } from 'models/spaceships/factory'
import Game, { PlayerChoices } from 'scenes/game'

export type PlayerProps = {
  scene: Game
  isMe: boolean
  position: PlayerPosition
  socketId?: string
  choices: PlayerChoices
  onTargetClick?: (spaceship: BaseSpaceship, x: number, y: number) => void
  onReachableAreaClick?: (spaceship: BaseSpaceship, x: number, y: number) => void
  onSpaceshipClick?: (player: Player, spaceship: BaseSpaceship) => void
}

class Player {
  scene: Game

  private spaceships: BaseSpaceship[]
  private activeSpaceship?: BaseSpaceship
  private reachableGraphic?: Phaser.GameObjects.Graphics
  private targetSprite?: Phaser.GameObjects.Sprite
  private isEditable = true
  private onReachableAreaClick?: (spaceship: BaseSpaceship, x: number, y: number) => void
  private onTargetClick?: (spaceship: BaseSpaceship, x: number, y: number) => void
  private onSpaceshipClick?: (player: Player, spaceship: BaseSpaceship) => void
  private isMe: boolean
  private socketId?: string

  constructor({
    scene,
    isMe,
    position,
    socketId,
    choices,
    onTargetClick,
    onReachableAreaClick,
    onSpaceshipClick,
  }: PlayerProps) {
    this.scene = scene
    this.onReachableAreaClick = onReachableAreaClick
    this.onTargetClick = onTargetClick
    this.onSpaceshipClick = onSpaceshipClick
    this.socketId = socketId
    this.spaceships = createSpaceships(this, position, choices)
    this.isMe = isMe
    if (isMe) {
      this.spaceships.forEach(spaceship => {
        spaceship.setInteractive()
        spaceship.on('pointerdown', () => this.handleSpaceshipClick(spaceship))
      })
    }
  }

  getScene() {
    return this.scene
  }

  getSocketId(): string | undefined {
    return this.socketId
  }

  getIsMe(): boolean {
    return this.isMe
  }

  finishRound(): void {
    this.spaceships = this.spaceships.filter(spaceship => spaceship.state !== 'DESTROYED')
    this.spaceships.forEach(spaceship => spaceship.addProgressBar())
  }

  createReachableArea(spaceship: BaseSpaceship): void {
    this.reachableGraphic = this.scene.add.graphics({
      fillStyle: {
        color: 0xffffff,
        alpha: 0.2,
      },
    })

    const maskShape = this.scene.make.graphics({})
    maskShape.fillStyle(0xffffff)
    maskShape.beginPath()
    maskShape.fillRect(10, 10, 595, 375)
    const mask = maskShape.createGeometryMask()
    this.reachableGraphic.setMask(mask)
    const circle = new Phaser.Geom.Circle(spaceship.x, spaceship.y, spaceship.getReach())
    this.reachableGraphic.fillCircleShape(circle)
    this.reachableGraphic.setInteractive(circle, Phaser.Geom.Circle.Contains)
    this.reachableGraphic.on(
      'pointerdown',
      (_pointer: Phaser.Input.Pointer, x: number, y: number) =>
        this.handleReachableAreaClick(spaceship, x, y)
    )
  }

  setIsEditable(isEditable: boolean) {
    this.isEditable = isEditable
  }

  handleSpaceshipClick(spaceship: BaseSpaceship): void {
    if (this.activeSpaceship || !this.isEditable || !this.isMe) {
      return
    }
    this.activeSpaceship = spaceship
    this.onSpaceshipClick?.(this, spaceship)
  }

  setSpaceshipDestination(spaceship: BaseSpaceship, x: number, y: number): void {
    spaceship?.setDestination(x, y)
  }

  handleReachableAreaClick(spaceship: BaseSpaceship, x: number, y: number): void {
    this.onReachableAreaClick?.(spaceship, x, y)
  }

  destroyReachableArea() {
    this.reachableGraphic?.destroy()
  }

  createTarget(spaceship: BaseSpaceship) {
    const targetSprite = this.scene.sys.game.device.os.desktop
      ? this.scene.add.sprite(0, 0, 'target').setInteractive()
      : this.scene.add.sprite(-50, -50, 'target').setInteractive()
    this.targetSprite = targetSprite

    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) =>
      this.handleTargetClick(spaceship, pointer)
    )
  }

  setSpaceshipTarget(
    spaceship: BaseSpaceship,
    x: number,
    y: number,
    targetSprite?: Phaser.GameObjects.Sprite
  ): void {
    spaceship?.setTarget(x, y, targetSprite)
  }

  handleTargetClick(spaceship: BaseSpaceship, pointer: Phaser.Input.Pointer): void {
    this.onTargetClick?.(spaceship, pointer.worldX, pointer.worldY)
  }

  destroyTarget() {
    this.scene.input.off('pointerdown')
    this.targetSprite?.destroy()
    this.targetSprite = undefined
    this.activeSpaceship = undefined
  }

  getSpaceships(): BaseSpaceship[] {
    return this.spaceships.filter(spaceship => spaceship.state !== 'DESTROYED')
  }

  startRound(): void {
    this.spaceships.forEach(spaceship => spaceship.startRound())
    this.activeSpaceship = undefined
    this.destroyReachableArea()
    this.destroyTarget()
    this.spaceships.forEach(spaceship => spaceship.destroyProgressBar())
    this.isEditable = false
  }

  update(): void {
    if (this.targetSprite && this.scene.sys.game.device.os.desktop) {
      const pointer = this.scene.input.activePointer
      this.targetSprite.x = pointer.worldX
      this.targetSprite.y = pointer.worldY
    }
    this.spaceships.forEach(spaceship => spaceship.update())
  }
}

export default Player
