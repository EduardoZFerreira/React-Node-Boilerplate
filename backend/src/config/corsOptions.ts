import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// Origins explicitly allowed by environment config
const configuredOrigins = process.env.ALLOWED_ORIGINS?.split(' ').filter(Boolean) ?? [];

// In development, the API server's own origin is added automatically so that
// Swagger UI (served at the same host) can make credentialed requests.
// This addition is never active in production.
const devOrigins = isProduction
  ? []
  : [`http://localhost:${process.env.API_PORT ?? 8081}`];

const allowedOrigins = [...configuredOrigins, ...devOrigins];

export const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    // Requests with no Origin header (e.g. server-to-server, curl) are allowed.
    // Browser requests always include Origin, so this does not weaken browser security.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,           // Required for session cookies to be sent cross-origin
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600,                 // Cache preflight response for 10 minutes
  optionsSuccessStatus: 200,
};
