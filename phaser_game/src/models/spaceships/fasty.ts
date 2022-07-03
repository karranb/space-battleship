import BaseSpaceship, { BaseSpaceshipProps } from './base'

class Fasty extends BaseSpaceship {
  constructor({
    textures,
    scene,
    x = 0,
    y = 0,
    angle = 0,
    owner,
    id,
  }: Pick<BaseSpaceshipProps, 'angle' | 'scene' | 'x' | 'y' | 'textures' | 'owner' | 'id'>) {
    super({ textures, scene, x, y, maxLife: 400, life: 400, speed: 7, angle, owner, id })
  }

  update(): Fasty {
    super.update()
    return this
  }
}

export default Fasty
