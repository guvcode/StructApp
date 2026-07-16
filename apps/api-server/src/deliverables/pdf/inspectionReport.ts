import PDFDocument from 'pdfkit';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { loadReportData, type ReportData } from '../reports/data';
import { getReportPath } from '../reports/download';

const REPORT_DIR = join(tmpdir(), 'structapp-reports');

function ensureDir() {
  if (!existsSync(REPORT_DIR)) mkdirSync(REPORT_DIR, { recursive: true });
}

function drawHeader(doc: PDFKit.PDFDocument, text: string, y: number): number {
  doc.fontSize(16).font('Helvetica-Bold').fillColor('#1a1a1a').text(text, 50, y);
  return y + 28;
}

function drawField(doc: PDFKit.PDFDocument, label: string, value: string, y: number): number {
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#555').text(label, 50, y);
  doc.font('Helvetica').fillColor('#1a1a1a').text(value, 150, y);
  return y + 16;
}

function drawSection(doc: PDFKit.PDFDocument, data: ReportData, reportType: 'draft_pdf' | 'final_pdf'): void {
  const { project, inspections, deficiencies } = data;

  let y = drawHeader(doc, 'Project Summary', 50);
  doc.fontSize(10).font('Helvetica').fillColor('#1a1a1a').text(project.title, 50, y);
  y = drawField(doc, 'Site:', project.site_name, y + 20);
  y = drawField(doc, 'Asset:', project.asset_tag, y);
  y = drawField(doc, 'Type:', project.type, y);
  y = drawField(doc, 'Due:', new Date(project.due_date).toLocaleDateString(), y);
  y += 20;

  y = drawHeader(doc, `Inspections (${inspections.length})`, y);
  for (const insp of inspections) {
    y = drawField(doc, insp.asset_tag, `${insp.status} — ${insp.inspector_name ?? 'N/A'}`, y);
    if (y > 720) { doc.addPage(); y = 50; }
  }
  y += 16;

  y = drawHeader(doc, `Deficiencies (${deficiencies.length})`, y);
  for (const def of deficiencies) {
    if (y > 680) { doc.addPage(); y = 50; }

    doc.fontSize(11).font('Helvetica-Bold').fillColor('#1a1a1a').text(`${def.asset_tag} — ${def.component}`, 50, y);
    y += 18;

    doc.fontSize(9).font('Helvetica').fillColor('#333');
    const lines = doc.fontSize(9).textInterlineSpacing?.(4) ?? doc;
    doc.text(`Priority: ${def.priority_tier ?? def.calculated_priority}  |  Risk: ${def.risk_rating ?? 'N/A'} (Rank: ${def.risk_rank ?? 'N/A'})`, 50, y);
    y += 14;

    doc.text(`Description: ${def.description ?? ''}`, 50, y, { width: 500 });
    y += doc.heightOfString(def.description ?? '', { width: 500 }) + 6;

    if (def.detailed_description) {
      doc.text(`Details: ${def.detailed_description}`, 50, y, { width: 500 });
      y += doc.heightOfString(def.detailed_description, { width: 500 }) + 6;
    }

    if (def.mechanisms) {
      doc.text(`Mechanisms: ${def.mechanisms}`, 50, y, { width: 500 });
      y += doc.heightOfString(def.mechanisms, { width: 500 }) + 6;
    }

    if (def.recommended_action) {
      doc.text(`Recommended Action: ${def.recommended_action}`, 50, y, { width: 500 });
      y += doc.heightOfString(def.recommended_action, { width: 500 }) + 6;
    }

    if (def.photo_urls.length > 0) {
      doc.fontSize(8).fillColor('#888').text(`Photos: ${def.photo_urls.length} attachment(s)`, 50, y);
      y += 14;
    }

    y += 8;
    doc.moveTo(50, y).lineTo(550, y).strokeColor('#ddd').stroke();
    y += 12;
  }
}

export async function generateInspectionReport(
  jobId: string,
  projectId: string,
  reportType: 'draft_pdf' | 'final_pdf',
  clientId: string
): Promise<void> {
  const data = await loadReportData(projectId, clientId);

  const doc = new PDFDocument({ autoFirstPage: false });
  const buffers: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => buffers.push(chunk));

  doc.addPage({ margin: 50 });

  if (reportType === 'draft_pdf') {
    doc.save();
    doc.rotate(45, { origin: [doc.page.width / 2, doc.page.height / 2] });
    doc.fontSize(50).fillColor('#cccccc').text('DRAFT — NOT FOR DISTRIBUTION', 100, 300, { opacity: 0.4 });
    doc.restore();
  }

  doc.fontSize(24).font('Helvetica-Bold').fillColor('#1a1a1a').text('Inspection Report', 50, 50, { align: 'center' });
  doc.fontSize(12).font('Helvetica').fillColor('#666').text(data.project.title, 50, 80, { align: 'center' });
  doc.fontSize(10).fillColor('#999').text(`Generated: ${new Date().toISOString().split('T')[0]}  |  Type: ${reportType === 'draft_pdf' ? 'Draft' : 'Final'}`, 50, 98, { align: 'center' });
  doc.moveTo(50, 118).lineTo(550, 118).strokeColor('#ccc').stroke();

  drawSection(doc, data, reportType);

  await new Promise<void>((resolve) => {
    doc.on('end', () => resolve());
    doc.end();
  });

  const pdfBuffer = Buffer.concat(buffers);
  ensureDir();
  writeFileSync(getReportPath(jobId, 'pdf'), pdfBuffer);
}