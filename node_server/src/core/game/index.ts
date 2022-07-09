import SpaceshipBattleBase from 'core/game/base'
import { Socket } from 'socket.io'
import gameMixin from './mixins/game'
import roomMixin from './mixins/room'
import challengeMixin from './mixins/challenge'

import WebSocket from 'interfaces/socket'

class SpaceshipBattle extends gameMixin(challengeMixin(roomMixin(SpaceshipBattleBase))) {
  constructor(webSocket: WebSocket) {
    super(webSocket)
    this.webSocket.addEventListener('connection', (socket: Socket) => {
      this.setupSocketListeners(socket)
    })
  }

  setupSocketListeners(socket: Socket): void {
    this.setupRoomListeners(socket)
    this.setupChallengeListeners(socket, this.createGame.bind(this))
    this.setupGameListeners(socket)
  }
}

export default SpaceshipBattle
