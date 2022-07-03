import { Socket } from 'socket.io-client'
import { Commands, SpaceshipsTypes, WeaponTypes } from 'interfaces/shared'
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

  public sendDone(): void {
    this.webSocketClient.emit(
      Commands.SET_CHOICES,
      JSON.stringify({
        0: {
          spaceship: SpaceshipsTypes.SPACESHIP1,
          weapon: WeaponTypes.SINGLE_BULLET,
        },
        1: {
          spaceship: SpaceshipsTypes.SPACESHIP1,
          weapon: WeaponTypes.SINGLE_BULLET,
        },
        2: {
          spaceship: SpaceshipsTypes.SPACESHIP1,
          weapon: WeaponTypes.SINGLE_BULLET,
        },
      })
    )
  }

  public isChallenger(id: string): boolean {
    return this.webSocketClient.id === id
  }

  public createShipSelectSocketHandler({
    handleCloseGame,
    handleSetChoices,
    handleDisconnect
  }: {
    handleCloseGame: (value: string) => void
    handleSetChoices: (value: string) => void
    handleDisconnect: () => void
  }): void {
    const socketMessageHandlers = {
      [Commands.CLOSE_GAME]: handleCloseGame,
      [Commands.SET_CHOICES]: handleSetChoices,
    }
    this.setSocketListeners(
      socketMessageHandlers,
      () => null,
      handleDisconnect
    )
  }
}

export default SpaceshipSelectocketHandler
