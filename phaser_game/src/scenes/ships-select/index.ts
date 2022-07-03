import 'phaser'
import { Socket } from 'socket.io-client'
import { SCENES } from 'utils/constants'
import BaseSpaceship from 'models/spaceships/base'
// import red1 from 'assets/spritesheet_red_1.png'
// import red1Atlas from 'assets/spritesheet_red_1.json'
import ShipsSelectDOMHandler from './dom'
import SpaceshipSelectSocketHandler from './socket'

class ShipsSelect extends Phaser.Scene {
  private elements: BaseSpaceship[] = []
  private challenger?: string
  private challenged?: string
  private DOMHandler?: ShipsSelectDOMHandler
  private socketHandler?: SpaceshipSelectSocketHandler
  private challengerName?: string
  private challengedName?: string

  constructor() {
    super(SCENES.ShipsSelect)
  }

  init(data: {
    webSocketClient: Socket
    challenger: string
    challenged: string
    challengedName: string
    challengerName: string
  }): void {
    this.socketHandler = new SpaceshipSelectSocketHandler(data.webSocketClient)
    this.DOMHandler = new ShipsSelectDOMHandler(
      this,
      this.socketHandler.isChallenger(data.challenger)
    )
    this.challenged = data.challenged
    this.challenger = data.challenger
    this.challengerName = data.challengerName
    this.challengedName = data.challengedName
  }

  setupButtonListeners() {
    this.DOMHandler?.setDoneButtonOnClick(() => {
      this.DOMHandler?.showWaitingOponent()
      this.socketHandler?.sendDone()
    })
    this.DOMHandler?.setGiveUpButtonOnClick(() => {
      this.socketHandler?.sendGiveUp()
    })
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
    this.setupButtonListeners()
    this.setupWebsocketListeners()
  }

  update(): void {
    this.elements.forEach(element => (element.rotation += 0.02))
  }
}

export default ShipsSelect
