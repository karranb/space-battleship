import Player from 'models/player'
import SingleBullet from 'models/weapons/single-bullet'

export type BaseSpaceshipProps = {
  x: number
  y: number
  life: number
  maxLife: number
  speed: number
  scene: Phaser.Scene
  texture: string
  angle: number
  id?: number
  state?: 'MOVING' | 'STOPPED' | 'DESTROYED'
  owner?: Player
}

abstract class BaseSpaceship extends Phaser.GameObjects.Sprite {
  x: number
  y: number
  scene: Phaser.Scene
  angle: number
  state = 'STOPPED'

  declare body: Phaser.Physics.Arcade.Body
  protected id?: number
  protected life: number
  protected maxLife: number
  protected speed: number
  protected destination?: Phaser.Math.Vector2
  protected target?: Phaser.Math.Vector2
  protected pathGraphic?: Phaser.GameObjects.Graphics
  protected targetSprite?: Phaser.GameObjects.Sprite
  protected owner?: Player

  constructor({
    scene,
    x = 0,
    y = 0,
    life,
    maxLife,
    speed,
    angle,
    texture,
    owner,
    id,
  }: BaseSpaceshipProps) {
    super(scene, x, y, texture)
    this.id = id
    this.scene = scene
    this.scene.add.existing(this)
    this.scene.physics.add.existing(this)
    this.body.debugBodyColor = 0xffffff
    this.setDisplaySize(36.8, 50)
    this.setOrigin(0.3, 0.5)
    this.x = x
    this.y = y
    this.life = life
    this.maxLife = maxLife
    this.speed = speed
    this.angle = angle
    this.owner = owner
    this.setAngle(angle)
    this.setRotation(Phaser.Math.DegToRad(angle))
  }

  setDestination(x: number, y: number): void {
    this.pathGraphic?.destroy()
    this.pathGraphic = this.scene.add.graphics({
      x: 0,
      y: 0,
      lineStyle: {
        color: 0xffffff,
        width: 2,
      },
    })
    const line = new Phaser.Geom.Line(this.x, this.y, x, y)
    this.destination = new Phaser.Math.Vector2(x, y)
    this.pathGraphic.strokeLineShape(line)
  }

  setTarget(x: number, y: number, targetSprite?: Phaser.GameObjects.Sprite): void {
    if (this.targetSprite) {
      this.targetSprite.destroy()
    }
    this.target = new Phaser.Math.Vector2(x, y)
    this.targetSprite = targetSprite
  }

  startRound(): void {
    this.pathGraphic?.destroy()
    this.targetSprite?.destroy()
    if (this.destination) {
      this.state = 'MOVING'
      this.scene.physics.moveToObject(this, this.destination, 50)
      const angle = Phaser.Math.Angle.Between(
        this.x,
        this.y,
        this.destination.x,
        this.destination.y
      )
      this.setRotation(angle)
    }
  }

  shoot(): SingleBullet | undefined {
    if (this.target) {
      return new SingleBullet(this.scene, this.x, this.y, this.target, this)
    }
    return undefined
  }

  endRound(): void {
    if (this.destination) {
      this.body.setVelocity(0, 0)
    }
    this.state = 'STOPPED'
    this.destination = undefined
    this.target = undefined
  }

  setDamage(damage: number): void {
    this.life -= damage
    if (this.life < 0) {
      this.destroy()
    }
  }

  destroy(): void {
    this.state = 'DESTROYED'
    super.destroy()
  }

  update(): BaseSpaceship {
    if (this.destination) {
      const distance = Phaser.Math.Distance.Between(
        this.x,
        this.y,
        this.destination.x,
        this.destination.y
      )
      if (distance < 4) {
        this.endRound()
      }
    }
    return this
  }

  getId(): number | undefined {
    return this.id
  }
}

export default BaseSpaceship
