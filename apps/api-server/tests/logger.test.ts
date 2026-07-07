import pino from 'pino';
import pinoHttp from 'pino-http';
import { Request, Response, NextFunction } from 'express';
import { logger, createLogger } from '../src/lib/logger';

jest.mock('pino-pretty', () => ({ default: { transport: jest.fn() } }));

describe('logger', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('createLogger', () => {
    test('does not enable pretty transport in production', () => {
      process.env.NODE_ENV = 'production';
      const log = createLogger();
      expect(log.level).toBe('info');
      expect(log).not.toHaveProperty('transport');
    });

    test('has debug level in development', () => {
      process.env.NODE_ENV = 'development';
      const log = createLogger();
      expect(log.level).toBe('debug');
    });

    test('default export is a pino logger instance', () => {
      expect(logger).toBeDefined();
    });
  });

  describe('pino-http middleware', () => {
    const customProps = (req: Request, _res: Response) => ({
      userId: req.user?.sub ?? 'anonymous',
      path: req.path,
    });

    test('binds req.log and supports custom logging', async () => {
      const testLogger = createLogger();
      const middleware = pinoHttp({ logger: testLogger, customProps });

      const req = {
        user: { sub: 'user-1', client_id: 'client-1', role: 'Admin' },
        path: '/api/v1/inspections',
      } as unknown as Request;
      const res = {
        on: jest.fn(),
      } as unknown as Response;

      await new Promise<void>((resolve, reject) => {
        middleware(req, res, (err?: unknown) => {
          if (err) reject(err);
          else resolve();
        });
      });

      expect(req.log).toBeDefined();
      expect(() => req.log!.info('test')).not.toThrow();
    });

    test('binds req.log without crashing when req.user is missing', async () => {
      const testLogger = createLogger();
      const middleware = pinoHttp({ logger: testLogger, customProps });

      const req = { path: '/health' } as unknown as Request;
      const res = {
        on: jest.fn(),
      } as unknown as Response;

      await expect(
        new Promise<void>((resolve, reject) => {
          middleware(req, res, (err?: unknown) => {
            if (err) reject(err);
            else resolve();
          });
        }),
      ).resolves.toBeUndefined();

      expect(req.log).toBeDefined();
      expect(() => req.log!.info('test')).not.toThrow();
    });
  });
});
