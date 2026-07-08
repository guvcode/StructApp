import { type Migrator } from 'node-pg-migrate';

export const up = (pgm: Migrator) => {
  pgm.createTable('notification_queue', {
    id: 'BIGSERIAL PRIMARY KEY',
    notification_type: { type: 'VARCHAR(100)', notNull: true },
    payload: { type: 'JSONB', notNull: true },
    status: { type: 'VARCHAR(20)', notNull: true, default: 'pending' },
    retry_count: { type: 'INT', notNull: true, default: 0 },
    last_error: { type: 'TEXT' },
    created_at: { type: 'TIMESTAMPTZ', notNull: true, default: pgm.func('NOW()') },
    sent_at: { type: 'TIMESTAMPTZ' },
  });

  pgm.createIndex('notification_queue', 'status');
};

export const down = (pgm: Migrator) => {
  pgm.dropTable('notification_queue');
};