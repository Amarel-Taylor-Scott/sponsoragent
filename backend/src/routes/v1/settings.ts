import { Router } from 'express';
import { z } from 'zod';
import type { Knex } from 'knex';
import { requireAuth } from './auth.js';

const settingsUpdateSchema = z.object({
  content_niches: z.array(z.string()).optional(),
  brand_exclusions: z.array(z.string()).optional(),
  min_deal_value: z.number().int().min(100).max(10000).optional(),
  outreach_style: z.enum(['professional', 'casual', 'enthusiastic', 'direct']).optional(),
  dry_run_mode: z.boolean().optional(),
  notification_preferences: z.object({
    email: z.boolean().optional(),
    browser: z.boolean().optional(),
  }).optional(),
  communication_preferences: z.object({
    preferred_time: z.string().optional(),
    timezone: z.string().optional(),
  }).optional(),
});

export function settingsRoutes(db: Knex): Router {
  const router = Router();

  // GET /settings
  router.get('/settings', requireAuth, async (req: any, res, next) => {
    try {
      let prefs = await db('user_preferences')
        .where('user_id', req.session.userId)
        .first();

      if (!prefs) {
        // Auto-create defaults
        [prefs] = await db('user_preferences')
          .insert({ user_id: req.session.userId })
          .returning('*');
      }

      res.json({ success: true, data: { settings: prefs } });
    } catch (error) {
      next(error);
    }
  });

  // PUT /settings
  router.put('/settings', requireAuth, async (req: any, res, next) => {
    try {
      const data = settingsUpdateSchema.parse(req.body);
      const updates: Record<string, any> = {};

      if (data.content_niches !== undefined) updates.content_niches = JSON.stringify(data.content_niches);
      if (data.brand_exclusions !== undefined) updates.brand_exclusions = JSON.stringify(data.brand_exclusions);
      if (data.min_deal_value !== undefined) updates.min_deal_value = data.min_deal_value;
      if (data.outreach_style !== undefined) updates.outreach_style = data.outreach_style;
      if (data.dry_run_mode !== undefined) updates.dry_run_mode = data.dry_run_mode;
      if (data.notification_preferences !== undefined) updates.notification_preferences = JSON.stringify(data.notification_preferences);
      if (data.communication_preferences !== undefined) updates.communication_preferences = JSON.stringify(data.communication_preferences);

      // Upsert
      let prefs = await db('user_preferences')
        .where('user_id', req.session.userId)
        .first();

      if (prefs) {
        [prefs] = await db('user_preferences')
          .where('user_id', req.session.userId)
          .update(updates)
          .returning('*');
      } else {
        [prefs] = await db('user_preferences')
          .insert({ user_id: req.session.userId, ...updates })
          .returning('*');
      }

      res.json({ success: true, data: { settings: prefs } });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
