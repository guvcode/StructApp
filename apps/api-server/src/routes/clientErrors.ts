import { Router, Request, Response, NextFunction } from 'express';
import { recordClientError } from '../services/jobErrors';
import { decodeTokenUnsafe } from '../lib/auth';

const router = Router();

router.post(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error_message, error_stack, error_code } = req.body;

      if (!error_message || typeof error_message !== 'string') {
        return res.status(422).json({
          success: false,
          error_code: 'VALIDATION_ERROR',
          message: 'error_message is required',
        });
      }

      const authHeader = req.headers.authorization;
      let userSub: string | undefined;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        const decoded = decodeTokenUnsafe(token);
        userSub = decoded?.sub;
      }

      const ip = req.connection.remoteAddress;

      await recordClientError(
        { error_message, error_stack, error_code },
        userSub,
        ip
      );

      res.status(202).json({ success: true });
    } catch (err) {
      if (err instanceof Error && err.message === 'RATE_LIMITED') {
        return res.status(429).json({
          success: false,
          error_code: 'RATE_LIMITED',
          message: 'Too many errors reported. Please try again later.',
        });
      }
      next(err);
    }
  }
);

export const clientErrorsRouter = router;
