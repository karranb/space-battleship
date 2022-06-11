import { Socket } from 'socket.io'
import { Commands } from 'shared'
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

  sendErrorMessage(socket: Socket, command: Commands, message: string): void {
    this.webSocket.sendMessage(socket, Commands.COMMAND_ERROR, JSON.stringify({ command, message }))
  }

  sendProcessedMessage(socket: Socket, command: Commands): void {
    this.webSocket.sendMessage(socket, Commands.COMMAND_PROCESSED, JSON.stringify({ command }))
  }

  sendMessage(socket: Socket, command: Commands, message?: string): void {
    this.webSocket.sendMessage(socket, command, message)
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
