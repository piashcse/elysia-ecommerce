import envConfig from '../config/env';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Minimal mail transport.
 *
 * - In development, messages are logged so flows can be tested without SMTP.
 * - In production, configure MAIL_WEBHOOK_URL to forward the message to an
 *   email provider/queue. The webhook receives a JSON MailMessage payload.
 */
class MailService {
  async send(message: MailMessage): Promise<void> {
    if (envConfig.MAIL_WEBHOOK_URL) {
      const response = await fetch(envConfig.MAIL_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: envConfig.MAIL_FROM, ...message }),
      });

      if (!response.ok) {
        throw new Error(`Mail provider returned ${response.status}`);
      }
      return;
    }

    if (envConfig.NODE_ENV !== 'production') {
      if (envConfig.NODE_ENV !== 'test') {
        console.info(`[mail:dev] to=${message.to} subject="${message.subject}"\n${message.text}`);
      }
      return;
    }

    // Do not disclose the recipient or token in the error message.
    console.error('Mail transport is not configured (MAIL_WEBHOOK_URL missing)');
  }
}

export const mailService = new MailService();
