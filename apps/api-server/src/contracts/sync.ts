import { z } from 'zod';

export const deficiencySyncSchema = z.object({
  client_local_id: z.string().min(1),
  inspection_id: z.string().uuid(),
  structure_id: z.string().uuid(),
  previous_deficiency_id: z.string().uuid().nullable(),
  component_type_id: z.string().uuid(),
  component_notes: z.string().max(500).optional(),
  description: z.string().min(10),

  severity: z.number().int().min(1).max(5).nullable().optional(),
  probability: z.number().int().min(1).max(5).nullable().optional(),
  consequences: z.number().int().min(1).max(5).nullable().optional(),

  category: z.string().max(100).optional(),
  equipment_type: z.string().max(255).optional(),
  component: z.string().max(255).optional(),
  sub_component: z.string().max(255).optional(),
  focus_area: z.string().max(255).optional(),
  deficiency_category: z.string().max(255).optional(),
  detailed_description: z.string().optional(),
  mechanisms: z.string().optional(),
  vibration_present: z.boolean().optional(),
  ndt_required: z.boolean().optional(),
  further_investigation_required: z.boolean().optional(),
  recommended_action: z.string().optional(),

consequence_severity: z.number().int().min(1).max(5).optional(),
  likelihood: z.enum(['A', 'B', 'C', 'D', 'E']).optional(),
  most_affected_consequence: z.string().max(100).optional(),
  priority_rating: z.enum(['P1', 'P2', 'P3', 'P4', 'P5']).optional(),

  gps_latitude: z.number().min(-90).max(90).nullable(),
  gps_longitude: z.number().min(-180).max(180).nullable(),
});

export type DeficiencySyncInput = z.infer<typeof deficiencySyncSchema>;

export const submissionSyncSchema = z.object({
  inspection_id: z.string().uuid(),
  submitted_at: z.string().datetime(),
});

export type SubmissionSyncInput = z.infer<typeof submissionSyncSchema>;

export const syncPushSchema = z.object({
  deficiencies: z.array(deficiencySyncSchema),
  submissions: z.array(submissionSyncSchema).optional(),
  pending_structures: z.array(
    z.object({
      client_local_id: z.string().min(1),
      site_id: z.string().uuid(),
      asset_tag: z.string().max(100),
      description: z.string().min(1),
      qr_code_value: z.string().max(150).nullable().optional(),
      deficiencies: z.array(
        z.object({
          client_local_id: z.string().min(1),
          category: z.string().max(100).nullable().optional(),
          equipment_type: z.string().max(255).nullable().optional(),
          component: z.string().max(255).nullable().optional(),
          sub_component: z.string().max(255).nullable().optional(),
          focus_area: z.string().max(255).nullable().optional(),
          deficiency_category: z.string().max(255).nullable().optional(),
          detailed_description: z.string().nullable().optional(),
          consequence_severity: z.number().int().min(1).max(5).nullable().optional(),
          likelihood: z.enum(['A', 'B', 'C', 'D', 'E']).nullable().optional(),
          recommended_action: z.string().nullable().optional(),
          most_affected_consequence: z.string().max(100).nullable().optional(),
          gps_latitude: z.number().min(-90).max(90).nullable().optional(),
          gps_longitude: z.number().min(-180).max(180).nullable().optional(),
          photos: z.array(
            z.object({
              client_local_id: z.string().min(1),
              filename: z.string().min(1),
              caption: z.string().max(500).optional().default(''),
              display_order: z.number().int().optional(),
              storage_url: z.string().url().optional(),
            })
          ).optional(),
        })
      ).optional(),
    })
  ).optional(),
});

export type SyncPushInput = z.infer<typeof syncPushSchema>;

export const syncPullSchema = z.object({
  last_sync_at: z.string().datetime().optional(),
});

export type SyncPullInput = z.infer<typeof syncPullSchema>;