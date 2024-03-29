import { Socket as ClientSocket } from 'socket.io-client'
import { createServer } from 'http'
import { AddressInfo } from 'ws'

import { Commands, User } from 'interfaces/shared'
import WebSocket from 'interfaces/socket'

import Game from '..'
import { createClient, createClientWithName } from './fixtures'

describe('Room logic', () => {
  let clientSocketWithoutName: ClientSocket
  let clientSocketWithName: ClientSocket

  let webSocket: WebSocket
  let game: Game
  let port: number

  beforeEach(done => {
    const httpServer = createServer()
    webSocket = new WebSocket(httpServer)
    game = new Game(webSocket)
    httpServer.listen(async () => {
      port = (httpServer.address() as AddressInfo)?.port
      clientSocketWithoutName = await createClient(port)
      clientSocketWithName = await createClientWithName(port)
      done()
    })
  })

  afterEach(() => {
    webSocket.wss.close()
    clientSocketWithoutName.close()
    clientSocketWithName.close()
  })
  /**
   * Set Name
   */
  it('Can set name', async () => {
    const mockedName = 'An name example'
    const promise1 = new Promise(resolve => {
      clientSocketWithName.on(Commands.NEW_USER_SET, value => {
        const { id, name } = value
        expect(id).toBe(clientSocketWithoutName.id)
        expect(name).toBe(mockedName)
        resolve(true)
      })
    })
    const promise2 = new Promise(resolve => {
      clientSocketWithoutName.on(Commands.COMMAND_PROCESSED, value => {
        const { command } = value
        expect(command).toBe(Commands.NAME)
        resolve(true)
      })
    })
    clientSocketWithoutName.emit(Commands.NAME, {
      name: mockedName,
      countryCode: 'BR',
      VERSION: undefined,
    })
    await promise1
    await promise2
  })

  it("Can't set name if already set", done => {
    const mockedNewName = 'new name'
    clientSocketWithName.on(Commands.COMMAND_ERROR, value => {
      const { command } = value
      expect(command).toBe(Commands.NAME)
      const serverSideSocket = game.webSocket.getSocket(clientSocketWithName.id)
      if (serverSideSocket) {
        expect(serverSideSocket.data.name).not.toEqual(mockedNewName)
      }
      done()
    })

    clientSocketWithName.emit(Commands.NAME, { name: mockedNewName })
  })

  it("Can't set empty name", done => {
    const mockedName = ''

    clientSocketWithoutName.on(Commands.COMMAND_ERROR, value => {
      const { command } = value
      expect(command).toBe(Commands.NAME)
      done()
    })

    clientSocketWithoutName.emit(Commands.NAME, { name: mockedName })
  })

  it("Can't set trimmed empty name", done => {
    const mockedName = ' '

    clientSocketWithoutName.on(Commands.COMMAND_ERROR, value => {
      const { command } = value
      expect(command).toBe(Commands.NAME)
      done()
    })
    clientSocketWithoutName.emit(Commands.NAME, { name: mockedName })
  })

  it('Get user list on name set', async done => {
    const name = 'Another name'
    clientSocketWithoutName.emit(Commands.NAME, { name })
    clientSocketWithoutName.on(Commands.GET_USERS_LIST, value => {
      const list: User[] = value
      const sockets = game.webSocket.getSockets()
      expect(sockets.filter(socket => socket.data.name).length).toBe(list.length)
      list.forEach(item => {
        const socket = game.webSocket.getSocket(item.id)
        expect(socket?.data.name).toEqual(item.name)
        expect(socket?.id).toEqual(item.id)
        expect(!!socket?.data.game).toEqual(item.isPlaying)
      })
      clientSocketWithoutName.close()
      done()
    })
  })

  /**
   * Send room message
   */

  it('Can send a room message', async done => {
    const mockedMessage = 'Message'
    clientSocketWithName.emit(Commands.ROOM_MESSAGE, mockedMessage)
    clientSocketWithoutName.on(Commands.ROOM_MESSAGE, value => {
      const { id, message } = value
      expect(message).toStrictEqual(mockedMessage)
      expect(id).toStrictEqual(clientSocketWithName.id)
      done()
    })
  })

  it("Can't Send a room message if has no name", async done => {
    const mockedMessage = 'Message'

    clientSocketWithoutName.emit(Commands.ROOM_MESSAGE, mockedMessage)

    clientSocketWithoutName.on(Commands.COMMAND_ERROR, value => {
      const { command } = value
      expect(command).toBe(Commands.ROOM_MESSAGE)
      done()
    })
  })

  /**
   *  on Disconnect
   */

  it('Is notified on user disconnect', async done => {
    const clientSocketId = clientSocketWithName.id
    clientSocketWithoutName.on(Commands.USER_DISCONNECTED, value => {
      expect(value).toBe(clientSocketId)
      done()
    })
    clientSocketWithName.close()
  })

  /**
   * User List
   */

  it('Can get user list', async done => {
    clientSocketWithoutName.on(Commands.GET_USERS_LIST, value => {
      const list: User[] = value
      const sockets = game.webSocket.getSockets()
      expect(sockets.filter(socket => socket.data.name).length).toBe(list.length)
      list.forEach(item => {
        const socket = game.webSocket.getSocket(item.id)
        expect(socket?.data.name).toEqual(item.name)
        expect(socket?.id).toEqual(item.id)
        expect(!!socket?.data.game).toEqual(item.isPlaying)
      })
      done()
    })
    clientSocketWithoutName.emit(Commands.GET_USERS_LIST)
  })
})
