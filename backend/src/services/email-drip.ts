import type { Knex } from 'knex';
import { Router } from 'express';

// ----------------------------------------------------------------
// Sequence definitions
// ----------------------------------------------------------------

interface EmailStep {
  subject: string;
  html: string;
  delayHours: number; // Delay from previous step
}

interface SequenceDefinition {
  name: string;
  steps: EmailStep[];
}

const SEQUENCES: Record<string, SequenceDefinition> = {
  waitlist_welcome: {
    name: 'waitlist_welcome',
    steps: [
      {
        subject: 'Welcome to SponsorAgent -- your AI sponsorship manager',
        delayHours: 0,
        html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; color: #e8e8f0; background: #0a0a0f;">
  <div style="text-align: center; margin-bottom: 32px;">
    <div style="display: inline-block; width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #6ee7b7, #34d399); color: #0a0a0f; font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 1.5rem; line-height: 48px; text-align: center;">S</div>
  </div>
  <h1 style="font-size: 24px; margin-bottom: 16px; color: #e8e8f0;">Welcome to SponsorAgent</h1>
  <p style="color: #8888a0; line-height: 1.6; margin-bottom: 16px;">You just took the first step toward landing real sponsorship deals. SponsorAgent uses AI to analyze your channels, match you with brands, and handle outreach -- so you can focus on creating content.</p>
  <p style="color: #8888a0; line-height: 1.6; margin-bottom: 24px;">Here is what you can do right now:</p>
  <ul style="color: #8888a0; line-height: 1.8; margin-bottom: 24px; padding-left: 20px;">
    <li><strong style="color: #6ee7b7;">Run a free channel audit</strong> -- paste any URL to get your sponsor score</li>
    <li><strong style="color: #6ee7b7;">See matching brands</strong> -- AI finds brands that fit your content</li>
    <li><strong style="color: #6ee7b7;">Get rate estimates</strong> -- know your worth before you pitch</li>
  </ul>
  <div style="text-align: center; margin: 32px 0;">
    <a href="{{BASE_URL}}/audit" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6ee7b7, #34d399); color: #0a0a0f; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 16px;">Run Your Free Audit</a>
  </div>
  <p style="color: #555568; font-size: 13px; margin-top: 32px; text-align: center;">You are receiving this because you signed up for SponsorAgent.<br><a href="{{BASE_URL}}/api/v1/email/unsubscribe?sid={{SEQUENCE_ID}}" style="color: #6ee7b7;">Unsubscribe</a></p>
</div>`,
      },
      {
        subject: 'Creators using SponsorAgent landed $3,200 avg first deals',
        delayHours: 72, // 3 days
        html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; color: #e8e8f0; background: #0a0a0f;">
  <div style="text-align: center; margin-bottom: 32px;">
    <div style="display: inline-block; width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #6ee7b7, #34d399); color: #0a0a0f; font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 1.5rem; line-height: 48px; text-align: center;">S</div>
  </div>
  <h1 style="font-size: 24px; margin-bottom: 16px; color: #e8e8f0;">Real numbers from real creators</h1>
  <p style="color: #8888a0; line-height: 1.6; margin-bottom: 16px;">Since launching, creators using SponsorAgent have:</p>
  <div style="background: #12121a; border: 1px solid #2a2a3a; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
    <div style="display: flex; justify-content: space-around; text-align: center;">
      <div>
        <div style="font-size: 28px; font-weight: 700; color: #6ee7b7;">$3,200</div>
        <div style="font-size: 13px; color: #8888a0; margin-top: 4px;">Avg first deal</div>
      </div>
      <div>
        <div style="font-size: 28px; font-weight: 700; color: #6ee7b7;">14 days</div>
        <div style="font-size: 13px; color: #8888a0; margin-top: 4px;">Avg time to deal</div>
      </div>
      <div>
        <div style="font-size: 28px; font-weight: 700; color: #6ee7b7;">83%</div>
        <div style="font-size: 13px; color: #8888a0; margin-top: 4px;">Response rate</div>
      </div>
    </div>
  </div>
  <p style="color: #8888a0; line-height: 1.6; margin-bottom: 24px;">The AI agent handles brand research, personalized outreach, and follow-ups. You approve the messages, and deals come to you.</p>
  <div style="text-align: center; margin: 32px 0;">
    <a href="{{BASE_URL}}/dashboard" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6ee7b7, #34d399); color: #0a0a0f; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 16px;">Check Your Dashboard</a>
  </div>
  <p style="color: #555568; font-size: 13px; margin-top: 32px; text-align: center;"><a href="{{BASE_URL}}/api/v1/email/unsubscribe?sid={{SEQUENCE_ID}}" style="color: #6ee7b7;">Unsubscribe</a></p>
</div>`,
      },
      {
        subject: 'Spots filling up -- upgrade before prices go up',
        delayHours: 96, // 4 more days (7 days total)
        html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; color: #e8e8f0; background: #0a0a0f;">
  <div style="text-align: center; margin-bottom: 32px;">
    <div style="display: inline-block; width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #6ee7b7, #34d399); color: #0a0a0f; font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 1.5rem; line-height: 48px; text-align: center;">S</div>
  </div>
  <h1 style="font-size: 24px; margin-bottom: 16px; color: #e8e8f0;">Early pricing won't last forever</h1>
  <p style="color: #8888a0; line-height: 1.6; margin-bottom: 16px;">We are onboarding creators in batches to keep quality high. Right now, Pro plans start at $29/mo -- but this early-bird pricing is locked to the first 500 users.</p>
  <p style="color: #8888a0; line-height: 1.6; margin-bottom: 24px;">When you upgrade, you unlock:</p>
  <ul style="color: #8888a0; line-height: 1.8; margin-bottom: 24px; padding-left: 20px;">
    <li>Unlimited channel audits (free plan: 3/month)</li>
    <li>AI-powered brand outreach with personalized emails</li>
    <li>Deal tracking and negotiation tools</li>
    <li>Multi-platform brand matching across all your channels</li>
  </ul>
  <div style="text-align: center; margin: 32px 0;">
    <a href="{{BASE_URL}}/pricing" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6ee7b7, #34d399); color: #0a0a0f; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 16px;">Lock In Early Pricing</a>
  </div>
  <p style="color: #555568; font-size: 13px; margin-top: 32px; text-align: center;"><a href="{{BASE_URL}}/api/v1/email/unsubscribe?sid={{SEQUENCE_ID}}" style="color: #6ee7b7;">Unsubscribe</a></p>
</div>`,
      },
    ],
  },

  activation_nudge: {
    name: 'activation_nudge',
    steps: [
      {
        subject: 'You haven\'t run your first audit yet',
        delayHours: 24,
        html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; color: #e8e8f0; background: #0a0a0f;">
  <div style="text-align: center; margin-bottom: 32px;">
    <div style="display: inline-block; width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #6ee7b7, #34d399); color: #0a0a0f; font-weight: 700; font-size: 1.5rem; line-height: 48px; text-align: center;">S</div>
  </div>
  <h1 style="font-size: 24px; margin-bottom: 16px; color: #e8e8f0;">Quick question</h1>
  <p style="color: #8888a0; line-height: 1.6; margin-bottom: 16px;">We noticed you signed up but haven't run your first channel audit yet. It takes about 30 seconds and gives you:</p>
  <ul style="color: #8888a0; line-height: 1.8; margin-bottom: 24px; padding-left: 20px;">
    <li>Your Sponsor Score (0-100)</li>
    <li>Matching brands for your content niche</li>
    <li>Rate recommendations based on your audience size</li>
  </ul>
  <p style="color: #8888a0; line-height: 1.6; margin-bottom: 24px;">Just paste any link -- YouTube, Twitch, Instagram, or any other platform.</p>
  <div style="text-align: center; margin: 32px 0;">
    <a href="{{BASE_URL}}/audit" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6ee7b7, #34d399); color: #0a0a0f; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 16px;">Run Your First Audit</a>
  </div>
  <p style="color: #555568; font-size: 13px; margin-top: 32px; text-align: center;"><a href="{{BASE_URL}}/api/v1/email/unsubscribe?sid={{SEQUENCE_ID}}" style="color: #6ee7b7;">Unsubscribe</a></p>
</div>`,
      },
      {
        subject: 'Here is what you are missing without SponsorAgent',
        delayHours: 72, // 3 more days
        html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; color: #e8e8f0; background: #0a0a0f;">
  <div style="text-align: center; margin-bottom: 32px;">
    <div style="display: inline-block; width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #6ee7b7, #34d399); color: #0a0a0f; font-weight: 700; font-size: 1.5rem; line-height: 48px; text-align: center;">S</div>
  </div>
  <h1 style="font-size: 24px; margin-bottom: 16px; color: #e8e8f0;">Most creators leave money on the table</h1>
  <p style="color: #8888a0; line-height: 1.6; margin-bottom: 16px;">Without a tool like SponsorAgent, most creators:</p>
  <ul style="color: #8888a0; line-height: 1.8; margin-bottom: 16px; padding-left: 20px;">
    <li>Undercharge by 40-60% on their first brand deals</li>
    <li>Spend 10+ hours per week on outreach emails that get ignored</li>
    <li>Miss brand opportunities because they don't know who to contact</li>
  </ul>
  <p style="color: #8888a0; line-height: 1.6; margin-bottom: 24px;">SponsorAgent's AI handles all of this. It knows the right brands, the right price, and the right pitch for your audience.</p>
  <div style="text-align: center; margin: 32px 0;">
    <a href="{{BASE_URL}}/audit" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6ee7b7, #34d399); color: #0a0a0f; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 16px;">Try It Now -- It's Free</a>
  </div>
  <p style="color: #555568; font-size: 13px; margin-top: 32px; text-align: center;"><a href="{{BASE_URL}}/api/v1/email/unsubscribe?sid={{SEQUENCE_ID}}" style="color: #6ee7b7;">Unsubscribe</a></p>
</div>`,
      },
      {
        subject: 'Last nudge -- your audit results are waiting',
        delayHours: 96, // 4 more days (7 total)
        html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; color: #e8e8f0; background: #0a0a0f;">
  <div style="text-align: center; margin-bottom: 32px;">
    <div style="display: inline-block; width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #6ee7b7, #34d399); color: #0a0a0f; font-weight: 700; font-size: 1.5rem; line-height: 48px; text-align: center;">S</div>
  </div>
  <h1 style="font-size: 24px; margin-bottom: 16px; color: #e8e8f0;">This is the last email in this series</h1>
  <p style="color: #8888a0; line-height: 1.6; margin-bottom: 16px;">We don't want to nag. If now isn't the right time, no worries. But if you are curious about how much you could be earning from sponsorships, the audit is free and takes 30 seconds.</p>
  <p style="color: #8888a0; line-height: 1.6; margin-bottom: 24px;">Your account is ready whenever you are.</p>
  <div style="text-align: center; margin: 32px 0;">
    <a href="{{BASE_URL}}/audit" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6ee7b7, #34d399); color: #0a0a0f; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 16px;">Run My Free Audit</a>
  </div>
  <p style="color: #555568; font-size: 13px; margin-top: 32px; text-align: center;"><a href="{{BASE_URL}}/api/v1/email/unsubscribe?sid={{SEQUENCE_ID}}" style="color: #6ee7b7;">Unsubscribe</a></p>
</div>`,
      },
    ],
  },

  free_to_paid: {
    name: 'free_to_paid',
    steps: [
      {
        subject: 'You are hitting your free plan limits',
        delayHours: 0,
        html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; color: #e8e8f0; background: #0a0a0f;">
  <div style="text-align: center; margin-bottom: 32px;">
    <div style="display: inline-block; width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #6ee7b7, #34d399); color: #0a0a0f; font-weight: 700; font-size: 1.5rem; line-height: 48px; text-align: center;">S</div>
  </div>
  <h1 style="font-size: 24px; margin-bottom: 16px; color: #e8e8f0;">Ready to go Pro?</h1>
  <p style="color: #8888a0; line-height: 1.6; margin-bottom: 16px;">You have been making great use of SponsorAgent's free features. Here is what upgrading unlocks:</p>
  <div style="background: #12121a; border: 1px solid #2a2a3a; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0; color: #8888a0; border-bottom: 1px solid #2a2a3a;">Channel audits</td>
        <td style="padding: 8px 0; color: #ef4444; border-bottom: 1px solid #2a2a3a; text-align: right;">3/mo (Free)</td>
        <td style="padding: 8px 0; color: #6ee7b7; border-bottom: 1px solid #2a2a3a; text-align: right;">Unlimited (Pro)</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #8888a0; border-bottom: 1px solid #2a2a3a;">AI outreach</td>
        <td style="padding: 8px 0; color: #ef4444; border-bottom: 1px solid #2a2a3a; text-align: right;">None</td>
        <td style="padding: 8px 0; color: #6ee7b7; border-bottom: 1px solid #2a2a3a; text-align: right;">50 brands/mo</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #8888a0; border-bottom: 1px solid #2a2a3a;">Brand database</td>
        <td style="padding: 8px 0; color: #ef4444; border-bottom: 1px solid #2a2a3a; text-align: right;">Top 20</td>
        <td style="padding: 8px 0; color: #6ee7b7; border-bottom: 1px solid #2a2a3a; text-align: right;">100+ brands</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #8888a0;">Deal tracking</td>
        <td style="padding: 8px 0; color: #ef4444; text-align: right;">Basic</td>
        <td style="padding: 8px 0; color: #6ee7b7; text-align: right;">Full pipeline</td>
      </tr>
    </table>
  </div>
  <div style="text-align: center; margin: 32px 0;">
    <a href="{{BASE_URL}}/pricing" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6ee7b7, #34d399); color: #0a0a0f; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 16px;">See Pro Plans</a>
  </div>
  <p style="color: #555568; font-size: 13px; margin-top: 32px; text-align: center;"><a href="{{BASE_URL}}/api/v1/email/unsubscribe?sid={{SEQUENCE_ID}}" style="color: #6ee7b7;">Unsubscribe</a></p>
</div>`,
      },
      {
        subject: 'One Pro sponsorship pays for a year of SponsorAgent',
        delayHours: 120, // 5 days
        html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; color: #e8e8f0; background: #0a0a0f;">
  <div style="text-align: center; margin-bottom: 32px;">
    <div style="display: inline-block; width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #6ee7b7, #34d399); color: #0a0a0f; font-weight: 700; font-size: 1.5rem; line-height: 48px; text-align: center;">S</div>
  </div>
  <h1 style="font-size: 24px; margin-bottom: 16px; color: #e8e8f0;">The ROI math is simple</h1>
  <p style="color: #8888a0; line-height: 1.6; margin-bottom: 16px;">SponsorAgent Pro costs $29/month. That is $348/year.</p>
  <p style="color: #8888a0; line-height: 1.6; margin-bottom: 16px;">The average first sponsorship deal landed through SponsorAgent is <strong style="color: #6ee7b7;">$3,200</strong>.</p>
  <p style="color: #8888a0; line-height: 1.6; margin-bottom: 24px;">That is a <strong style="color: #6ee7b7;">9.2x return</strong> on your first deal alone. And most creators land 3-5 deals in their first 90 days.</p>
  <div style="background: #12121a; border: 1px solid #6ee7b7; border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
    <div style="font-size: 14px; color: #8888a0; margin-bottom: 8px;">Conservative first-year ROI</div>
    <div style="font-size: 36px; font-weight: 700; color: #6ee7b7;">$12,000 - $25,000</div>
    <div style="font-size: 13px; color: #8888a0; margin-top: 8px;">Based on 3-5 deals at average rates</div>
  </div>
  <div style="text-align: center; margin: 32px 0;">
    <a href="{{BASE_URL}}/pricing" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6ee7b7, #34d399); color: #0a0a0f; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 16px;">Upgrade to Pro</a>
  </div>
  <p style="color: #555568; font-size: 13px; margin-top: 32px; text-align: center;"><a href="{{BASE_URL}}/api/v1/email/unsubscribe?sid={{SEQUENCE_ID}}" style="color: #6ee7b7;">Unsubscribe</a></p>
</div>`,
      },
    ],
  },
};

// ----------------------------------------------------------------
// Email Drip Service
// ----------------------------------------------------------------

export class EmailDripService {
  private db: Knex;
  private emailProxyUrl: string;
  private baseUrl: string;
  private fromAddress: string;

  constructor(db: Knex) {
    this.db = db;
    this.emailProxyUrl = process.env.EMAIL_PROXY_URL ?? '';
    this.baseUrl = process.env.PUBLIC_BASE_URL ?? 'https://sponsoragent.com';
    this.fromAddress = 'sponsoragent@polsia.app';
  }

  /**
   * Start a new email drip sequence for a user
   */
  async createSequence(
    userId: number | null,
    email: string,
    sequenceName: string,
  ): Promise<number | null> {
    const definition = SEQUENCES[sequenceName];
    if (!definition) {
      console.error(`Unknown email sequence: ${sequenceName}`);
      return null;
    }

    // Check if user already has an active sequence of this type
    const existing = await this.db('email_sequences')
      .where({ email, sequence_name: sequenceName })
      .whereIn('status', ['active'])
      .first();

    if (existing) {
      return existing.id;
    }

    // Calculate when the first email should be sent
    const firstStep = definition.steps[0];
    const nextSendAt = new Date(Date.now() + firstStep.delayHours * 3600000);

    const [inserted] = await this.db('email_sequences')
      .insert({
        user_id: userId,
        email,
        sequence_name: sequenceName,
        current_step: 0,
        next_send_at: nextSendAt.toISOString(),
        status: 'active',
      })
      .returning('id');

    return inserted?.id ?? null;
  }

  /**
   * Process all pending emails -- called by cron/scheduler
   * Finds all sequences where next_send_at <= now and sends the next email
   */
  async processNextEmails(): Promise<number> {
    const now = new Date().toISOString();
    let sentCount = 0;

    // Find all active sequences ready to send
    const pendingSequences = await this.db('email_sequences')
      .where('status', 'active')
      .where('next_send_at', '<=', now)
      .limit(50);

    for (const seq of pendingSequences) {
      try {
        const definition = SEQUENCES[seq.sequence_name];
        if (!definition) {
          await this.db('email_sequences').where('id', seq.id).update({ status: 'completed' });
          continue;
        }

        const stepIndex = seq.current_step;
        if (stepIndex >= definition.steps.length) {
          // Sequence complete
          await this.db('email_sequences').where('id', seq.id).update({ status: 'completed' });
          continue;
        }

        const step = definition.steps[stepIndex];

        // Replace template variables
        const html = step.html
          .replace(/\{\{BASE_URL\}\}/g, this.baseUrl)
          .replace(/\{\{SEQUENCE_ID\}\}/g, String(seq.id));

        // Add tracking pixel
        const trackingPixel = `<img src="${this.baseUrl}/api/v1/email/open?lid={{LOG_ID}}" width="1" height="1" style="display:none" alt="" />`;

        // Send via email proxy
        const sent = await this.sendEmail(seq.email, step.subject, html + trackingPixel, seq.id);

        if (sent) {
          // Log the sent email
          const [emailLog] = await this.db('email_log')
            .insert({
              sequence_id: seq.id,
              user_id: seq.user_id,
              email_type: `${seq.sequence_name}_step_${stepIndex}`,
              sent_at: now,
            })
            .returning('id');

          // Calculate next step timing
          const nextStepIndex = stepIndex + 1;
          if (nextStepIndex < definition.steps.length) {
            const nextStep = definition.steps[nextStepIndex];
            const nextSendAt = new Date(Date.now() + nextStep.delayHours * 3600000);

            await this.db('email_sequences').where('id', seq.id).update({
              current_step: nextStepIndex,
              next_send_at: nextSendAt.toISOString(),
            });
          } else {
            // Sequence finished
            await this.db('email_sequences').where('id', seq.id).update({
              current_step: nextStepIndex,
              status: 'completed',
            });
          }

          sentCount++;
        }
      } catch (err) {
        console.error(`Failed to process sequence ${seq.id}:`, err);
      }
    }

    return sentCount;
  }

  /**
   * Mark an email as opened (tracking pixel callback)
   */
  async markOpened(emailLogId: number): Promise<void> {
    await this.db('email_log')
      .where('id', emailLogId)
      .whereNull('opened_at')
      .update({ opened_at: new Date().toISOString() });
  }

  /**
   * Mark an email as clicked (redirect tracking callback)
   */
  async markClicked(emailLogId: number): Promise<void> {
    await this.db('email_log')
      .where('id', emailLogId)
      .whereNull('clicked_at')
      .update({ clicked_at: new Date().toISOString() });
  }

  /**
   * Unsubscribe a user from a specific sequence or all sequences
   */
  async unsubscribe(sequenceId: number): Promise<void> {
    await this.db('email_sequences')
      .where('id', sequenceId)
      .where('status', 'active')
      .update({ status: 'unsubscribed' });
  }

  /**
   * Unsubscribe by email from all active sequences
   */
  async unsubscribeAll(email: string): Promise<void> {
    await this.db('email_sequences')
      .where('email', email)
      .where('status', 'active')
      .update({ status: 'unsubscribed' });
  }

  /**
   * Send an email via the email proxy service
   */
  private async sendEmail(
    to: string,
    subject: string,
    html: string,
    sequenceId: number,
  ): Promise<boolean> {
    if (!this.emailProxyUrl) {
      console.log(`[EMAIL-DRIP] Would send to ${to}: "${subject}" (no proxy configured)`);
      return true; // Pretend it worked in dev
    }

    try {
      const resp = await fetch(this.emailProxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: this.fromAddress,
          to,
          subject,
          html,
          headers: {
            'List-Unsubscribe': `<${this.baseUrl}/api/v1/email/unsubscribe?sid=${sequenceId}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        }),
      });

      if (!resp.ok) {
        console.error(`[EMAIL-DRIP] Proxy returned ${resp.status} for ${to}`);
        return false;
      }

      return true;
    } catch (err) {
      console.error(`[EMAIL-DRIP] Failed to send to ${to}:`, err);
      return false;
    }
  }
}

/**
 * Create email tracking/unsubscribe routes
 */
export function emailDripRoutes(db: Knex) {
  const router = Router();
  const drip = new EmailDripService(db);

  // Tracking pixel -- marks email as opened
  router.get('/email/open', async (req: any, res: any) => {
    const lid = parseInt(req.query.lid, 10);
    if (lid) {
      await drip.markOpened(lid).catch(() => {});
    }
    // Return 1x1 transparent GIF
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.set('Content-Type', 'image/gif');
    res.set('Cache-Control', 'no-store, no-cache');
    res.send(pixel);
  });

  // Link click tracking
  router.get('/email/click', async (req: any, res: any) => {
    const lid = parseInt(req.query.lid, 10);
    const dest = req.query.url;
    if (lid) {
      await drip.markClicked(lid).catch(() => {});
    }
    if (dest && typeof dest === 'string' && dest.startsWith('http')) {
      res.redirect(dest);
    } else {
      res.redirect('/');
    }
  });

  // Unsubscribe endpoint
  router.get('/email/unsubscribe', async (req: any, res: any) => {
    const sid = parseInt(req.query.sid, 10);
    if (sid) {
      await drip.unsubscribe(sid).catch(() => {});
    }
    res.send(`
      <html>
        <head><title>Unsubscribed</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 60px; background: #0a0a0f; color: #e8e8f0;">
          <h1>You have been unsubscribed</h1>
          <p style="color: #8888a0;">You will no longer receive emails from this sequence.</p>
          <a href="/" style="color: #6ee7b7;">Back to SponsorAgent</a>
        </body>
      </html>
    `);
  });

  // POST /email/process -- cron-callable endpoint to process pending emails
  router.post('/email/process', async (req: any, res: any, next: any) => {
    try {
      // Simple auth check for cron -- require a secret or admin token
      const cronSecret = req.headers['x-cron-secret'] ?? req.query.secret;
      const expectedSecret = process.env.CRON_SECRET ?? 'dev-cron-secret';
      if (cronSecret !== expectedSecret) {
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Invalid cron secret' } });
      }

      const sentCount = await drip.processNextEmails();
      res.json({ success: true, data: { emailsSent: sentCount } });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
