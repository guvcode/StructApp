import { type Migrator } from 'node-pg-migrate';

export const up = (pgm: Migrator) => {
  pgm.createTable('system_job_errors', {
    error_id: 'UUID PRIMARY KEY DEFAULT uuid_generate_v4()',
    job_id: 'UUID NULL',
    job_type: 'VARCHAR(100) NOT NULL',
    error_code: 'VARCHAR(100) NOT NULL',
    error_message: 'TEXT NOT NULL',
    error_stack: 'TEXT CHECK (length(error_stack) <= 8192 OR error_stack IS NULL)',
    attempt_count: 'INT NOT NULL DEFAULT 1',
    last_attempted_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
    input_payload: 'JSONB',
    dismissed_at: 'TIMESTAMP WITH TIME ZONE NULL',
    dismissed_by: 'UUID NULL REFERENCES users(user_id)',
    created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
  });

  pgm.createIndex('system_job_errors', ['job_type']);
  pgm.createIndex('system_job_errors', ['error_code']);
  pgm.createIndex('system_job_errors', ['dismissed_at']);
  pgm.createIndex('system_job_errors', ['last_attempted_at']);
  pgm.createIndex('system_job_errors', ['job_id']);
};

export const down = (pgm: Migrator) => {
  pgm.dropTable('system_job_errors');
};
