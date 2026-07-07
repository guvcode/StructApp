import { Pool } from 'pg';

const DEFAULT_COMPONENT_TYPES = [
  'Support Frame',
  'Bolted Connection',
  'Welded Joint',
  'Corrosion Protection Coating',
  'Foundation/Footing',
  'Handrail/Guardrail',
];

const DEFAULT_WORK_TYPES = [
  'On-Site Inspection',
  'Travel',
  'Report Writing',
  'Client Meeting',
];

export async function seedDefaultPicklists(pool: Pool, clientId: string): Promise<void> {
  const client = await pool.connect();
  try {
    for (const name of DEFAULT_COMPONENT_TYPES) {
      await client.query(
        'INSERT INTO component_types (client_id, name) VALUES ($1, $2) ON CONFLICT (client_id, name) DO NOTHING',
        [clientId, name]
      );
    }
    for (const name of DEFAULT_WORK_TYPES) {
      await client.query(
        'INSERT INTO work_types (client_id, name) VALUES ($1, $2) ON CONFLICT (client_id, name) DO NOTHING',
        [clientId, name]
      );
    }
  } finally {
    client.release();
  }
}