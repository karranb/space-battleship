import SpaceshipBattleBase from 'game/base'
import { Socket } from 'socket.io'
import gameMixin from './mixins/game'
import roomMixin from './mixins/room'

import WebSocket from 'interfaces/socket'

class SpaceshipBattle extends gameMixin(roomMixin(SpaceshipBattleBase)) {
  constructor(webSocket: WebSocket) {
    super(webSocket)
    this.webSocket.addEventListener('connection', (socket: Socket) =>
      this.setupSocketListeners(socket)
    )
  }

  setupSocketListeners(socket: Socket): void {
    this.setupRoomListeners(socket)
    this.setupGameListeners(socket)
  }
}

export default SpaceshipBattle
