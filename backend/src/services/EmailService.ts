import { mailer } from '../config/mailer';
import { logger } from '../config/logger';

class EmailService {
  static async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    try {
      await mailer.sendMail({
        from: process.env.SMTP_FROM || 'no-reply@boilerplate.local',
        to,
        subject: 'Reset your password',
        text: `Someone requested a password reset for this account. If this was you, use the link below (valid for 1 hour):\n\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`,
        html: `<p>Someone requested a password reset for this account. If this was you, click the link below (valid for 1 hour):</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you didn't request this, you can safely ignore this email.</p>`,
      });
    } catch (err) {
      // Never let delivery failures leak whether the account exists or block
      // the request — log it and let the caller keep responding generically.
      logger.error({ err, to }, 'Failed to send password reset email');
    }
  }
}

export { EmailService };
