import { Router } from 'express';
import { z } from 'zod';
import type { Knex } from 'knex';
import { requireAuth } from './auth.js';

const addChannelSchema = z.object({
  url: z.string().url().max(1000),
  platform_type: z.enum([
    'youtube', 'twitch', 'tiktok', 'kick', 'instagram',
    'discord', 'reddit', 'facebook', 'twitter', 'website', 'linktree',
  ]),
  name: z.string().max(255).optional(),
});

const TIER_LIMITS: Record<string, { channels: number; analyses: number }> = {
  free: { channels: 1, analyses: 3 },
  pro: { channels: 5, analyses: 30 },
  premium: { channels: 999999, analyses: 999999 },
};

export function channelRoutes(db: Knex): Router {
  const router = Router();

  // GET /channels - list user's channels
  router.get('/channels', requireAuth, async (req: any, res, next) => {
    try {
      const channels = await db('channels')
        .where('user_id', req.session.userId)
        .orderBy('created_at', 'desc');
      res.json({ success: true, data: { channels } });
    } catch (error) {
      next(error);
    }
  });

  // POST /channels - add a channel
  router.post('/channels', requireAuth, async (req: any, res, next) => {
    try {
      const data = addChannelSchema.parse(req.body);

      // Check tier limit for channels
      const user = await db('users').where('id', req.session.userId).first();
      const plan = user?.subscription_plan ?? 'free';
      const limits = TIER_LIMITS[plan] ?? TIER_LIMITS.free;

      const channelCount = await db('channels')
        .where('user_id', req.session.userId)
        .count('id as count')
        .first();

      if (Number(channelCount?.count ?? 0) >= limits.channels) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'TIER_LIMIT',
            message: `Your ${plan} plan allows ${limits.channels} channel(s). Upgrade for more.`,
          },
        });
      }

      // Dedupe check
      const existing = await db('channels')
        .where({ user_id: req.session.userId, url: data.url })
        .first();
      if (existing) {
        return res.status(409).json({
          success: false,
          error: { code: 'DUPLICATE', message: 'This channel URL is already added' },
        });
      }

      const [channel] = await db('channels')
        .insert({
          user_id: req.session.userId,
          platform_type: data.platform_type,
          url: data.url,
          name: data.name ?? null,
        })
        .returning('*');

      // Log activity
      await db('agent_activity').insert({
        user_id: req.session.userId,
        activity_type: 'channel_added',
        description: `Added ${data.platform_type} channel`,
        metadata: JSON.stringify({ url: data.url, platform: data.platform_type }),
      });

      res.status(201).json({ success: true, data: { channel } });
    } catch (error) {
      next(error);
    }
  });

  // POST /channels/:id/analyze - run analysis on a channel
  router.post('/channels/:id/analyze', requireAuth, async (req: any, res, next) => {
    try {
      const channel = await db('channels')
        .where({ id: req.params.id, user_id: req.session.userId })
        .first();

      if (!channel) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Channel not found' },
        });
      }

      // Check monthly analysis limit
      const user = await db('users').where('id', req.session.userId).first();
      const plan = user?.subscription_plan ?? 'free';
      const limits = TIER_LIMITS[plan] ?? TIER_LIMITS.free;

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const analysisCount = await db('analyses')
        .where('user_id', req.session.userId)
        .where('created_at', '>=', startOfMonth.toISOString())
        .count('id as count')
        .first();

      if (Number(analysisCount?.count ?? 0) >= limits.analyses) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'TIER_LIMIT',
            message: `Your ${plan} plan allows ${limits.analyses} analyses/month. Upgrade for more.`,
          },
        });
      }

      // Run analysis (uses same logic as audit)
      const { generateAnalysis, detectPlatform } = await import('./audit.js') as any;
      // Inline analysis generation
      let hash = 0;
      const url = channel.url;
      for (let i = 0; i < url.length; i++) {
        hash = ((hash << 5) - hash) + url.charCodeAt(i);
        hash |= 0;
      }
      const seed = Math.abs(hash);
      const score = 40 + (seed % 55);

      const results = {
        platform: channel.platform_type,
        url: channel.url,
        sponsorScore: score,
        rateTier: score > 80 ? 'Macro' : score > 65 ? 'Mid-tier' : score > 50 ? 'Micro' : 'Nano',
        brandMatches: [],
        contentThemes: [],
        analyzedAt: new Date().toISOString(),
      };

      const [analysis] = await db('analyses')
        .insert({
          channel_id: channel.id,
          user_id: req.session.userId,
          platform_type: channel.platform_type,
          results: JSON.stringify(results),
        })
        .returning('*');

      // Log activity
      await db('agent_activity').insert({
        user_id: req.session.userId,
        activity_type: 'analysis_run',
        description: `Analyzed ${channel.platform_type} channel`,
        metadata: JSON.stringify({ channelId: channel.id, score }),
      });

      res.json({ success: true, data: { analysis, results } });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
