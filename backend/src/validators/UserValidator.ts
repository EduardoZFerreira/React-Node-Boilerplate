import dotenv from "dotenv";
import { ICreateUserRequest } from "../interfaces/requests/ICreateUserRequest";

dotenv.config();

const bypassStrength = Boolean(process.env.BYPASS_PASSWORD_STRENGTH_VALIDATION);

const userValidator = (user: ICreateUserRequest): IValidationResponse => {
  const errors: string[] = [];
  let valid = true;

  if (!user.name) {
    valid = false;
    errors.push("Name not informed");
  }

  if (!user.email) {
    valid = false;
    errors.push("E-mail not informed");
  }

  if (!user.password) {
    valid = false;
    errors.push("Password not informed");
  }

  if (!bypassStrength) {
    const expression =
      /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*\W)(?!.* ).{8,16}$/;

    if (!expression.test(user.password)) {
      valid = false;
      errors.push("Password doesn't match requirements");
    }
  }

  return { valid, errors };
};

export { userValidator };
