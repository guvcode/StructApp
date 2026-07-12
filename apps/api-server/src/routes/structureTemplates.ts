import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { getTemplatesForStructureType, getTemplateAncestors } from '../services/structureTemplates';

const router = Router();

router.get(
  '/structure-taxonomy-templates',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as Request & { user: { client_id: string; role: string } }).user;
      const structureTypeId = req.query.structure_type_id as string;

      if (!structureTypeId) {
        return res.status(422).json({
          success: false,
          error_code: 'VALIDATION_ERROR',
          message: 'structure_type_id query parameter is required',
        });
      }

      const templates = await getTemplatesForStructureType(user.client_id, structureTypeId);

      const ancestorsByNodeId: Record<string, Array<{ node_id: string; parent_id: string | null; level: string; label: string; category: string }>> = {};
      for (const tpl of templates) {
        ancestorsByNodeId[tpl.taxonomy_node_id] = await getTemplateAncestors(user.client_id, tpl.taxonomy_node_id);
      }

      res.json({
        success: true,
        data: {
          templates,
          ancestors: ancestorsByNodeId,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export const structureTemplatesRouter = router;