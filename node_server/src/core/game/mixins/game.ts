import { Socket } from 'socket.io'
import crypto from 'crypto'
import {
  Commands,
  CHOICE_SECONDS_LIMIT,
  MAX_ROUNDS,
  ROUND_ANIMATION_SECONDS_LIMIT,
  ROUND_SECONDS_LIMIT,
} from 'interfaces/shared'
import { Game, Player, PlayerPhase, SpaceshipBattleMixin } from '../types'
import { getLastItem } from 'utils/array'
import { SocketError } from 'utils/errors'
import { getRandomChoices } from 'utils/game'

function gameMixin<TBase extends SpaceshipBattleMixin>(Base: TBase) {
  return class extends Base {
    finishRound(game: Game): void {
      game.challenger.phase = PlayerPhase.PREPARING_FOR_NEW_ROUND
      game.challenged.phase = PlayerPhase.PREPARING_FOR_NEW_ROUND
      if (game.roundTimer) {
        clearTimeout(game.roundTimer)
        game.roundTimer = undefined
      }
      game.roundTimer = this.setTimeout(
        () => this.startRound(game),
        ROUND_ANIMATION_SECONDS_LIMIT * 1000
      )
      const lastRound = getLastItem(game.rounds)
      this.sendMessage(game.challenged.socket, Commands.SET_PLAYER_READY, JSON.stringify(lastRound))
      this.sendMessage(game.challenger.socket, Commands.SET_PLAYER_READY, JSON.stringify(lastRound))
    }

    startRound(game: Game): void {
      if (game.rounds.length === MAX_ROUNDS) {
        this.closeGame(game.challenger.socket)
        this.sendMessage(
          game.challenged.socket,
          Commands.CLOSE_GAME,
          JSON.stringify({ reason: 'draw' })
        )
        this.sendMessage(
          game.challenger.socket,
          Commands.CLOSE_GAME,
          JSON.stringify({ reason: 'draw' })
        )
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
        game.roundTimer = undefined
      }
      game.roundTimer = this.setTimeout(() => {
        this.finishRound(game)
      }, ROUND_SECONDS_LIMIT * 1000)
    }

    createGame(challenger: Socket, challenged: Socket) {
      const uuid = crypto.randomUUID()
      challenger.data.game = uuid
      challenged.data.game = uuid
      const game: Game = {
        challenger: {
          socket: challenger,
          phase: PlayerPhase.READY_FOR_COMMANDS,
          choices: {},
        },
        challenged: {
          socket: challenged,
          phase: PlayerPhase.READY_FOR_COMMANDS,
          choices: {},
        },
        rounds: [],
      }

      game.roundTimer = this.setTimeout(() => {
        this.setPlayersChoices(game)
        this.startRound(game)
      }, CHOICE_SECONDS_LIMIT * 1000)

      this.games[uuid] = game
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

    validateChoicesAreSet(game: Game): void {
      const players = [game.challenged, game.challenger]
      if (players.some(player => Object.keys(player.choices).length === 0)) {
        throw new SocketError('Choices are not set')
      }
    }

    setPlayersChoices(game: Game): void {
      if (game.roundTimer) {
        clearTimeout(game.roundTimer)
        game.roundTimer = undefined
      }
      const players = [game.challenged, game.challenger]
      players.forEach(player => {
        if (Object.keys(player.choices).length === 0) {
          player.choices = getRandomChoices()
        }
      })
      const message = JSON.stringify({
        challenged: game.challenged.choices,
        challenger: game.challenger.choices,
      })
      players.forEach(player => {
        this.sendMessage(player.socket, Commands.SET_CHOICES, message)
      })
    }

    handlePlayerChoices(socket: Socket, message: string): void {
      const game = this.getGame(socket)
      const player = this.getPlayer(socket, game)
      this.validatePlayerPhase(player, PlayerPhase.READY_FOR_COMMANDS, 'Invalid phase')
      if (Object.keys(player.choices).length > 0) {
        throw new SocketError('Choices are already set')
      }

      player.choices = JSON.parse(message)
      player.phase = PlayerPhase.WAITING_OPONENT
      this.sendProcessedMessage(socket, Commands.SET_CHOICES)
      if (
        game.challenged.phase === PlayerPhase.WAITING_OPONENT &&
        game.challenger.phase === PlayerPhase.WAITING_OPONENT
      ) {
        this.setPlayersChoices(game)
        this.startRound(game)
      }
    }

    handleSocketGameDisconnect(socket: Socket): void {
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

    handlePrivateMessage(socket: Socket, message: string): void {
      const game = this.getGame(socket)
      const socketMessage = JSON.stringify({ id: socket.id, message })
      this.sendMessage(game.challenged.socket, Commands.PRIVATE_MESSAGE, socketMessage)
      this.sendMessage(game.challenger.socket, Commands.PRIVATE_MESSAGE, socketMessage)
    }

    handleCloseGame(socket: Socket, reason: string): void {
      const game = this.closeGame(socket)
      if (game) {
        const message = JSON.stringify({ reason })
        this.sendMessage(game.challenger.socket, Commands.CLOSE_GAME, message)
        this.sendMessage(game.challenged.socket, Commands.CLOSE_GAME, message)
      }
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

    validateCoordinates(x: number, y: number): void {
      if (x < 10 || x > 605 || y < 10 || y > 385) {
        throw new SocketError('Invalid coordintes')
      }
    }

    handleSetSpaceshipDestination(socket: Socket, value: string): void {
      const game = this.getGame(socket)
      const player = this.getPlayer(socket, game)
      this.validatePlayerPhase(player, PlayerPhase.READY_FOR_COMMANDS, 'You are already ready')
      this.validateChoicesAreSet(game)
      const { spaceship, x, y }: { spaceship: number; x: number; y: number } = JSON.parse(value)
      this.validateCoordinates(x, y)
      const playerRound = getLastItem(game.rounds)?.[socket.id] ?? {}
      if (!playerRound[spaceship]) {
        playerRound[spaceship] = {}
      }
      playerRound[spaceship].destination = { x, y }
      this.sendProcessedMessage(socket, Commands.SET_SPACESHIP_DESTINATION, { spaceship, x, y })
    }

    handleSetSpaceshipTarget(socket: Socket, value: string): void {
      const game = this.getGame(socket)
      const player = this.getPlayer(socket, game)
      this.validatePlayerPhase(player, PlayerPhase.READY_FOR_COMMANDS, 'You are already ready')
      this.validateChoicesAreSet(game)

      const { spaceship, x, y }: { spaceship: number; x: number; y: number } = JSON.parse(value)
      this.validateCoordinates(x, y)
      const playerRound = getLastItem(game.rounds)?.[socket.id] ?? {}
      if (!playerRound[spaceship]) {
        playerRound[spaceship] = {}
      }
      playerRound[spaceship].target = { x, y }
      this.sendProcessedMessage(socket, Commands.SET_SPACESHIP_TARGET, { spaceship, x, y })
    }

    handleSetPlayerReady(socket: Socket): void {
      const game = this.getGame(socket)
      const player = this.getPlayer(socket, game)
      this.validatePlayerPhase(player, PlayerPhase.READY_FOR_COMMANDS, 'You are already ready')
      this.validateChoicesAreSet(game)

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
        { command: Commands.SET_CHOICES, callback: this.handlePlayerChoices },
      ])
      this.webSocket
        .addEventClientListener(socket, 'disconnect', () => this.handleSocketGameDisconnect(socket))
        .addEventClientListener(socket, 'error', () => this.handleSocketGameDisconnect(socket))
    }
  }
}

export default gameMixin
