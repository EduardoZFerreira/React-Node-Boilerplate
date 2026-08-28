import { genSalt, hash } from 'bcrypt';
import prismaClient from '../prisma/prismaClient';
import { Role } from '../config/roles';
import { logger } from '../config/logger';

class AdminBootstrapService {
  // Runs on every boot but only acts once: if an Admin already exists, it's a
  // no-op. Otherwise it seeds one from INITIAL_ADMIN_EMAIL/INITIAL_ADMIN_PASSWORD
  // (set by the dev in their own .env) instead of generating a random password
  // that would need to be read off the console during deploy.
  static async ensureInitialAdmin(): Promise<void> {
    const anyAdmin = await prismaClient.user.findFirst({ where: { roles: { has: Role.ADMIN } } });
    if (anyAdmin) return;

    const email = process.env.INITIAL_ADMIN_EMAIL;
    const password = process.env.INITIAL_ADMIN_PASSWORD;

    if (!email || !password) {
      logger.warn(
        'No Admin user exists and INITIAL_ADMIN_EMAIL/INITIAL_ADMIN_PASSWORD are not set — skipping admin bootstrap. See README for setup.',
      );
      return;
    }

    const existingUser = await prismaClient.user.findFirst({ where: { email } });
    if (existingUser) {
      // Already a real account with its own password — just grant the role.
      if (!existingUser.roles.includes(Role.ADMIN)) {
        await prismaClient.user.update({
          where: { id: existingUser.id },
          data: { roles: { push: Role.ADMIN } },
        });
      }
      logger.info(`Promoted existing user ${email} to Admin.`);
      return;
    }

    const salt = await genSalt();
    const passwordHash = await hash(password, salt);

    await prismaClient.user.create({
      data: {
        name: 'Admin',
        surname: 'User',
        email,
        password: passwordHash,
        roles: [Role.ADMIN],
        mustResetPassword: true,
      },
    });

    logger.info(`Created initial Admin user: ${email} (password reset required on first login)`);
  }
}

export { AdminBootstrapService };
