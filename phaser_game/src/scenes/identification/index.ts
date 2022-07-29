import 'phaser'

import { Commands } from 'interfaces/shared'
import { ErrorTypes, SCENES } from 'utils/constants'

import IdentificationSocketHandler from './socket'
import IdentificationUI from './ui'

class Identification extends Phaser.Scene {
  private UI?: IdentificationUI
  private returnKey?: Phaser.Input.Keyboard.Key
  private socketHandler?: IdentificationSocketHandler

  constructor() {
    super(SCENES.Identification)
  }

  init(data: { error: ErrorTypes }): void {
    this.returnKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
    const defaultName = localStorage.getItem('username') ?? 'Guest'
    const handleSubmit = (value: string): void => {
      localStorage.setItem('username', value)
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

      const handleError = () => {
        this.UI?.updateProps({ showLoading: false, error: ErrorTypes.not_able_to_connect })
      }

      this.socketHandler.createIdentificationSocketHandler(
        handleNameMessage,
        handleSocketOpen,
        handleError
      )
    }

    const handleCloseMessage = () => {
      this.UI?.updateProps({ error: undefined })
    }

    this.returnKey?.on('down', () => this.UI?.submit())
    this.UI = new IdentificationUI(this, {
      defaultName,
      showLoading: false,
      handleSubmit,
      handleCloseMessage,
      error: data?.error,
    })
  }

  create(): void {
    setTimeout(() => {
      window.scrollTo(0, 100)
    }, 100)
  }
}

export default Identification
