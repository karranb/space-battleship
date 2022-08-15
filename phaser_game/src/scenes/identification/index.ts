import 'phaser'

import { Commands } from 'interfaces/shared'
import { ErrorTypes, SCENES } from 'utils/constants'
import axios from 'axios'
import IdentificationSocketHandler from './socket'
import IdentificationUI from './ui'

class Identification extends Phaser.Scene {
  private UI?: IdentificationUI
  private returnKey?: Phaser.Input.Keyboard.Key
  private socketHandler?: IdentificationSocketHandler

  constructor() {
    super(SCENES.Identification)
  }

  async getCountryCode() {
    // const storageCountryCode = localStorage.getItem('countryCode')
    // if (storageCountryCode) {
    //   return storageCountryCode
    // }

    return axios
      .get('https://server.spacesbattleship.com/country')
      .then(response => {
        const code = response.data
        localStorage.setItem('countryCode', code)
        return code
      })
      .catch(() => '')
  }

  async init(data: { error: ErrorTypes }): Promise<void> {
    this.returnKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
    const defaultName = localStorage.getItem('username') ?? 'Guest'
    const countryCode = await this.getCountryCode()
    const handleSubmit = (value: string): void => {
      localStorage.setItem('username', value)
      this.UI?.updateProps({ showLoading: true })
      this.socketHandler = new IdentificationSocketHandler(import.meta.env.VITE_SOCKET_SERVER)

      const handleSocketOpen = (): void => this.socketHandler?.sendName(value, countryCode)

      const handleNameMessage = (message: string): void => {
        const { command } = JSON.parse(message)
        if (command === Commands.NAME) {
          this.scene.start(SCENES.Room, {
            webSocketClient: this.socketHandler?.getWebSocketClient(),
            countryCode,
          })
        }
      }

      const handleError = (...props: any[]) => {
        // eslint-disable-next-line no-console
        console.error('error', props)
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

    const handleVersusComputerClick = () => this.scene.start(SCENES.ShipsSelect)

    const handleAboutClick = () => this.scene.start(SCENES.About)

    this.returnKey?.on('down', () => this.UI?.submit())

    this.UI = new IdentificationUI(this, {
      defaultName,
      showLoading: false,
      handleSubmit,
      handleCloseMessage,
      error: data?.error,
      handleVersusComputerClick,
      handleAboutClick,
    })
  }

  create(): void {
    setTimeout(() => {
      window.scrollTo(0, 100)
    }, 100)
  }
}

export default Identification
