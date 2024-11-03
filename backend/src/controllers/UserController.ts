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

  async login(request: Request, response: Response) {
    const { email, password } = request.body;
    const loginData = await new UserService().login(email, password);

    const status = loginData[0].hasError ? 401 : 200;

    if (loginData[1]) {
      response.cookie("jwt", loginData[1], {
        httpOnly: true,
        sameSite: "none",
        secure: true,
        maxAge: 24 * 60 * 60 * 1000,
      });
    }

    response.status(status).json(loginData[0]);
  }

  async logout(request: Request, response: Response) {
    const cookie = request.cookies;

    if (cookie?.jwt) await new UserService().logout(cookie.jwt);

    response.clearCookie("jwt", {
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });

    response.sendStatus(204);
  }
}

export { UserController };
