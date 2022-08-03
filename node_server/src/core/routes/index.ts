import express, { Request, Response } from 'express'
import path from 'path'

export const routes = (app: express.Application) => {
  app.get('/', (_req: Request, res: Response) => {
    res.sendFile(path.resolve('./src/static/game/index.html'))
  })
}
