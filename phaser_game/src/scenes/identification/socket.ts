import { Commands, VERSION } from 'interfaces/shared'
import { io } from 'socket.io-client'
import { BaseSocketHandler } from 'utils/socket'

class IdentificationSocketHandler extends BaseSocketHandler {
  public constructor(url: string) {
    super(io(url))
  }

  public sendName(name: string): void {
    this.send(Commands.NAME, JSON.stringify({ name, version: VERSION }))
  }

  public createIdentificationSocketHandler(
    handleNameMessage: (name: string) => void,
    handleSocketOpen: () => void,
    handleError: (message: string) => void
  ): void {
    const socketMessageHandlers = {
      [Commands.COMMAND_PROCESSED]: handleNameMessage,
      [Commands.COMMAND_ERROR]: handleError,
    }
    this.setSocketListeners(socketMessageHandlers, handleSocketOpen, () => null)
  }
}

export default IdentificationSocketHandler
