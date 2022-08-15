import express, { Request, Response } from 'express'

export const routes = (app: express.Application) => {
  app.get('/', (_req: Request, res: Response) => {
    res.send('success')
  })
  app.get('/country', (req: Request, res: Response) => {
    const countryCode = req.headers['cf-ipcountry']
    res.send(countryCode)
  })
}
