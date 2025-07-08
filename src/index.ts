import express, { Request, Response } from 'express'
import routes from './routes/index'

const app = express()

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Hello from TypeScript microservice v1.2.3!' })
})

app.use(routes);

export default app