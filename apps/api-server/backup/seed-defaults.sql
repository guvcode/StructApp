INSERT INTO clients (client_id, name, safety_contact_email, created_at)
SELECT uuid_generate_v4(), 'Default Client', 'safety@default.com', NOW()
WHERE NOT EXISTS (SELECT 1 FROM clients LIMIT 1);

INSERT INTO users (user_id, email, display_name, password_hash, role, is_active, created_at)
SELECT uuid_generate_v4(), 'admin@default.com', 'Admin', '$2a$10$VNNVqQXwGSV./3LRASe8suzDcishSnZYAUUj4cQ4sTNQvPEi4GBMW', 'Admin', TRUE, NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE role = 'Admin' LIMIT 1);

INSERT INTO client_memberships (user_id, client_id, created_at)
SELECT u.user_id, c.client_id, NOW()
FROM users u, clients c
WHERE u.role = 'Admin'
  AND NOT EXISTS (SELECT 1 FROM client_memberships cm WHERE cm.user_id = u.user_id AND cm.client_id = c.client_id);

INSERT INTO component_types (client_id, name)
SELECT c.client_id, ct.name
FROM clients c, (VALUES
  ('Support Frame'), ('Bolted Connection'), ('Welded Joint'),
  ('Corrosion Protection Coating'), ('Foundation/Footing'), ('Handrail/Guardrail')
) AS ct(name)
WHERE NOT EXISTS (SELECT 1 FROM component_types WHERE client_id = c.client_id AND name = ct.name)
ON CONFLICT (client_id, name) DO NOTHING;

INSERT INTO work_types (client_id, name)
SELECT c.client_id, wt.name
FROM clients c, (VALUES
  ('On-Site Inspection'), ('Travel'), ('Report Writing'), ('Client Meeting')
) AS wt(name)
WHERE NOT EXISTS (SELECT 1 FROM work_types WHERE client_id = c.client_id LIMIT 1)
ON CONFLICT (client_id, name) DO NOTHING;

INSERT INTO structure_types (client_id, name)
SELECT c.client_id, st.name
FROM clients c, (VALUES
  ('Building Envelope'), ('Structural Support'), ('Foundations & Geotechnical'),
  ('Process Equipment (Mechanical)')
) AS st(name)
WHERE NOT EXISTS (SELECT 1 FROM structure_types WHERE client_id = c.client_id LIMIT 1)
ON CONFLICT (client_id, name) DO NOTHING;