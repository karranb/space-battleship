import 'phaser'
import { Socket } from 'socket.io-client'

import i18next from 'i18n'
import { User, UsersIndex } from 'interfaces/shared'
import { ErrorTypes, SCENES, StorageKeys } from 'utils/constants'
import { getFromLocalStorage, setToLocalStorage } from 'utils/storage'
import { debounce } from 'utils/ui'

import RoomSocketHandler from './socket'
import RoomUI from './ui'

class Room extends Phaser.Scene {
  private UI?: RoomUI
  private socketHandler?: RoomSocketHandler
  private returnKey?: Phaser.Input.Keyboard.Key
  private reason?: string
  private countryCode?: string

  constructor() {
    super(SCENES.Room)
  }

  init(data: { webSocketClient: Socket; reason?: string; countryCode?: string }): void {
    this.socketHandler = new RoomSocketHandler(data.webSocketClient)
    this.returnKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
    this.reason = data.reason
    this.countryCode = data.countryCode ?? getFromLocalStorage(StorageKeys.countryCode) ?? ''
  }

  setupWebsocketListeners = (): void => {
    const handleGetUsersList = (value: unknown): void => {
      const users = (value as User[]).reduce(
        (acc: UsersIndex, user: User) => ({
          ...acc,
          [user.id]: { name: user.name, isPlaying: user.isPlaying, countryCode: user.countryCode },
        }),
        {} as UsersIndex
      )
      this.UI?.updateUsers(users)
    }

    const handleUserDisconnected = (value: unknown): void => {
      this.UI?.addQuittedMessage(value as string)
      this.UI?.removeUser(value as string)
    }

    const handleCloseChallenge = (value: unknown): void => {
      const { challengeId, reason } = value as { challengeId: string; reason: string }
      if (reason === 'TIMEOUT') {
        this.UI?.setChallengeClosedMessage(challengeId, i18next.t('The challenge timed out'))
        return
      }
      const name = this.socketHandler?.isMe(reason) ? i18next.t('You') : i18next.t('The opponent')
      this.UI?.setChallengeClosedMessage(
        challengeId,
        `${name ?? i18next.t('The opponent')} ${i18next.t('canceled the challenge')}`
      )
    }

    const handleErrorChallenge = (value: unknown): void => {
      const { message } = value as { message: string }
      this.UI?.addErrorMessage(message)
    }

    const handleAcceptChallenge = (message: unknown): void => {
      const { challenger, challenged } = message as { challenger: string; challenged: string }
      const challengerName = this.UI?.getUserName(challenger)
      const challengedName = this.UI?.getUserName(challenged)
      this.scene.start(SCENES.ShipsSelect, {
        webSocketClient: this.socketHandler?.getWebSocketClient(),
        challenged,
        challenger,
        challengerName,
        challengedName,
      })
    }

    const handleChallenge = (value: unknown): void => {
      const { challengeId, challengerId, challengedId } = value as {
        challengeId: string
        challengerId: string
        challengedId: string
      }
      if (this.socketHandler?.isMe(challengedId)) {
        this.UI?.addChallengedMessage(challengerId, challengeId)
        return
      }
      if (this.socketHandler?.isMe(challengerId)) {
        this.UI?.addChallengerMessage(challengedId, challengeId)
      }
    }

    const handleUserConnected = (value: unknown): void => {
      const item = value as User
      this.UI?.updateUsers({
        ...this.UI.getUsers(),
        [item.id]: {
          name: item.name,
          isPlaying: item.isPlaying,
          countryCode: item.countryCode,
        },
      })
      this.UI?.addJoinedMessage(item.name)
    }

    const handleRoomMessage = (value: unknown): void => {
      const { id, message } = value as { id: string; message: string }
      this.UI?.addUserMessage(id, message)
    }

    const handleDisconnect = () => {
      this.scene.start(SCENES.Identification, { error: ErrorTypes.disconnected })
    }

    const handleUserIsPlaying = (socketId: string) => {
      this.UI?.updateUserIsPlaying(socketId, true)
      this.UI?.addJoinedAGameMessage(socketId)
    }

    const handleUserIsBackFromGame = (socketId: string) => {
      this.UI?.updateUserIsPlaying(socketId, false)
      this.UI?.addBackFromGameMessage(socketId)
    }

    const handleUpdateCountryCode = (value: unknown) => {
      const { id, countryCode } = value as { id: string; countryCode: string }
      this.UI?.updateUserCountryCode(id, countryCode)
    }

    this.socketHandler?.createRoomSocketHandler({
      handleGetUsersList,
      handleUserDisconnected,
      handleUserConnected,
      handleRoomMessage,
      handleChallenge,
      handleAcceptChallenge,
      handleCloseChallenge,
      handleUpdateCountryCode,
      handleErrorChallenge,
      handleDisconnect,
      handleUserIsBackFromGame,
      handleUserIsPlaying,
    })
  }

  setupButtonListeners = (): void => {
    const handleSubmitMessage = (message?: string): void => {
      this.socketHandler?.sendMessage(message ?? '')
    }

    const handleSubmitChallenge = (selectedValue?: string): void => {
      if (!selectedValue) {
        this.UI?.addErrorMessage(i18next.t('You need to select someone to challenge'))
        return
      }
      if (this.socketHandler?.isMe(selectedValue)) {
        this.UI?.addErrorMessage(i18next.t("You can't challenge yourself, select someone else"))
        return
      }
      this.socketHandler?.sendChallenge(selectedValue)
    }

    this.UI = new RoomUI(this, {
      handleSubmitChallenge,
      handleSubmitMessage,
      handleGoBack: () => {
        this.socketHandler?.close()
        this.scene.start(SCENES.Identification)
      },
      handleUpdateFlag: (countryCode: string) => {
        this.socketHandler?.sendUpdateFlag(countryCode)
        setToLocalStorage(StorageKeys.countryCode, countryCode)
        this.UI?.updateProps({ countryCode })
      },
      handleRefuseChallengeClick: (id: string) => this.socketHandler?.sendMessageRefuse(id),
      handleAcceptChallengeClick: (id: string) => this.socketHandler?.sendMessageAccept(id),
      handleCloseChallengeClick: (id: string) => this.socketHandler?.sendMessageCancel(id),
      handleCloseMessage: () => {
        this.UI?.updateProps({ reason: undefined })
      },
      reason: this.reason,
      countryCode: this.countryCode ?? '',
    })

    this.returnKey?.on(
      'down',
      debounce(() => this.UI?.sendMessage())
    )
  }

  create(): void {
    this.setupButtonListeners()
    this.setupWebsocketListeners()
    this.socketHandler?.sendGetUsersList()
  }
}

export default Room
