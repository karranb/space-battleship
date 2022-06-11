import express, { Request, Response } from 'express'
import http from 'http'

const app = express()

app.get('/', (_req: Request, res: Response) => {
  res.send('GET request to the homepage')
})

const server = http.createServer(app)

const port = process.env.PORT ?? 8000

server.listen(port, () => {
  process.stdout.write(`Server started on port ${port} :)`)
})

export default server
