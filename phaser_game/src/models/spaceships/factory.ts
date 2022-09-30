import { SpaceshipsTypes } from 'interfaces/shared'
import Player from 'models/player'
import { PlayerChoices, SpaceshipIndexes } from 'scenes/game'
import { getRandomItem } from 'utils/array'

import BaseSpaceship, { BaseSpaceshipProps, SpaceshipColors } from './base'
import Fast from './fast'
import Regular from './regular'
import Slow from './slow'

export enum PlayerPosition {
  TOP = 'TOP',
  BOTTOM = 'BOTTOM',
}

type CreateSpaceshipInput = Pick<BaseSpaceshipProps, 'x' | 'y' | 'angle' | 'id' | 'color'> & {
  type: SpaceshipsTypes
  player: Player
}

const createSpaceship = ({
  x,
  y,
  angle,
  id,
  color,
  type,
  player,
}: CreateSpaceshipInput): BaseSpaceship => {
  const spaceshipProps = {
    x,
    y,
    angle,
    id,
    color,
    owner: player,
    scene: player.getScene(),
  }
  if (type === SpaceshipsTypes.FAST) {
    return new Fast(spaceshipProps)
  }
  if (type === SpaceshipsTypes.SLOW) {
    return new Slow(spaceshipProps)
  }
  return new Regular(spaceshipProps)
}

const getSpaceshipPosition = (
  position: PlayerPosition,
  index: string,
  indexesSize: number
): { x: number; y: number } => {
  const size = 50
  const center = size / 2
  const TOP_RIGHT_POSITION = {
    x: 78 + center,
    y: 8 + center,
  }

  const TOP_CENTER_POSITION = {
    x: 75 + center,
    y: 75 + center,
  }

  const TOP_LEFT_POSITION = {
    x: 28 + center,
    y: 121 + center,
  }

  const BOTTOM_LEFT_POSITION = {
    x: 480 + center,
    y: 329 + center,
  }

  const BOTTOM_CENTER_POSITION = {
    x: 483 + center,
    y: 263 + center,
  }

  const BOTTOM_RIGHT_POSITION = {
    x: 530 + center,
    y: 216 + center,
  }

  if (position === PlayerPosition.TOP) {
    if ((index === '0' && indexesSize === 3) || (index === '0' && indexesSize === 1)) {
      return TOP_CENTER_POSITION
    }

    if ((index === '1' && indexesSize === 3) || (index === '0' && indexesSize === 2)) {
      return TOP_RIGHT_POSITION
    }

    if ((index === '2' && indexesSize === 3) || (index === '1' && indexesSize === 2)) {
      return TOP_LEFT_POSITION
    }
  }

  if (position === PlayerPosition.BOTTOM) {
    if ((index === '0' && indexesSize === 3) || (index === '0' && indexesSize === 1)) {
      return BOTTOM_CENTER_POSITION
    }

    if ((index === '1' && indexesSize === 3) || (index === '0' && indexesSize === 2)) {
      return BOTTOM_LEFT_POSITION
    }

    if ((index === '2' && indexesSize === 3) || (index === '1' && indexesSize === 2)) {
      return BOTTOM_RIGHT_POSITION
    }
  }

  return {
    x: 0,
    y: 0,
  }
}

export const createSpaceships = (
  player: Player,
  position: PlayerPosition,
  choices: PlayerChoices
) => {
  const angle = position === PlayerPosition.TOP ? 120 : -60
  const indexes = Object.keys(choices) as SpaceshipIndexes[]
  const color = position === PlayerPosition.TOP ? SpaceshipColors.RED : SpaceshipColors.BLUE
  return indexes.map(index => {
    return createSpaceship({
      ...getSpaceshipPosition(position, index, indexes.length),
      id: Number(index),
      angle,
      color,
      player,
      type:
        choices?.[index]?.spaceship ??
        SpaceshipsTypes.FAST ??
        getRandomItem(Object.values(SpaceshipsTypes)),
    })
  })
}
