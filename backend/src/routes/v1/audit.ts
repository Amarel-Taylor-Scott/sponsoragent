import { Router } from 'express';
import { z } from 'zod';
import type { Knex } from 'knex';
import { analyzeUrl, detectPlatform } from '../../services/analyzers/index.js';

const auditSchema = z.object({
  url: z.string().url().max(2000),
});

export function auditRoutes(db: Knex): Router {
  const router = Router();

  // POST /audit -- core feature, accepts any URL
  router.post('/audit', async (req, res, next) => {
    try {
      const { url } = auditSchema.parse(req.body);
      const platform = detectPlatform(url);

      // Run the real platform analyzer
      const results = await analyzeUrl(url);

      // Try to store analysis if user is logged in
      const authHeader = req.headers.authorization;
      let userId: number | null = null;
      if (authHeader?.startsWith('Bearer ')) {
        try {
          const jwt = await import('jsonwebtoken');
          const payload = jwt.default.verify(authHeader.slice(7), process.env.JWT_SECRET ?? 'dev-secret') as any;
          userId = payload.userId;
        } catch { /* not logged in, fine */ }
      }

      if (userId) {
        await db('analyses').insert({
          user_id: userId,
          platform_type: platform,
          results: JSON.stringify(results),
        });

        // Log activity
        await db('agent_activity').insert({
          user_id: userId,
          activity_type: 'channel_audit',
          description: `Analyzed ${platform} channel: ${results.channelName ?? url}`,
          metadata: JSON.stringify({ url, platform, score: results.sponsorScore }),
        });
      }

      // Log funnel event
      await db('funnel_events').insert({
        user_id: userId,
        event_type: 'audit_run',
        metadata: JSON.stringify({ url, platform, score: results.sponsorScore }),
      });

      res.json({ success: true, data: results });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
