import { Request, Response } from "express";
import { ICreateUserRequest } from "../interfaces/requests/ICreateUserRequest";
import { UserService } from "../services/UserService";

class UserController {
  async createUser(request: Request, response: Response) {
    const userData = request.body as ICreateUserRequest;
    const responseDto = await new UserService().createUser(userData);

    const status = responseDto.hasError ? 500 : 201;

    response.status(status).json(responseDto);
  }
}

export { UserController };
