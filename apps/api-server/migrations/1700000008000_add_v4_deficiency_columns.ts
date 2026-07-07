import { type Migrator } from 'node-pg-migrate';

export const up = (pgm: Migrator) => {
  pgm.addColumns('deficiency_records', {
    category: 'VARCHAR(100) NULL',
    sub_component: 'VARCHAR(255) NULL',
    focus_area: 'VARCHAR(255) NULL',
    deficiency_category: 'VARCHAR(255) NULL',
    detailed_description: 'TEXT NULL',
    mechanisms: 'TEXT NULL',
    vibration_present: 'BOOLEAN NULL',
    ndt_required: 'BOOLEAN NULL',
    further_investigation_required: 'BOOLEAN NULL',
    recommended_action: 'TEXT NULL',
    consequence_severity: 'INT NULL CHECK (consequence_severity BETWEEN 1 AND 5)',
    likelihood: 'CHAR(1) NULL CHECK (likelihood IN (\'A\', \'B\', \'C\', \'D\', \'E\'))',
    most_affected_consequence: 'VARCHAR(100) NULL',
    risk_rank: 'INT NULL CHECK (risk_rank BETWEEN 1 AND 25)',
    risk_rating: 'VARCHAR(10) NULL CHECK (risk_rating IN (\'High\', \'Medium\', \'Low\'))',
  });

  pgm.createIndex('deficiency_records', 'category', { name: 'idx_deficiencies_category', where: 'category IS NOT NULL' });
};

export const down = (pgm: Migrator) => {
  pgm.dropIndex('deficiency_records', { name: 'idx_deficiencies_category' });
  pgm.removeColumns('deficiency_records', [
    'category',
    'sub_component',
    'focus_area',
    'deficiency_category',
    'detailed_description',
    'mechanisms',
    'vibration_present',
    'ndt_required',
    'further_investigation_required',
    'recommended_action',
    'consequence_severity',
    'likelihood',
    'most_affected_consequence',
    'risk_rank',
    'risk_rating',
  ]);
};