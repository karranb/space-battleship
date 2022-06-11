import { Socket } from 'socket.io'
import { Commands, User } from 'shared'
import { SpaceshipBattleMixin } from '../types'
import { SocketError } from 'utils/errors'

function roomMixin<TBase extends SpaceshipBattleMixin>(Base: TBase) {
  return class extends Base {
    getUserData(socket: Socket): User {
      return { id: socket.id, name: socket.data.name, isPlaying: !!socket.data.game }
    }

    validateIsSignedIn(socket: Socket) {
      if (!socket.data.name) {
        throw new SocketError('You are not signed in')
      }
    }

    handleSetUserName(socket: Socket, name: string): void {
      if (socket.data.name) {
        throw new SocketError('Name is already set')
      }
      const parsedName = name.trim()
      if (!parsedName) {
        throw new SocketError('Empty name is not allowed')
      }
      socket.data.name = parsedName
      this.webSocket.broadcastMessage(
        Commands.NEW_USER_SET,
        JSON.stringify(this.getUserData(socket))
      )
      this.handleGetUsersList(socket)
    }

    handleSocketRoomDisconnect(socket: Socket): void {
      this.webSocket.broadcastMessage(Commands.USER_DISCONNECTED, socket.id)
    }

    handleGetUsersList(socket: Socket): void {
      const sockets = this.webSocket.getSockets()
      this.sendMessage(
        socket,
        Commands.GET_USERS_LIST,
        JSON.stringify(sockets.map(socket => this.getUserData(socket)).filter(({ name }) => !!name))
      )
    }

    handleRoomMessage(socket: Socket, message: string): void {
      this.validateIsSignedIn(socket)
      this.webSocket.broadcastMessage(
        Commands.ROOM_MESSAGE,
        JSON.stringify({ id: socket.id, message })
      )
    }

    setupRoomListeners(socket: Socket): void {
      this.addMessageListeners(socket, [
        {
          command: Commands.NAME,
          callback: this.handleSetUserName,
        },
        { command: Commands.GET_USERS_LIST, callback: this.handleGetUsersList },
        { command: Commands.ROOM_MESSAGE, callback: this.handleRoomMessage },
      ])
      this.webSocket
        .addEventClientListener(socket, 'disconnect', () => this.handleSocketRoomDisconnect(socket))
        .addEventClientListener(socket, 'error', () => this.handleSocketRoomDisconnect(socket))
    }
  }
}

export default roomMixin
