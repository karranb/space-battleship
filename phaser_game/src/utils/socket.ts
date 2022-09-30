import { Socket } from 'socket.io-client'

import { Commands } from 'interfaces/shared'

export type SocketSceneOpenHandler = () => void
export type SocketSceneCloseHandler = () => void
export type SocketHandlerIndex = {
  [key in Commands]?: (value: string) => void
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

  protected send(command: Commands, value?: string | Record<string, unknown>): void {
    this.webSocketClient.emit(command, value)
  }

  public close() {
    this.clearSocketListeners()
    this.webSocketClient.close()
  }

  protected setSocketListeners(
    handleIndex: SocketHandlerIndex,
    openHandler: SocketSceneOpenHandler,
    closeHandler: SocketSceneCloseHandler
  ): void {
    this.clearSocketListeners()
    this.webSocketClient.on('connect', openHandler)
    this.webSocketClient.on('disconnect', closeHandler)
    this.webSocketClient.on('connect_error', closeHandler)
    Object.entries(handleIndex).forEach(([key, value]) => {
      this.webSocketClient.on(key, value)
    })
  }
}
