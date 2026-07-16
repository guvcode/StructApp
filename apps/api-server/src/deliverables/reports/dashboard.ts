import PDFDocument from 'pdfkit';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { loadDashboardData, type DashboardSummaryData } from './data';
import { getReportPath } from './download';

const REPORT_DIR = join(tmpdir(), 'structapp-reports');

function ensureDir() {
  if (!existsSync(REPORT_DIR)) mkdirSync(REPORT_DIR, { recursive: true });
}

export async function generateDashboardPdf(
  jobId: string,
  clientId: string,
  startDate: string,
  endDate: string
): Promise<void> {
  const data = await loadDashboardData(clientId, startDate, endDate);

  const doc = new PDFDocument({ margin: 50 });
  const buffers: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => buffers.push(chunk));

  doc.fontSize(24).font('Helvetica-Bold').fillColor('#1a1a1a').text('Dashboard Summary', 50, 50, { align: 'center' });
  doc.fontSize(12).font('Helvetica').fillColor('#666').text(data.client_name, 50, 80, { align: 'center' });
  doc.fontSize(10).fillColor('#999').text(`${data.date_range.start} to ${data.date_range.end}`, 50, 98, { align: 'center' });
  doc.moveTo(50, 118).lineTo(550, 118).strokeColor('#ccc').stroke();

  let y = 140;

  doc.fontSize(14).font('Helvetica-Bold').fillColor('#1a1a1a').text('Overview', 50, y);
  y += 24;

  const overview = [
    ['Projects', String(data.total_projects)],
    ['Inspections', String(data.total_inspections)],
    ['Deficiencies', String(data.total_deficiencies)],
    ['P1 Deficiencies', String(data.p1_count)],
    ['P2 Deficiencies', String(data.p2_count)],
  ];

  doc.fontSize(10).font('Helvetica');
  for (const [label, value] of overview) {
    doc.font('Helvetica-Bold').fillColor('#555').text(label, 50, y);
    doc.font('Helvetica').fillColor('#1a1a1a').text(value, 200, y);
    y += 16;
  }

  y += 12;
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#1a1a1a').text('Inspection Status Breakdown', 50, y);
  y += 24;
  doc.fontSize(10).font('Helvetica');
  for (const [status, count] of Object.entries(data.status_breakdown)) {
    doc.font('Helvetica-Bold').fillColor('#555').text(status, 50, y);
    doc.font('Helvetica').fillColor('#1a1a1a').text(String(count), 200, y);
    y += 16;
    if (y > 720) { doc.addPage(); y = 50; }
  }

  y += 12;
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#1a1a1a').text('Risk Rating Breakdown', 50, y);
  y += 24;
  doc.fontSize(10).font('Helvetica');
  for (const [rating, count] of Object.entries(data.risk_rating_breakdown)) {
    doc.font('Helvetica-Bold').fillColor('#555').text(rating, 50, y);
    doc.font('Helvetica').fillColor('#1a1a1a').text(String(count), 200, y);
    y += 16;
    if (y > 720) { doc.addPage(); y = 50; }
  }

  y += 12;
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#1a1a1a').text('Inspections by Project', 50, y);
  y += 24;
  doc.fontSize(10).font('Helvetica');
  for (const item of data.inspections_by_project) {
    doc.font('Helvetica-Bold').fillColor('#555').text(item.project_name, 50, y);
    doc.font('Helvetica').fillColor('#1a1a1a').text(String(item.count), 200, y);
    y += 16;
    if (y > 720) { doc.addPage(); y = 50; }
  }

  await new Promise<void>((resolve) => {
    doc.on('end', () => resolve());
    doc.end();
  });

  const pdfBuffer = Buffer.concat(buffers);
  ensureDir();
  writeFileSync(getReportPath(jobId, 'pdf'), pdfBuffer);
}

export async function generateDashboardExcel(
  jobId: string,
  clientId: string,
  startDate: string,
  endDate: string
): Promise<void> {
  const data = await loadDashboardData(clientId, startDate, endDate);
  const Excel = await import('exceljs');
  const workbook = new Excel.Workbook();

  const overview = workbook.addWorksheet('Overview');
  overview.columns = [
    { header: 'Metric', key: 'metric', width: 25 },
    { header: 'Value', key: 'value', width: 15 },
  ];
  overview.getRow(1).font = { bold: true };
  overview.addRow({ metric: 'Client', value: data.client_name });
  overview.addRow({ metric: 'Date Range', value: `${data.date_range.start} to ${data.date_range.end}` });
  overview.addRow({ metric: 'Total Projects', value: data.total_projects });
  overview.addRow({ metric: 'Total Inspections', value: data.total_inspections });
  overview.addRow({ metric: 'Total Deficiencies', value: data.total_deficiencies });
  overview.addRow({ metric: 'P1 Deficiencies', value: data.p1_count });
  overview.addRow({ metric: 'P2 Deficiencies', value: data.p2_count });
  overview.addRow({ metric: 'P3 Deficiencies', value: data.p3_count });
  overview.addRow({ metric: 'P4 Deficiencies', value: data.p4_count });
  overview.addRow({ metric: 'P5 Deficiencies', value: data.p5_count });

  const statusSheet = workbook.addWorksheet('Status Breakdown');
  statusSheet.columns = [
    { header: 'Status', key: 'status', width: 20 },
    { header: 'Count', key: 'count', width: 10 },
  ];
  statusSheet.getRow(1).font = { bold: true };
  Object.entries(data.status_breakdown).forEach(([status, count]) => statusSheet.addRow({ status, count }));

  const riskSheet = workbook.addWorksheet('Risk Breakdown');
  riskSheet.columns = [
    { header: 'Risk Rating', key: 'rating', width: 20 },
    { header: 'Count', key: 'count', width: 10 },
  ];
  riskSheet.getRow(1).font = { bold: true };
  Object.entries(data.risk_rating_breakdown).forEach(([rating, count]) => riskSheet.addRow({ rating, count }));

  const projectSheet = workbook.addWorksheet('By Project');
  projectSheet.columns = [
    { header: 'Project', key: 'project_name', width: 30 },
    { header: 'Inspections', key: 'count', width: 12 },
  ];
  projectSheet.getRow(1).font = { bold: true };
  data.inspections_by_project.forEach(item => projectSheet.addRow(item));

  const buffer = await workbook.xlsx.writeBuffer();
  ensureDir();
  writeFileSync(getReportPath(jobId, 'xlsx'), buffer as Buffer);
}