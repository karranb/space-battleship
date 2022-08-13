import { SpaceshipsTypes } from 'interfaces/shared'
import BaseSpaceship, { BaseSpaceshipProps } from './base'

class Regular extends BaseSpaceship {
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
      maxLife: 600,
      life: 600,
      reach: 90,
      angle,
      owner,
      id,
      spaceshipName: SpaceshipsTypes.REGULAR,
      color,
    })
    this.setDisplaySize(36.8, 50)
    this.setOrigin(0.5, 0.44)
    this.setCircle(80, -15)
  }

  update(): Regular {
    super.update()
    return this
  }
}

export default Regular
