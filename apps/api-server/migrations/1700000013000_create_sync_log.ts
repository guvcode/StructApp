import { type Migrator } from 'node-pg-migrate';

export const up = (pgm: Migrator) => {
  pgm.createTable('sync_log', {
    log_id: { type: 'UUID', primaryKey: true, default: pgm.func('uuid_generate_v4()') },
    client_id: { type: 'UUID', notNull: true },
    user_id: { type: 'UUID', notNull: true },
    action: { type: 'VARCHAR(20)', notNull: true, check: "action IN ('push', 'pull')" },
    item_count: { type: 'INT', notNull: true, default: 0 },
    created_at: { type: 'TIMESTAMP WITH TIME ZONE', notNull: true, default: pgm.func('NOW()') },
  });

  pgm.createIndex('sync_log', 'client_id', { name: 'idx_sync_log_client' });
  pgm.createIndex('sync_log', 'created_at', { name: 'idx_sync_log_created' });
};

export const down = (pgm: Migrator) => {
  pgm.dropTable('sync_log');
};