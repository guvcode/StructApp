import { type Migrator } from 'node-pg-migrate';

export const up = (pgm: Migrator) => {
  pgm.sql(`
    DO $$
    DECLARE
      c RECORD;
      cat_id UUID;
      comp_id UUID;
      sub_id UUID;
      focus_id UUID;
      defcat_id UUID;
    BEGIN
      IF EXISTS (SELECT 1 FROM deficiency_taxonomy LIMIT 1) THEN RETURN; END IF;

      FOR c IN SELECT client_id FROM clients LOOP

        -- ===== Building Envelope =====
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order)
          VALUES (c.client_id, NULL, 'category', 'Building Envelope', 'Building Envelope', 1)
          RETURNING node_id INTO cat_id;

        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, cat_id, 'component', 'Building Envelope', 'Roofing', 1) RETURNING node_id INTO comp_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, comp_id, 'sub_component', 'Building Envelope', 'Membrane', 1) RETURNING node_id INTO sub_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, sub_id, 'focus_area', 'Building Envelope', 'Waterproofing', 1) RETURNING node_id INTO focus_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, focus_id, 'deficiency_category', 'Building Envelope', 'Blistering', 1) RETURNING node_id INTO defcat_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, defcat_id, 'detailed_description', 'Building Envelope', 'Localized blistering on roof membrane', 1);
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, focus_id, 'deficiency_category', 'Building Envelope', 'Tears/Punctures', 2) RETURNING node_id INTO defcat_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, defcat_id, 'detailed_description', 'Building Envelope', 'Mechanical damage to membrane', 1);

        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, comp_id, 'sub_component', 'Building Envelope', 'Drainage', 2) RETURNING node_id INTO sub_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, sub_id, 'focus_area', 'Building Envelope', 'Ponding Water', 1) RETURNING node_id INTO focus_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, focus_id, 'deficiency_category', 'Building Envelope', 'Standing water > 48hrs', 1) RETURNING node_id INTO defcat_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, defcat_id, 'detailed_description', 'Building Envelope', 'Ponding water on low-slope roof', 1);

        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, cat_id, 'component', 'Building Envelope', 'Cladding', 2) RETURNING node_id INTO comp_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, comp_id, 'sub_component', 'Building Envelope', 'Panel Seals', 1) RETURNING node_id INTO sub_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, sub_id, 'focus_area', 'Building Envelope', 'Joint Sealant Failure', 1) RETURNING node_id INTO focus_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, focus_id, 'deficiency_category', 'Building Envelope', 'Cracked/separated sealant', 1) RETURNING node_id INTO defcat_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, defcat_id, 'detailed_description', 'Building Envelope', 'Sealant failure at panel joints', 1);

        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, cat_id, 'component', 'Building Envelope', 'Coating', 3) RETURNING node_id INTO comp_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, comp_id, 'sub_component', 'Building Envelope', 'Paint System', 1) RETURNING node_id INTO sub_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, sub_id, 'focus_area', 'Building Envelope', 'Coating Failure', 1) RETURNING node_id INTO focus_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, focus_id, 'deficiency_category', 'Building Envelope', 'Peeling/Delamination', 1) RETURNING node_id INTO defcat_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, defcat_id, 'detailed_description', 'Building Envelope', 'Paint peeling on exposed steel', 1);

        -- ===== Structural Support =====
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order)
          VALUES (c.client_id, NULL, 'category', 'Structural Support', 'Structural Support', 2)
          RETURNING node_id INTO cat_id;

        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, cat_id, 'component', 'Structural Support', 'Steel Framing', 1) RETURNING node_id INTO comp_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, comp_id, 'sub_component', 'Structural Support', 'Columns', 1) RETURNING node_id INTO sub_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, sub_id, 'focus_area', 'Structural Support', 'Welded Connections', 1) RETURNING node_id INTO focus_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, focus_id, 'deficiency_category', 'Structural Support', 'Fatigue Crack', 1) RETURNING node_id INTO defcat_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, defcat_id, 'detailed_description', 'Structural Support', 'Hairline crack at weld toe', 1);
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, focus_id, 'deficiency_category', 'Structural Support', 'Corrosion at Base', 2) RETURNING node_id INTO defcat_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, defcat_id, 'detailed_description', 'Structural Support', 'Section loss at column base plate', 1);

        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, comp_id, 'sub_component', 'Structural Support', 'Bolted Connections', 2) RETURNING node_id INTO sub_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, sub_id, 'focus_area', 'Structural Support', 'Loose Bolts', 1) RETURNING node_id INTO focus_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, focus_id, 'deficiency_category', 'Structural Support', 'Multiple loose anchor bolts', 1) RETURNING node_id INTO defcat_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, defcat_id, 'detailed_description', 'Structural Support', 'Anchor bolts below specified torque', 1);

        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, cat_id, 'component', 'Structural Support', 'Cable System', 2) RETURNING node_id INTO comp_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, comp_id, 'sub_component', 'Structural Support', 'Suspension Cables', 1) RETURNING node_id INTO sub_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, sub_id, 'focus_area', 'Structural Support', 'Corrosion Protection', 1) RETURNING node_id INTO focus_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, focus_id, 'deficiency_category', 'Structural Support', 'Corrosion', 1) RETURNING node_id INTO defcat_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, defcat_id, 'detailed_description', 'Structural Support', 'Active corrosion on main cables', 1);

        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, cat_id, 'component', 'Structural Support', 'Expansion Joints', 3) RETURNING node_id INTO comp_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, comp_id, 'sub_component', 'Structural Support', 'Deck Joints', 1) RETURNING node_id INTO sub_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, sub_id, 'focus_area', 'Structural Support', 'Excessive Gap', 1) RETURNING node_id INTO focus_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, focus_id, 'deficiency_category', 'Structural Support', 'Joint gap exceeds specification', 1) RETURNING node_id INTO defcat_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, defcat_id, 'detailed_description', 'Structural Support', 'Measured gap > max allowable', 1);

        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, cat_id, 'component', 'Structural Support', 'Guardrails', 4) RETURNING node_id INTO comp_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, comp_id, 'sub_component', 'Structural Support', 'Handrails', 1) RETURNING node_id INTO sub_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, sub_id, 'focus_area', 'Structural Support', 'Loose Connection', 1) RETURNING node_id INTO focus_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, focus_id, 'deficiency_category', 'Structural Support', 'Loose railing connection', 1) RETURNING node_id INTO defcat_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, defcat_id, 'detailed_description', 'Structural Support', 'Handrail bolts require tightening', 1);

        -- ===== Foundations & Geotechnical =====
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order)
          VALUES (c.client_id, NULL, 'category', 'Foundations & Geotechnical', 'Foundations & Geotechnical', 3)
          RETURNING node_id INTO cat_id;

        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, cat_id, 'component', 'Foundations & Geotechnical', 'Concrete Foundation', 1) RETURNING node_id INTO comp_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, comp_id, 'sub_component', 'Foundations & Geotechnical', 'Footings', 1) RETURNING node_id INTO sub_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, sub_id, 'focus_area', 'Foundations & Geotechnical', 'Settlement', 1) RETURNING node_id INTO focus_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, focus_id, 'deficiency_category', 'Foundations & Geotechnical', 'Settlement Crack', 1) RETURNING node_id INTO defcat_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, defcat_id, 'detailed_description', 'Foundations & Geotechnical', 'Minor settling crack in foundation wall', 1);

        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, cat_id, 'component', 'Foundations & Geotechnical', 'Retaining Walls', 2) RETURNING node_id INTO comp_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, comp_id, 'sub_component', 'Foundations & Geotechnical', 'Wall Panels', 1) RETURNING node_id INTO sub_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, sub_id, 'focus_area', 'Foundations & Geotechnical', 'Structural Cracks', 1) RETURNING node_id INTO focus_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, focus_id, 'deficiency_category', 'Foundations & Geotechnical', 'Hairline Crack', 1) RETURNING node_id INTO defcat_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, defcat_id, 'detailed_description', 'Foundations & Geotechnical', 'Crack in retaining wall < 2mm', 1);

        -- ===== Process Equipment =====
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order)
          VALUES (c.client_id, NULL, 'category', 'Process Equipment', 'Process Equipment', 4)
          RETURNING node_id INTO cat_id;

        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, cat_id, 'component', 'Process Equipment', 'Pressure Vessels', 1) RETURNING node_id INTO comp_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, comp_id, 'sub_component', 'Process Equipment', 'Vessel Shell', 1) RETURNING node_id INTO sub_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, sub_id, 'focus_area', 'Process Equipment', 'Inspection Status', 1) RETURNING node_id INTO focus_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, focus_id, 'deficiency_category', 'Process Equipment', 'Inspection Overdue', 1) RETURNING node_id INTO defcat_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, defcat_id, 'detailed_description', 'Process Equipment', 'Annual inspection sticker expired', 1);

        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, cat_id, 'component', 'Process Equipment', 'Pipe Supports', 2) RETURNING node_id INTO comp_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, comp_id, 'sub_component', 'Process Equipment', 'Brackets', 1) RETURNING node_id INTO sub_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, sub_id, 'focus_area', 'Process Equipment', 'Corrosion Protection', 1) RETURNING node_id INTO focus_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, focus_id, 'deficiency_category', 'Process Equipment', 'Corrosion', 1) RETURNING node_id INTO defcat_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, defcat_id, 'detailed_description', 'Process Equipment', 'Section loss on pipe support bracket', 1);

        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, cat_id, 'component', 'Process Equipment', 'Piping', 3) RETURNING node_id INTO comp_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, comp_id, 'sub_component', 'Process Equipment', 'Pipe Wall', 1) RETURNING node_id INTO sub_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, sub_id, 'focus_area', 'Process Equipment', 'Wall Thickness', 1) RETURNING node_id INTO focus_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, focus_id, 'deficiency_category', 'Process Equipment', 'General Corrosion', 1) RETURNING node_id INTO defcat_id;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order) VALUES (c.client_id, defcat_id, 'detailed_description', 'Process Equipment', 'Uniform wall thinning detected', 1);

      END LOOP;
    END $$;
  `);
};

export const down = (pgm: Migrator) => {
  pgm.sql(`DELETE FROM deficiency_taxonomy`);
};