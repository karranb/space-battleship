import './config/env'

import server from 'interfaces/http'
import WebSocket from 'interfaces/socket'
import Game from 'core/game'

const webSocket = new WebSocket(server)
new Game(webSocket)
