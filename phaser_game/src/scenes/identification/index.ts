import 'phaser'

import { Commands } from 'interfaces/shared'
import { SCENES } from 'utils/constants'

import IdentificationDOMHandler from './dom'
import IdentificationSocketHandler from './socket'

class Identification extends Phaser.Scene {
  private DOMHandler?: IdentificationDOMHandler
  private returnKey?: Phaser.Input.Keyboard.Key
  private socketHandler?: IdentificationSocketHandler

  constructor() {
    super(SCENES.Identification)
  }

  destroy(): void {
    this.children.destroy()
    this.socketHandler?.clearSocketListeners()
    this.returnKey?.off('down')
  }

  setupButtonListener = (): void => {
    const handleSubmit = (): void => {
      this.DOMHandler?.hideFormContainer()
      this.DOMHandler?.showLoadingContainer()
      this.socketHandler = new IdentificationSocketHandler(import.meta.env.VITE_SOCKET_SERVER)

      const handleSocketOpen = (): void =>
        this.socketHandler?.sendName(this.DOMHandler?.getNicknameInputValue() ?? '')

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

    this.DOMHandler?.setSigninButtonOnClick(handleSubmit)
    this.returnKey?.on('down', handleSubmit)
  }

  init(): void {
    this.DOMHandler = new IdentificationDOMHandler(this)
    this.returnKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
  }

  create(): void {
    this.setupButtonListener()

    setTimeout(() => {
      window.scrollTo(0, 1)
    }, 1000)
  }
}

export default Identification
