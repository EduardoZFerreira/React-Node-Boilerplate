import dotenv from "dotenv";

dotenv.config();

const allowedOrigins = process?.env?.ALLOWED_ORIGINS?.split(" ");

const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (
      err: Error | null,
      origin?: boolean | string | RegExp | Array<boolean | string | RegExp>
    ) => void
  ) => {
    if (!origin || allowedOrigins?.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  optionsSuccessStatus: 200,
};

export { corsOptions };
