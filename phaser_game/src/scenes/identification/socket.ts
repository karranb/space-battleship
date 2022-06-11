import { io } from 'socket.io-client'
import { Commands } from 'shared'
import { BaseSocketHandler } from 'utils/socket'

class IdentificationSocketHandler extends BaseSocketHandler {
  public constructor(url: string) {
    super(io(url))
  }

  public sendName(name: string): void {
    this.send(Commands.NAME, name)
  }

  public createIdentificationSocketHandler(
    handleNameMessage: (name: string) => void,
    handleSocketOpen: () => void
  ): void {
    const socketMessageHandlers = {
      [Commands.NAME]: handleNameMessage,
    }
    this.setSocketListeners(socketMessageHandlers, handleSocketOpen, () => null)
  }
}

export default IdentificationSocketHandler
