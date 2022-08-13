import 'phaser'
import { Socket } from 'socket.io-client'
import { SCENES } from 'utils/constants'
import BaseSpaceship from 'models/spaceships/base'
import ShipsSelectUI from './ui'
import SpaceshipSelectSocketHandler from './socket'
import { getRandomItem } from 'utils/array'
import { SpaceshipsTypes, WeaponTypes } from 'interfaces/shared'
import i18next from 'i18next'

class ShipsSelect extends Phaser.Scene {
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

  init(data: {
    webSocketClient?: Socket
    challenger: string
    challenged: string
    challengedName: string
    challengerName: string
  }): void {
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
    if (data.webSocketClient) {
      this.socketHandler = new SpaceshipSelectSocketHandler(data.webSocketClient)
      this.UI = new ShipsSelectUI(this, {
        isChallenger: this.socketHandler.isChallenger(data.challenger),
        handleSubmit: () => {
          const choices = this.UI?.getProps()?.spaceships as Record<string, number>
          this.socketHandler?.sendDone(
            Array(3)
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
          )
          this.UI?.setIsWaitingOponent()
        },
        handleGiveUp: () => this.socketHandler?.sendGiveUp(),
        timer: 15,
        spaceships,
        onSpaceshipChange,
      })
    } else {
      const isChallenger = getRandomItem([true, false])
      this.UI = new ShipsSelectUI(this, {
        spaceships,
        onSpaceshipChange,
        isChallenger,
        handleSubmit: () => {
          const choices = this.UI?.getProps()?.spaceships as Record<string, number>
          const myChoices = Array(3)
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
          const enemyChoices = Array(3)
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
          this.scene.start(SCENES.Game, {
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

        handleGiveUp: () => this.scene.start(SCENES.Identification),
        timer: 0,
      })
    }
    this.challenged = data.challenged
    this.challenger = data.challenger
    this.challengerName = data.challengerName
    this.challengedName = data.challengedName
  }

  setupWebsocketListeners = (): void => {
    const handleCloseGame = (message: string) => {
      const { user } = JSON.parse(message)
      this.scene.start(SCENES.Room, {
        webSocketClient: this.socketHandler?.getWebSocketClient(),
        reason: user === this.socketHandler?.getWebSocketClient().id ? undefined : 'ENEMY_GAVE_UP',
      })
    }

    const handleSetChoices = (value: string) => {
      const choices = JSON.parse(value)
      this.scene.start(SCENES.Game, {
        webSocketClient: this.socketHandler?.getWebSocketClient(),
        challenged: this.challenged,
        challenger: this.challenger,
        choices: choices,
        challengerName: this.challengerName,
        challengedName: this.challengedName,
      })
    }

    const handleDisconnect = () => {
      this.scene.start(SCENES.Identification)
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
