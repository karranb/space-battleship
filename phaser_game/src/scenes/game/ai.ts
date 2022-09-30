import Player from 'models/player'
import BaseSpaceship from 'models/spaceships/base'
import { getRandomItem } from 'utils/array'
import { HEIGHT, WIDTH } from 'utils/constants'
import { randomNumber } from 'utils/number'

type Ghost = {
  x: number
  y: number
  destinationX?: number
  destinationY?: number
  id: number
}

const checkHasCollisions = (ships: Ghost[], bullets: Ghost[]) => {
  for (let i = 0; i < ships.length; i++) {
    const ship = ships[i]
    const bulletSafeDistance = 30
    const spaceshipSafeDistance = 55
    for (const bullet of bullets) {
      if (ship.id !== bullet.id) {
        if (
          Phaser.Math.Distance.Between(ship.x, ship.y, bullet.x, bullet.y) <= bulletSafeDistance
        ) {
          return true
        }
      }
    }
    for (const otherShip of ships.slice(i + 1)) {
      if (
        Phaser.Math.Distance.Between(ship.x, ship.y, otherShip.x, otherShip.y) <=
        spaceshipSafeDistance
      ) {
        return true
      }
    }
  }
  return false
}

const createGhost = (spaceship: BaseSpaceship, id: number, isBullet: boolean) => {
  const destination = isBullet ? spaceship.getTarget() : spaceship.getDestination()
  return {
    x: spaceship.x,
    y: spaceship.y,
    destinationX: destination?.x,
    destinationY: destination?.y,
    angle: Phaser.Math.Angle.Between(
      destination?.x ?? 0,
      destination?.y ?? 0,
      spaceship.x,
      spaceship.y
    ),
    id,
    stepTowardDestination: function () {
      if (isBullet && (this.x < 0 || this.x > WIDTH - 220 || this.y < 0 || this.y > HEIGHT)) {
        return true
      }
      if (!isBullet) {
        const distance = Phaser.Math.Distance.Between(
          this.x,
          this.y,
          this.destinationX ?? 0,
          this.destinationY ?? 0
        )
        if (distance <= 10) {
          return true
        }
      }
      const speed = isBullet ? 150 / 60 : 50 / 60
      const vx = speed * Math.cos(this.angle)
      const vy = speed * Math.sin(this.angle)
      this.x -= vx
      this.y -= vy
      return false
    },
  }
}

const checkWillCollide = (spaceships: BaseSpaceship[]) => {
  const ghostShips = spaceships.map((item, id) => createGhost(item, id, false))
  const ghostBullets = spaceships.map((item, id) => createGhost(item, id, true))
  const items = [...ghostBullets, ...ghostShips]
  const maxIterations = 200
  for (let i = 0, check = true; i < maxIterations || !check; i++) {
    const iteration = items.map(item => item.stepTowardDestination())
    check = iteration.every(item => item)
    if (checkHasCollisions(ghostShips, ghostBullets)) {
      return true
    }
  }
  return false
}

const maxXReach = 605
const minXReach = 10
const maxYReach = 385
const minYReach = 10

const setRandomPlay = (ai: Player, spaceship: BaseSpaceship, enemySpaceships: BaseSpaceship[]) => {
  const enemySpaceship = getRandomItem(enemySpaceships)
  const enemyReachX = enemySpaceship.getReach() - enemySpaceship.getDisplayWidth() / 2
  const enemyReachY = enemySpaceship.getReach() - enemySpaceship.getDisplayHeight() / 2
  const spaceshipReachX = spaceship.getReach() - spaceship.getDisplayWidth() / 2
  const spaceshipReachY = spaceship.getReach() - spaceship.getDisplayHeight() / 2

  const aimX = randomNumber(
    Math.max(enemySpaceship.x - enemyReachX, minXReach),
    Math.min(enemySpaceship.x + enemyReachX, maxXReach)
  )

  const aimY = randomNumber(
    Math.max(enemySpaceship.y - enemyReachX, minYReach),
    Math.min(enemySpaceship.y + enemyReachY, maxYReach)
  )

  const destinationX = randomNumber(
    Math.max(spaceship.x - spaceshipReachX, minXReach),
    Math.min(spaceship.x + spaceshipReachX, maxXReach)
  )
  const destinationY = randomNumber(
    Math.max(spaceship.y - spaceshipReachY, minYReach),
    Math.min(spaceship.y + spaceshipReachY, maxYReach)
  )

  ai.setSpaceshipDestination(spaceship, destinationX, destinationY)
  ai.setSpaceshipTarget(spaceship, aimX, aimY)
}

export const setAIPlay = (ai: Player, enemy: Player) => {
  const enemySpaceships = enemy.getSpaceships() ?? []
  const spaceships = ai.getSpaceships() ?? []

  let i = 0
  const maxAttempts = 100

  while (i < maxAttempts) {
    spaceships.forEach(spaceship => setRandomPlay(ai, spaceship, enemySpaceships))
    if (!checkWillCollide(spaceships)) {
      return
    }
    i++
  }
}
