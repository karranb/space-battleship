import { Socket as ClientSocket } from 'socket.io-client'
import { createServer } from 'http'
import { AddressInfo } from 'ws'

import { Commands } from 'interfaces/shared'
import WebSocket from 'interfaces/socket'
import { getRandomChoices } from 'utils/game'

import Game from '..'
import { createClient, createClientWithName, createGame, createGameWithChoices } from './fixtures'

const timeout = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

describe('Game logic', () => {
  let clientSocketWithoutName: ClientSocket
  let clientSocketWithName: ClientSocket
  let clientSocketChallenger: ClientSocket
  let clientSocketChallenged: ClientSocket

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
      clientSocketChallenger = await createClientWithName(port)
      clientSocketChallenged = await createClientWithName(port)
      done()
    })
  })

  afterEach(() => {
    webSocket.wss.close()
    clientSocketWithoutName.close()
    clientSocketWithName.close()
    clientSocketChallenger.close()
    clientSocketChallenged.close()
  })

  /**
   * Set destination
   */

  it('Can set destination', async done => {
    await createGameWithChoices(port, clientSocketChallenger, clientSocketChallenged)
    clientSocketChallenger.on(Commands.COMMAND_PROCESSED, value => {
      const { command } = value
      expect(command).toEqual(Commands.SET_SPACESHIP_DESTINATION)
      done()
    })
    clientSocketChallenger.emit(Commands.SET_SPACESHIP_DESTINATION, { spaceship: 1, x: 50, y: 50 })
  })

  it("Can't set destination if no choices are set", async done => {
    await createGame(port, clientSocketChallenger, clientSocketChallenged)
    clientSocketChallenger.on(Commands.COMMAND_ERROR, value => {
      const { command } = value
      expect(command).toEqual(Commands.SET_SPACESHIP_DESTINATION)
      done()
    })
    clientSocketChallenger.emit(Commands.SET_SPACESHIP_DESTINATION, { spaceship: 1, x: 50, y: 50 })
  })

  it("Can't set destination if ready", async done => {
    await createGameWithChoices(port, clientSocketChallenger, clientSocketChallenged)
    clientSocketChallenger.on(Commands.COMMAND_PROCESSED, () => {
      clientSocketChallenger.emit(Commands.SET_SPACESHIP_DESTINATION, { spaceship: 1, x: 50, y: 50 })
    })

    clientSocketChallenger.on(Commands.COMMAND_ERROR, value => {
      const { command } = value
      expect(command).toEqual(Commands.SET_SPACESHIP_DESTINATION)
      done()
    })
    clientSocketChallenger.emit(Commands.SET_PLAYER_READY)
  })

  it("Can't set destination if not in game", async done => {
    await createGameWithChoices(port, clientSocketChallenger, clientSocketChallenged)

    clientSocketWithName.on(Commands.COMMAND_ERROR, value => {
      const { command } = value
      expect(command).toEqual(Commands.SET_SPACESHIP_DESTINATION)
      done()
    })

    clientSocketWithName.emit(Commands.SET_SPACESHIP_DESTINATION, { spaceship: 1, x: 50, y: 50 })
  })

  /**
   * Set Target
   */

  it('Can set target', async done => {
    await createGameWithChoices(port, clientSocketChallenger, clientSocketChallenged)
    clientSocketChallenger.on(Commands.COMMAND_PROCESSED, value => {
      const { command } = value
      expect(command).toEqual(Commands.SET_SPACESHIP_TARGET)
      done()
    })
    clientSocketChallenger.emit(Commands.SET_SPACESHIP_TARGET, { spaceship: 1, x: 50, y: 50 })
  })

  it("Can't set target if choices are not set", async done => {
    await createGame(port, clientSocketChallenger, clientSocketChallenged)
    clientSocketChallenger.on(Commands.COMMAND_ERROR, value => {
      const { command } = value
      expect(command).toEqual(Commands.SET_SPACESHIP_TARGET)
      done()
    })
    clientSocketChallenger.emit(Commands.SET_SPACESHIP_TARGET, { spaceship: 1, x: 50, y: 50 })
  })

  it("Can't set target if ready", async done => {
    await createGameWithChoices(port, clientSocketChallenger, clientSocketChallenged)
    clientSocketChallenger.on(Commands.COMMAND_PROCESSED, () => {
      clientSocketChallenger.emit(Commands.SET_SPACESHIP_TARGET, { spaceship: 1, x: 50, y: 50 })
    })

    clientSocketChallenger.on(Commands.COMMAND_ERROR, value => {
      const { command } = value
      expect(command).toEqual(Commands.SET_SPACESHIP_TARGET)
      done()
    })
    clientSocketChallenger.emit(Commands.SET_PLAYER_READY)
  })

  it("Can't set target if not in game", async done => {
    await createGameWithChoices(port, clientSocketChallenger, clientSocketChallenged)

    clientSocketWithName.on(Commands.COMMAND_ERROR, value => {
      const { command } = value
      expect(command).toEqual(Commands.SET_SPACESHIP_TARGET)
      done()
    })

    clientSocketWithName.emit(Commands.SET_SPACESHIP_TARGET, { spaceship: 1, x: 50, y: 50 })
  })

  /**
   * Set Target
   */

  it('Can set ready', async done => {
    await createGameWithChoices(port, clientSocketChallenger, clientSocketChallenged)

    clientSocketChallenger.on(Commands.COMMAND_PROCESSED, value => {
      const { command } = value
      expect(command).toEqual(Commands.SET_PLAYER_READY)
      done()
    })
    clientSocketChallenger.emit(Commands.SET_PLAYER_READY)
  })

  it("Can't set ready if choise is not set", async done => {
    await createGame(port, clientSocketChallenger, clientSocketChallenged)

    clientSocketChallenger.on(Commands.COMMAND_ERROR, value => {
      const { command } = value
      expect(command).toEqual(Commands.SET_PLAYER_READY)
      done()
    })
    clientSocketChallenger.emit(Commands.SET_PLAYER_READY)
  })

  it("Can't set ready twice", async done => {
    await createGameWithChoices(port, clientSocketChallenger, clientSocketChallenged)

    clientSocketChallenger.on(Commands.COMMAND_ERROR, value => {
      const { command } = value
      expect(command).toEqual(Commands.SET_PLAYER_READY)
      done()
    })
    clientSocketChallenger.emit(Commands.SET_PLAYER_READY)
    await timeout(10)
    clientSocketChallenger.emit(Commands.SET_PLAYER_READY)
  })

  it("Can't set ready if not in game", async done => {
    await createGameWithChoices(port, clientSocketChallenger, clientSocketChallenged)

    clientSocketWithName.on(Commands.COMMAND_ERROR, value => {
      const { command } = value
      expect(command).toEqual(Commands.SET_PLAYER_READY)
      done()
    })
    clientSocketWithName.emit(Commands.SET_PLAYER_READY)
  })

  it('Round finishes when both ready', async done => {
    await createGameWithChoices(port, clientSocketChallenger, clientSocketChallenged)

    clientSocketChallenger.emit(Commands.SET_SPACESHIP_TARGET, { spaceship: 1, x: 50, y: 50 })
    await timeout(10)
    clientSocketChallenged.emit(Commands.SET_SPACESHIP_TARGET, { spaceship: 2, x: 50, y: 50 })
    await timeout(10)
    clientSocketChallenger.emit(Commands.SET_SPACESHIP_DESTINATION, { spaceship: 1, x: 50, y: 50 })
    await timeout(10)
    clientSocketChallenged.emit(Commands.SET_SPACESHIP_DESTINATION, { spaceship: 2, x: 50, y: 50 })

    clientSocketChallenger.on(Commands.SET_PLAYER_READY, value => {
      expect(value).toStrictEqual({
        [clientSocketChallenged.id]: { 2: { target: { x: 50, y: 50 }, destination: { x: 50, y: 50 } } },
        [clientSocketChallenger.id]: { 1: { target: { x: 50, y: 50 }, destination: { x: 50, y: 50 } } },
      })
      done()
    })

    clientSocketChallenger.emit(Commands.SET_PLAYER_READY)
    await timeout(10)
    clientSocketChallenged.emit(Commands.SET_PLAYER_READY)
  })

  it('Round finishes when time finishes', async done => {
    jest
      .spyOn(Game.prototype, 'setTimeout')
      .mockImplementation((callback): NodeJS.Timeout => setTimeout(callback, 50))

    await createGameWithChoices(port, clientSocketChallenger, clientSocketChallenged)

    clientSocketChallenger.emit(Commands.SET_SPACESHIP_TARGET, { spaceship: 1, x: 50, y: 50 })
    await timeout(10)
    clientSocketChallenged.emit(Commands.SET_SPACESHIP_TARGET, { spaceship: 2, x: 50, y: 50 })
    await timeout(10)
    clientSocketChallenger.emit(Commands.SET_SPACESHIP_DESTINATION, { spaceship: 1, x: 50, y: 50 })
    await timeout(10)
    clientSocketChallenged.emit(Commands.SET_SPACESHIP_DESTINATION, { spaceship: 2, x: 50, y: 50 })

    clientSocketChallenger.on(Commands.SET_PLAYER_READY, value => {
      expect(value).toStrictEqual({
        [clientSocketChallenged.id]: { 2: { target: { x: 50, y: 50 }, destination: { x: 50, y: 50 } } },
        [clientSocketChallenger.id]: { 1: { target: { x: 50, y: 50 }, destination: { x: 50, y: 50 } } },
      })
      done()
    })
  })

  it('Round finishes when time finishes', async done => {
    jest
      .spyOn(Game.prototype, 'setTimeout')
      .mockImplementation((callback): NodeJS.Timeout => setTimeout(callback, 50))

    await createGameWithChoices(port, clientSocketChallenger, clientSocketChallenged)

    clientSocketChallenger.emit(Commands.SET_SPACESHIP_TARGET, { spaceship: 1, x: 50, y: 50 })
    await timeout(10)
    clientSocketChallenged.emit(Commands.SET_SPACESHIP_TARGET, { spaceship: 2, x: 50, y: 50 })
    await timeout(10)
    clientSocketChallenger.emit(Commands.SET_SPACESHIP_DESTINATION, { spaceship: 1, x: 50, y: 50 })
    await timeout(10)
    clientSocketChallenged.emit(Commands.SET_SPACESHIP_DESTINATION, { spaceship: 2, x: 50, y: 50 })

    clientSocketChallenger.on(Commands.SET_PLAYER_READY, value => {
      expect(value).toStrictEqual({
        [clientSocketChallenged.id]: { 2: { target: { x: 50, y: 50 }, destination: { x: 50, y: 50 } } },
        [clientSocketChallenger.id]: { 1: { target: { x: 50, y: 50 }, destination: { x: 50, y: 50 } } },
      })
      done()
    })
  })

  it('Round starts after finish timeout', async done => {
    jest
      .spyOn(Game.prototype, 'setTimeout')
      .mockImplementation((callback): NodeJS.Timeout => setTimeout(callback, 50))

    await createGameWithChoices(port, clientSocketChallenger, clientSocketChallenged)

    clientSocketChallenger.emit(Commands.SET_PLAYER_READY)
    await timeout(10)
    clientSocketChallenged.emit(Commands.SET_PLAYER_READY)

    clientSocketChallenger.on(Commands.ROUND_STARTED, () => {
      const currentGame = Object.values(game.games)[0]
      if (currentGame.rounds.length === 2) {
        done()
      }
    })
  })

  it('Round starts after both ready', async done => {
    await createGameWithChoices(port, clientSocketChallenger, clientSocketChallenged)

    clientSocketChallenger.emit(Commands.SET_PLAYER_READY)
    await timeout(10)
    clientSocketChallenged.emit(Commands.SET_PLAYER_READY)
    await timeout(10)
    clientSocketChallenger.emit(Commands.ROUND_STARTED)
    await timeout(10)
    clientSocketChallenged.emit(Commands.ROUND_STARTED)

    clientSocketChallenger.on(Commands.ROUND_STARTED, () => {
      const currentGame = Object.values(game.games)[0]
      if (currentGame.rounds.length === 2) {
        done()
      }
    })
  })

  it("Can't be ready for new round if invalid state", async done => {
    await createGameWithChoices(port, clientSocketChallenger, clientSocketChallenged)

    clientSocketChallenger.emit(Commands.ROUND_STARTED)

    clientSocketChallenger.on(Commands.COMMAND_ERROR, value => {
      const { command } = value
      expect(command).toEqual(Commands.ROUND_STARTED)
      done()
    })
  })

  it("Can't be ready for new round if not in a game", async done => {
    await createGameWithChoices(port, clientSocketChallenger, clientSocketChallenged)

    clientSocketWithName.emit(Commands.ROUND_STARTED)

    clientSocketWithName.on(Commands.COMMAND_ERROR, value => {
      const { command } = value
      expect(command).toEqual(Commands.ROUND_STARTED)
      done()
    })
  })

  it('Draw game after 10 rounds', async done => {
    await createGameWithChoices(port, clientSocketChallenger, clientSocketChallenged)

    for (let i = 0; i < 10; i++) {
      await timeout(10)
      clientSocketChallenger.emit(Commands.SET_PLAYER_READY)
      await timeout(10)
      clientSocketChallenged.emit(Commands.SET_PLAYER_READY)
      await timeout(10)
      clientSocketChallenger.emit(Commands.ROUND_STARTED)
      await timeout(10)
      clientSocketChallenged.emit(Commands.ROUND_STARTED)
    }

    clientSocketChallenger.on(Commands.CLOSE_GAME, value => {
      expect(value).toEqual({reason: 'draw'})
      done()
    })
  })

  it('Close game after someone send close message', async done => {
    await createGameWithChoices(port, clientSocketChallenger, clientSocketChallenged)

    clientSocketChallenged.emit(Commands.CLOSE_GAME)

    clientSocketChallenger.on(Commands.CLOSE_GAME, () => {
      done()
    })
  })

  it("Can't close game if not in game", async done => {
    await createGameWithChoices(port, clientSocketChallenger, clientSocketChallenged)

    clientSocketWithName.emit(Commands.CLOSE_GAME)

    clientSocketWithName.on(Commands.COMMAND_ERROR, value => {
      const { command } = value
      expect(command).toEqual(Commands.CLOSE_GAME)
      done()
    })
  })

  it('Can send private message', async done => {
    await createGameWithChoices(port, clientSocketChallenger, clientSocketChallenged)
    const mockedMessage = 'wow'
    clientSocketChallenger.emit(Commands.PRIVATE_MESSAGE, mockedMessage)

    clientSocketChallenged.on(Commands.PRIVATE_MESSAGE, value => {
      const { id, message } = value
      expect(id).toEqual(clientSocketChallenger.id)
      expect(message).toEqual(mockedMessage)
      done()
    })
  })

  it("Can't send private message if not in game", async done => {
    await createGameWithChoices(port, clientSocketChallenger, clientSocketChallenged)

    clientSocketWithName.emit(Commands.PRIVATE_MESSAGE, 'wow')

    clientSocketWithName.on(Commands.COMMAND_ERROR, value => {
      const { command } = value
      expect(command).toEqual(Commands.PRIVATE_MESSAGE)
      done()
    })
  })

  /**
   * Choices
   */

  it('Can make choices', async done => {
    await createGame(port, clientSocketChallenger, clientSocketChallenged)

    clientSocketChallenger.emit(Commands.SET_CHOICES, getRandomChoices())

    clientSocketChallenger.on(Commands.COMMAND_PROCESSED, value => {
      const { command } = value
      expect(command).toEqual(Commands.SET_CHOICES)
      done()
    })
  })

  it("Can't make choices twices", async done => {
    await createGame(port, clientSocketChallenger, clientSocketChallenged)

    clientSocketChallenger.emit(Commands.SET_CHOICES, getRandomChoices())
    clientSocketChallenger.emit(Commands.SET_CHOICES, getRandomChoices())

    clientSocketChallenger.on(Commands.COMMAND_ERROR, value => {
      const { command } = value
      expect(command).toEqual(Commands.SET_CHOICES)
      done()
    })
  })

  it("Can't make choices if game started", async done => {
    await createGameWithChoices(port, clientSocketChallenger, clientSocketChallenged)

    clientSocketChallenger.emit(Commands.SET_CHOICES, getRandomChoices())

    clientSocketChallenger.on(Commands.COMMAND_ERROR, value => {
      const { command } = value
      expect(command).toEqual(Commands.SET_CHOICES)
      done()
    })
  })

  it('If both make choices the round starts', async done => {
    await createGame(port, clientSocketChallenger, clientSocketChallenged)

    clientSocketChallenger.emit(Commands.SET_CHOICES, getRandomChoices())
    await timeout(10)
    clientSocketChallenged.emit(Commands.SET_CHOICES, getRandomChoices())

    clientSocketChallenger.on(Commands.ROUND_STARTED, () => {
      done()
    })
  })

  it('If timeout round starts', async done => {
    jest
      .spyOn(Game.prototype, 'setTimeout')
      .mockImplementation((callback): NodeJS.Timeout => setTimeout(callback, 50))

    await createGame(port, clientSocketChallenger, clientSocketChallenged)

    clientSocketChallenger.on(Commands.ROUND_STARTED, () => {
      done()
    })
  })
})
