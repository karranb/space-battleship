import { io } from 'socket.io-client'

import { Commands, VERSION } from 'interfaces/shared'
import { BaseSocketHandler } from 'utils/socket'

class IdentificationSocketHandler extends BaseSocketHandler {
  public constructor(url: string) {
    super(
      io(url, {
        reconnection: false,
        secure: true,
      })
    )
  }

  public sendName(name: string, countryCode: string): void {
    this.send(Commands.NAME, JSON.stringify({ name, version: VERSION, countryCode }))
  }

  public createIdentificationSocketHandler(
    handleNameMessage: (name: string) => void,
    handleSocketOpen: () => void,
    handleError: () => void
  ): void {
    const socketMessageHandlers = {
      [Commands.COMMAND_PROCESSED]: handleNameMessage,
      [Commands.COMMAND_ERROR]: handleError,
    }
    this.setSocketListeners(socketMessageHandlers, handleSocketOpen, handleError)
  }
}

export default IdentificationSocketHandler
