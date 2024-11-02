import { genSalt, hash } from "bcrypt";
import { ICreateUserRequest } from "../interfaces/requests/ICreateUserRequest";
import prismaClient from "../prisma/prismaClient";
import { userValidator } from "../validators/UserValidator";
import { CreateUserResponseDTO } from "../DTOs/CreateUserResponseDTO";
import { Role } from "../config/roles";

class UserService {
  async getEmailInUse(email: string) {
    const user = await prismaClient.user.findFirst({
      where: {
        email: email,
      },
      select: {
        id: true,
      },
    });

    return Boolean(user);
  }

  async createUser(
    userData: ICreateUserRequest
  ): Promise<CreateUserResponseDTO> {
    const validation = userValidator(userData);

    if (!validation.valid)
      return new CreateUserResponseDTO(true, validation.errors);

    const userExists = await this.getEmailInUse(userData.email);

    if (userExists)
      return new CreateUserResponseDTO(true, ["E-mail already in use"]);

    const salt = await genSalt();
    const passwordHash = await hash(userData.password, salt);

    try {
      const newUser = await prismaClient.user.create({
        data: {
          name: userData.name,
          surname: userData.surname,
          email: userData.email,
          password: passwordHash,
        },
      });

      await this.addUserRole(newUser.id, Role.USER);

      return new CreateUserResponseDTO(false, [], newUser.id);
    } catch (error: any) {
      return new CreateUserResponseDTO(true, [error.message]);
    }
  }

  async addUserRole(userId: number, role: Role) {
    const dbRole = await prismaClient.role.findFirst({
      where: {
        title: role,
      },
    });

    if (!dbRole) throw new Error("Unknown role");

    const user = await prismaClient.user.findFirst({
      where: { id: userId },
    });

    if (!user) throw new Error("User does not exist");

    try {
      await prismaClient.userRole.create({
        data: {
          userId: userId,
          roleId: dbRole.id,
        },
      });
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}

export { UserService };
