import BaseSpaceship from 'models/spaceships/base'
import Fasty from 'models/spaceships/fasty'
import { HEIGHT } from 'utils/constants'

class Player {
  scene: Phaser.Scene

  private spaceships: BaseSpaceship[]
  private activeSpaceship?: BaseSpaceship
  private reachableGraphic?: Phaser.GameObjects.Graphics
  private targetSprite?: Phaser.GameObjects.Sprite
  private isEditable = true
  private onReachableAreaClick?: (spaceship: BaseSpaceship, x: number, y: number) => void
  private onTargetClick?: (
    spaceship: BaseSpaceship,
    x: number,
    y: number,
    targetSprite: Phaser.GameObjects.Sprite
  ) => void
  private onSpaceshipClick?: (spaceship: BaseSpaceship) => void
  private isMe: boolean

  createSpaceship(
    x: number,
    y: number,
    angle: number,
    id: number,
    type: 'FASTY' = 'FASTY'
  ): BaseSpaceship {
    if (type === 'FASTY') {
      return new Fasty({
        scene: this.scene,
        x,
        y,
        angle,
        texture: 'spaceship',
        owner: this,
        id,
      })
    }
    throw new Error('invalid spaceship')
  }

  createSpaceships(position: 'TOP' | 'BOTTOM'): BaseSpaceship[] {
    const angle = position === 'TOP' ? 40 : 210
    const size = 50
    const center = size / 2
    const width = 600
    const height = HEIGHT
    return Array(3)
      .fill(null)
      .map((_, i) => {
        if (position === 'TOP') {
          if (i === 0) {
            return this.createSpaceship(75 + center, 65 + center, angle, i)
          }
          if (i === 1) {
            return this.createSpaceship(10 + center, 90 + center, angle, i)
          }
          return this.createSpaceship(90 + center, center, angle, i)
        } else {
          if (i === 0) {
            return this.createSpaceship(width - (75 + center), height - (65 + center), angle, i)
          }
          if (i === 1) {
            return this.createSpaceship(width - (10 + center), height - (90 + center), angle, i)
          }
          return this.createSpaceship(width - (90 + center), height - center, angle, i)
        }
      })
  }

  constructor(
    scene: Phaser.Scene,
    isMe: boolean,
    position: 'TOP' | 'BOTTOM',
    onTargetClick?: (
      player: Player
    ) => (
      spaceship: BaseSpaceship,
      x: number,
      y: number,
      targetSprite: Phaser.GameObjects.Sprite
    ) => void,
    onReachableAreaClick?: (
      player: Player
    ) => (spaceship: BaseSpaceship, x: number, y: number) => void,
    onSpaceshipClick?: (player: Player) => (spaceship: BaseSpaceship) => void
  ) {
    // Todo: Make spaceship factory
    this.scene = scene
    this.spaceships = this.createSpaceships(position)
    this.onReachableAreaClick = onReachableAreaClick?.(this)
    this.onTargetClick = onTargetClick?.(this)
    this.onSpaceshipClick = onSpaceshipClick?.(this)
    this.isMe = isMe
    if (isMe) {
      this.spaceships.forEach(spaceship => {
        spaceship.setInteractive()
        spaceship.on('pointerdown', () => this.handleSpaceshipClick(spaceship))
      })
    }
  }

  getIsMe(): boolean {
    return this.isMe
  }

  finishRound(): void {
    this.spaceships = this.spaceships.filter(spaceship => spaceship.state !== 'DESTROYED')
    this.isEditable = true
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
    const circle = new Phaser.Geom.Circle(spaceship.x, spaceship.y, 100)
    this.reachableGraphic.fillCircleShape(circle)
    this.reachableGraphic.setInteractive(circle, Phaser.Geom.Circle.Contains)
    this.reachableGraphic.on(
      'pointerdown',
      (_pointer: Phaser.Input.Pointer, x: number, y: number) =>
        this.handleReachableAreaClick(spaceship, x, y)
    )
  }

  handleSpaceshipClick(spaceship: BaseSpaceship): void {
    if (this.activeSpaceship || !this.isEditable) {
      return
    }
    this.activeSpaceship = spaceship
    this.onSpaceshipClick?.(spaceship)
  }

  setSpaceshipDestination(spaceship: BaseSpaceship, x: number, y: number): void {
    spaceship?.setDestination(x, y)
  }

  handleReachableAreaClick(spaceship: BaseSpaceship, x: number, y: number): void {
    this.reachableGraphic?.destroy()
    const targetSprite = this.scene.add.sprite(0, 0, 'target').setInteractive()
    targetSprite.on('pointerdown', (pointer: Phaser.Input.Pointer) =>
      this.handleTargetClick(spaceship, pointer, targetSprite)
    )
    this.targetSprite = targetSprite
    this.onReachableAreaClick?.(spaceship, x, y)
  }

  setSpaceshipTarget(
    spaceship: BaseSpaceship,
    x: number,
    y: number,
    targetSprite?: Phaser.GameObjects.Sprite
  ): void {
    spaceship?.setTarget(x, y, targetSprite)
  }

  handleTargetClick(
    spaceship: BaseSpaceship,
    pointer: Phaser.Input.Pointer,
    targetSprite: Phaser.GameObjects.Sprite
  ): void {
    this.targetSprite?.off('pointerdown')
    this.targetSprite = undefined
    this.activeSpaceship = undefined
    this.onTargetClick?.(spaceship, pointer.worldX, pointer.worldY, targetSprite)
  }

  getSpaceships(): BaseSpaceship[] {
    return this.spaceships
  }

  startRound(): void {
    this.spaceships.forEach(spaceship => spaceship.startRound())
    this.activeSpaceship = undefined
    this.reachableGraphic?.destroy()
    this.targetSprite?.destroy()
    this.isEditable = false
  }

  update(): void {
    if (this.targetSprite) {
      const pointer = this.scene.input.activePointer
      this.targetSprite.x = pointer.worldX
      this.targetSprite.y = pointer.worldY
    }
    this.spaceships.forEach(spaceship => spaceship.update())
  }
}

export default Player
