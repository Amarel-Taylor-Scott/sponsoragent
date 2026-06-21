import { Router } from 'express';
import type { Knex } from 'knex';

function requireAdmin(req: any, res: any, next: any) {
  const secret = req.query.secret ?? req.headers['x-admin-secret'];
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Invalid admin secret' } });
  }
  next();
}

export function adminRoutes(db: Knex): Router {
  const router = Router();

  // GET /admin/cohorts
  router.get('/admin/cohorts', requireAdmin, async (_req, res, next) => {
    try {
      // Weekly cohort analysis
      const cohorts = await db.raw(`
        SELECT
          date_trunc('week', created_at) AS week,
          subscription_plan,
          COUNT(*) AS user_count
        FROM users
        GROUP BY week, subscription_plan
        ORDER BY week DESC
        LIMIT 100
      `);

      res.json({ success: true, data: { cohorts: cohorts.rows } });
    } catch (error) {
      next(error);
    }
  });

  // GET /admin/acquisition-channels
  router.get('/admin/acquisition-channels', requireAdmin, async (_req, res, next) => {
    try {
      const channels = await db('users')
        .select('source')
        .count('id as count')
        .groupBy('source')
        .orderBy('count', 'desc');

      const waitlistSources = await db('waitlist')
        .select('source')
        .count('id as count')
        .groupBy('source')
        .orderBy('count', 'desc');

      res.json({ success: true, data: { userSources: channels, waitlistSources } });
    } catch (error) {
      next(error);
    }
  });

  // GET /admin/export/users
  router.get('/admin/export/users', requireAdmin, async (_req, res, next) => {
    try {
      const users = await db('users')
        .select(
          'id', 'name', 'email', 'email_verified', 'subscription_plan',
          'subscription_status', 'source', 'onboarding_completed', 'terms_accepted', 'created_at',
        )
        .orderBy('created_at', 'desc');

      res.json({ success: true, data: { users, total: users.length } });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
