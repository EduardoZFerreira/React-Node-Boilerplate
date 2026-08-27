import session from 'express-session';
import prismaClient from '../prisma/prismaClient';

export class PrismaStore extends session.Store {
  async get(
    sid: string,
    callback: (err: unknown, session?: session.SessionData | null) => void
  ): Promise<void> {
    try {
      const record = await prismaClient.session.findUnique({ where: { sid } });

      if (!record) return callback(null, null);

      if (record.expiresAt && record.expiresAt < new Date()) {
        await prismaClient.session.delete({ where: { sid } }).catch(() => {});
        return callback(null, null);
      }

      callback(null, JSON.parse(record.data) as session.SessionData);
    } catch (err) {
      callback(err);
    }
  }

  async set(
    sid: string,
    sessionData: session.SessionData,
    callback?: (err?: unknown) => void
  ): Promise<void> {
    const data = JSON.stringify(sessionData);
    const expiresAt = sessionData.cookie.expires ?? null;

    try {
      await prismaClient.session.upsert({
        where: { sid },
        update: { data, expiresAt },
        create: { sid, data, expiresAt },
      });
      callback?.();
    } catch (err) {
      callback?.(err);
    }
  }

  async destroy(sid: string, callback?: (err?: unknown) => void): Promise<void> {
    try {
      await prismaClient.session.deleteMany({ where: { sid } });
      callback?.();
    } catch (err) {
      callback?.(err);
    }
  }

  async touch(
    sid: string,
    sessionData: session.SessionData,
    callback?: () => void
  ): Promise<void> {
    try {
      await prismaClient.session.update({
        where: { sid },
        data: { expiresAt: sessionData.cookie.expires ?? null },
      });
    } catch {
      // session will expire naturally if touch fails
    } finally {
      callback?.();
    }
  }
}
