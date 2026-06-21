import { Router } from 'express';
import type { Knex } from 'knex';
import { authRoutes } from './auth.js';
import { auditRoutes } from './audit.js';
import { channelRoutes } from './channels.js';
import { dashboardRoutes } from './dashboard.js';
import { settingsRoutes } from './settings.js';
import { waitlistRoutes } from './waitlist.js';
import { checkoutRoutes } from './checkout.js';
import { adminRoutes } from './admin.js';
import { emailDripRoutes } from '../../services/email-drip.js';

export function createRoutes(db: Knex): Router {
  const router = Router();

  router.use(authRoutes(db));
  router.use(auditRoutes(db));
  router.use(channelRoutes(db));
  router.use(dashboardRoutes(db));
  router.use(settingsRoutes(db));
  router.use(waitlistRoutes(db));
  router.use(checkoutRoutes(db));
  router.use(adminRoutes(db));
  router.use(emailDripRoutes(db));

  return router;
}
