import { Socket } from 'socket.io-client'
import { Commands } from 'interfaces/shared'
import { BaseSocketHandler } from 'utils/socket'

class GameSocketHandler extends BaseSocketHandler {
  public constructor(webSocketClient: Socket) {
    super(webSocketClient)
  }

  public destroy(): void {
    this.webSocketClient.off()
  }

  public sendClose(message: string): void {
    this.webSocketClient.emit(Commands.CLOSE_GAME, message)
  }

  public sendPlayerReady(): void {
    this.webSocketClient.emit(Commands.SET_PLAYER_READY)
  }

  public sendSetDestination(spaceship: number, x: number, y: number): void {
    this.webSocketClient.emit(
      Commands.SET_SPACESHIP_DESTINATION,
      JSON.stringify({ spaceship, x, y })
    )
  }

  public sendSetTarget(spaceship: number, x: number, y: number): void {
    this.webSocketClient.emit(Commands.SET_SPACESHIP_TARGET, JSON.stringify({ spaceship, x, y }))
  }

  public sendRoundStarted(): void {
    this.webSocketClient.emit(Commands.ROUND_STARTED)
  }

  public sendPrivateMessage(value: string): void {
    this.webSocketClient.emit(Commands.PRIVATE_MESSAGE, value)
  }

  public sendGiveUp(): void {
    this.webSocketClient.emit(Commands.CLOSE_GAME)
  }

  public isMe(id: string): boolean {
    return this.webSocketClient.id === id
  }

  public createGameSocketHandler({
    handleCommandProcessed,
    handleSetPlayerReady,
    handlePrivateMessage,
    handleCloseGame,
    handleRoundStarted,
    handleDisconnect,
  }: {
    handleCloseGame: (value: string) => void
    handleRoundStarted: (value: string) => void
    handleCommandProcessed: (value: string) => void
    handlePrivateMessage: (value: string) => void
    handleSetPlayerReady: (value: string) => void
    handleDisconnect: () => void
  }): void {
    const socketMessageHandlers = {
      [Commands.COMMAND_PROCESSED]: handleCommandProcessed,
      [Commands.SET_PLAYER_READY]: handleSetPlayerReady,
      [Commands.PRIVATE_MESSAGE]: handlePrivateMessage,
      [Commands.ROUND_STARTED]: handleRoundStarted,
      [Commands.CLOSE_GAME]: handleCloseGame,
    }
    this.setSocketListeners(socketMessageHandlers, () => null, handleDisconnect)
  }
}

export default GameSocketHandler
