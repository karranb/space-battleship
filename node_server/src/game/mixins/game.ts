import { Socket } from 'socket.io'
import crypto from 'crypto'
import { Commands } from 'shared'
import { Challenge, Game, Player, PlayerPhase, SpaceshipBattleMixin } from '../types'
import { getLastItem } from 'utils/array'
import { SocketError } from 'utils/errors'

function gameMixin<TBase extends SpaceshipBattleMixin>(Base: TBase) {
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

    finishRound(game: Game): void {
      game.challenger.phase = PlayerPhase.PREPARING_FOR_NEW_ROUND
      game.challenged.phase = PlayerPhase.PREPARING_FOR_NEW_ROUND
      if (game.roundTimer) {
        clearTimeout(game.roundTimer)
      }
      game.roundTimer = this.setTimeout(() => this.startRound(game), 15000)
      const lastRound = getLastItem(game.rounds)
      this.sendMessage(game.challenged.socket, Commands.SET_PLAYER_READY, JSON.stringify(lastRound))
      this.sendMessage(game.challenger.socket, Commands.SET_PLAYER_READY, JSON.stringify(lastRound))
    }

    startRound(game: Game): void {
      if (game.rounds.length === 10) {
        this.closeGame(game.challenger.socket)
        this.sendMessage(game.challenged.socket, Commands.CLOSE_GAME, 'draw')
        this.sendMessage(game.challenger.socket, Commands.CLOSE_GAME, 'draw')
        return
      }

      game.challenger.phase = PlayerPhase.READY_FOR_COMMANDS
      game.challenged.phase = PlayerPhase.READY_FOR_COMMANDS

      game.rounds.push({
        [game.challenger.socket.id]: {},
        [game.challenged.socket.id]: {},
      })

      this.sendMessage(game.challenger.socket, Commands.ROUND_STARTED)
      this.sendMessage(game.challenged.socket, Commands.ROUND_STARTED)
      if (game.roundTimer) {
        clearTimeout(game.roundTimer)
      }
      game.roundTimer = this.setTimeout(() => {
        this.finishRound(game)
      }, 30000)
    }

    getGame(socket: Socket): Game {
      const game = this.games[socket.data.game]
      if (!game) {
        throw new SocketError('You are not in a game')
      }
      return game
    }

    getPlayer(socket: Socket, game: Game): Player {
      const player =
        game.challenged.socket.id === socket.id
          ? game.challenged
          : game.challenger.socket.id === socket.id
          ? game.challenger
          : null
      if (!player) {
        throw new SocketError('You are not in this game')
      }
      return player
    }

    closeGame(socket: Socket): Game | null {
      const game = this.getGame(socket)
      const gameId = socket.data.game
      game.challenged.socket.data.game = undefined
      game.challenger.socket.data.game = undefined
      if (game.roundTimer) {
        clearTimeout(game.roundTimer)
        game.roundTimer = undefined
      }
      delete this.games[gameId]
      return game
    }

    validatePlayerPhase(player: Player, phase: PlayerPhase, errorMessage: string): void {
      if (player.phase !== phase) {
        throw new SocketError(errorMessage)
      }
    }

    handleSocketGameDisconnect(socket: Socket): void {
      this.cancelUserChallenges(socket)
      try {
        const game = this.closeGame(socket)
        if (game) {
          const message = JSON.stringify({ reason: socket.id })
          this.sendMessage(game.challenged.socket, Commands.CLOSE_GAME, message)
          this.sendMessage(game.challenger.socket, Commands.CLOSE_GAME, message)
        }
      } catch (err) {
        if (err instanceof SocketError) {
          return
        }
        throw err
      }
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
      this.startRound(this.games[uuid])
      const message = JSON.stringify({ challenger: challenge.challenger.id, challenged: socket.id })
      this.sendMessage(challenge.challenger, Commands.CHALLENGE_CONFIRM, message)
      this.sendMessage(socket, Commands.CHALLENGE_CONFIRM, message)
      this.cancelUserChallenges(socket)
      this.cancelUserChallenges(challenge.challenger)
    }

    handlePrivateMessage(socket: Socket, message: string): void {
      const game = this.getGame(socket)
      const socketMessage = JSON.stringify({ id: socket.id, message })
      this.sendMessage(game.challenged.socket, Commands.PRIVATE_MESSAGE, socketMessage)
      this.sendMessage(game.challenger.socket, Commands.PRIVATE_MESSAGE, socketMessage)
    }

    handleCloseGame(socket: Socket, reason: string): void {
      const game = this.getGame(socket)
      const message = JSON.stringify({ reason })
      this.sendMessage(game.challenged.socket, Commands.CLOSE_GAME, message)
      this.sendMessage(game.challenger.socket, Commands.CLOSE_GAME, message)
    }

    handleRoundStarted(socket: Socket): void {
      const game = this.getGame(socket)
      const player = this.getPlayer(socket, game)
      this.validatePlayerPhase(player, PlayerPhase.PREPARING_FOR_NEW_ROUND, 'Invalid phase')

      player.phase = PlayerPhase.WAITING_OPONENT
      this.sendProcessedMessage(socket, Commands.ROUND_STARTED)
      if (
        game.challenged.phase === PlayerPhase.WAITING_OPONENT &&
        game.challenger.phase === PlayerPhase.WAITING_OPONENT
      ) {
        this.startRound(game)
      }
    }

    handleSetSpaceshipDestination(socket: Socket, value: string): void {
      const game = this.getGame(socket)
      const player = this.getPlayer(socket, game)
      this.validatePlayerPhase(player, PlayerPhase.READY_FOR_COMMANDS, 'You are already ready')
      const { spaceship, x, y }: { spaceship: number; x: number; y: number } = JSON.parse(value)
      const playerRound = getLastItem(game.rounds)?.[socket.id] ?? {}
      if (!playerRound[spaceship]) {
        playerRound[spaceship] = {}
      }
      playerRound[spaceship].destination = { x, y }
      this.sendProcessedMessage(socket, Commands.SET_SPACESHIP_DESTINATION)
    }

    handleSetSpaceshipTarget(socket: Socket, value: string): void {
      const game = this.getGame(socket)
      const player = this.getPlayer(socket, game)
      this.validatePlayerPhase(player, PlayerPhase.READY_FOR_COMMANDS, 'You are already ready')

      const { spaceship, x, y }: { spaceship: number; x: number; y: number } = JSON.parse(value)
      const playerRound = getLastItem(game.rounds)?.[socket.id] ?? {}
      if (!playerRound[spaceship]) {
        playerRound[spaceship] = {}
      }
      playerRound[spaceship].target = { x, y }
      this.sendProcessedMessage(socket, Commands.SET_SPACESHIP_TARGET)
    }

    handleSetPlayerReady(socket: Socket): void {
      const game = this.getGame(socket)
      const player = this.getPlayer(socket, game)
      this.validatePlayerPhase(player, PlayerPhase.READY_FOR_COMMANDS, 'You are already ready')
      player.phase = PlayerPhase.WAITING_OPONENT
      this.sendProcessedMessage(socket, Commands.SET_PLAYER_READY)
      if (
        game.challenged.phase === PlayerPhase.WAITING_OPONENT &&
        game.challenger.phase === PlayerPhase.WAITING_OPONENT
      ) {
        this.finishRound(game)
      }
    }

    setupGameListeners(socket: Socket): void {
      this.addMessageListeners(socket, [
        {
          command: Commands.SET_SPACESHIP_DESTINATION,
          callback: this.handleSetSpaceshipDestination,
        },
        { command: Commands.SET_SPACESHIP_TARGET, callback: this.handleSetSpaceshipTarget },
        { command: Commands.SET_PLAYER_READY, callback: this.handleSetPlayerReady },
        { command: Commands.PRIVATE_MESSAGE, callback: this.handlePrivateMessage },
        { command: Commands.CLOSE_GAME, callback: this.handleCloseGame },
        { command: Commands.ROUND_STARTED, callback: this.handleRoundStarted },
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

export default gameMixin
