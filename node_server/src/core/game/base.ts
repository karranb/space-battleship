import { Socket } from 'socket.io'
import { Commands } from 'interfaces/shared'
import WebSocket from 'interfaces/socket'
import { Challenge, Games, SocketListener } from './types'
import { SocketError } from 'utils/errors'

class SpaceshipBattleBase {
  webSocket: WebSocket
  games: Games = {}
  challenges: Record<string, Challenge> = {}

  constructor(webSocket: WebSocket) {
    this.webSocket = webSocket
  }

  sendMessage(socket: Socket, command: Commands, message?: string): void {
    this.webSocket.sendMessage(socket, command, message)
  }

  sendErrorMessage(socket: Socket, command: Commands, message: string): void {
    this.sendMessage(socket, Commands.COMMAND_ERROR, JSON.stringify({ command, message }))
  }

  sendProcessedMessage(socket: Socket, command: Commands, data?: Record<string, unknown>): void {
    this.sendMessage(
      socket,
      Commands.COMMAND_PROCESSED,
      JSON.stringify({ command, ...(data ?? {}) })
    )
  }

  setTimeout(callback: () => void, time: number): NodeJS.Timeout {
    return setTimeout(callback, time)
  }

  addMessageListener(socket: Socket, listener: SocketListener) {
    const { command, callback } = listener
    this.webSocket.addMessageListeners(socket, command, (value: string) => {
      try {
        callback.bind(this)(socket, value)
      } catch (err) {
        if (err instanceof SocketError) {
          this.sendErrorMessage(socket, command, err.message)
          return
        }
        throw err
      }
    })
  }

  addMessageListeners(socket: Socket, listeners: SocketListener[]) {
    listeners.forEach(listener => this.addMessageListener(socket, listener))
  }
}

export default SpaceshipBattleBase
