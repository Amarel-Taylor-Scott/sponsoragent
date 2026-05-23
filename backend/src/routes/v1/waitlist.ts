import { Router } from 'express';
import { z } from 'zod';
import type { Knex } from 'knex';

const waitlistSchema = z.object({
  email: z.string().email().max(255),
  variant: z.enum(['A', 'B']).default('A'),
  source: z.string().max(255).optional(),
});

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function rateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

export function waitlistRoutes(db: Knex): Router {
  const router = Router();

  // POST /waitlist
  router.post('/waitlist', async (req, res, next) => {
    try {
      const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
      if (!rateLimit(ip, 5, 60000)) {
        return res.status(429).json({
          success: false,
          error: { code: 'RATE_LIMITED', message: 'Too many requests. Try again in a minute.' },
        });
      }

      const data = waitlistSchema.parse(req.body);

      // Check if already on waitlist
      const existing = await db('waitlist').where('email', data.email).first();
      if (existing) {
        return res.json({ success: true, data: { message: 'You are already on the waitlist!', alreadyJoined: true } });
      }

      await db('waitlist').insert({
        email: data.email,
        variant: data.variant,
        source: data.source ?? null,
      });

      // Create email sequence
      await db('email_sequences').insert({
        email: data.email,
        sequence_name: 'waitlist_welcome',
        current_step: 0,
        next_send_at: db.fn.now(),
        status: 'active',
      });

      // Funnel event
      await db('funnel_events').insert({
        email: data.email,
        event_type: 'waitlist_signup',
        metadata: JSON.stringify({ variant: data.variant, source: data.source }),
      });

      const [{ count }] = await db('waitlist').count('id as count');

      res.status(201).json({
        success: true,
        data: { message: 'You are on the waitlist!', position: Number(count) },
      });
    } catch (error) {
      next(error);
    }
  });

  // GET /waitlist/count (public)
  router.get('/waitlist/count', async (_req, res, next) => {
    try {
      const [{ count }] = await db('waitlist').count('id as count');
      res.json({ success: true, data: { count: Number(count) } });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
