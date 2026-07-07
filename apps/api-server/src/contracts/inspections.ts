import { z } from 'zod';

export const inspectionModeEnum = z.enum(['onsite', 'post_inspection']);

export type InspectionMode = z.infer<typeof inspectionModeEnum>;

export const inspectionApproveSchema = z.object({});

export type InspectionApproveInput = z.infer<typeof inspectionApproveSchema>;

export const inspectionReturnSchema = z.object({
  returned_reason: z.string().min(10),
});

export type InspectionReturnInput = z.infer<typeof inspectionReturnSchema>;

export const inspectionRescheduleSchema = z.object({
  scheduled_date: z.string().date(),
});

export const inspectionReopenSchema = z.object({
  target_status: z.enum(['Submitted', 'Returned']),
  reason: z.string().min(10),
});

export type InspectionReopenInput = z.infer<typeof inspectionReopenSchema>;

export const inspectionSubmitSchema = z.object({
  no_deficiencies_found: z.boolean().optional(),
}).strict();

export type InspectionSubmitInput = z.infer<typeof inspectionSubmitSchema>;

export const inspectionCreateSchema = z.object({
  structure_id: z.string().uuid(),
  inspector_id: z.string().uuid(),
  inspection_mode: inspectionModeEnum.default('onsite'),
}).strict();

export type InspectionCreateInput = z.infer<typeof inspectionCreateSchema>;

export type InspectionRescheduleInput = z.infer<typeof inspectionRescheduleSchema>;

export const inspectionReassignSchema = z.object({
  inspector_id: z.string().uuid(),
  reason: z.string().min(10),
});

export type InspectionReassignInput = z.infer<typeof inspectionReassignSchema>;

export const inspectionModeUpdateSchema = z.object({
  inspection_mode: inspectionModeEnum,
});

export type InspectionModeUpdateInput = z.infer<typeof inspectionModeUpdateSchema>;

export const remediationUpdateSchema = z.object({
  remediation_status: z.enum(['Remediation_Scheduled', 'Remediated_Pending_Verification']),
  remediation_due_date: z.string().date().nullable().optional()
});

export type RemediationUpdateInput = z.infer<typeof remediationUpdateSchema>;

export const photoUpdateSchema = z.object({
  caption: z.string().max(500).optional(),
  display_order: z.number().int().min(0).optional(),
  purpose: z.enum(['deficiency_evidence', 'remediation_evidence']).optional()
}).strict();

export type PhotoUpdateInput = z.infer<typeof photoUpdateSchema>;

export const picklistEntrySchema = z.object({
  name: z.string().min(2).max(100)
});

export type PicklistEntryInput = z.infer<typeof picklistEntrySchema>;

export const picklistUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  is_active: z.boolean().optional(),
}).refine(data => data.name !== undefined || data.is_active !== undefined, {
  message: 'At least one field (name or is_active) must be provided',
});