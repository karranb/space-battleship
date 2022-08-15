import express, { Request, Response } from 'express'

export const routes = (app: express.Application) => {
  app.get('/', (_req: Request, res: Response) => {
    res.send('success')
  })
  app.get('/country', (req: Request, res: Response) => {
    const country_code = req.headers['cf-ipcountry']
    const country_code2 = req.headers['CF-IPCountry']

    res.send(country_code + ' ' + country_code2)
  })
}
