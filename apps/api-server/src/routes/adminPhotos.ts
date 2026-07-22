import { Router, Request, Response, NextFunction } from 'express';
import { requireAdminOrReviewer } from '../middleware/requireAdmin';
import { pool } from '../lib/db';

const router = Router();

interface AdminPhotoRow {
  photo_id: string;
  deficiency_id?: string;
  storage_url: string;
  caption: string;
  display_order: number;
  created_at: string;
  original_filename?: string;
  captured_at?: string;
  camera_make?: string;
  camera_model?: string;
  raw_exif_payload?: string;
  client_id?: string;
  client_name?: string;
  site_name?: string;
  inspection_id?: string;
  purpose?: string;
}

router.get(
  '/',
  requireAdminOrReviewer,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await pool.query(
        `SELECT p.photo_id, p.deficiency_id, p.storage_url, p.caption, p.display_order, p.created_at,
                e.original_filename, e.captured_at, e.camera_make, e.camera_model, e.raw_exif_payload,
                COALESCE(c.name, 'Unknown') AS client_name,
                s.site_id,
                i.inspection_id,
                'deficiency' AS purpose
         FROM photos p
         LEFT JOIN photo_evidence_metadata e ON p.photo_id = e.photo_id
         LEFT JOIN deficiency_records d ON p.deficiency_id = d.deficiency_id
         LEFT JOIN inspections i ON d.inspection_id = i.inspection_id
         LEFT JOIN clients c ON i.client_id = c.client_id
         LEFT JOIN sites s ON i.site_id = s.site_id
         WHERE p.deleted_at IS NULL
         ORDER BY p.created_at DESC
         LIMIT 200`
      );

      const photos: AdminPhotoRow[] = result.rows;
      res.json({ success: true, data: photos });
    } catch (err) {
      next(err);
    }
  }
);

export const adminPhotosRouter = router;
