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
    if (data.webSocketClient) {
      this.socketHandler = new SpaceshipSelectSocketHandler(data.webSocketClient)
      this.UI = new ShipsSelectUI(this, {
        isChallenger: this.socketHandler.isChallenger(data.challenger),
        handleSubmit: () => {
          this.socketHandler?.sendDone()
          this.UI?.setIsWaitingOponent()
        },
        handleGiveUp: () => this.socketHandler?.sendGiveUp(),
        timer: 15,
      })
    } else {
      const isChallenger = getRandomItem([true, false])
      this.UI = new ShipsSelectUI(this, {
        isChallenger,
        handleSubmit: () =>
          this.scene.start(SCENES.Game, {
            isChallenger,
            challengerName: isChallenger ? i18next.t('You') : i18next.t('Enemy'),
            challengedName: isChallenger ? i18next.t('Enemy') : i18next.t('You'),
            choices: Array(3)
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
              ),
          }),
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
    const handleCloseGame = () => {
      this.scene.start(SCENES.Room, {
        webSocketClient: this.socketHandler?.getWebSocketClient(),
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
