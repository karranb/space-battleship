import { Commands } from 'shared'
import { io, Socket as ClientSocket } from 'socket.io-client'

export const createClient = (port: number): Promise<ClientSocket> => {
  return new Promise(resolve => {
    const socket = io(`http://localhost:${port}`)
    socket.on('connect', () => {
      resolve(socket)
    })
  })
}

export const createClientWithName = (port: number, name?: string): Promise<ClientSocket> => {
  return new Promise(resolve => {
    const socket = io(`http://localhost:${port}`)
    socket.on('connect', () => {
      socket.emit(Commands.NAME, name ?? 'name')
      socket.on(Commands.NEW_USER_SET, () => {
        resolve(socket)
      })
    })
  })
}

export const createChallenge = async (
  port: number,
  challengerArg?: ClientSocket,
  challengedArg?: ClientSocket
): Promise<string> => {
  const challenger = challengerArg ?? (await createClientWithName(port))
  const challenged = challengedArg ?? (await createClientWithName(port))
  return new Promise(resolve => {
    challenged.on(Commands.CHALLENGE, value => {
      resolve(JSON.parse(value).challengeId)
    })
    challenger.emit(Commands.CHALLENGE, challenged.id)
  })
}

export const createGame = async (
  port: number,
  challengerArg?: ClientSocket,
  challengedArg?: ClientSocket
): Promise<boolean> => {
  const challenger = challengerArg ?? (await createClientWithName(port))
  const challenged = challengedArg ?? (await createClientWithName(port))
  const challengeId = await createChallenge(port, challenger, challenged)
  return new Promise(resolve => {
    challenger.on(Commands.CHALLENGE_CONFIRM, () => {
      resolve(true)
    })
    challenged.emit(Commands.CHALLENGE_CONFIRM, challengeId)
  })
}
