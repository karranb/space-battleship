import 'phaser'
import axios from 'axios'

import AFewJumpsAwayMP3 from 'assets/a-few-jumps-away.mp3'
import AFewJumpsAwayOGG from 'assets/a-few-jumps-away.ogg'
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
  private music?: Phaser.Sound.WebAudioSound
  private volume = 0.5
  private firstInteraction = false

  constructor() {
    super(SCENES.Identification)
    try {
      const storagedValue = getFromLocalStorage(StorageKeys.volume)
      if (storagedValue) {
        this.volume = Number(storagedValue)
      }
    } catch (err) {
      console.error(err)
    }
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
      console.error(err)
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
        this.fadeOutMusic()
        this.redirect(SCENES.Room, {
          webSocketClient: this.socketHandler?.getWebSocketClient(),
          countryCode,
          volume: this.volume,
        })
      }
    }

    const handleError = (...props: any[]) => {
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

    const handleVersusComputerClick = () => {
      this.redirect(SCENES.ShipsSelect, {
        volume: this.volume,
        music: this.music,
        fadeOutMusic: this.fadeOutMusic,
      })
    }

    const handleAboutClick = () => this.redirect(SCENES.About)

    const handleMuteClick = () => {
      const isMuted = !this.UI?.getProps()?.isMuted
      this.UI?.updateProps({
        isMuted,
      })
      this.volume = isMuted ? 0 : 0.5

      setToLocalStorage(StorageKeys.volume, `${this.volume}`)
      this.music?.setVolume(this.volume)
    }

    this.UI = new IdentificationUI(this, {
      defaultName,
      error,
      handleAboutClick,
      handleCloseMessage,
      handleSubmit,
      handleVersusComputerClick,
      handleMuteClick,
      showLoading: false,
    })
  }

  fadeOutMusic = () => {
    if (!this.music) {
      return
    }
    const music = this.music
    this.music = undefined
    const interval = setInterval(() => {
      const newVolume = music.volume - 0.05
      if (newVolume <= 0) {
        music.stop()
        clearInterval(interval)
        return
      }
      music.setVolume(newVolume)
    }, 100)
  }

  async init(data: { error: ErrorTypes }): Promise<void> {
    this.returnKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
    const defaultName = getFromLocalStorage(StorageKeys.username) ?? 'Guest'
    const countryCode = await this.getCountryCode()
    this.setupUI(data.error, defaultName, countryCode)
    this.returnKey?.on('down', () => this.UI?.submit())
  }

  playTheme() {
    if (!this.music) {
      this.music = this.sound.add('menu_theme') as Phaser.Sound.WebAudioSound
    }
    this.music.play({ volume: this.volume })
  }

  setupMusic() {
    const loader = this.load.audio('menu_theme', [AFewJumpsAwayOGG, AFewJumpsAwayMP3])
    loader.start()

    const handleFirstUserInteraction = () => {
      this.firstInteraction = true
      this.playTheme()
      window.removeEventListener('scroll', handleFirstUserInteraction)
      window.removeEventListener('click', handleFirstUserInteraction)
    }
    if (!this.firstInteraction) {
      window.addEventListener('scroll', handleFirstUserInteraction)
      window.addEventListener('click', handleFirstUserInteraction)
    }
  }

  create(): void {
    // hack to hide the searchbar
    setTimeout(() => window.scrollTo(0, 100), 100)

    if (!this.music) {
      this.setupMusic()

      // hack to try to start music
      setTimeout(() => this.playTheme(), 100)
    }
  }
}

export default Identification
