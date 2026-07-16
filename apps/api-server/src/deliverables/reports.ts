import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { Document, Paragraph, Packer, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType } from 'docx';
import { loadReportData, type ReportData } from './reports/data';
import { getReportPath } from './reports/download';

const REPORT_DIR = join(tmpdir(), 'structapp-reports');

function ensureDir() {
  if (!existsSync(REPORT_DIR)) mkdirSync(REPORT_DIR, { recursive: true });
}

export async function generateWordReport(
  jobId: string,
  projectId: string,
  clientId: string
): Promise<void> {
  const data = await loadReportData(projectId, clientId);

  const defRows = data.deficiencies.map(def => [
    def.asset_tag,
    def.component,
    def.priority_tier ?? def.calculated_priority,
    def.risk_rating ?? '',
    def.description ?? '',
    def.recommended_action ?? '',
    def.triage_state,
    def.remediation_status,
  ]);

  const defTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: ['Structure', 'Component', 'Priority', 'Risk', 'Description', 'Action', 'Triage', 'Remediation'].map(h =>
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 18 })] })] })
        ),
      }),
      ...defRows.map(cells =>
        new TableRow({
          children: cells.map(c =>
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: c, size: 16 })] })] })
          ),
        })
      ),
    ],
  });

  const inspRows = data.inspections.map(insp => [
    insp.asset_tag,
    insp.site_name,
    insp.status,
    insp.inspector_name ?? '',
    insp.created_at ? insp.created_at.split('T')[0] : '',
    insp.completed_at ? insp.completed_at.split('T')[0] : '',
  ]);

  const inspTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: ['Structure', 'Site', 'Status', 'Inspector', 'Created', 'Completed'].map(h =>
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 18 })] })] })
        ),
      }),
      ...inspRows.map(cells =>
        new TableRow({
          children: cells.map(c =>
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: c, size: 16 })] })] })
          ),
        })
      ),
    ],
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({ text: 'Inspection Report', heading: 'Heading1', alignment: AlignmentType.CENTER }),
          new Paragraph({ text: data.project.title, alignment: AlignmentType.CENTER }),
          new Paragraph({ text: `Site: ${data.project.site_name}  |  Asset: ${data.project.asset_tag}` }),
          new Paragraph({ text: `Generated: ${new Date().toISOString().split('T')[0]}` }),
          new Paragraph({ text: '' }),
          new Paragraph({ text: `Inspections (${data.inspections.length})`, heading: 'Heading2' }),
          inspTable,
          new Paragraph({ text: '' }),
          new Paragraph({ text: `Deficiencies (${data.deficiencies.length})`, heading: 'Heading2' }),
          defTable,
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  ensureDir();
  writeFileSync(getReportPath(jobId, 'docx'), buffer);
}

export async function generateExcelReport(
  jobId: string,
  projectId: string,
  clientId: string
): Promise<void> {
  const data = await loadReportData(projectId, clientId);
  const Excel = await import('exceljs');
  const workbook = new Excel.Workbook();

  const defSheet = workbook.addWorksheet('Deficiencies');
  defSheet.columns = [
    { header: 'Structure', key: 'asset_tag', width: 20 },
    { header: 'Site', key: 'site_name', width: 20 },
    { header: 'Component', key: 'component', width: 18 },
    { header: 'Priority', key: 'priority', width: 10 },
    { header: 'Risk Rating', key: 'risk_rating', width: 12 },
    { header: 'Risk Rank', key: 'risk_rank', width: 10 },
    { header: 'Description', key: 'description', width: 40 },
    { header: 'Details', key: 'detailed_description', width: 40 },
    { header: 'Mechanisms', key: 'mechanisms', width: 30 },
    { header: 'Recommended Action', key: 'recommended_action', width: 30 },
    { header: 'Triage', key: 'triage_state', width: 14 },
    { header: 'Remediation', key: 'remediation_status', width: 20 },
    { header: 'Location', key: 'location_desc', width: 20 },
  ];
  defSheet.getRow(1).font = { bold: true };
  data.deficiencies.forEach(def => defSheet.addRow(def));

  const riskSheet = workbook.addWorksheet('Risk Summary');
  riskSheet.columns = [
    { header: 'Priority', key: 'priority', width: 12 },
    { header: 'Count', key: 'count', width: 10 },
  ];
  riskSheet.getRow(1).font = { bold: true };
  const counts: Record<string, number> = {};
  for (const def of data.deficiencies) {
    const p = def.priority_tier ?? def.calculated_priority;
    counts[p] = (counts[p] || 0) + 1;
  }
  Object.entries(counts).forEach(([priority, count]) => riskSheet.addRow({ priority, count }));

  if (data.deficiencies.length > 0) {
    riskSheet.addRow({});
    riskSheet.addRow({ priority: 'Risk Rating', count: 'Count' });
    riskSheet.getRow(3).font = { bold: true };
    const riskCounts: Record<string, number> = {};
    for (const def of data.deficiencies) {
      const r = def.risk_rating || 'Unrated';
      riskCounts[r] = (riskCounts[r] || 0) + 1;
    }
    Object.entries(riskCounts).forEach(([rating, count]) => riskSheet.addRow({ priority: rating, count }));
  }

  const inspSheet = workbook.addWorksheet('Inspections');
  inspSheet.columns = [
    { header: 'Structure', key: 'asset_tag', width: 20 },
    { header: 'Site', key: 'site_name', width: 20 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Inspector', key: 'inspector_name', width: 20 },
    { header: 'Created', key: 'created_at', width: 14 },
    { header: 'Completed', key: 'completed_at', width: 14 },
  ];
  inspSheet.getRow(1).font = { bold: true };
  data.inspections.forEach(insp => inspSheet.addRow({
    ...insp,
    created_at: insp.created_at?.split('T')[0] ?? '',
    completed_at: insp.completed_at?.split('T')[0] ?? '',
  }));

  const buffer = await workbook.xlsx.writeBuffer();
  ensureDir();
  writeFileSync(getReportPath(jobId, 'xlsx'), buffer as Buffer);
}

export async function generateCsvReport(
  jobId: string,
  projectId: string,
  clientId: string
): Promise<void> {
  const data = await loadReportData(projectId, clientId);

  const header = 'Structure,Site,Component,Priority,Risk Rating,Risk Rank,Description,Details,Mechanisms,Action,Triage,Remediation,Location\n';
  const escape = (v: string | undefined | null): string => {
    if (!v) return '';
    const s = String(v).replace(/"/g, '""');
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
  };

  const rows = data.deficiencies.map(def =>
    [
      def.asset_tag, def.site_name, def.component,
      def.priority_tier ?? def.calculated_priority,
      def.risk_rating ?? '', def.risk_rank ?? '',
      def.description, def.detailed_description ?? '',
      def.mechanisms ?? '', def.recommended_action ?? '',
      def.triage_state, def.remediation_status, def.location_desc ?? '',
    ].map(escape).join(',')
  ).join('\n');

  const csv = header + rows;
  ensureDir();
  writeFileSync(getReportPath(jobId, 'csv'), csv, 'utf-8');
}