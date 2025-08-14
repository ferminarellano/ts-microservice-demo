import { Request, Response } from 'express';

export const getHealthStatus = (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'parser-microservice',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    daxtra: {
      baseUrl: process.env.DAXTRA_BASE_URL,
      account: process.env.DAXTRA_ACCOUNT,
      turbo: process.env.DAXTRA_TURBO === 'true'
    }
  });
};