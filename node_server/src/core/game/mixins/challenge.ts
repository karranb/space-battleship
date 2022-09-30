import { Socket } from 'socket.io'
import crypto from 'crypto'
import { Commands, CHALLENGE_SECONDS_LIMIT } from 'interfaces/shared'
import { Challenge, SpaceshipBattleMixin } from '../types'
import { SocketError } from 'utils/errors'

type OnChallengeAccept = (challenger: Socket, challenged: Socket) => void

function challengeMixin<TBase extends SpaceshipBattleMixin>(Base: TBase) {
  return class extends Base {
    cancelChallenge(challengeId: string): Challenge | null {
      const challenge = this.challenges[challengeId]
      if (!challenge) {
        return null
      }
      if (challenge.timer) {
        clearTimeout(challenge.timer)
        challenge.timer = undefined
      }
      const challenger = challenge.challenger
      challenger.data.challenges = challenger.data.challenges?.filter(
        (item: string) => item !== challengeId
      )
      const challenged = challenge.challenged
      challenged.data.challenges = challenged.data.challenges?.filter(
        (item: string) => item !== challengeId
      )
      delete this.challenges[challengeId]
      return challenge
    }

    cancelUserChallenges(socket: Socket): void {
      socket.data.challenges?.forEach((challengeId: string) => {
        const challenge = this.cancelChallenge(challengeId)
        if (challenge) {
          const message = { challengeId, reason: socket.id }
          this.sendMessage(challenge.challenger, Commands.CHALLENGE_CLOSE, message)
          this.sendMessage(challenge.challenged, Commands.CHALLENGE_CLOSE, message)
        }
      })
    }

    getChallenge(challengeId: string): Challenge {
      const challenge = this.challenges[challengeId]
      if (!challenge) {
        throw new SocketError('The challenge does not exist')
      }
      return challenge
    }

    handleSocketChallengeDisconnect(socket: Socket): void {
      this.cancelUserChallenges(socket)
    }

    handleCloseChallenge(socket: Socket, challengeId: unknown): void {
      const challenge = this.cancelChallenge(challengeId as string)
      if (!challenge) {
        throw new SocketError('This challenge does not exist anymore')
      }

      const message = { challengeId, reason: socket.id }
      this.sendMessage(challenge.challenger, Commands.CHALLENGE_CLOSE, message)
      this.sendMessage(challenge.challenged, Commands.CHALLENGE_CLOSE, message)
    }

    handleChallengeUser(socket: Socket, value: unknown): void {
      if (!socket.data.name) {
        throw new SocketError('You are not signed in')
      }

      if (socket.data.game) {
        throw new SocketError('You Are already playing')
      }

      const challenged = this.webSocket.getSocket(value as string)
      if (!challenged || challenged.data.game) {
        throw new SocketError('Player not available anymore')
      }
      const challengeId = crypto.randomUUID()
      const challenge = {
        challenged: challenged,
        challenger: socket,
        timer: this.setTimeout(() => {
          const challenge = this.cancelChallenge(challengeId)
          if (challenge) {
            const message = { challengeId, reason: 'TIMEOUT' }
            this.sendMessage(challenge.challenger, Commands.CHALLENGE_CLOSE, message)
            this.sendMessage(challenge.challenged, Commands.CHALLENGE_CLOSE, message)
          }
        }, CHALLENGE_SECONDS_LIMIT * 1000),
      }
      this.challenges[challengeId] = challenge
      socket.data.challenges = [...(socket.data.challenges ?? []), challengeId]
      challenged.data.challenges = [...(challenged.data.challenges ?? []), challengeId]

      const message = {
        challengeId,
        challengedId: challenged.id,
        challengerId: socket.id,
      }
      this.sendMessage(challenged, Commands.CHALLENGE, message)
      this.sendMessage(socket, Commands.CHALLENGE, message)
      this.sendProcessedMessage(socket, Commands.CHALLENGE)
    }

    handleChallengeAccept(onChallengeAccept: (challenger: Socket, challenged: Socket) => void) {
      return (socket: Socket, challengeId: unknown): void => {
        const challenge = this.getChallenge(challengeId as string)
        if (challenge.challenged.id !== socket.id) {
          throw new SocketError('You are not allowed to accept this challenge')
        }
        onChallengeAccept(challenge.challenger, challenge.challenged)

        const message = {
          challenger: challenge.challenger.id,
          challenged: socket.id,
        }
        this.sendMessage(challenge.challenger, Commands.CHALLENGE_CONFIRM, message)
        this.sendMessage(socket, Commands.CHALLENGE_CONFIRM, message)
        this.cancelUserChallenges(socket)
        this.cancelUserChallenges(challenge.challenger)
      }
    }

    setupChallengeListeners(socket: Socket, onChallengeAccept: OnChallengeAccept): void {
      this.addMessageListeners(socket, [
        { command: Commands.CHALLENGE_CLOSE, callback: this.handleCloseChallenge },
        { command: Commands.CHALLENGE, callback: this.handleChallengeUser },
        {
          command: Commands.CHALLENGE_CONFIRM,
          callback: this.handleChallengeAccept(onChallengeAccept),
        },
      ])
      this.webSocket
        .addEventClientListener(socket, 'disconnect', () =>
          this.handleSocketChallengeDisconnect(socket)
        )
        .addEventClientListener(socket, 'error', () => this.handleSocketChallengeDisconnect(socket))
    }
  }
}

export default challengeMixin
