import { Socket } from 'socket.io-client'

import { Commands } from 'interfaces/shared'
import { BaseSocketHandler } from 'utils/socket'

class SpaceshipSelectocketHandler extends BaseSocketHandler {
  public constructor(webSocketClient: Socket) {
    super(webSocketClient)
  }

  public destroy(): void {
    this.webSocketClient.off()
  }

  public sendGiveUp(): void {
    this.webSocketClient.emit(Commands.CLOSE_GAME)
  }

  public sendDone(choices: Record<string, unknown>): void {
    this.webSocketClient.emit(Commands.SET_CHOICES, choices)
  }

  public isChallenger(challengerId?: string): boolean {
    return this.webSocketClient.id === challengerId
  }

  public createShipSelectSocketHandler({
    handleCloseGame,
    handleSetChoices,
    handleDisconnect,
  }: {
    handleCloseGame: (value: string) => void
    handleSetChoices: (value: string) => void
    handleDisconnect: () => void
  }): void {
    const socketMessageHandlers = {
      [Commands.CLOSE_GAME]: handleCloseGame,
      [Commands.SET_CHOICES]: handleSetChoices,
    }
    this.setSocketListeners(socketMessageHandlers, () => null, handleDisconnect)
  }
}

export default SpaceshipSelectocketHandler
