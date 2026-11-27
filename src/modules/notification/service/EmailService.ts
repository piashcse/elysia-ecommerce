import { asc, eq } from 'drizzle-orm';
import { db } from '../../../config/database';
import { emailOutbox } from '../../../database/schema';
import { mailService } from '../../../services/mail.service';

export class EmailService {
  async enqueue(input: { to: string; subject: string; text: string; html?: string }) {
    const [record] = await db.insert(emailOutbox).values(input).returning();
    return record;
  }

  async list(limit = 50) {
    return db.select().from(emailOutbox).orderBy(asc(emailOutbox.createdAt)).limit(Math.min(100, Math.max(1, limit)));
  }

  async process(limit = 50): Promise<{ sent: number; failed: number }> {
    const pending = await db
      .select()
      .from(emailOutbox)
      .where(eq(emailOutbox.status, 'pending'))
      .orderBy(asc(emailOutbox.createdAt))
      .limit(Math.min(100, Math.max(1, limit)));

    let sent = 0;
    let failed = 0;

    for (const email of pending) {
      try {
        await mailService.send({ to: email.to, subject: email.subject, text: email.text, html: email.html ?? undefined });
        await db.update(emailOutbox).set({ status: 'sent', sentAt: new Date(), attempts: email.attempts + 1, lastError: null }).where(eq(emailOutbox.id, email.id));
        sent += 1;
      } catch (error) {
        await db.update(emailOutbox).set({
          status: 'failed',
          attempts: email.attempts + 1,
          lastError: (error as Error).message,
        }).where(eq(emailOutbox.id, email.id));
        failed += 1;
      }
    }

    return { sent, failed };
  }
}

export const emailService = new EmailService();
