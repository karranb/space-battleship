import { Socket } from 'socket.io'
import crypto from 'crypto'
import { Commands } from 'shared'
import { Challenge, PlayerPhase, SpaceshipBattleMixin } from '../types'
import { SocketError } from 'utils/errors'

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
          const message = JSON.stringify({ challengeId, reason: socket.id })
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

    handleSocketGameDisconnect(socket: Socket): void {
      this.cancelUserChallenges(socket)
    }

    handleCloseChallenge(socket: Socket, challengeId: string): void {
      const challenge = this.cancelChallenge(challengeId)
      if (!challenge) {
        throw new SocketError('This challenge does not exist anymore')
      }

      const message = JSON.stringify({ challengeId, reason: socket.id })
      this.sendMessage(challenge.challenger, Commands.CHALLENGE_CLOSE, message)
      this.sendMessage(challenge.challenged, Commands.CHALLENGE_CLOSE, message)
    }

    handleChallengeUser(socket: Socket, value: string): void {
      if (!socket.data.name) {
        throw new SocketError('You are not signed in')
      }

      if (socket.data.game) {
        throw new SocketError('You Are already playing')
      }

      const challenged = this.webSocket.getSocket(value)
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
            const message = JSON.stringify({ challengeId, reason: 'TIMEOUT' })
            this.sendMessage(challenge.challenger, Commands.CHALLENGE_CLOSE, message)
            this.sendMessage(challenge.challenged, Commands.CHALLENGE_CLOSE, message)
          }
        }, 15000),

      }
      this.challenges[challengeId] = challenge
      socket.data.challenges = [...(socket.data.challenges ?? []), challengeId]
      challenged.data.challenges = [...(challenged.data.challenges ?? []), challengeId]

      this.sendMessage(
        challenged,
        Commands.CHALLENGE,
        JSON.stringify({
          challengeId,
          challengedId: challenged.id,
          challengerId: socket.id,
        })
      )
      this.sendProcessedMessage(socket, Commands.CHALLENGE)
    }

    handleChallengeAccept(socket: Socket, challengeId: string): void {
      const challenge = this.getChallenge(challengeId)
      if (challenge.challenged.id !== socket.id) {
        throw new SocketError('You are not allowed to accept this challenge')
      }
      const uuid = crypto.randomUUID()
      challenge.challenger.data.game = uuid
      challenge.challenged.data.game = uuid
      this.games[uuid] = {
        challenger: {
          socket: challenge.challenger,
          phase: PlayerPhase.PREPARING_FOR_NEW_ROUND,
        },
        challenged: {
          socket,
          phase: PlayerPhase.PREPARING_FOR_NEW_ROUND,
        },
        rounds: [],
      }
      const message = JSON.stringify({ challenger: challenge.challenger.id, challenged: socket.id })
      this.sendMessage(challenge.challenger, Commands.CHALLENGE_CONFIRM, message)
      this.sendMessage(socket, Commands.CHALLENGE_CONFIRM, message)
      this.cancelUserChallenges(socket)
      this.cancelUserChallenges(challenge.challenger)
    }

    setupGameListeners(socket: Socket): void {
      this.addMessageListeners(socket, [
        { command: Commands.CHALLENGE_CLOSE, callback: this.handleCloseChallenge },
        { command: Commands.CHALLENGE, callback: this.handleChallengeUser },
        { command: Commands.CHALLENGE_CONFIRM, callback: this.handleChallengeAccept },
      ])
      this.webSocket
        .addEventClientListener(socket, 'disconnect', () => this.handleSocketGameDisconnect(socket))
        .addEventClientListener(socket, 'error', () => this.handleSocketGameDisconnect(socket))
    }
  }
}

export default challengeMixin


