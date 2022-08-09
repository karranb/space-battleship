import { routes } from 'core/routes'
import express from 'express'
import http from 'http'
import fs from 'fs'

const app = express()
app.use('/game', express.static(__dirname + '/../../static/game'))
app.use('/assets', express.static(__dirname + '/../../static/game/assets'))
routes(app)
const getOptions = () => {
  try {
    return {
      key: fs.readFileSync(__dirname + '/origin.pem'),
      cert: fs.readFileSync(__dirname + '/private.pem'),
    } as http.ServerOptions
  } catch (err) {
    return {}
  }
}
const server = http.createServer(getOptions(), app)
const port = 8000
server.listen(port, () => {
  process.stdout.write(`Server started on port ${port} :)`)
})

export default server
