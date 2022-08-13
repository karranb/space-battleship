import { SpaceshipsTypes } from 'interfaces/shared'
import BaseSpaceship, { SpaceshipColors } from 'models/spaceships/base'
import Fast from 'models/spaceships/fast'
import Regular from 'models/spaceships/regular'
import Slow from 'models/spaceships/slow'
import Game, { PlayerChoices } from 'scenes/game'
import { getRandomItem } from 'utils/array'

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
  private socketId: string
  private choices?: PlayerChoices

  constructor(
    scene: Game,
    isMe: boolean,
    position: 'TOP' | 'BOTTOM',
    socketId: string,
    choices?: PlayerChoices,
    onTargetClick?: (spaceship: BaseSpaceship, x: number, y: number) => void,
    onReachableAreaClick?: (spaceship: BaseSpaceship, x: number, y: number) => void,
    onSpaceshipClick?: (player: Player, spaceship: BaseSpaceship) => void
  ) {
    // Todo: Make spaceship factory
    this.scene = scene
    
    this.onReachableAreaClick = onReachableAreaClick
    this.onTargetClick = onTargetClick
    this.onSpaceshipClick = onSpaceshipClick
    this.socketId = socketId
    this.choices = choices
    this.spaceships = this.createSpaceships(position)
    this.isMe = isMe
    if (isMe) {
      this.spaceships.forEach(spaceship => {
        spaceship.setInteractive()
        spaceship.on('pointerdown', () => this.handleSpaceshipClick(spaceship))
      })
    }
  }

  getSocketId(): string {
    return this.socketId
  }

  getIsMe(): boolean {
    return this.isMe
  }

  finishRound(): void {
    this.spaceships = this.spaceships.filter(spaceship => spaceship.state !== 'DESTROYED')
    this.spaceships.forEach(spaceship => {
      spaceship.addProgressBar()
    })
  }

  createReachableArea(spaceship: BaseSpaceship): void {
    this.reachableGraphic = this.scene.add.graphics({
      x: 0,
      y: 0,
      fillStyle: {
        color: 0xffffff,
        alpha: 0.2,
      },
    })

    const shape = this.scene.make.graphics({})
    shape.fillStyle(0xffffff)
    shape.beginPath()
    shape.fillRect(10, 10, 595, 375)
    const mask = shape.createGeometryMask()
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
    if (this.activeSpaceship || !this.isEditable) {
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

  createSpaceship(
    x: number,
    y: number,
    angle: number,
    id: number,
    color: SpaceshipColors,
    type: SpaceshipsTypes
  ): BaseSpaceship {
    if (type === SpaceshipsTypes.FAST) {
      return new Fast({
        scene: this.scene,
        x,
        y,
        angle,
        owner: this,
        id,
        color,
      })
    }

    if (type === SpaceshipsTypes.REGULAR) {
      return new Regular({
        scene: this.scene,
        x,
        y,
        angle,
        owner: this,
        id,
        color,
      })
    }

    if (type === SpaceshipsTypes.SLOW) {
      return new Slow({
        scene: this.scene,
        x,
        y,
        angle,
        owner: this,
        id,
        color,
      })
    }

    throw new Error('invalid spaceship')
  }

  createSpaceships(position: 'TOP' | 'BOTTOM'): BaseSpaceship[] {
    const angle = position === 'TOP' ? 120 : -60
    const size = 50
    const center = size / 2
    return Array(3)
      .fill(null)
      .map((_, i) => {
        if (position === 'TOP') {
          if (i === 0) {
            return this.createSpaceship(
              78 + center,
              8 + center,
              angle,
              i,
              SpaceshipColors.RED,
              this.choices?.[i]?.spaceship ?? getRandomItem(Object.values(SpaceshipsTypes))
            )
          }
          if (i === 1) {
            return this.createSpaceship(
              75 + center,
              75 + center,
              angle,
              i,
              SpaceshipColors.RED,
              this.choices?.[i]?.spaceship ?? getRandomItem(Object.values(SpaceshipsTypes))
            )
          }
          return this.createSpaceship(
            28 + center,
            121 + center,
            angle,
            i,
            SpaceshipColors.RED,
            this.choices?.[2]?.spaceship ?? getRandomItem(Object.values(SpaceshipsTypes))
          )
        } else {
          if (i === 0) {
            return this.createSpaceship(
              480 + center,
              329 + center,
              angle,
              i,
              SpaceshipColors.BLUE,
              this.choices?.[i]?.spaceship ?? getRandomItem(Object.values(SpaceshipsTypes))
            )
          }
          if (i === 1) {
            return this.createSpaceship(
              483 + center,
              263 + center,
              angle,
              i,
              SpaceshipColors.BLUE,
              this.choices?.[i]?.spaceship ?? getRandomItem(Object.values(SpaceshipsTypes))
            )
          }
          return this.createSpaceship(
            530 + center,
            216 + center,
            angle,
            i,
            SpaceshipColors.BLUE,
            this.choices?.[2]?.spaceship ?? getRandomItem(Object.values(SpaceshipsTypes))
          )
        }
      })
  }

  startRound(): void {
    this.spaceships.forEach(spaceship => spaceship.startRound())
    this.activeSpaceship = undefined
    this.destroyReachableArea()
    this.destroyTarget()
    this.spaceships.forEach(spaceship => {
      spaceship.destroyProgressBar()
    })
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
