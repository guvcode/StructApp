import PDFDocument from 'pdfkit';
import { pool } from '../../lib/db';

export async function generateInspectionReport(
  jobId: string,
  projectId: string,
  reportType: 'draft_pdf' | 'final_pdf'
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const project = await client.query(
      'SELECT p.*, s.name as site_name, st.asset_tag, st.description FROM projects p JOIN sites s ON p.project_id = s.project_id JOIN structures st ON s.site_id = st.site_id WHERE p.project_id = $1',
      [projectId]
    );

    const doc = new PDFDocument();
    const buffers: Buffer[] = [];
    
    doc.on('data', (chunk: Buffer) => buffers.push(chunk));
    
    if (reportType === 'draft_pdf') {
      doc.save();
      doc.rotate(45, { origin: [300, 300] });
      doc.fontSize(50).fillColor('grey').text('DRAFT — NOT FOR DISTRIBUTION', 100, 300);
      doc.restore();
    }

    doc.fontSize(24).text('Inspection Report', 50, 50);

    let y = 100;
    for (const row of project.rows) {
      doc.fontSize(12).text(`${row.site_name} - ${row.asset_tag}`, 50, y);
      y += 20;
    }

    await new Promise<void>((resolve) => {
      doc.on('end', () => resolve());
      doc.end();
    });

    const pdfBuffer = Buffer.concat(buffers);
    
    await client.query(
      'UPDATE report_jobs SET status = $1, download_url = $2 WHERE job_id = $3',
      ['Ready', `/storage/reports/${jobId}.pdf`, jobId]
    );
    
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    await client.query(
      'UPDATE report_jobs SET status = $1, error_message = $2 WHERE job_id = $3',
      ['Failed', (err as Error).message, jobId]
    );
    throw err;
  } finally {
    client.release();
  }
}