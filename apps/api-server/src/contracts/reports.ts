import { z } from 'zod';

export const reportGenerateSchema = z.object({
  type: z.enum(['draft_pdf', 'final_pdf', 'word', 'excel', 'csv']),
  project_id: z.string().uuid(),
});

export type ReportGenerateInput = z.infer<typeof reportGenerateSchema>;