import { Socket } from 'socket.io'
import { Commands, User } from 'interfaces/shared'
import { SpaceshipBattleMixin } from '../types'
import { SocketError } from 'utils/errors'

function roomMixin<TBase extends SpaceshipBattleMixin>(Base: TBase) {
  return class extends Base {
    getUserData(socket: Socket): User {
      return {
        id: socket.id,
        name: socket.data.name,
        isPlaying: !!socket.data.game,
        countryCode: socket.data.countryCode,
      }
    }

    validateIsSignedIn(socket: Socket) {
      if (!socket.data.name) {
        throw new SocketError('You are not signed in')
      }
    }

    handleSetUserName(socket: Socket, message: unknown): void {
      if (socket.data.name) {
        throw new SocketError('Name is already set')
      }
      const { name, version, countryCode } = message as {
        name: string
        version: string
        countryCode: string
      }
      const parsedName = name.trim()
      if (!parsedName) {
        throw new SocketError('Empty name is not allowed')
      }
      const supportedVersions = process.env.SUPPORTED_VERSIONS?.split(',') ?? []
      if (supportedVersions.length && !supportedVersions.includes(version)) {
        throw new SocketError('Version not supported')
      }
      socket.data.name = parsedName
      socket.data.countryCode = countryCode
      this.sendProcessedMessage(socket, Commands.NAME)
      this.webSocket.broadcastMessage(Commands.NEW_USER_SET, this.getUserData(socket))
      this.handleGetUsersList(socket)
    }

    handleSetCountryCode(socket: Socket, countryCode: unknown): void {
      socket.data.countryCode = countryCode as string
      this.sendProcessedMessage(socket, Commands.SET_COUNTRY_CODE)
      this.webSocket.broadcastMessage(Commands.USER_COUNTRY_CODE_SET, this.getUserData(socket))
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
        sockets.map(socket => this.getUserData(socket)).filter(({ name }) => !!name)
      )
    }

    handleRoomMessage(socket: Socket, message: unknown): void {
      this.validateIsSignedIn(socket)
      this.webSocket.broadcastMessage(Commands.ROOM_MESSAGE, { id: socket.id, message })
    }

    setupRoomListeners(socket: Socket): void {
      this.addMessageListeners(socket, [
        {
          command: Commands.NAME,
          callback: this.handleSetUserName,
        },
        {
          command: Commands.SET_COUNTRY_CODE,
          callback: this.handleSetCountryCode,
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
