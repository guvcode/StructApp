import { z } from 'zod';

export const taxonomyCreateSchema = z.object({
  parent_id: z.string().uuid().nullable(),
  level: z.enum(['category', 'equipment_type', 'component', 'sub_component', 'focus_area']),
  category: z.string().min(1).max(100),
  label: z.string().min(1).max(255),
  display_order: z.number().int().min(0).optional(),
});

export type TaxonomyCreateInput = z.infer<typeof taxonomyCreateSchema>;

export const taxonomyUpdateSchema = z.object({
  parent_id: z.string().uuid().nullable().optional(),
  label: z.string().min(1).max(255).optional(),
  display_order: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
});

export type TaxonomyUpdateInput = z.infer<typeof taxonomyUpdateSchema>;