import { routes } from 'core/routes'
import express from 'express'
import http from 'http'

const app = express()
app.use('/game', express.static(__dirname + '/../../static/game'))
app.use('/assets', express.static(__dirname + '/../../static/game/assets'))
routes(app)
const server = http.createServer(app)
const port = process.env.PORT ?? 8000
server.listen(port, () => {
  process.stdout.write(`Server started on port ${port} :)`)
})

export default server
