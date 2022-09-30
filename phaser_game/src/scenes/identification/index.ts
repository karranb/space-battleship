import 'phaser'
import axios from 'axios'

import { Commands, ProcessedCommandMessage } from 'interfaces/shared'
import { ErrorTypes, SCENES, StorageKeys } from 'utils/constants'
import BaseScene from 'utils/phaser'
import { getFromLocalStorage, setToLocalStorage } from 'utils/storage'

import IdentificationSocketHandler from './socket'
import IdentificationUI from './ui'

class Identification extends BaseScene {
  private UI?: IdentificationUI
  private returnKey?: Phaser.Input.Keyboard.Key
  private socketHandler?: IdentificationSocketHandler

  constructor() {
    super(SCENES.Identification)
  }

  clearData(): void {
    this.UI = undefined
    this.returnKey = undefined
    this.socketHandler = undefined
  }

  async getCountryCode() {
    try {
      const storageCountryCode = getFromLocalStorage(StorageKeys.countryCode)
      if (storageCountryCode) {
        return storageCountryCode
      }
    } catch (err) {
      null
    }

    return axios
      .get(`${process.env.VITE_SOCKET_SERVER}/country`)
      .then(response => {
        const code = response.data
        setToLocalStorage(StorageKeys.countryCode, code)
        return code
      })
      .catch(() => '')
  }

  connectToServer(value: string, countryCode: string) {
    try {
      setToLocalStorage(StorageKeys.username, value)
    } catch (err) {
      null
    }
    this.UI?.updateProps({ showLoading: true })
    this.socketHandler = new IdentificationSocketHandler(import.meta.env.VITE_SOCKET_SERVER)

    const handleSocketOpen = (): void => this.socketHandler?.sendName(value, countryCode)

    const handleNameMessage = (message: unknown): void => {
      const { command } = message as ProcessedCommandMessage
      if (command === Commands.NAME) {
        this.redirect(SCENES.Room, {
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

  setupUI(error: ErrorTypes, defaultName: string, countryCode: string) {
    const handleSubmit = (value: string) => this.connectToServer(value, countryCode)

    const handleCloseMessage = () => {
      this.UI?.updateProps({ error: undefined })
    }

    const handleVersusComputerClick = () => this.redirect(SCENES.ShipsSelect)

    const handleAboutClick = () => this.redirect(SCENES.About)

    this.UI = new IdentificationUI(this, {
      defaultName,
      error,
      handleAboutClick,
      handleCloseMessage,
      handleSubmit,
      handleVersusComputerClick,
      showLoading: false,
    })
  }

  async init(data: { error: ErrorTypes }): Promise<void> {
    this.returnKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
    const defaultName = getFromLocalStorage(StorageKeys.username) ?? 'Guest'
    const countryCode = await this.getCountryCode()
    this.setupUI(data.error, defaultName, countryCode)
    this.returnKey?.on('down', () => this.UI?.submit())
  }

  create(): void {
    // hack to try to hide the search bar
    setTimeout(() => {
      window.scrollTo(0, 100)
    }, 100)
  }
}

export default Identification
