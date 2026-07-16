import { pool } from '../../lib/db';

export interface ReportProject {
  project_id: string;
  title: string;
  type: string;
  due_date: string;
  created_at: string;
  site_name: string;
  asset_tag: string;
  structure_description: string;
}

export interface ReportInspection {
  inspection_id: string;
  structure_id: string;
  asset_tag: string;
  site_name: string;
  inspector_name: string;
  status: string;
  inspection_mode: string;
  scheduled_date: string;
  created_at: string;
  submitted_at: string;
  approved_at: string;
}

export interface ReportDeficiency {
  deficiency_id: string;
  inspection_id: string;
  component: string;
  sub_component: string;
  category: string;
  description: string;
  detailed_description: string;
  mechanisms: string;
  calculated_priority: string;
  priority_tier: string;
  risk_rank: number;
  risk_rating: string;
  triage_state: string;
  remediation_status: string;
  recommended_action: string;
  likelihood: string;
  consequence_severity: number;
  location_desc: string;
  asset_tag: string;
  site_name: string;
  photo_urls: string[];
}

export interface ReportData {
  project: ReportProject;
  inspections: ReportInspection[];
  deficiencies: ReportDeficiency[];
}

export async function loadReportData(projectId: string, clientId: string): Promise<ReportData> {
  const projectResult = await pool.query(
    `SELECT p.project_id, p.title, p.type, p.due_date, p.created_at,
            s.name AS site_name, st.asset_tag, st.description AS structure_description
     FROM projects p
     JOIN sites s ON p.project_id = s.project_id
     JOIN structures st ON s.site_id = st.site_id
     WHERE p.project_id = $1 AND p.client_id = $2
     LIMIT 1`,
    [projectId, clientId]
  );
  const project = projectResult.rows[0] as ReportProject;

  const inspectionsResult = await pool.query(
    `SELECT i.inspection_id, i.structure_id, st.asset_tag, s.name AS site_name,
            u.display_name AS inspector_name, i.status, i.inspection_mode,
            i.scheduled_date, i.created_at, i.submitted_at, i.approved_at
     FROM inspections i
     JOIN structures st ON i.structure_id = st.structure_id
     JOIN sites s ON st.site_id = s.site_id
     LEFT JOIN users u ON i.inspector_id = u.user_id
     WHERE st.site_id IN (SELECT site_id FROM sites WHERE project_id = $1)
     ORDER BY i.created_at DESC`,
    [projectId]
  );
  const inspections: ReportInspection[] = inspectionsResult.rows;

  const defResult = await pool.query(
    `SELECT d.deficiency_id, d.inspection_id, d.component, d.sub_component, d.category,
            d.description, d.detailed_description, d.mechanisms,
            d.calculated_priority, d.priority_tier, d.risk_rank, d.risk_rating,
            d.triage_state, d.remediation_status, d.recommended_action,
            d.likelihood, d.consequence_severity, d.location_desc,
            st.asset_tag, s.name AS site_name
     FROM deficiency_records d
     JOIN inspections i ON d.inspection_id = i.inspection_id
     JOIN structures st ON i.structure_id = st.structure_id
     JOIN sites s ON st.site_id = s.site_id
     WHERE st.site_id IN (SELECT site_id FROM sites WHERE project_id = $1)
     ORDER BY d.calculated_priority ASC, d.created_at DESC`,
    [projectId]
  );
  const deficiencies: ReportDeficiency[] = defResult.rows;

  for (const def of deficiencies) {
    const photoResult = await pool.query(
      `SELECT storage_url FROM photos WHERE deficiency_id = $1 ORDER BY display_order ASC`,
      [def.deficiency_id]
    );
    def.photo_urls = photoResult.rows.map((r: any) => r.storage_url);
  }

  return { project, inspections, deficiencies };
}

export interface DashboardSummaryData {
  client_name: string;
  date_range: { start: string; end: string };
  total_projects: number;
  total_inspections: number;
  total_deficiencies: number;
  p1_count: number;
  p2_count: number;
  p3_count: number;
  p4_count: number;
  p5_count: number;
  status_breakdown: Record<string, number>;
  risk_rating_breakdown: Record<string, number>;
  inspections_by_project: Array<{ project_name: string; count: number }>;
}

export async function loadDashboardData(clientId: string, startDate: string, endDate: string): Promise<DashboardSummaryData> {
  const clientResult = await pool.query('SELECT name FROM clients WHERE client_id = $1', [clientId]);
  const client_name = clientResult.rows[0]?.name ?? 'Unknown';

  const projectCount = await pool.query('SELECT COUNT(*) AS count FROM projects WHERE client_id = $1', [clientId]);
  const total_projects = parseInt(projectCount.rows[0].count, 10);

  const inspCount = await pool.query(
    `SELECT COUNT(*) AS count FROM inspections
     WHERE client_id = $1 AND created_at >= $2 AND created_at <= $3`,
    [clientId, startDate, endDate]
  );
  const total_inspections = parseInt(inspCount.rows[0].count, 10);

  const defCount = await pool.query(
    `SELECT COUNT(*) AS count FROM deficiency_records
     WHERE client_id = $1 AND created_at >= $2 AND created_at <= $3`,
    [clientId, startDate, endDate]
  );
  const total_deficiencies = parseInt(defCount.rows[0].count, 10);

  const priorityCounts = await pool.query(
    `SELECT COALESCE(priority_tier, calculated_priority) AS tier, COUNT(*) AS count
     FROM deficiency_records
     WHERE client_id = $1 AND created_at >= $2 AND created_at <= $3
     GROUP BY tier ORDER BY tier`,
    [clientId, startDate, endDate]
  );
  const p1 = priorityCounts.rows.find((r: any) => r.tier === 'P1');
  const p2 = priorityCounts.rows.find((r: any) => r.tier === 'P2');
  const p3 = priorityCounts.rows.find((r: any) => r.tier === 'P3');
  const p4 = priorityCounts.rows.find((r: any) => r.tier === 'P4');
  const p5 = priorityCounts.rows.find((r: any) => r.tier === 'P5');

  const statusBreakdown = await pool.query(
    `SELECT status, COUNT(*) AS count FROM inspections
     WHERE client_id = $1 AND created_at >= $2 AND created_at <= $3
     GROUP BY status ORDER BY status`,
    [clientId, startDate, endDate]
  );
  const status_breakdown: Record<string, number> = {};
  for (const row of statusBreakdown.rows) {
    status_breakdown[row.status] = parseInt(row.count, 10);
  }

  const riskBreakdown = await pool.query(
    `SELECT COALESCE(risk_rating, 'Unrated') AS rating, COUNT(*) AS count
     FROM deficiency_records
     WHERE client_id = $1 AND created_at >= $2 AND created_at <= $3
     GROUP BY rating ORDER BY rating`,
    [clientId, startDate, endDate]
  );
  const risk_rating_breakdown: Record<string, number> = {};
  for (const row of riskBreakdown.rows) {
    risk_rating_breakdown[row.rating] = parseInt(row.count, 10);
  }

  const byProject = await pool.query(
    `SELECT p.title AS project_name, COUNT(i.inspection_id) AS count
     FROM projects p
     LEFT JOIN inspections i ON i.structure_id IN (
       SELECT structure_id FROM structures WHERE site_id IN (
         SELECT site_id FROM sites WHERE project_id = p.project_id
       )
     ) AND i.created_at >= $2 AND i.created_at <= $3
     WHERE p.client_id = $1
     GROUP BY p.project_id, p.title ORDER BY count DESC`,
    [clientId, startDate, endDate]
  );
  const inspections_by_project = byProject.rows.map((r: any) => ({
    project_name: r.project_name,
    count: parseInt(r.count, 10),
  }));

  return {
    client_name,
    date_range: { start: startDate, end: endDate },
    total_projects,
    total_inspections,
    total_deficiencies,
    p1_count: p1 ? parseInt(p1.count, 10) : 0,
    p2_count: p2 ? parseInt(p2.count, 10) : 0,
    p3_count: p3 ? parseInt(p3.count, 10) : 0,
    p4_count: p4 ? parseInt(p4.count, 10) : 0,
    p5_count: p5 ? parseInt(p5.count, 10) : 0,
    status_breakdown,
    risk_rating_breakdown,
    inspections_by_project,
  };
}