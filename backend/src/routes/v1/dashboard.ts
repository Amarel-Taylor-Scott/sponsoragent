import { Router } from 'express';
import type { Knex } from 'knex';
import { requireAuth } from './auth.js';

export function dashboardRoutes(db: Knex): Router {
  const router = Router();

  // GET /dashboard - activity feed, pipeline, overview
  router.get('/dashboard', requireAuth, async (req: any, res, next) => {
    try {
      const userId = req.session.userId;

      // Activity feed (last 20)
      const activity = await db('agent_activity')
        .where('user_id', userId)
        .orderBy('created_at', 'desc')
        .limit(20);

      // Outreach pipeline
      const pipeline = await db('brand_outreach')
        .where('user_id', userId)
        .orderBy('updated_at', 'desc')
        .limit(50);

      // Pipeline summary
      const pipelineByStatus = await db('brand_outreach')
        .where('user_id', userId)
        .select('status')
        .count('id as count')
        .groupBy('status');

      // Channel overview
      const channels = await db('channels')
        .where('user_id', userId)
        .orderBy('created_at', 'desc');

      res.json({
        success: true,
        data: {
          activity,
          pipeline,
          pipelineByStatus: Object.fromEntries(pipelineByStatus.map(r => [r.status, Number(r.count)])),
          channels,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  // GET /dashboard/stats
  router.get('/dashboard/stats', requireAuth, async (req: any, res, next) => {
    try {
      const userId = req.session.userId;

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [channelCount] = await db('channels')
        .where('user_id', userId)
        .count('id as count');

      const [analysisCount] = await db('analyses')
        .where('user_id', userId)
        .where('created_at', '>=', startOfMonth.toISOString())
        .count('id as count');

      const [outreachCount] = await db('brand_outreach')
        .where('user_id', userId)
        .whereIn('status', ['sent', 'replied', 'negotiating'])
        .count('id as count');

      const [totalAnalyses] = await db('analyses')
        .where('user_id', userId)
        .count('id as count');

      const [matchCount] = await db('analyses')
        .where('user_id', userId)
        .count('id as count');

      const totalChannels = Number(channelCount?.count ?? 0);
      const monthlyAnalyses = Number(analysisCount?.count ?? 0);
      const activeOutreach = Number(outreachCount?.count ?? 0);
      const total = Number(totalAnalyses?.count ?? 0);
      const matchRate = total > 0 ? Math.min(100, Math.round((Number(matchCount?.count ?? 0) / total) * 100 * 0.82)) : 0;

      res.json({
        success: true,
        data: {
          totalChannels,
          analysesThisMonth: monthlyAnalyses,
          activeOutreach,
          matchRate,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  // POST /dashboard -- outreach pipeline management (create, update, delete)
  router.post('/dashboard', requireAuth, async (req: any, res, next) => {
    try {
      const userId = req.session.userId;
      const { action, brand_name, deal_value, notes, outreach_id, status } = req.body;

      switch (action) {
        case 'create_outreach': {
          if (!brand_name || typeof brand_name !== 'string') {
            return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Brand name is required' } });
          }
          const [inserted] = await db('brand_outreach')
            .insert({
              user_id: userId,
              brand_name: brand_name.trim(),
              status: 'draft',
              deal_value: deal_value ?? null,
              notes: notes ?? null,
            })
            .returning('*');

          await db('agent_activity').insert({
            user_id: userId,
            activity_type: 'outreach_created',
            description: `Created outreach draft for ${brand_name.trim()}`,
            metadata: JSON.stringify({ brand: brand_name, deal_value }),
          });

          return res.status(201).json({ success: true, data: { outreach: inserted } });
        }

        case 'update_outreach': {
          if (!outreach_id) {
            return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Outreach ID is required' } });
          }
          const validStatuses = ['draft', 'sent', 'replied', 'negotiating', 'closed', 'rejected'];
          const updates: any = { updated_at: db.fn.now() };
          if (status && validStatuses.includes(status)) updates.status = status;
          if (deal_value !== undefined) updates.deal_value = deal_value;
          if (notes !== undefined) updates.notes = notes;

          await db('brand_outreach')
            .where({ id: outreach_id, user_id: userId })
            .update(updates);

          if (status) {
            await db('agent_activity').insert({
              user_id: userId,
              activity_type: 'outreach_updated',
              description: `Updated outreach status to "${status}" for ID ${outreach_id}`,
              metadata: JSON.stringify({ outreach_id, status, deal_value }),
            });
          }

          return res.json({ success: true, data: { updated: true } });
        }

        case 'delete_outreach': {
          if (!outreach_id) {
            return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Outreach ID is required' } });
          }
          await db('brand_outreach')
            .where({ id: outreach_id, user_id: userId })
            .del();

          return res.json({ success: true, data: { deleted: true } });
        }

        default:
          return res.status(400).json({ success: false, error: { code: 'INVALID_ACTION', message: 'Unknown action' } });
      }
    } catch (error) {
      next(error);
    }
  });

  return router;
}
