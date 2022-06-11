import { Socket as ClientSocket } from 'socket.io-client'
import { createServer } from 'http'
import { AddressInfo } from 'ws'

import { Commands, User } from 'shared'
import WebSocket from 'interfaces/socket'

import Game from '..'
import {  createClient, createClientWithName } from './fixtures'


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
  it('Can set name', done => {
    const mockedName = 'An name example'
    clientSocketWithoutName.on(Commands.NEW_USER_SET, value => {
      const { id, name } = JSON.parse(value)
      expect(id).toBe(clientSocketWithoutName.id)
      expect(name).toBe(mockedName)
      done()
    })
    clientSocketWithoutName.emit(Commands.NAME, mockedName)
  })

  it("Can't set name if already set", done => {
    const mockedNewName = 'new name'
    clientSocketWithName.on(Commands.COMMAND_ERROR, value => {
      const { command } = JSON.parse(value)
      expect(command).toBe(Commands.NAME)
      const serverSideSocket = game.webSocket.getSocket(clientSocketWithName.id)
      if (serverSideSocket) {
        expect(serverSideSocket.data.name).not.toEqual(mockedNewName)
      }
      done()
    })

    clientSocketWithName.emit(Commands.NAME, mockedNewName)
  })

  it("Can't set empty name", done => {
    const mockedName = ''

    clientSocketWithoutName.on(Commands.COMMAND_ERROR, value => {
      const { command } = JSON.parse(value)
      expect(command).toBe(Commands.NAME)
      done()
    })

    clientSocketWithoutName.emit(Commands.NAME, mockedName)
  })

  it("Can't set trimmed empty name", done => {
    const mockedName = ' '

    clientSocketWithoutName.on(Commands.COMMAND_ERROR, value => {
      const { command } = JSON.parse(value)
      expect(command).toBe(Commands.NAME)
      done()
    })
    clientSocketWithoutName.emit(Commands.NAME, mockedName)
  })

  it('Get user list on name set', async done => {
    const name = 'Another name'
    clientSocketWithoutName.emit(Commands.NAME, name)
    clientSocketWithoutName.on(Commands.GET_USERS_LIST, (value: string) => {
      const list: User[] = JSON.parse(value)
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
    clientSocketWithoutName.on(Commands.ROOM_MESSAGE, (value: string) => {
      const { id, message } = JSON.parse(value)
      expect(message).toStrictEqual(mockedMessage)
      expect(id).toStrictEqual(clientSocketWithName.id)
      done()
    })
  })

  it("Can't Send a room message if has no name", async done => {
    const mockedMessage = 'Message'

    clientSocketWithoutName.emit(Commands.ROOM_MESSAGE, mockedMessage)

    clientSocketWithoutName.on(Commands.COMMAND_ERROR, (value: string) => {
      const { command } = JSON.parse(value)
      expect(command).toBe(Commands.ROOM_MESSAGE)
      done()
    })
  })

  /**
   *  on Disconnect
   */

  it('Is notified on user disconnect', async done => {
    const clientSocketId = clientSocketWithName.id
    clientSocketWithoutName.on(Commands.USER_DISCONNECTED, (value: string) => {
      expect(value).toBe(clientSocketId)
      done()
    })
    clientSocketWithName.close()
  })

  /**
   * User List
   */

  it('Can get user list', async done => {
    clientSocketWithoutName.on(Commands.GET_USERS_LIST, (value: string) => {
      const list: User[] = JSON.parse(value)
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
