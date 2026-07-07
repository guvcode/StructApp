import pino from 'pino';

let pretty: unknown;
try {
  pretty = require('pino-pretty');
} catch {
  pretty = undefined;
}

export function createLogger(env = process.env.NODE_ENV): pino.Logger {
  const options: pino.LoggerOptions = {
    level: env === 'production' ? 'info' : 'debug',
  };
  if (env !== 'production' && pretty) {
    options.transport = { target: 'pino-pretty' };
  }
  return pino(options);
}

export const logger = createLogger();