import { compare, genSalt, hash } from "bcrypt";
import { ICreateUserRequest } from "../interfaces/requests/ICreateUserRequest";
import prismaClient from "../prisma/prismaClient";
import { userValidator } from "../validators/UserValidator";
import { CreateUserResponseDTO } from "../DTOs/CreateUserResponseDTO";
import { Role } from "../config/roles";
import Jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { AuthenticationResponseDTO } from "../DTOs/AuthenticationResponseDTO";

dotenv.config();

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

  async login(
    email: string,
    password: string
  ): Promise<[AuthenticationResponseDTO, string]> {
    const existingUser = await prismaClient.user.findFirst({
      where: { email: email },
    });

    if (!existingUser)
      return [new AuthenticationResponseDTO(true, ["User not found"]), ""];

    const comparePassword = await compare(password, existingUser.password);

    if (!comparePassword)
      return [new AuthenticationResponseDTO(true, ["Incorrect password"]), ""];

    const accessToken = Jwt.sign(
      { email: existingUser.email },
      process.env.API_TOKEN_SECRET as string,
      { expiresIn: "10m" }
    );

    const refreshToken = Jwt.sign(
      { email: existingUser.email },
      process.env.REFRESH_TOKEN_SECRET as string,
      { expiresIn: "1d" }
    );

    try {
      await prismaClient.user.update({
        where: { id: existingUser.id },
        data: {
          refreshToken: refreshToken,
        },
      });

      const response = new AuthenticationResponseDTO(
        false,
        [],
        accessToken,
        existingUser.id
      );

      return [response, refreshToken];
    } catch (error: any) {
      return [new AuthenticationResponseDTO(true, [error.message]), ""];
    }
  }

  async logout(cookie: string): Promise<void> {
    const tokenOwner = await prismaClient.user.findFirst({
      where: { refreshToken: cookie },
    });

    if (!tokenOwner) return;

    await prismaClient.user.update({
      where: { id: tokenOwner.id },
      data: { refreshToken: null },
    });
  }
}

export { UserService };
