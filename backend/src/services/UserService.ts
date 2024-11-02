import { genSalt, hash } from "bcrypt";
import { ICreateUserRequest } from "../interfaces/requests/ICreateUserRequest";
import prismaClient from "../prisma/prismaClient";
import { userValidator } from "../validators/UserValidator";

class UserService {
  async createUser(userData: ICreateUserRequest) {
    const validation = userValidator(userData);

    if (validation.valid) {
      const salt = await genSalt();
      const passwordHash = await hash(userData.password, salt);

      const userExists = await prismaClient.user.findFirst({
        where: {
          email: userData.email,
        },
      });

      if (userExists) {
        throw new Error("E-mail already in use");
      }

      const newUser = await prismaClient.user.create({
        data: {
          name: userData.name,
          surname: userData.surname,
          email: userData.email,
          password: passwordHash,
        },
      });
    }
  }
}

export { UserService };
