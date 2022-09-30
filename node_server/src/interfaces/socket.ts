import { Server, Socket } from 'socket.io'
import http from 'http'
import { Commands } from 'interfaces/shared'

type MessageListener = (value: string) => void

type ClientEventListener = (value: Socket) => void

type ServerEventListener = (value: Socket) => void

class WebSocket {
  wss: Server

  constructor(httpServer: http.Server) {
    this.wss = new Server(httpServer, {
      cors: {
        origin: '*',
      },
    })
  }

  sendMessage(ws: Socket, command: Commands, message?: unknown): WebSocket {
    ws.emit(command, message)
    return this
  }

  broadcastMessage(command: Commands, message?: string | Record<string, unknown>): WebSocket {
    this.wss.emit(command, message)
    return this
  }

  addMessageListeners(ws: Socket, event: string, listener: MessageListener): WebSocket {
    ws.on(event, listener)
    return this
  }

  addEventListener(event: string, listener: ServerEventListener): WebSocket {
    this.wss.on(event, listener)
    return this
  }

  addEventClientListener(ws: Socket, event: string, listener: ClientEventListener): WebSocket {
    ws.on(event, listener)
    return this
  }

  getSocket(id: string): Socket | undefined {
    return this.wss.sockets.sockets.get(id)
  }

  getSockets(): Socket[] {
    return Array.from(this.wss.sockets.sockets.values())
  }
}

export default WebSocket
