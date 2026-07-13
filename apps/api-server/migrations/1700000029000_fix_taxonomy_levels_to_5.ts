import { type Migrator } from 'node-pg-migrate';

const OLD_ENUM = 'taxonomy_level_enum';
const NEW_ENUM = 'taxonomy_level_enum_v5';

export const up = (pgm: Migrator) => {
  // Step 1: Add deficiency_codes and deficiency_mechanisms columns
  pgm.addColumns('deficiency_taxonomy', {
    deficiency_codes: 'TEXT[] NULL',
    deficiency_mechanisms: 'TEXT[] NULL',
  });

  // Step 2: For each focus_area, aggregate deficiency codes from its deficiency_category children
  pgm.sql(`
    UPDATE deficiency_taxonomy fa
    SET
      deficiency_codes = sub.codes,
      deficiency_mechanisms = sub.mechanisms
    FROM (
      SELECT
        dc.parent_id AS focus_id,
        ARRAY_AGG(DISTINCT dc.label ORDER BY dc.label) AS codes,
        ARRAY_AGG(DISTINCT dc.label ORDER BY dc.label) AS mechanisms
      FROM deficiency_taxonomy dc
      WHERE dc.level = 'deficiency_category'
        AND dc.parent_id IS NOT NULL
      GROUP BY dc.parent_id
    ) sub
    WHERE fa.node_id = sub.focus_id
      AND fa.level = 'focus_area'
  `);

  // Step 3: Delete detailed_description and deficiency_category nodes
  // Delete detailed_description first (children of deficiency_category)
  pgm.sql(`
    DELETE FROM deficiency_taxonomy
    WHERE level = 'detailed_description'
  `);
  pgm.sql(`
    DELETE FROM deficiency_taxonomy
    WHERE level = 'deficiency_category'
  `);

  // Step 4: Remove 'deficiency_category' and 'detailed_description' from the enum
  pgm.sql(`CREATE TYPE ${NEW_ENUM} AS ENUM (
    'category', 'equipment_type', 'component',
    'sub_component', 'focus_area'
  )`);

  pgm.sql(`
    ALTER TABLE deficiency_taxonomy
    ALTER COLUMN level DROP DEFAULT
  `);

  pgm.sql(`
    ALTER TABLE deficiency_taxonomy
    ALTER COLUMN level TYPE ${NEW_ENUM}
    USING level::text::${NEW_ENUM}
  `);

  pgm.sql(`
    ALTER TABLE deficiency_taxonomy
    ALTER COLUMN level SET DEFAULT 'category'
  `);

  pgm.sql(`DROP TYPE ${OLD_ENUM}`);

  // Step 5: Drop the unique constraint that included level, since we removed levels
  // The constraint was: unique_label_per_client_category_level
  // Keep it but the removed levels are gone so it's cleaner now
};

export const down = (pgm: Migrator) => {
  // Restore old enum with all values
  pgm.sql(`CREATE TYPE ${OLD_ENUM} AS ENUM (
    'category', 'equipment_type', 'component',
    'sub_component', 'focus_area',
    'deficiency_category', 'detailed_description'
  )`);

  pgm.sql(`
    ALTER TABLE deficiency_taxonomy
    ALTER COLUMN level DROP DEFAULT
  `);

  pgm.sql(`
    ALTER TABLE deficiency_taxonomy
    ALTER COLUMN level TYPE ${OLD_ENUM}
    USING level::text::${OLD_ENUM}
  `);

  pgm.sql(`
    ALTER TABLE deficiency_taxonomy
    ALTER COLUMN level SET DEFAULT 'category'
  `);

  pgm.sql(`DROP TYPE ${NEW_ENUM}`);

  // Remove the added columns
  pgm.dropColumns('deficiency_taxonomy', ['deficiency_codes', 'deficiency_mechanisms']);
};