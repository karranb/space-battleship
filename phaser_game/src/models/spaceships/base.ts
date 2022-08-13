import { SpaceshipsTypes } from 'interfaces/shared'
import Player from 'models/player'
import SingleBullet from 'models/weapons/single-bullet'
import Game from 'scenes/game'

export enum SpaceshipColors {
  RED = 'red',
  BLUE = 'blue',
}

export type BaseSpaceshipProps = {
  x: number
  y: number
  life: number
  maxLife: number
  reach: number
  scene: Game
  angle: number
  id?: number
  state?: 'MOVING' | 'STOPPED' | 'DESTROYED'
  spaceshipName?: SpaceshipsTypes
  owner?: Player
  color: SpaceshipColors
}

abstract class BaseSpaceship extends Phaser.Physics.Arcade.Sprite {
  x: number
  y: number
  scene: Game
  state = 'STOPPED'

  declare body: Phaser.Physics.Arcade.Body
  protected id?: number
  protected life: number
  protected maxLife: number
  protected reach: number
  protected destination?: Phaser.Math.Vector2
  protected target?: Phaser.Math.Vector2
  protected pathGraphic?: Phaser.GameObjects.Graphics
  protected targetSprite?: Phaser.GameObjects.Sprite
  protected owner?: Player
  protected textures: { moving: string; stopped: string }
  protected hitTimer?: Phaser.Time.TimerEvent
  protected progressBar?: Phaser.GameObjects.Graphics
  protected color?: SpaceshipColors
  protected spaceshipName?: SpaceshipsTypes
  // protected width?: number
  // protected height?: number

  constructor({
    scene,
    x = 0,
    y = 0,
    life,
    maxLife,
    reach,
    angle,
    owner,
    id,
    color,
    spaceshipName,
  }: // width,
  // height,
  BaseSpaceshipProps) {
    const texturePrefix = `${spaceshipName}-${color}`
    const textures = {
      stopped: `${texturePrefix}-stopped`,
      moving: `${texturePrefix}-moving`,
    }
    super(scene, x, y, textures.stopped)
    this.textures = textures

    this.spaceshipName = spaceshipName
    this.textures = textures
    this.play(textures.stopped)
    this.id = id
    this.scene = scene
    this.scene.add.existing(this)
    this.scene.physics.add.existing(this)
    this.body.debugBodyColor = 0xffffff
    this.x = x
    this.y = y
    this.life = life
    this.maxLife = maxLife
    this.reach = reach
    this.owner = owner
    this.setRotation(Phaser.Math.DegToRad(angle))
    this.color = color
  }

  getDisplayWidth() {
    return this.displayWidth
  }

  getDisplayHeight() {
    return this.displayHeight
  }

  getReach() {
    return this.reach
  }

  addProgressBar() {
    this.progressBar = this.scene.add.graphics()
    this.progressBar.fillStyle(0x01c9cf, 1)
    this.progressBar.fillRect(this.x - 20, this.y + 25, 40 * (this.life / this.maxLife), 5)
  }

  destroyProgressBar() {
    this.progressBar?.destroy()
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
      this.play(this.textures.moving)
      this.state = 'MOVING'
      this.scene.physics.moveToObject(this, this.destination, 50)
      const angle = Phaser.Math.Angle.Between(
        this.x,
        this.y,
        this.destination.x,
        this.destination.y
      )
      this.setRotation(angle + Phaser.Math.DegToRad(90))
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
    this.play(this.textures.stopped)
    this.state = 'STOPPED'
    this.destination = undefined
    this.target = undefined
  }

  setDamage(damage: number): void {
    this.life -= damage
    if (this.life <= 0) {
      this.destroy()
    } else {
      if (this.hitTimer) {
        this.hitTimer.destroy()
        this.setAlpha(1)
      }
      this.hitTimer = this.scene.time.addEvent({
        delay: 50,
        callback: () => {
          if ((this.hitTimer?.getRepeatCount() ?? 0) > 5) {
            this.alpha = this.alpha - 0.1
          } else {
            this.alpha = this.alpha + 0.1
          }
        },
        repeat: 10,
      })
    }
  }

  destroy(): void {
    this.state = 'DESTROYED'
    this.scene?.addExplosion(this.x, this.y)
    this.destroyProgressBar()
    this.hitTimer?.destroy()
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
