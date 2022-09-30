import { SpaceshipsTypes } from 'interfaces/shared'

import BaseSpaceship, { BaseSpaceshipProps } from './base'

class Slow extends BaseSpaceship {
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
      maxLife: 900,
      life: 900,
      reach: 65,
      angle,
      owner,
      id,
      spaceshipName: SpaceshipsTypes.SLOW,
      color,
    })
    this.setCircle(85)
    this.setOrigin(0.5, 0.38)
    this.setDisplaySize(40.92, 60)
  }

  update(): Slow {
    super.update()
    return this
  }

  getClass() {
    return Slow
  }
}

export default Slow
