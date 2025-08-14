import { Request, Response, NextFunction } from 'express';
import { MulterError } from 'multer';
import { DaxtraError } from '../index.js';
import { ApiResponse } from '../utils/responseTypes.js';

export const errorHandler = (error: Error | MulterError, req: Request, res: Response, next: NextFunction): void => {
  // eslint-disable-next-line no-console
  console.error('Error:', error);

  if (error instanceof MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      const response: ApiResponse = {
        success: false,
        error: {
          type: 'file_too_large',
          message: 'File size exceeds 10MB limit'
        }
      };
      res.status(400).json(response);
      return;
    }
  }

  if (error instanceof DaxtraError) {
    const response: ApiResponse = {
      success: false,
      error: {
        type: 'daxtra_error',
        code: error.code?.toString(),
        message: error.message,
        status: error.status
      }
    };
    res.status(error.status).json(response);
    return;
  }

  const response: ApiResponse = {
    success: false,
    error: {
      type: 'internal_error',
      message: 'An unexpected error occurred'
    }
  };
  res.status(500).json(response);
};
