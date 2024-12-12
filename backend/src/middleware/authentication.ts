import Jwt from "jsonwebtoken";

const authenticateToken = async (req: any, res: any, next: any) => {
  const header = req.headers.authorization || req.headers.Authorization;
  if (!header?.startsWith("Bearer ")) return res.sendStatus(401);

  const token = header.split(" ")[1];

  Jwt.verify(
    token,
    process.env.API_TOKEN_SECRET as string,
    async (err: any, decoded: any) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = decoded.email;

      next();
    }
  );
};

export { authenticateToken };
