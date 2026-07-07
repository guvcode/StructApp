import { generateWordReport, generateExcelReport } from '../src/deliverables/reports';

jest.mock('exceljs', () => {
  const mockWorkbook = {
    addWorksheet: jest.fn().mockReturnThis(),
    getWorksheet: jest.fn().mockReturnThis(),
    xlsx: {
      writeBuffer: jest.fn().mockResolvedValue(Buffer.from('test')),
    },
  };
  return {
    Workbook: jest.fn(() => mockWorkbook),
  };
});

describe('report generators', () => {
  test('generateWordReport creates document with title', async () => {
    await generateWordReport('job-123', 'project-456');
    // Placeholder - would verify docx structure
  });

  test('generateExcelReport creates workbook with columns', async () => {
    await generateExcelReport('job-789', 'project-456');
    // Placeholder - would verify exceljs structure
  });
});