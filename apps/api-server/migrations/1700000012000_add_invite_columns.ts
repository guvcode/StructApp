import { type Migrator } from 'node-pg-migrate';

export const up = (pgm: Migrator) => {
  pgm.addColumns('users', {
    invite_token: 'VARCHAR(500) NULL',
    invite_sent_at: 'TIMESTAMP WITH TIME ZONE NULL',
    invite_accepted_at: 'TIMESTAMP WITH TIME ZONE NULL',
  });
};

export const down = (pgm: Migrator) => {
  pgm.dropColumns('users', ['invite_token', 'invite_sent_at', 'invite_accepted_at']);
};