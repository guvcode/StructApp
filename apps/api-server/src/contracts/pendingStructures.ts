import { z } from 'zod';

export const submitPendingStructureSchema = z.object({
  local_id: z.string().min(1).optional(),
  site_id: z.string().uuid(),
  asset_tag: z.string().min(1).max(100),
  description: z.string().min(1),
  qr_code_value: z.string().max(150).optional().nullable(),
});

export type SubmitPendingStructureInput = z.infer<typeof submitPendingStructureSchema>;

export const pendingDeficiencySchema = z.object({
  local_id: z.string().min(1),
  category: z.string().max(100).optional(),
  equipment_type: z.string().max(255).optional(),
  component: z.string().max(255).optional(),
  sub_component: z.string().max(255).optional(),
  focus_area: z.string().max(255).optional(),
  deficiency_category: z.string().max(255).optional(),
  detailed_description: z.string().optional(),
  consequence_severity: z.number().int().min(1).max(5).optional(),
  likelihood: z.enum(['A', 'B', 'C', 'D', 'E']).optional(),
  recommended_action: z.string().optional(),
  most_affected_consequence: z.string().max(100).optional(),
  gps_latitude: z.number().min(-90).max(90).nullable().optional(),
  gps_longitude: z.number().min(-180).max(180).nullable().optional(),
});

export type PendingDeficiencyInput = z.infer<typeof pendingDeficiencySchema>;

export const pendingPhotoSchema = z.object({
  filename: z.string().min(1),
  data: z.string().min(1),
  caption: z.string().optional(),
  display_order: z.number().int().min(0).optional(),
  original_filename: z.string().optional(),
  captured_at: z.string().optional(),
  camera_make: z.string().optional(),
  camera_model: z.string().optional(),
  raw_exif_payload: z.string().optional(),
});

export type PendingPhotoInput = z.infer<typeof pendingPhotoSchema>;

export const pendingStructureApproveSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  type: z.string().min(1).max(100).optional(),
  identifier: z.string().min(1).max(100).optional(),
});

export type PendingStructureApproveInput = z.infer<typeof pendingStructureApproveSchema>;
