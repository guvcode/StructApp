import { z } from 'zod';

export const commitBatchSchema = z.object({
  batch_id: z.string().uuid(),
});

export type CommitBatchInput = z.infer<typeof commitBatchSchema>;