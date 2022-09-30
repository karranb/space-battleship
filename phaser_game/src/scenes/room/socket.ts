import { Socket } from 'socket.io-client'

import { Commands } from 'interfaces/shared'
import { BaseSocketHandler } from 'utils/socket'

class RoomSocketHandler extends BaseSocketHandler {
  public constructor(webSocketClient: Socket) {
    super(webSocketClient)
  }

  public destroy(): void {
    this.webSocketClient.off()
  }

  public sendMessageRefuse(id: string): void {
    this.webSocketClient.emit(Commands.CHALLENGE_CLOSE, id)
  }

  public sendMessageAccept(id: string): void {
    this.webSocketClient.emit(Commands.CHALLENGE_CONFIRM, id)
  }

  public sendMessageCancel(id: string): void {
    this.webSocketClient.emit(Commands.CHALLENGE_CLOSE, id)
  }

  public sendChallenge(id: string): void {
    this.webSocketClient.emit(Commands.CHALLENGE, id)
  }

  public sendMessage(value: string): void {
    const parsedValue = value.trim()
    if (parsedValue) {
      this.webSocketClient.emit(Commands.ROOM_MESSAGE, parsedValue)
    }
  }

  public sendGetUsersList(): void {
    this.webSocketClient.emit(Commands.GET_USERS_LIST)
  }

  public sendUpdateFlag(countryCode: string): void {
    this.webSocketClient.emit(Commands.SET_COUNTRY_CODE, countryCode)
  }

  public isMe(id: string): boolean {
    return this.webSocketClient.id === id
  }

  public createRoomSocketHandler({
    handleGetUsersList,
    handleUserDisconnected,
    handleUserConnected,
    handleRoomMessage,
    handleChallenge,
    handleAcceptChallenge,
    handleCloseChallenge,
    handleErrorChallenge,
    handleDisconnect,
    handleUserIsPlaying,
    handleUserIsBackFromGame,
    handleUpdateCountryCode,
  }: {
    handleUserIsBackFromGame: (value: string) => void
    handleUserIsPlaying: (value: string) => void
    handleGetUsersList: (value: string) => void
    handleUserDisconnected: (value: string) => void
    handleUserConnected: (value: string) => void
    handleRoomMessage: (value: string) => void
    handleChallenge: (value: string) => void
    handleAcceptChallenge: (value: string) => void
    handleCloseChallenge: (value: string) => void
    handleErrorChallenge: (value: string) => void
    handleDisconnect: () => void
    handleUpdateCountryCode: (countryCode: string) => void
  }): void {
    const socketMessageHandlers = {
      [Commands.GET_USERS_LIST]: handleGetUsersList,
      [Commands.USER_DISCONNECTED]: handleUserDisconnected,
      [Commands.NEW_USER_SET]: handleUserConnected,
      [Commands.ROOM_MESSAGE]: handleRoomMessage,
      [Commands.CHALLENGE]: handleChallenge,
      [Commands.CHALLENGE_CONFIRM]: handleAcceptChallenge,
      [Commands.CHALLENGE_CLOSE]: handleCloseChallenge,
      [Commands.COMMAND_ERROR]: handleErrorChallenge,
      [Commands.USER_IS_BACK_FROM_GAME]: handleUserIsBackFromGame,
      [Commands.USER_IS_PLAYING]: handleUserIsPlaying,
      [Commands.USER_COUNTRY_CODE_SET]: handleUpdateCountryCode,
    }
    this.setSocketListeners(socketMessageHandlers, () => null, handleDisconnect)
  }
}

export default RoomSocketHandler
