import 'phaser'
import { Socket } from 'socket.io-client'

import i18next from 'i18next'
import { SpaceshipsTypes, WeaponTypes } from 'interfaces/shared'
import BaseSpaceship from 'models/spaceships/base'
import { getRandomItem } from 'utils/array'
import { SCENES } from 'utils/constants'
import BaseScene from 'utils/phaser'

import SpaceshipSelectSocketHandler from './socket'
import ShipsSelectUI from './ui'

class ShipsSelect extends BaseScene {
  private elements: BaseSpaceship[] = []
  private challenger?: string
  private challenged?: string
  private UI?: ShipsSelectUI
  private socketHandler?: SpaceshipSelectSocketHandler
  private challengerName?: string
  private challengedName?: string

  constructor() {
    super(SCENES.ShipsSelect)
  }

  clearData(): void {
    this.socketHandler = undefined
  }

  init(data: {
    webSocketClient?: Socket
    challenger: string
    challenged: string
    challengedName: string
    challengerName: string
  }): void {
    this.challenged = data.challenged
    this.challenger = data.challenger
    this.challengerName = data.challengerName
    this.challengedName = data.challengedName
    this.setupUI(data.challenger, data.webSocketClient)
  }

  setupUI(challenger: string, webSocketClient?: Socket) {
    const spaceships = {
      '0': 1,
      '1': 1,
      '2': 1,
    }

    const onSpaceshipChange = (index: string, value: number) => {
      if (this.UI) {
        const currentSpaceships = this.UI.getProps()?.spaceships as Record<string, number>
        this.UI.updateProps({
          spaceships: { ...currentSpaceships, [index]: value },
        })
      }
    }

    const getMyChoices = () => {
      const choices = this.UI?.getProps()?.spaceships as Record<string, number>
      return Array(3)
        .fill(null)
        .reduce(
          (acc, _, index) => ({
            ...acc,
            [index]: {
              spaceship: Object.values(SpaceshipsTypes)[choices[index]],
              weapon: getRandomItem(Object.values(WeaponTypes)),
            },
          }),
          {}
        )
    }

    const getRandomChoices = () => {
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

    if (webSocketClient) {
      this.socketHandler = new SpaceshipSelectSocketHandler(webSocketClient)
      this.UI = new ShipsSelectUI(this, {
        spaceships,
        onSpaceshipChange,
        isChallenger: this.socketHandler.isChallenger(challenger),
        handleSubmit: () => {
          this.socketHandler?.sendDone(getMyChoices())
          this.UI?.setIsWaitingOponent()
        },
        handleGiveUp: () => this.socketHandler?.sendGiveUp(),
        timer: 15,
      })
      return
    }
    const isChallenger = getRandomItem([true, false])
    this.UI = new ShipsSelectUI(this, {
      spaceships,
      onSpaceshipChange,
      isChallenger,
      handleSubmit: () => {
        const myChoices = getMyChoices()
        const enemyChoices = getRandomChoices()
        this.redirect(SCENES.Game, {
          spaceships,
          isChallenger,
          challengerName: isChallenger ? i18next.t('You') : i18next.t('Enemy'),
          challengedName: isChallenger ? i18next.t('Enemy') : i18next.t('You'),
          choices: {
            challenger: isChallenger ? myChoices : enemyChoices,
            challenged: isChallenger ? enemyChoices : myChoices,
          },
        })
      },
      handleGiveUp: () => this.redirect(SCENES.Identification),
      timer: 0,
    })
  }

  setupWebsocketListeners = (): void => {
    const handleCloseGame = (message: unknown) => {
      const { user } = message as { user: string }
      this.redirect(SCENES.Room, {
        webSocketClient: this.socketHandler?.getWebSocketClient(),
        reason: user === this.socketHandler?.getWebSocketClient().id ? undefined : 'ENEMY_GAVE_UP',
      })
    }

    const handleSetChoices = (value: unknown) => {
      const choices = value
      this.redirect(SCENES.Game, {
        webSocketClient: this.socketHandler?.getWebSocketClient(),
        challenged: this.challenged,
        challenger: this.challenger,
        choices: choices,
        challengerName: this.challengerName,
        challengedName: this.challengedName,
        isChallenger: this.socketHandler?.isChallenger?.(this.challenger),
      })
    }

    const handleDisconnect = () => {
      this.redirect(SCENES.Identification)
    }

    this.socketHandler?.createShipSelectSocketHandler({
      handleCloseGame,
      handleSetChoices,
      handleDisconnect,
    })
  }

  create(): void {
    this.setupWebsocketListeners()
  }

  update(): void {
    this.elements.forEach(element => (element.rotation += 0.02))
  }
}

export default ShipsSelect
