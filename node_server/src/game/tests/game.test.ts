import { Socket as ClientSocket } from 'socket.io-client'
import { createServer } from 'http'
import { AddressInfo } from 'ws'

import { Commands } from 'shared'
import WebSocket from 'interfaces/socket'

import Game from '..'
import { createChallenge, createClient, createClientWithName, createGame } from './fixtures'

const timeout = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

describe('Game logic', () => {
  let clientSocketWithoutName: ClientSocket
  let clientSocketWithName: ClientSocket
  let clientSocketChallenger: ClientSocket
  let clientSocketChallenged: ClientSocket
  let challengeId: string

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
      challengeId = await createChallenge(port, clientSocketChallenger, clientSocketChallenged)
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
   * Challenge request
   */

  it('Can Challenge another user', async () => {
    clientSocketWithName.emit(Commands.CHALLENGE, clientSocketChallenged.id)

    const promiseChallenge = new Promise(resolve => {
      clientSocketChallenged.on(Commands.CHALLENGE, (value: string) => {
        expect(JSON.parse(value).challengerId).toBe(clientSocketWithName.id)
        resolve(true)
      })
    })
    const promiseChallengeSent = new Promise(resolve => {
      clientSocketWithName.on(Commands.COMMAND_PROCESSED, (value: string) => {
        const { command } = JSON.parse(value)
        expect(command).toBe(Commands.CHALLENGE)
        resolve(true)
      })
    })
    await Promise.all([promiseChallenge, promiseChallengeSent])
  })

  it("Can't Challenge another user if did not set name", async done => {
    clientSocketWithoutName.emit(Commands.CHALLENGE, clientSocketChallenged.id)

    clientSocketWithoutName.on(Commands.COMMAND_ERROR, (value: string) => {
      const { command } = JSON.parse(value)

      expect(command).toBe(Commands.CHALLENGE)
      done()
    })
  })

  it("Can't Challenge a user that quitted", async done => {
    clientSocketChallenged.close()
    clientSocketChallenger.emit(Commands.CHALLENGE, clientSocketChallenged.id)
    clientSocketChallenger.on(Commands.COMMAND_ERROR, (value: string) => {
      const { command } = JSON.parse(value)
      expect(command).toBe(Commands.CHALLENGE)
      done()
    })
  })

  it("Can't Challenge a user that is playing", async done => {
    await createGame(port, clientSocketChallenger, clientSocketChallenged)

    clientSocketWithName.emit(Commands.CHALLENGE, clientSocketChallenged.id)

    clientSocketWithName.on(Commands.COMMAND_ERROR, (value: string) => {
      const { command } = JSON.parse(value)
      expect(command).toBe(Commands.CHALLENGE)
      done()
    })
  })

  it("Can't Challenge a user if is playing", async done => {
    await createGame(port, clientSocketChallenger, clientSocketChallenged)

    clientSocketChallenger.emit(Commands.CHALLENGE, clientSocketWithName.id)

    clientSocketChallenger.on(Commands.COMMAND_ERROR, (value: string) => {
      const { command } = JSON.parse(value)
      expect(command).toBe(Commands.CHALLENGE)
      done()
    })
  })

  /**
   *  on Disconnect
   */

  it('Challenge is cancelled after user quit', async done => {
    clientSocketChallenged.close()
    clientSocketChallenger.on(Commands.CHALLENGE_CLOSE, (value: string) => {
      const { challengeId: retrievedChallengeId } = JSON.parse(value)
      expect(retrievedChallengeId).toBe(challengeId)
      done()
    })
  })

  it('Challenge is cancelled after timeout', async done => {
    jest
      .spyOn(Game.prototype, 'setTimeout')
      .mockImplementation((callback): NodeJS.Timeout => setTimeout(callback, 50))

    const newChallengeId = await createChallenge(
      port,
      clientSocketChallenger,
      clientSocketChallenger
    )

    clientSocketChallenger.on(Commands.CHALLENGE_CLOSE, (value: string) => {
      const { challengeId: retrievedChallengeId } = JSON.parse(value)
      expect(retrievedChallengeId).toBe(newChallengeId)
      done()
    })
  })

  /**
   * Cancel challenge
   */

  test('Challenger can cancel challenge', async done => {
    clientSocketChallenger.emit(Commands.CHALLENGE_CLOSE, challengeId)

    const validateMessage = (value: string): void => {
      const { challengeId: retrievedChallengeId } = JSON.parse(value)
      expect(retrievedChallengeId).toBe(challengeId)
    }

    const promise1 = new Promise(resolve => {
      clientSocketChallenger.on(Commands.CHALLENGE_CLOSE, (value: string) => {
        validateMessage(value)
        resolve(true)
      })
    })

    const promise2 = new Promise(resolve => {
      clientSocketChallenged.on(Commands.CHALLENGE_CLOSE, (value: string) => {
        validateMessage(value)
        resolve(true)
      })
    })

    await Promise.all([promise1, promise2])
    done()
  })

  test('Challenged can cancel challenge', async done => {
    clientSocketChallenged.emit(Commands.CHALLENGE_CLOSE, challengeId)

    const promise1 = new Promise(resolve => {
      clientSocketChallenged.on(Commands.CHALLENGE_CLOSE, (value: string) => {
        const { challengeId: retrievedChallengeId } = JSON.parse(value)
        expect(retrievedChallengeId).toBe(challengeId)
        resolve(true)
      })
    })

    const promise2 = new Promise(resolve => {
      clientSocketChallenger.on(Commands.CHALLENGE_CLOSE, (value: string) => {
        const { challengeId: retrievedChallengeId } = JSON.parse(value)
        expect(retrievedChallengeId).toBe(challengeId)
        resolve(true)
      })
    })

    await Promise.all([promise1, promise2])
    done()
  })

  it("Can't cancel already cancelled challenge", async done => {
    clientSocketChallenger.emit(Commands.CHALLENGE_CLOSE, challengeId)
    await timeout(10)
    clientSocketChallenger.emit(Commands.CHALLENGE_CLOSE, challengeId)

    clientSocketChallenger.on(Commands.COMMAND_ERROR, (value: string) => {
      const { command } = JSON.parse(value)
      expect(command).toBe(Commands.CHALLENGE_CLOSE)
      done()
    })
  })

  it("Can't cancel inexistent challenge", async done => {
    clientSocketWithName.emit(Commands.CHALLENGE_CLOSE, 'invalid')

    clientSocketWithName.on(Commands.COMMAND_ERROR, (value: string) => {
      const { command } = JSON.parse(value)
      expect(command).toBe(Commands.CHALLENGE_CLOSE)
      done()
    })
  })

  /**
   * Accept challenge
   */

  it('Can accept challenge', async done => {
    const promise1 = new Promise(resolve => {
      clientSocketChallenged.on(Commands.CHALLENGE_CONFIRM, (value: string) => {
        const { challenged, challenger } = JSON.parse(value)
        expect(challenged).toBe(clientSocketChallenged.id)
        expect(challenger).toBe(clientSocketChallenger.id)
        resolve(true)
      })
    })

    const promise2 = new Promise(resolve => {
      clientSocketChallenger.on(Commands.CHALLENGE_CONFIRM, (value: string) => {
        const { challenged, challenger } = JSON.parse(value)
        expect(challenged).toBe(clientSocketChallenged.id)
        expect(challenger).toBe(clientSocketChallenger.id)
        resolve(true)
      })
    })

    clientSocketChallenged.emit(Commands.CHALLENGE_CONFIRM, challengeId)

    await Promise.all([promise1, promise2])
    done()
  })

  test("Challenger Can't accept challenge", async done => {
    clientSocketChallenger.emit(Commands.CHALLENGE_CONFIRM, challengeId)

    clientSocketChallenger.on(Commands.COMMAND_ERROR, (value: string) => {
      const { command } = JSON.parse(value)
      expect(command).toBe(Commands.CHALLENGE_CONFIRM)
      done()
    })
  })

  it("Can't accept inexistent challenge", async done => {
    clientSocketChallenger.emit(Commands.CHALLENGE_CONFIRM, 'invalid')

    clientSocketChallenger.on(Commands.COMMAND_ERROR, (value: string) => {
      const { command } = JSON.parse(value)
      expect(command).toBe(Commands.CHALLENGE_CONFIRM)
      done()
    })
  })

  it("Can't accept others challenge", async done => {
    clientSocketWithName.emit(Commands.CHALLENGE_CONFIRM, challengeId)

    clientSocketWithName.on(Commands.COMMAND_ERROR, (value: string) => {
      const { command } = JSON.parse(value)
      expect(command).toBe(Commands.CHALLENGE_CONFIRM)
      done()
    })
  })

  /**
   * Set destination
   */

  it('Can set destination', async done => {
    await createGame(port, clientSocketChallenger, clientSocketChallenged)
    clientSocketChallenger.on(Commands.COMMAND_PROCESSED, (value: string) => {
      const { command } = JSON.parse(value)
      expect(command).toEqual(Commands.SET_SPACESHIP_DESTINATION)
      done()
    })
    clientSocketChallenger.emit(
      Commands.SET_SPACESHIP_DESTINATION,
      JSON.stringify({ spaceship: 1, x: 1, y: 1 })
    )
  })

  it("Can't set destination if ready", async done => {
    await createGame(port, clientSocketChallenger, clientSocketChallenged)
    clientSocketChallenger.on(Commands.COMMAND_PROCESSED, () => {
      clientSocketChallenger.emit(
        Commands.SET_SPACESHIP_DESTINATION,
        JSON.stringify({ spaceship: 1, x: 1, y: 1 })
      )
    })

    clientSocketChallenger.on(Commands.COMMAND_ERROR, (value: string) => {
      const { command } = JSON.parse(value)
      expect(command).toEqual(Commands.SET_SPACESHIP_DESTINATION)
      done()
    })
    clientSocketChallenger.emit(Commands.SET_PLAYER_READY)
  })

  it("Can't set destination if not in game", async done => {
    await createGame(port, clientSocketChallenger, clientSocketChallenged)

    clientSocketWithName.on(Commands.COMMAND_ERROR, (value: string) => {
      const { command } = JSON.parse(value)
      expect(command).toEqual(Commands.SET_SPACESHIP_DESTINATION)
      done()
    })

    clientSocketWithName.emit(
      Commands.SET_SPACESHIP_DESTINATION,
      JSON.stringify({ spaceship: 1, x: 1, y: 1 })
    )
  })

  /**
   * Set Target
   */

  it('Can set target', async done => {
    await createGame(port, clientSocketChallenger, clientSocketChallenged)
    clientSocketChallenger.on(Commands.COMMAND_PROCESSED, (value: string) => {
      const { command } = JSON.parse(value)
      expect(command).toEqual(Commands.SET_SPACESHIP_TARGET)
      done()
    })
    clientSocketChallenger.emit(
      Commands.SET_SPACESHIP_TARGET,
      JSON.stringify({ spaceship: 1, x: 1, y: 1 })
    )
  })

  it("Can't set target if ready", async done => {
    await createGame(port, clientSocketChallenger, clientSocketChallenged)
    clientSocketChallenger.on(Commands.COMMAND_PROCESSED, () => {
      clientSocketChallenger.emit(
        Commands.SET_SPACESHIP_TARGET,
        JSON.stringify({ spaceship: 1, x: 1, y: 1 })
      )
    })

    clientSocketChallenger.on(Commands.COMMAND_ERROR, (value: string) => {
      const { command } = JSON.parse(value)
      expect(command).toEqual(Commands.SET_SPACESHIP_TARGET)
      done()
    })
    clientSocketChallenger.emit(Commands.SET_PLAYER_READY)
  })

  it("Can't set target if not in game", async done => {
    await createGame(port, clientSocketChallenger, clientSocketChallenged)

    clientSocketWithName.on(Commands.COMMAND_ERROR, (value: string) => {
      const { command } = JSON.parse(value)
      expect(command).toEqual(Commands.SET_SPACESHIP_TARGET)
      done()
    })

    clientSocketWithName.emit(
      Commands.SET_SPACESHIP_TARGET,
      JSON.stringify({ spaceship: 1, x: 1, y: 1 })
    )
  })

  /**
   * Set Target
   */

  it('Can set ready', async done => {
    await createGame(port, clientSocketChallenger, clientSocketChallenged)

    clientSocketChallenger.on(Commands.COMMAND_PROCESSED, (value: string) => {
      const { command } = JSON.parse(value)
      expect(command).toEqual(Commands.SET_PLAYER_READY)
      done()
    })
    clientSocketChallenger.emit(Commands.SET_PLAYER_READY)
  })

  it("Can't set ready twice", async done => {
    await createGame(port, clientSocketChallenger, clientSocketChallenged)

    clientSocketChallenger.on(Commands.COMMAND_ERROR, (value: string) => {
      const { command } = JSON.parse(value)
      expect(command).toEqual(Commands.SET_PLAYER_READY)
      done()
    })
    clientSocketChallenger.emit(Commands.SET_PLAYER_READY)
    await timeout(10)
    clientSocketChallenger.emit(Commands.SET_PLAYER_READY)
  })

  it("Can't set ready if not in game", async done => {
    await createGame(port, clientSocketChallenger, clientSocketChallenged)

    clientSocketWithName.on(Commands.COMMAND_ERROR, (value: string) => {
      const { command } = JSON.parse(value)
      expect(command).toEqual(Commands.SET_PLAYER_READY)
      done()
    })
    clientSocketWithName.emit(Commands.SET_PLAYER_READY)
  })

  it('Round finishes when both ready', async done => {
    await createGame(port, clientSocketChallenger, clientSocketChallenged)

    clientSocketChallenger.emit(
      Commands.SET_SPACESHIP_TARGET,
      JSON.stringify({ spaceship: 1, x: 1, y: 1 })
    )
    await timeout(10)
    clientSocketChallenged.emit(
      Commands.SET_SPACESHIP_TARGET,
      JSON.stringify({ spaceship: 2, x: 2, y: 2 })
    )
    await timeout(10)
    clientSocketChallenger.emit(
      Commands.SET_SPACESHIP_DESTINATION,
      JSON.stringify({ spaceship: 1, x: 1, y: 1 })
    )
    await timeout(10)
    clientSocketChallenged.emit(
      Commands.SET_SPACESHIP_DESTINATION,
      JSON.stringify({ spaceship: 2, x: 2, y: 2 })
    )

    clientSocketChallenger.on(Commands.SET_PLAYER_READY, value => {
      expect(JSON.parse(value)).toStrictEqual({
        [clientSocketChallenged.id]: { 2: { target: { x: 2, y: 2 }, destination: { x: 2, y: 2 } } },
        [clientSocketChallenger.id]: { 1: { target: { x: 1, y: 1 }, destination: { x: 1, y: 1 } } },
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

    await createGame(port, clientSocketChallenger, clientSocketChallenged)

    clientSocketChallenger.emit(
      Commands.SET_SPACESHIP_TARGET,
      JSON.stringify({ spaceship: 1, x: 1, y: 1 })
    )
    await timeout(10)
    clientSocketChallenged.emit(
      Commands.SET_SPACESHIP_TARGET,
      JSON.stringify({ spaceship: 2, x: 2, y: 2 })
    )
    await timeout(10)
    clientSocketChallenger.emit(
      Commands.SET_SPACESHIP_DESTINATION,
      JSON.stringify({ spaceship: 1, x: 1, y: 1 })
    )
    await timeout(10)
    clientSocketChallenged.emit(
      Commands.SET_SPACESHIP_DESTINATION,
      JSON.stringify({ spaceship: 2, x: 2, y: 2 })
    )

    clientSocketChallenger.on(Commands.SET_PLAYER_READY, value => {
      expect(JSON.parse(value)).toStrictEqual({
        [clientSocketChallenged.id]: { 2: { target: { x: 2, y: 2 }, destination: { x: 2, y: 2 } } },
        [clientSocketChallenger.id]: { 1: { target: { x: 1, y: 1 }, destination: { x: 1, y: 1 } } },
      })
      done()
    })
  })

  it('Round finishes when time finishes', async done => {
    jest
      .spyOn(Game.prototype, 'setTimeout')
      .mockImplementation((callback): NodeJS.Timeout => setTimeout(callback, 50))

    await createGame(port, clientSocketChallenger, clientSocketChallenged)

    clientSocketChallenger.emit(
      Commands.SET_SPACESHIP_TARGET,
      JSON.stringify({ spaceship: 1, x: 1, y: 1 })
    )
    await timeout(10)
    clientSocketChallenged.emit(
      Commands.SET_SPACESHIP_TARGET,
      JSON.stringify({ spaceship: 2, x: 2, y: 2 })
    )
    await timeout(10)
    clientSocketChallenger.emit(
      Commands.SET_SPACESHIP_DESTINATION,
      JSON.stringify({ spaceship: 1, x: 1, y: 1 })
    )
    await timeout(10)
    clientSocketChallenged.emit(
      Commands.SET_SPACESHIP_DESTINATION,
      JSON.stringify({ spaceship: 2, x: 2, y: 2 })
    )

    clientSocketChallenger.on(Commands.SET_PLAYER_READY, value => {
      expect(JSON.parse(value)).toStrictEqual({
        [clientSocketChallenged.id]: { 2: { target: { x: 2, y: 2 }, destination: { x: 2, y: 2 } } },
        [clientSocketChallenger.id]: { 1: { target: { x: 1, y: 1 }, destination: { x: 1, y: 1 } } },
      })
      done()
    })
  })

  it('Round starts after finish timeout', async done => {
    jest
      .spyOn(Game.prototype, 'setTimeout')
      .mockImplementation((callback): NodeJS.Timeout => setTimeout(callback, 50))

    await createGame(port, clientSocketChallenger, clientSocketChallenged)

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
    await createGame(port, clientSocketChallenger, clientSocketChallenged)

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
    await createGame(port, clientSocketChallenger, clientSocketChallenged)

    clientSocketChallenger.emit(Commands.ROUND_STARTED)

    clientSocketChallenger.on(Commands.COMMAND_ERROR, value => {
      const { command } = JSON.parse(value)
      expect(command).toEqual(Commands.ROUND_STARTED)
      done()
    })
  })

  it("Can't be ready for new round if not in a game", async done => {
    await createGame(port, clientSocketChallenger, clientSocketChallenged)

    clientSocketWithName.emit(Commands.ROUND_STARTED)

    clientSocketWithName.on(Commands.COMMAND_ERROR, value => {
      const { command } = JSON.parse(value)
      expect(command).toEqual(Commands.ROUND_STARTED)
      done()
    })
  })

  it('Draw game after 10 rounds', async done => {
    await createGame(port, clientSocketChallenger, clientSocketChallenged)

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
      expect(value).toEqual('draw')
      done()
    })
  })

  it('Close game after someone send close message', async done => {
    await createGame(port, clientSocketChallenger, clientSocketChallenged)

    clientSocketChallenger.emit(Commands.CLOSE_GAME)

    clientSocketChallenged.on(Commands.CLOSE_GAME, () => {
      done()
    })
  })

  it("Can't close game if not in game", async done => {
    await createGame(port, clientSocketChallenger, clientSocketChallenged)

    clientSocketWithName.emit(Commands.CLOSE_GAME)

    clientSocketWithName.on(Commands.COMMAND_ERROR, value => {
      const { command } = JSON.parse(value)
      expect(command).toEqual(Commands.CLOSE_GAME)
      done()
    })
  })

  it('Can send private message', async done => {
    await createGame(port, clientSocketChallenger, clientSocketChallenged)
    const mockedMessage = 'wow'
    clientSocketChallenger.emit(Commands.PRIVATE_MESSAGE, mockedMessage)

    clientSocketChallenged.on(Commands.PRIVATE_MESSAGE, value => {
      const { id, message } = JSON.parse(value)
      expect(id).toEqual(clientSocketChallenger.id)
      expect(message).toEqual(mockedMessage)
      done()
    })
  })

  it("Can't send private message if not in game", async done => {
    await createGame(port, clientSocketChallenger, clientSocketChallenged)

    clientSocketWithName.emit(Commands.PRIVATE_MESSAGE, 'wow')

    clientSocketWithName.on(Commands.COMMAND_ERROR, value => {
      const { command } = JSON.parse(value)
      expect(command).toEqual(Commands.PRIVATE_MESSAGE)
      done()
    })
  })
})
