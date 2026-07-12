import { type Migrator } from 'node-pg-migrate';

// Inline the asset library data as a JSON string to avoid fs/import.meta.url issues
// with node-pg-migrate's module loader
const ASSET_LIBRARY_JSON = JSON.stringify([
  {
    "category": "Process Equipment (Mechanical)",
    "components": [
      {
        "name": "Influent Screen / Bar Rack",
        "sub_components": [
          { "name": "Screen Assembly", "focus_areas": ["Bar Rack / Mesh Panel", "Guide Rails / Frame"] },
          { "name": "Support Structure", "focus_areas": ["Anchor Bolts / Base"] }
        ]
      },
      {
        "name": "Equalization / Sump Tank",
        "sub_components": [
          { "name": "Tank Shell / Wall", "focus_areas": ["Wall Plate (steel) or Concrete Wall Panel", "Wall-to-Floor Joint / Waterstop"] },
          { "name": "Floor / Sump", "focus_areas": ["Base Slab"] },
          { "name": "Access", "focus_areas": ["Manway / Hatch, Platform"] }
        ]
      },
      {
        "name": "Rapid Mix / Reaction Tank",
        "sub_components": [
          { "name": "Tank Shell", "focus_areas": ["Wall / Internal Lining"] },
          { "name": "Agitator / Mixer", "focus_areas": ["Shaft, Impeller, Mounting"] },
          { "name": "Support / Foundation", "focus_areas": ["Baseplate, Anchor Bolts"] }
        ]
      },
      {
        "name": "Lime Reactor / HDS Reaction Tank",
        "sub_components": [
          { "name": "Tank Shell", "focus_areas": ["Wall Plate, Coating/Lining"] },
          { "name": "Internals", "focus_areas": ["Agitator/Impeller, Aeration Diffusers, Baffles"] },
          { "name": "Support / Foundation", "focus_areas": ["Skirt/Legs, Anchor Bolts, Foundation"] }
        ]
      },
      {
        "name": "Reactivator Clarifier / Thickener",
        "sub_components": [
          { "name": "Tank Shell / Walls", "focus_areas": ["Wall Plate (steel) or Concrete Wall"] },
          { "name": "Drive Mechanism", "focus_areas": ["Center Column, Bridge/Walkway, Drive Support"] },
          { "name": "Rake / Scraper Mechanism", "focus_areas": ["Rake Arms, Scraper Blades"] },
          { "name": "Launder & Weir", "focus_areas": ["Overflow Launder, Weir Plates"] },
          { "name": "Underflow System", "focus_areas": ["Cone/Hopper, Underflow Piping"] }
        ]
      },
      {
        "name": "Lime Silo & Slaking System",
        "sub_components": [
          { "name": "Silo", "focus_areas": ["Shell / Walls", "Support Legs / Skirt", "Discharge Cone / Feeder"] },
          { "name": "Slaker Unit", "focus_areas": ["Slaking Chamber, Agitator"] }
        ]
      },
      {
        "name": "Chemical Storage Tank (polymer/coagulant/caustic/acid)",
        "sub_components": [
          { "name": "Tank Shell", "focus_areas": ["FRP / Steel / Poly Wall"] },
          { "name": "Secondary Containment", "focus_areas": ["Containment Bund/Berm, Liner"] },
          { "name": "Nozzles / Venting", "focus_areas": ["Fill/Vent Nozzles, Overflow"] }
        ]
      },
      {
        "name": "Chemical Dosing Skid / Feed Pumps",
        "sub_components": [
          { "name": "Skid Frame", "focus_areas": ["Base Frame, Anchor Points"] },
          { "name": "Metering Pump", "focus_areas": ["Pump Head, Diaphragm/Seal"] },
          { "name": "Piping / Tubing", "focus_areas": ["Chemical Feed Lines, Fittings"] }
        ]
      },
      {
        "name": "Sludge Thickener",
        "sub_components": [
          { "name": "Tank Shell", "focus_areas": ["Wall Plate / Concrete Wall"] },
          { "name": "Rake Mechanism", "focus_areas": ["Rake Arms, Drive Unit"] }
        ]
      },
      {
        "name": "Sludge Dewatering (Filter Press / Belt Press / Centrifuge)",
        "sub_components": [
          { "name": "Frame / Skid", "focus_areas": ["Main Frame, Hydraulic Cylinder Mounts"] },
          { "name": "Filter Media", "focus_areas": ["Filter Plates / Belts"] },
          { "name": "Feed System", "focus_areas": ["Feed Pump, Piping"] }
        ]
      },
      {
        "name": "Media Filter (Sand / Multimedia)",
        "sub_components": [
          { "name": "Filter Vessel / Basin", "focus_areas": ["Shell (pressure) or Concrete Basin (gravity)"] },
          { "name": "Underdrain System", "focus_areas": ["Nozzles/Laterals, Support Plate"] },
          { "name": "Backwash System", "focus_areas": ["Backwash Piping, Air Scour"] }
        ]
      },
      {
        "name": "Membrane System (RO/UF)",
        "sub_components": [
          { "name": "Skid Frame", "focus_areas": ["Frame, Pressure Vessel Racking"] },
          { "name": "Pressure Vessels / Housings", "focus_areas": ["Membrane Housing, End Caps"] },
          { "name": "Piping Manifolds", "focus_areas": ["Feed / Permeate / Concentrate Headers"] }
        ]
      },
      {
        "name": "Neutralization Tank",
        "sub_components": [
          { "name": "Tank Shell", "focus_areas": ["Wall / Lining"] },
          { "name": "Mixer / Agitator", "focus_areas": ["Shaft, pH Probe Mount"] }
        ]
      },
      {
        "name": "Pumps (Transfer / Recycle / Sludge / Feed / Effluent)",
        "sub_components": [
          { "name": "Casing / Volute", "focus_areas": ["Casing, Wear Rings"] },
          { "name": "Baseplate & Foundation", "focus_areas": ["Baseplate, Grout, Anchor Bolts"] },
          { "name": "Seal / Packing", "focus_areas": ["Mechanical Seal, Packing Gland"] },
          { "name": "Bearing Housing", "focus_areas": ["Bearings, Coupling Guard"] }
        ]
      },
      {
        "name": "Piping Systems (Process / Chemical / Slurry-Sludge Lines)",
        "sub_components": [
          { "name": "Straight Runs", "focus_areas": ["Carbon Steel / HDPE / Lined Pipe"] },
          { "name": "Fittings / Elbows", "focus_areas": ["Elbows, Reducers, Wear-Back Plates"] },
          { "name": "Joints / Connections", "focus_areas": ["Flanges, Victaulic/Mechanical Couplings"] },
          { "name": "Supports / Hangers", "focus_areas": ["Pipe Shoes, Hangers, Guides"] }
        ]
      },
      {
        "name": "Storage Tank (Treated Water / Effluent)",
        "sub_components": [
          { "name": "Shell", "focus_areas": ["Shell Courses"] },
          { "name": "Roof", "focus_areas": ["Roof Structure, Roof Seals"] },
          { "name": "Bottom / Foundation Interface", "focus_areas": ["Bottom Plate, Annular Ring, Ring-wall"] },
          { "name": "Nozzles", "focus_areas": ["Inlet/Outlet, Overflow"] }
        ]
      },
      {
        "name": "Effluent Discharge Structure / Outfall",
        "sub_components": [
          { "name": "Discharge Structure", "focus_areas": ["Headwall, Discharge Pipe"] },
          { "name": "Erosion Protection", "focus_areas": ["Riprap / Energy Dissipator"] }
        ]
      }
    ]
  },
  {
    "category": "Structural Support",
    "components": [
      {
        "name": "Tank / Basin Foundation Interface",
        "sub_components": [
          { "name": "Concrete Ringwall / Basin Wall", "focus_areas": ["Ringwall, Bearing Pad & Grout"] },
          { "name": "Anchor Chairs", "focus_areas": ["Anchor Chair, Base Plate"] }
        ]
      },
      {
        "name": "Clarifier / Thickener Support",
        "sub_components": [
          { "name": "Center Column Foundation", "focus_areas": ["Foundation Pedestal"] },
          { "name": "Bridge / Walkway Support", "focus_areas": ["Support Beams, Bracing"] }
        ]
      },
      {
        "name": "Pump Bases / Skids",
        "sub_components": [
          { "name": "Grouted Steel Base", "focus_areas": ["Baseplate, Grout"] },
          { "name": "Anchorage", "focus_areas": ["Anchor Bolts"] },
          { "name": "Skid Frame", "focus_areas": ["Frame Members"] }
        ]
      },
      {
        "name": "Silo Support Structure",
        "sub_components": [
          { "name": "Support Legs / Skirt", "focus_areas": ["Legs, Skirt, Bracing"] }
        ]
      },
      {
        "name": "Pipe Supports / Hangers",
        "sub_components": [
          { "name": "Shoe / Saddle", "focus_areas": ["Pipe Shoe, Saddle"] },
          { "name": "U-Bolts & Clamps", "focus_areas": ["Fasteners"] },
          { "name": "Guides & Anchors", "focus_areas": ["Guide Assembly, Anchor Point"] }
        ]
      },
      {
        "name": "Pipe Racks (process / chemical / slurry lines)",
        "sub_components": [
          { "name": "Transverse Beams", "focus_areas": ["Beams"] },
          { "name": "Bracing", "focus_areas": ["Bracing Members"] },
          { "name": "Base Plates", "focus_areas": ["Base Plate, Grout"] }
        ]
      },
      {
        "name": "Equipment Frames (mixers, agitators, dosing skids)",
        "sub_components": [
          { "name": "Cross Members", "focus_areas": ["Frame Members"] },
          { "name": "Gusset Plates", "focus_areas": ["Welded Connections"] }
        ]
      },
      {
        "name": "Anchor Bolts / Baseplates (general)",
        "sub_components": [
          { "name": "Grout Bed", "focus_areas": ["Grout"] },
          { "name": "Anchor Plate", "focus_areas": ["Plate, Levelling Nuts"] }
        ]
      },
      {
        "name": "Cable Tray Supports",
        "sub_components": [
          { "name": "Cantilever Arms / Trapeze Hangers", "focus_areas": ["Support Arms, Hangers"] }
        ]
      },
      {
        "name": "Structural Steel Supporting Vessels / Tanks",
        "sub_components": [
          { "name": "Saddle Supports", "focus_areas": ["Saddle"] },
          { "name": "Skirt / Legs", "focus_areas": ["Skirt, Legs"] },
          { "name": "Welded Connections", "focus_areas": ["Critical Welds"] }
        ]
      }
    ]
  },
  {
    "category": "Foundations & Geotechnical",
    "components": [
      {
        "name": "Shallow Foundations",
        "sub_components": [
          { "name": "Pad / Spread Footings", "focus_areas": ["Footing"] },
          { "name": "Strip Footings, Grade Beams", "focus_areas": ["Footing / Beam"] }
        ]
      },
      {
        "name": "Slabs-on-Grade",
        "sub_components": [
          { "name": "Reinforced Slab, Subgrade/Sub-base", "focus_areas": ["Slab, Compacted Fill"] },
          { "name": "Control Joints, Vapour Barrier", "focus_areas": ["Joint, Barrier"] }
        ]
      },
      {
        "name": "Soil Interaction Zones",
        "sub_components": [
          { "name": "Backfill / Surrounding Soil", "focus_areas": ["Drainage Paths, Perimeter Zones"] },
          { "name": "Drainage Layer, Perimeter Grading", "focus_areas": ["Drain, Grading"] }
        ]
      },
      {
        "name": "Legacy Mine Ground Interface",
        "sub_components": [
          { "name": "Backfilled / Reclaimed Ground", "focus_areas": ["Engineered Fill over Former Workings"] },
          { "name": "Void / Subsidence Zones", "focus_areas": ["Shallow Voids, Collapsed Workings"] },
          { "name": "Old Mine Workings Below Grade", "focus_areas": ["Shafts, Adits, Stopes (if mapped nearby)"] }
        ]
      },
      {
        "name": "Frost-Sensitive Soils (climate-dependent)",
        "sub_components": [
          { "name": "Shallow Foundations in Frost Zone", "focus_areas": ["Frost-Susceptible Soil"] }
        ]
      },
      {
        "name": "Concrete Foundations",
        "sub_components": [
          { "name": "Footings / Pedestals, Pile Caps", "focus_areas": ["Concrete Element"] },
          { "name": "Reinforcement / Rebar", "focus_areas": ["Rebar"] },
          { "name": "Waterproofing", "focus_areas": ["Membrane / Coating"] }
        ]
      },
      {
        "name": "Bearing / Load Transfer Zones",
        "sub_components": [
          { "name": "Bearing Soils", "focus_areas": ["Foundation-Soil Interface"] }
        ]
      },
      {
        "name": "Deep Foundations (where used)",
        "sub_components": [
          { "name": "Pile Foundations", "focus_areas": ["Pile Shaft, Toe/Bearing Layer"] },
          { "name": "Pile-to-Cap Connection", "focus_areas": ["Connection Detail"] }
        ]
      }
    ]
  },
  {
    "category": "Building Envelope",
    "components": [
      {
        "name": "Roofing Systems",
        "sub_components": [
          { "name": "Membrane / Metal Roof", "focus_areas": ["Deck, Insulation, Flashing & Parapets"] },
          { "name": "Roof Drainage & Penetrations", "focus_areas": ["Gutters, Drains, Skylights, Penetration Seals"] }
        ]
      },
      {
        "name": "Wall Cladding",
        "sub_components": [
          { "name": "Metal / Insulated Panel", "focus_areas": ["Panel, Sealants & Joints, Louvres/Vents"] }
        ]
      },
      {
        "name": "Concrete Floors / Slabs",
        "sub_components": [
          { "name": "Slab-on-Grade", "focus_areas": ["Topping/Wearing Surface, Construction/Control Joints"] }
        ]
      },
      {
        "name": "Structural Columns (building)",
        "sub_components": [
          { "name": "Steel / Concrete Column", "focus_areas": ["Base Plates & Anchor Bolts, Splices"] }
        ]
      },
      {
        "name": "Beams / Framing",
        "sub_components": [
          { "name": "Steel Framing", "focus_areas": ["Beam-to-Column Connections, Bracing, Purlins/Girts"] }
        ]
      },
      {
        "name": "Walkways / Platforms",
        "sub_components": [
          { "name": "Steel Grating / Checker Plate", "focus_areas": ["Decking, Support Framing, Toe/Kick Plates"] }
        ]
      },
      {
        "name": "Stairways",
        "sub_components": [
          { "name": "Steel Stairs", "focus_areas": ["Treads & Risers, Stringers, Landings"] }
        ]
      },
      {
        "name": "Access Ladders & Cages",
        "sub_components": [
          { "name": "Fixed Ladder", "focus_areas": ["Rungs & Rails, Safety Cage, Ladder Anchors"] }
        ]
      },
      {
        "name": "Handrails / Guardrails",
        "sub_components": [
          { "name": "Steel Rail System", "focus_areas": ["Top/Mid Rails, Posts & Bases, Fasteners & Welds"] }
        ]
      },
      {
        "name": "Grating Systems",
        "sub_components": [
          { "name": "Floor Grating", "focus_areas": ["Grating Clips, Support Angles, Edge Banding"] }
        ]
      },
      {
        "name": "General / Envelope-Wide",
        "sub_components": [
          { "name": "All Building Elements", "focus_areas": [] }
        ]
      }
    ]
  }
]);

interface FocusArea { name: string; focus_areas: string[] }
interface Comp { name: string; sub_components: FocusArea[] }
interface Cat { category: string; components: Comp[] }

const categories: Cat[] = JSON.parse(ASSET_LIBRARY_JSON);

export const up = (pgm: Migrator) => {
  const equipmentTypeNames = new Set<string>();
  for (const cat of categories) {
    for (const comp of cat.components) {
      equipmentTypeNames.add(comp.name);
    }
  }
  const sortedNames = Array.from(equipmentTypeNames).sort();

  const parts: string[] = [];
  parts.push(`DO $$`);
  parts.push(`DECLARE`);
  parts.push(`  c RECORD;`);
  parts.push(`  cat_id UUID;`);
  parts.push(`  comp_id UUID;`);
  parts.push(`  sub_id UUID;`);
  parts.push(`  focus_id UUID;`);
  parts.push(`  st_id UUID;`);
  parts.push(`  data_json jsonb := '${ASSET_LIBRARY_JSON.replace(/'/g, "''")}'::jsonb;`);
  parts.push(`  cat_record RECORD;`);
  parts.push(`  comp_record RECORD;`);
  parts.push(`  sub_record RECORD;`);
  parts.push(`  focus_val text;`);
  parts.push(`  cat_idx int;`);
  parts.push(`  comp_idx int;`);
  parts.push(`  sub_idx int;`);
  parts.push(`  focus_idx int;`);
  parts.push(`BEGIN`);
  parts.push(`  FOR c IN SELECT client_id FROM clients LOOP`);
  parts.push(`    IF (SELECT COUNT(*) FROM deficiency_taxonomy WHERE client_id = c.client_id AND level = 'category') > 10 THEN`);
  parts.push(`      CONTINUE;`);
  parts.push(`    END IF;`);
  parts.push(``);
  parts.push(`    cat_idx := 0;`);
  parts.push(`    FOR cat_record IN SELECT * FROM jsonb_to_recordset(data_json) AS x(category text, components jsonb) LOOP`);
  parts.push(`      cat_idx := cat_idx + 1;`);
  parts.push(`      INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order)`);
  parts.push(`        VALUES (c.client_id, NULL, 'category', cat_record.category, cat_record.category, cat_idx)`);
  parts.push(`        ON CONFLICT (client_id, category, level, label) DO UPDATE SET display_order = EXCLUDED.display_order`);
  parts.push(`        RETURNING node_id INTO cat_id;`);
  parts.push(``);
  parts.push(`      comp_idx := 0;`);
  parts.push(`      FOR comp_record IN SELECT * FROM jsonb_to_recordset(cat_record.components) AS x(name text, sub_components jsonb) LOOP`);
  parts.push(`        comp_idx := comp_idx + 1;`);
  parts.push(`        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order)`);
  parts.push(`          VALUES (c.client_id, cat_id, 'equipment_type', cat_record.category, comp_record.name, comp_idx)`);
  parts.push(`          ON CONFLICT (client_id, category, level, label) DO UPDATE SET display_order = EXCLUDED.display_order`);
  parts.push(`          RETURNING node_id INTO comp_id;`);
  parts.push(``);
  parts.push(`        sub_idx := 0;`);
  parts.push(`        FOR sub_record IN SELECT * FROM jsonb_to_recordset(comp_record.sub_components) AS x(name text, focus_areas jsonb) LOOP`);
  parts.push(`          sub_idx := sub_idx + 1;`);
  parts.push(`          INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order)`);
  parts.push(`            VALUES (c.client_id, comp_id, 'component', cat_record.category, sub_record.name, sub_idx)`);
  parts.push(`            ON CONFLICT (client_id, category, level, label) DO UPDATE SET display_order = EXCLUDED.display_order`);
  parts.push(`            RETURNING node_id INTO sub_id;`);
  parts.push(``);
  parts.push(`        focus_idx := 0;`);
  parts.push(`        FOR focus_val IN SELECT jsonb_array_elements_text(sub_record.focus_areas) LOOP`);
  parts.push(`          focus_idx := focus_idx + 1;`);
  parts.push(`          INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order)`);
  parts.push(`            VALUES (c.client_id, sub_id, 'sub_component', cat_record.category, focus_val, focus_idx)`);
  parts.push(`            ON CONFLICT (client_id, category, level, label) DO UPDATE SET display_order = EXCLUDED.display_order;`);
  parts.push(`        END LOOP;`);
  parts.push(`      END LOOP;`);
  parts.push(`    END LOOP;`);
  parts.push(`  END LOOP;`);

  // Insert structure_types
  parts.push(``);
  parts.push(`    -- =====================================================`);
  parts.push(`    -- Insert structure_types for all equipment type names`);
  parts.push(`    -- =====================================================`);
  for (const name of sortedNames) {
    const escaped = name.replace(/'/g, "''");
    parts.push(`    INSERT INTO structure_types (client_id, name)`);
    parts.push(`      VALUES (c.client_id, '${escaped}')`);
    parts.push(`      ON CONFLICT (client_id, name) DO UPDATE SET name = EXCLUDED.name;`);
  }

  // Create templates linking structure_type -> component
  parts.push(``);
  parts.push(`    -- =====================================================`);
  parts.push(`    -- Insert category-level structure_types so structures`);
  parts.push(`    -- typed at the category level also get matching templates`);
  parts.push(`    -- =====================================================`);
  for (const cat of categories) {
    const escaped = cat.category.replace(/'/g, "''");
    parts.push(`    INSERT INTO structure_types (client_id, name)`);
    parts.push(`      VALUES (c.client_id, '${escaped}')`);
    parts.push(`      ON CONFLICT (client_id, name) DO UPDATE SET name = EXCLUDED.name;`);
  }

  parts.push(``);
  parts.push(`    -- =====================================================`);
  parts.push(`    -- Create structure_taxonomy_templates`);
  parts.push(`    -- =====================================================`);
  parts.push(`    FOR comp_record IN SELECT DISTINCT ON (dt.node_id) dt.node_id, dt.label, dt.category`);
  parts.push(`      FROM deficiency_taxonomy dt`);
  parts.push(`      WHERE dt.client_id = c.client_id AND dt.level = 'component'`);
  parts.push(`      AND EXISTS (SELECT 1 FROM structure_types st WHERE st.client_id = c.client_id AND st.name = dt.label)`);
  parts.push(`    LOOP`);
  parts.push(`      SELECT structure_type_id INTO st_id FROM structure_types`);
  parts.push(`        WHERE client_id = c.client_id AND name = comp_record.label;`);
  parts.push(`      INSERT INTO structure_taxonomy_templates (client_id, structure_type_id, taxonomy_node_id)`);
  parts.push(`        VALUES (c.client_id, st_id, comp_record.node_id)`);
  parts.push(`        ON CONFLICT (structure_type_id, taxonomy_node_id) DO NOTHING;`);
  parts.push(`    END LOOP;`);

  parts.push(`  END LOOP;`);
  parts.push(`END $$;`);

  pgm.sql(parts.join('\n'));
};

export const down = (pgm: Migrator) => {
  pgm.sql(`
    DELETE FROM structure_taxonomy_templates
    WHERE taxonomy_node_id IN (
      SELECT node_id FROM deficiency_taxonomy
      WHERE level IN ('sub_component', 'component', 'equipment_type')
      AND category IN ('Process Equipment (Mechanical)', 'Structural Support', 'Foundations & Geotechnical', 'Building Envelope')
      AND node_id NOT IN (SELECT parent_id FROM deficiency_taxonomy WHERE parent_id IS NOT NULL)
    );
    DELETE FROM deficiency_taxonomy
    WHERE level = 'sub_component'
    AND category IN ('Process Equipment (Mechanical)', 'Structural Support', 'Foundations & Geotechnical', 'Building Envelope');
    DELETE FROM deficiency_taxonomy
    WHERE level = 'component'
    AND category IN ('Process Equipment (Mechanical)', 'Structural Support', 'Foundations & Geotechnical', 'Building Envelope');
    DELETE FROM deficiency_taxonomy
    WHERE level = 'equipment_type'
    AND category IN ('Process Equipment (Mechanical)', 'Structural Support', 'Foundations & Geotechnical', 'Building Envelope');
  `);
};