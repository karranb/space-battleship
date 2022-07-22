import 'phaser'

import { Commands } from 'interfaces/shared'
import { SCENES } from 'utils/constants'

import IdentificationSocketHandler from './socket'
import IdentificationUI from './ui'

class Identification extends Phaser.Scene {
  private UI?: IdentificationUI
  private returnKey?: Phaser.Input.Keyboard.Key
  private socketHandler?: IdentificationSocketHandler

  constructor() {
    super(SCENES.Identification)
  }

  setupUI = (): void => {
    const handleSubmit = (value: string): void => {
      this.UI?.updateProps({ showLoading: true })
      this.socketHandler = new IdentificationSocketHandler(import.meta.env.VITE_SOCKET_SERVER)

      const handleSocketOpen = (): void => this.socketHandler?.sendName(value)

      const handleNameMessage = (message: string): void => {
        const { command } = JSON.parse(message)
        if (command === Commands.NAME) {
          this.scene.start(SCENES.Room, {
            webSocketClient: this.socketHandler?.getWebSocketClient(),
          })
        }
      }

      const handleError = (message: string) => {
        console.error(message)
      }

      this.socketHandler.createIdentificationSocketHandler(
        handleNameMessage,
        handleSocketOpen,
        handleError
      )
    }
    this.UI = new IdentificationUI(this, { defaultName: 'Guest', showLoading: false, handleSubmit })
    this.returnKey?.on('down', () => this.UI?.submit())
  }

  init(): void {
    this.returnKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
  }

  create(): void {
    this.setupUI()

    setTimeout(() => {
      window.scrollTo(0, 1)
    }, 1000)
  }
}

export default Identification
