import { Choices } from 'core/game/types'
import { SpaceshipsTypes, WeaponTypes } from 'interfaces/shared'
import { getRandomItem } from './array'

export function getRandomChoices(): Choices {
  return Array(3)
    .fill(null)
    .reduce(
      (acc, _, index) => ({
        ...acc,
        [index]: {
          spaceship: getRandomItem(Object.values(SpaceshipsTypes)),
          weapon: getRandomItem(Object.values(WeaponTypes)),
        },
      }),
      {}
    )
}
