import { Commands } from 'shared'
import { Socket } from 'socket.io-client'

export type SocketSceneOpenHandler = () => void
export type SocketSceneCloseHandler = () => void
export type SocketHandlerIndex = {
  [key in Commands]?: (value: string) => void
}

export const createSocketHandler = (
  webSocketClient: Socket,
  handleIndex: SocketHandlerIndex,
  openHandler: SocketSceneOpenHandler,
  closeHandler: SocketSceneCloseHandler
): void => {
  webSocketClient.on('connect', openHandler)
  webSocketClient.on('disconnect', closeHandler)
  Object.entries(handleIndex).forEach(([key, value]) => {
    webSocketClient.on(key, value)
  })
}

export const destroySocketHandler = (webSocketClient: Socket): void => {
  webSocketClient.off()
}

export const socketSend = (webSocketClient: Socket, command: Commands, value?: string): void => {
  webSocketClient.emit(command, value)
}

export class BaseSocketHandler {
  protected webSocketClient: Socket

  public constructor(webSocketClient: Socket) {
    this.webSocketClient = webSocketClient
  }

  public getWebSocketClient(): Socket {
    return this.webSocketClient
  }

  public clearSocketListeners(): void {
    this.webSocketClient.off()
  }

  protected send(command: Commands, value?: string): void {
    this.webSocketClient.emit(command, value)
  }

  protected setSocketListeners(
    handleIndex: SocketHandlerIndex,
    openHandler: SocketSceneOpenHandler,
    closeHandler: SocketSceneCloseHandler
  ): void  {
    this.webSocketClient.on('connect', openHandler)
    this.webSocketClient.on('disconnect', closeHandler)
    Object.entries(handleIndex).forEach(([key, value]) => {
      this.webSocketClient.on(key, value)
    })
  }
}
