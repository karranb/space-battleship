import SpaceshipBattleBase from 'game/base'
import { Commands } from 'shared'
import { Socket } from 'socket.io'
import { GConstructor } from 'utils/types'

export type Coordinate = { x: number; y: number }

export type SpaceshipRound = {
  destination?: Coordinate
  target?: Coordinate
}

export type PlayerRound = Record<number, SpaceshipRound>

export type GameRound = Record<string, PlayerRound>

export enum PlayerPhase {
  READY_FOR_COMMANDS = 'READY_FOR_COMMANDS',
  PREPARING_FOR_NEW_ROUND = 'PREPARING_FOR_NEW_ROUND',
  WAITING_OPONENT = 'WAITING_OPONENT',
}

export type Player = {
  socket: Socket
  phase: PlayerPhase
}

export type Game = {
  rounds: GameRound[]
  challenger: Player
  challenged: Player
  roundTimer?: NodeJS.Timeout
}

export type Games = Record<string, Game>

export type Challenge = {
  challenger: Socket
  challenged: Socket
  timer?: NodeJS.Timeout
}

export type SpaceshipBattleMixin = GConstructor<SpaceshipBattleBase>

export type SocketListener = {
  command: Commands
  callback: (socket: Socket, value: string) => void
}
