import './config/env'

import server from 'interfaces/http'
import WebSocket from 'interfaces/socket'
import Game from 'game'

const webSocket = new WebSocket(server)

new Game(webSocket)
