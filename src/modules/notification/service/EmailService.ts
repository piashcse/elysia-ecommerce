import { and, asc, eq, lt, lte } from 'drizzle-orm';
import { db } from '../../../config/database';
import { emailOutbox } from '../../../database/schema';
import { mailService } from '../../../services/mail.service';
import envConfig from '../../../config/env';
import { NotificationPreferenceService } from './NotificationPreferenceService';

const BACKOFF_BASE_MS = 60_000;
const BACKOFF_MAX_MS = 60 * 60_000;

const backoffMs = (attempts: number) =>
  Math.min(BACKOFF_MAX_MS, BACKOFF_BASE_MS * 2 ** Math.max(0, attempts - 1));

export class EmailService {
  private preferences = new NotificationPreferenceService();

  async enqueue(input: {
    to: string;
    subject: string;
    text: string;
    html?: string;
    userId?: string | null;
    type?: string;
  }) {
    // Respect the user's email preferences when the message is tied to an
    // account and a notification type. Guests always receive transactional mail.
    if (input.userId && input.type && !(await this.preferences.isEmailEnabled(input.userId, input.type))) {
      return null;
    }

    const [record] = await db.insert(emailOutbox).values({
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
      nextAttemptAt: new Date(),
    }).returning();
    return record;
  }

  async list(limit = 50) {
    return db.select().from(emailOutbox).orderBy(asc(emailOutbox.createdAt)).limit(Math.min(100, Math.max(1, limit)));
  }

  /**
   * Delivers pending emails and retries previously failed attempts with
   * exponential backoff. Once the configured attempt limit is reached the
   * message is marked as permanently failed.
   */
  async process(limit = 50): Promise<{ sent: number; failed: number }> {
    const pending = await db
      .select()
      .from(emailOutbox)
      .where(and(
        eq(emailOutbox.status, 'pending'),
        lt(emailOutbox.attempts, envConfig.EMAIL_MAX_ATTEMPTS),
        lte(emailOutbox.nextAttemptAt, new Date())
      ))
      .orderBy(asc(emailOutbox.createdAt))
      .limit(Math.min(100, Math.max(1, limit)));

    let sent = 0;
    let failed = 0;

    for (const email of pending) {
      const attempts = email.attempts + 1;
      try {
        await mailService.send({ to: email.to, subject: email.subject, text: email.text, html: email.html ?? undefined });
        await db.update(emailOutbox).set({
          status: 'sent',
          sentAt: new Date(),
          attempts,
          lastError: null,
        }).where(eq(emailOutbox.id, email.id));
        sent += 1;
      } catch (error) {
        const exhausted = attempts >= envConfig.EMAIL_MAX_ATTEMPTS;
        await db.update(emailOutbox).set({
          status: exhausted ? 'failed' : 'pending',
          attempts,
          lastError: (error as Error).message,
          nextAttemptAt: new Date(Date.now() + backoffMs(attempts)),
        }).where(eq(emailOutbox.id, email.id));
        failed += 1;
      }
    }

    return { sent, failed };
  }

  startWorker(intervalMs = envConfig.EMAIL_WORKER_INTERVAL_MS): ReturnType<typeof setInterval> {
    const timer = setInterval(() => {
      this.process().catch((error) => {
        console.error('Email worker failed:', (error as Error).message);
      });
    }, intervalMs);
    timer.unref?.();
    return timer;
  }
}

export const emailService = new EmailService();
