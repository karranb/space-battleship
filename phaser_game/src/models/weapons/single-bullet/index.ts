import BaseSpaceship from 'models/spaceships/base'
import { HEIGHT, WIDTH } from 'utils/constants'

class SingleBullet extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body

  private destination: Phaser.Math.Vector2
  private owner: BaseSpaceship
  private destroyed = false
  private damage = 300

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    destination: Phaser.Math.Vector2,
    owner: BaseSpaceship
  ) {
    super(scene, x, y, 'bullet')
    this.owner = owner
    this.destination = destination
    this.scene.add.existing(this)
    this.scene.physics.add.existing(this)
    this.setDisplaySize(50, 50)
    this.body.setSize(40, 40)
    this.setCircle(10, 40, 40)
    const angle = Phaser.Math.Angle.Between(this.destination.x, this.destination.y, this.x, this.y)
    this.setRotation(angle)
    this.scene.physics.moveToObject(this, this.destination, 150)
  }

  getDestination() {
    return this.destination
  }

  getIsDestroyed(): boolean {
    return this.destroyed
  }

  destroy(): void {
    this.destroyed = true
    super.destroy()
  }

  getDamage(): number {
    return this.damage
  }

  getOwner(): BaseSpaceship {
    return this.owner
  }

  update(): void {
    if (this.x < 0 || this.x > WIDTH - 220 || this.y < 0 || this.y > HEIGHT) {
      this.destroy()
    }
  }
}

export default SingleBullet
