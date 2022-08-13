import { SpaceshipsTypes } from 'interfaces/shared'
import BaseSpaceship, { BaseSpaceshipProps } from './base'

class Fast extends BaseSpaceship {
  constructor({
    scene,
    x = 0,
    y = 0,
    angle = 0,
    owner,
    id,
    color,
  }: Pick<BaseSpaceshipProps, 'angle' | 'scene' | 'x' | 'y' | 'color' | 'owner' | 'id'>) {
    super({
      scene,
      x,
      y,
      maxLife: 300,
      life: 300,
      reach: 160,
      angle,
      owner,
      id,
      spaceshipName: SpaceshipsTypes.FAST,
      color,
    })
    this.setCircle(85)
    this.setOrigin(0.5, 0.42)
    this.setDisplaySize(42.6, 60)
  }

  update(): Fast {
    super.update()
    return this
  }
}

export default Fast
