import { Request, Response, NextFunction } from 'express';

const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'InternalServerError',
        message: 'An unexpected error occurred. Please try again later.'
    });
};

export default errorHandler;