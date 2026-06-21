import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import type { Knex } from 'knex';

const signupSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().max(255),
  password: z.string().min(10).max(200),
  terms: z.boolean().refine(v => v === true, { message: 'You must accept the terms' }),
  source: z.string().max(255).optional(),
});

const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(200),
});

function signToken(userId: number): string {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET ?? 'dev-secret',
    { expiresIn: '7d' },
  );
}

export function requireAuth(req: any, res: any, next: any) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing token' } });
  }
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET ?? 'dev-secret') as any;
    req.session = { userId: payload.userId };
    next();
  } catch {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } });
  }
}

async function sendVerificationEmail(email: string, token: string) {
  const proxyUrl = process.env.EMAIL_PROXY_URL;
  if (!proxyUrl) return;
  const verifyUrl = `${process.env.PUBLIC_BASE_URL ?? 'http://localhost'}/api/v1/auth/verify?token=${token}`;
  try {
    await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'sponsoragent@polsia.app',
        to: email,
        subject: 'Verify your SponsorAgent account',
        html: `<p>Welcome to SponsorAgent! Click below to verify your email:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
      }),
    });
  } catch (err) {
    console.error('Failed to send verification email', err);
  }
}

export function authRoutes(db: Knex): Router {
  const router = Router();

  // POST /auth/signup
  router.post('/auth/signup', async (req, res, next) => {
    try {
      const data = signupSchema.parse(req.body);
      const exists = await db('users').where('email', data.email).first();
      if (exists) {
        return res.status(409).json({ success: false, error: { code: 'EMAIL_EXISTS', message: 'Email already registered' } });
      }

      const hashedPassword = await bcrypt.hash(data.password, 12);
      const verificationToken = nanoid(48);

      const [user] = await db('users')
        .insert({
          name: data.name,
          email: data.email,
          password: hashedPassword,
          verification_token: verificationToken,
          terms_accepted: true,
          source: data.source ?? null,
        })
        .returning(['id', 'name', 'email', 'subscription_plan', 'created_at']);

      // Create welcome email sequence
      await db('email_sequences').insert({
        user_id: user.id,
        email: data.email,
        sequence_name: 'waitlist_welcome',
        current_step: 0,
        next_send_at: db.fn.now(),
        status: 'active',
      });

      // Log funnel event
      await db('funnel_events').insert({
        user_id: user.id,
        email: data.email,
        event_type: 'signup',
        metadata: JSON.stringify({ source: data.source }),
      });

      // Send verification email
      await sendVerificationEmail(data.email, verificationToken);

      const token = signToken(user.id);
      res.status(201).json({ success: true, data: { token, user } });
    } catch (error) {
      next(error);
    }
  });

  // POST /auth/login
  router.post('/auth/login', async (req, res, next) => {
    try {
      const data = loginSchema.parse(req.body);
      const user = await db('users').where('email', data.email).first();
      if (!user || !(await bcrypt.compare(data.password, user.password))) {
        return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
      }

      // Log session
      await db('user_sessions').insert({ user_id: user.id, page_visited: '/login', action_taken: 'login' });

      const token = signToken(user.id);
      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user.id, name: user.name, email: user.email,
            subscription_plan: user.subscription_plan, email_verified: user.email_verified,
            onboarding_completed: user.onboarding_completed,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  });

  // POST /auth/logout
  router.post('/auth/logout', (_req, res) => {
    res.json({ success: true });
  });

  // GET /auth/verify?token=
  router.get('/auth/verify', async (req, res, next) => {
    try {
      const { token } = req.query;
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Missing verification token' } });
      }

      const user = await db('users').where('verification_token', token).first();
      if (!user) {
        return res.status(404).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired verification token' } });
      }

      await db('users').where('id', user.id).update({
        email_verified: true,
        verification_token: null,
      });

      // Log funnel event
      await db('funnel_events').insert({
        user_id: user.id,
        email: user.email,
        event_type: 'email_verified',
      });

      // Redirect to dashboard with success
      res.redirect('/?verified=true');
    } catch (error) {
      next(error);
    }
  });

  // GET /auth/me
  router.get('/auth/me', requireAuth, async (req: any, res, next) => {
    try {
      const user = await db('users')
        .select('id', 'name', 'email', 'subscription_plan', 'subscription_status', 'email_verified', 'onboarding_completed', 'created_at')
        .where('id', req.session.userId)
        .first();
      if (!user) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
      }
      res.json({ success: true, data: { user } });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
