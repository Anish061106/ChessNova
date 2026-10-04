import { Request, Response } from 'express';
import { checkDatabaseConnection } from '../services/database/prisma.js';

export const getHealth = async (_req: Request, res: Response) => {
  const isDbConnected = await checkDatabaseConnection();

  res.status(200).json({
    status: 'ok',
    service: 'chessnova-api',
    database: isDbConnected ? 'connected' : 'disconnected',
  });
};
