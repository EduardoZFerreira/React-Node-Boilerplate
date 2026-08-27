import { compare, genSalt, hash } from 'bcrypt';
import prismaClient from '../prisma/prismaClient';
import { CreateUserResponseDTO } from '../DTOs/CreateUserResponseDTO';
import { Role } from '../config/roles';
import { AppError } from '../errors/AppError';
import { CreateUserInput, LoginInput } from '../schemas/userSchema';

class UserService {
  async getEmailInUse(email: string): Promise<boolean> {
    const user = await prismaClient.user.findFirst({
      where: { email },
      select: { id: true },
    });
    return Boolean(user);
  }

  async createUser(userData: CreateUserInput): Promise<CreateUserResponseDTO> {
    const userExists = await this.getEmailInUse(userData.email);
    if (userExists) return new CreateUserResponseDTO(true, ['E-mail already in use']);

    const salt = await genSalt();
    const passwordHash = await hash(userData.password, salt);

    const newUser = await prismaClient.user.create({
      data: {
        name: userData.name,
        surname: userData.surname,
        email: userData.email,
        password: passwordHash,
        roles: [Role.USER],
      },
    });

    return new CreateUserResponseDTO(false, [], newUser.id);
  }

  async addUserRole(userId: string, role: Role): Promise<void> {
    const user = await prismaClient.user.findFirst({ where: { id: userId } });
    if (!user) throw new AppError(404, 'User does not exist');

    if (!user.roles.includes(role)) {
      await prismaClient.user.update({
        where: { id: userId },
        data: { roles: { push: role } },
      });
    }
  }

  async removeUserRole(userId: string, role: Role): Promise<void> {
    const user = await prismaClient.user.findFirst({ where: { id: userId } });
    if (!user) throw new AppError(404, 'User does not exist');

    await prismaClient.user.update({
      where: { id: userId },
      data: { roles: user.roles.filter((r) => r !== role) },
    });
  }

  async login(
    credentials: LoginInput,
  ): Promise<{ id: string; email: string; roles: string[]; tenantId: string | null }> {
    const user = await prismaClient.user.findFirst({
      where: { email: credentials.email },
    });

    if (!user) throw new AppError(401, 'Invalid credentials');

    const passwordMatch = await compare(credentials.password, user.password);
    if (!passwordMatch) throw new AppError(401, 'Invalid credentials');

    return { id: user.id, email: user.email, roles: user.roles, tenantId: user.tenantId };
  }

  async createUserInTenant(data: CreateUserInput, tenantId: string): Promise<CreateUserResponseDTO> {
    const userExists = await this.getEmailInUse(data.email);
    if (userExists) return new CreateUserResponseDTO(true, ['E-mail already in use']);

    const salt = await genSalt();
    const passwordHash = await hash(data.password, salt);

    const newUser = await prismaClient.user.create({
      data: {
        name: data.name,
        surname: data.surname,
        email: data.email,
        password: passwordHash,
        roles: [Role.USER],
        tenantId,
      },
    });

    return new CreateUserResponseDTO(false, [], newUser.id);
  }
}

export { UserService };
