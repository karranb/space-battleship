import { Socket as ClientSocket } from 'socket.io-client'
import { createServer } from 'http'
import { AddressInfo } from 'ws'

import { Commands } from 'interfaces/shared'
import WebSocket from 'interfaces/socket'

import Game from '..'
import { createChallenge, createClient, createClientWithName, createGame } from './fixtures'

const timeout = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

describe('Challenge logic', () => {
  let clientSocketWithoutName: ClientSocket
  let clientSocketWithName: ClientSocket
  let clientSocketChallenger: ClientSocket
  let clientSocketChallenged: ClientSocket
  let challengeId: string

  let webSocket: WebSocket
  let port: number

  beforeEach(done => {
    const httpServer = createServer()
    webSocket = new WebSocket(httpServer)
    new Game(webSocket)
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
      clientSocketChallenged.on(Commands.CHALLENGE, value => {
        expect(value.challengerId).toBe(clientSocketWithName.id)
        resolve(true)
      })
    })
    const promiseChallengeSent = new Promise(resolve => {
      clientSocketWithName.on(Commands.COMMAND_PROCESSED, value => {
        const { command } = value
        expect(command).toBe(Commands.CHALLENGE)
        resolve(true)
      })
    })
    await Promise.all([promiseChallenge, promiseChallengeSent])
  })

  it("Can't Challenge another user if did not set name", async done => {
    clientSocketWithoutName.emit(Commands.CHALLENGE, clientSocketChallenged.id)

    clientSocketWithoutName.on(Commands.COMMAND_ERROR, value => {
      const { command } = value

      expect(command).toBe(Commands.CHALLENGE)
      done()
    })
  })

  it("Can't Challenge a user that quitted", async done => {
    clientSocketChallenged.close()
    clientSocketChallenger.emit(Commands.CHALLENGE, clientSocketChallenged.id)
    clientSocketChallenger.on(Commands.COMMAND_ERROR, value => {
      const { command } = value
      expect(command).toBe(Commands.CHALLENGE)
      done()
    })
  })

  it("Can't Challenge a user that is playing", async done => {
    await createGame(port, clientSocketChallenger, clientSocketChallenged)

    clientSocketWithName.emit(Commands.CHALLENGE, clientSocketChallenged.id)

    clientSocketWithName.on(Commands.COMMAND_ERROR, value => {
      const { command } = value
      expect(command).toBe(Commands.CHALLENGE)
      done()
    })
  })

  it("Can't Challenge a user if is playing", async done => {
    await createGame(port, clientSocketChallenger, clientSocketChallenged)

    clientSocketChallenger.emit(Commands.CHALLENGE, clientSocketWithName.id)

    clientSocketChallenger.on(Commands.COMMAND_ERROR, value => {
      const { command } = value
      expect(command).toBe(Commands.CHALLENGE)
      done()
    })
  })

  /**
   *  on Disconnect
   */

  it('Challenge is cancelled after user quit', async done => {
    clientSocketChallenged.close()
    clientSocketChallenger.on(Commands.CHALLENGE_CLOSE, value => {
      const { challengeId: retrievedChallengeId } = value
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
      clientSocketChallenged
    )

    clientSocketChallenger.on(Commands.CHALLENGE_CLOSE, value => {
      const { challengeId: retrievedChallengeId } = value
      expect(retrievedChallengeId).toBe(newChallengeId)
      done()
    })
  })

  /**
   * Cancel challenge
   */

  test('Challenger can cancel challenge', async done => {
    clientSocketChallenger.emit(Commands.CHALLENGE_CLOSE, challengeId)

    const validateMessage = (value: { challengeId: string }): void => {
      const { challengeId: retrievedChallengeId } = value
      expect(retrievedChallengeId).toBe(challengeId)
    }

    const promise1 = new Promise(resolve => {
      clientSocketChallenger.on(Commands.CHALLENGE_CLOSE, value => {
        validateMessage(value)
        resolve(true)
      })
    })

    const promise2 = new Promise(resolve => {
      clientSocketChallenged.on(Commands.CHALLENGE_CLOSE, value => {
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
      clientSocketChallenged.on(Commands.CHALLENGE_CLOSE, value => {
        const { challengeId: retrievedChallengeId } = value
        expect(retrievedChallengeId).toBe(challengeId)
        resolve(true)
      })
    })

    const promise2 = new Promise(resolve => {
      clientSocketChallenger.on(Commands.CHALLENGE_CLOSE, value => {
        const { challengeId: retrievedChallengeId } = value
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

    clientSocketChallenger.on(Commands.COMMAND_ERROR, value => {
      const { command } = value
      expect(command).toBe(Commands.CHALLENGE_CLOSE)
      done()
    })
  })

  it("Can't cancel inexistent challenge", async done => {
    clientSocketWithName.emit(Commands.CHALLENGE_CLOSE, 'invalid')

    clientSocketWithName.on(Commands.COMMAND_ERROR, value => {
      const { command } = value
      expect(command).toBe(Commands.CHALLENGE_CLOSE)
      done()
    })
  })

  /**
   * Accept challenge
   */

  it('Can accept challenge', async done => {
    const promise1 = new Promise(resolve => {
      clientSocketChallenged.on(Commands.CHALLENGE_CONFIRM, value => {
        const { challenged, challenger } = value
        expect(challenged).toBe(clientSocketChallenged.id)
        expect(challenger).toBe(clientSocketChallenger.id)
        resolve(true)
      })
    })

    const promise2 = new Promise(resolve => {
      clientSocketChallenger.on(Commands.CHALLENGE_CONFIRM, value => {
        const { challenged, challenger } = value
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

    clientSocketChallenger.on(Commands.COMMAND_ERROR, value => {
      const { command } = value
      expect(command).toBe(Commands.CHALLENGE_CONFIRM)
      done()
    })
  })

  it("Can't accept inexistent challenge", async done => {
    clientSocketChallenger.emit(Commands.CHALLENGE_CONFIRM, 'invalid')

    clientSocketChallenger.on(Commands.COMMAND_ERROR, value => {
      const { command } = value
      expect(command).toBe(Commands.CHALLENGE_CONFIRM)
      done()
    })
  })

  it("Can't accept others challenge", async done => {
    clientSocketWithName.emit(Commands.CHALLENGE_CONFIRM, challengeId)

    clientSocketWithName.on(Commands.COMMAND_ERROR, value => {
      const { command } = value
      expect(command).toBe(Commands.CHALLENGE_CONFIRM)
      done()
    })
  })
})
