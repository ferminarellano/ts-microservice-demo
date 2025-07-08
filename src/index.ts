import express, { Request, Response } from 'express'

const app = express()
const port = process.env.PORT || 3000

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Hello from TypeScript microservice v1.0.3!' })
})

app.listen(port, () => {
  console.log(`Microservice running on port ${port}`)
})
