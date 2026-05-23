import { Router } from 'express';
import { z } from 'zod';
import type { Knex } from 'knex';
import { requireAuth } from './auth.js';

const checkoutSchema = z.object({
  plan: z.enum(['pro', 'premium']),
});

const PRICE_IDS: Record<string, string> = {
  pro: 'price_pro_19_monthly',
  premium: 'price_premium_39_monthly',
};

const PLAN_PRICES: Record<string, number> = {
  pro: 1900,
  premium: 3900,
};

export function checkoutRoutes(db: Knex): Router {
  const router = Router();

  // POST /checkout - create Stripe checkout session
  router.post('/checkout', requireAuth, async (req: any, res, next) => {
    try {
      const { plan } = checkoutSchema.parse(req.body);
      const user = await db('users').where('id', req.session.userId).first();

      if (!user) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
      }

      if (user.subscription_plan === plan) {
        return res.status(400).json({ success: false, error: { code: 'ALREADY_SUBSCRIBED', message: `You are already on the ${plan} plan` } });
      }

      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey || stripeKey.startsWith('sk_test_...')) {
        // Development mode - simulate checkout
        return res.json({
          success: true,
          data: {
            url: `/pricing?upgrade=${plan}&demo=true`,
            sessionId: `demo_session_${Date.now()}`,
          },
        });
      }

      // Real Stripe integration
      const stripe = (await import('stripe')).default;
      const stripeClient = new stripe(stripeKey);

      const session = await stripeClient.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        customer_email: user.email,
        line_items: [{
          price: PRICE_IDS[plan],
          quantity: 1,
        }],
        success_url: `${process.env.PUBLIC_BASE_URL ?? 'http://localhost'}/dashboard?upgraded=${plan}`,
        cancel_url: `${process.env.PUBLIC_BASE_URL ?? 'http://localhost'}/pricing`,
        metadata: {
          userId: String(user.id),
          plan,
        },
      });

      // Log funnel event
      await db('funnel_events').insert({
        user_id: user.id,
        event_type: 'checkout_started',
        metadata: JSON.stringify({ plan }),
      });

      res.json({ success: true, data: { url: session.url, sessionId: session.id } });
    } catch (error) {
      next(error);
    }
  });

  // POST /webhooks/stripe - handle Stripe webhooks
  router.post('/webhooks/stripe', async (req, res, next) => {
    try {
      const sig = req.headers['stripe-signature'];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret || !sig) {
        return res.status(400).json({ success: false, error: { code: 'MISSING_CONFIG', message: 'Webhook not configured' } });
      }

      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey) {
        return res.status(500).json({ success: false, error: { code: 'MISSING_CONFIG', message: 'Stripe not configured' } });
      }

      const stripe = (await import('stripe')).default;
      const stripeClient = new stripe(stripeKey);

      let event;
      try {
        event = stripeClient.webhooks.constructEvent(req.body, sig as string, webhookSecret);
      } catch (err) {
        return res.status(400).json({ success: false, error: { code: 'INVALID_SIGNATURE', message: 'Invalid webhook signature' } });
      }

      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as any;
          const userId = Number(session.metadata?.userId);
          const plan = session.metadata?.plan;

          if (userId && plan) {
            await db('users').where('id', userId).update({
              subscription_plan: plan,
              subscription_status: 'active',
              subscription_id: session.subscription,
              subscription_started_at: db.fn.now(),
            });

            await db('funnel_events').insert({
              user_id: userId,
              event_type: 'subscription_activated',
              metadata: JSON.stringify({ plan, subscriptionId: session.subscription }),
            });

            await db('agent_activity').insert({
              user_id: userId,
              activity_type: 'plan_upgraded',
              description: `Upgraded to ${plan} plan`,
            });
          }
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as any;
          const subId = subscription.id;
          await db('users').where('subscription_id', subId).update({
            subscription_plan: 'free',
            subscription_status: 'cancelled',
          });
          break;
        }
      }

      res.json({ received: true });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
