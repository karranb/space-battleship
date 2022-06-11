import { Socket } from 'socket.io-client'
import { Commands } from 'shared'
import { BaseSocketHandler } from 'utils/socket'

class RoomSocketHandler extends BaseSocketHandler {
  public constructor(webSocketClient: Socket) {
    super(webSocketClient)
  }

  public destroy(): void{
    this.webSocketClient.off()
  }

  public sendMessageRefuse(id: string): void {
    this.webSocketClient.emit(Commands.CHALLENGE_REFUSE, id)
  }

  public sendMessageAccept(id: string): void {
    this.webSocketClient.emit(Commands.CHALLENGE_ACCEPT, id)
  }

  public sendMessageCancel(id: string): void {
    this.webSocketClient.emit(Commands.CHALLENGE_CANCEL, id)
  }

  public sendChallenge(id: string): void {
    this.webSocketClient.emit(Commands.CHALLENGE, id)
  }

  public sendMessage(value: string): void {
    this.webSocketClient.emit(Commands.ROOM_MESSAGE, value)
  }

  public sendGetUsersList(): void {
    this.webSocketClient.emit(Commands.GET_USERS_LIST)
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
    handleChallengeSent,
    handleAcceptChallenge,
    handleCancelChallenge,
    handleRefuseChallenge,
  }: {
    handleGetUsersList: (value: string) => void
    handleUserDisconnected: (value: string) => void
    handleUserConnected: (value: string) => void
    handleRoomMessage: (value: string) => void
    handleChallenge: (value: string) => void
    handleChallengeSent: (value: string) => void
    handleAcceptChallenge: (value: string) => void
    handleCancelChallenge: (value: string) => void
    handleRefuseChallenge: (value: string) => void
  }): void {
    const socketMessageHandlers = {
      [Commands.GET_USERS_LIST]: handleGetUsersList,
      [Commands.USER_DISCONNECTED]: handleUserDisconnected,
      [Commands.NEW_USER_SET]: handleUserConnected,
      [Commands.ROOM_MESSAGE]: handleRoomMessage,
      [Commands.CHALLENGE]: handleChallenge,
      [Commands.CHALLENGE_SENT]: handleChallengeSent,
      [Commands.CHALLENGE_ACCEPT]: handleAcceptChallenge,
      [Commands.CHALLENGE_CANCEL]: handleCancelChallenge,
      [Commands.CHALLENGE_REFUSE]: handleRefuseChallenge,
    }
    this.setSocketListeners(
      socketMessageHandlers,
      () => null,
      () => null
    )
  }
}

export default RoomSocketHandler
