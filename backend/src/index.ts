import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import session from 'express-session';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';

import { publicRoutes } from './routes/publicRoutes';
import { privateRoutes } from './routes/privateRoutes';
import { itemRoutes } from './routes/itemRoutes';
import { apiKeyRoutes } from './routes/apiKeyRoutes';
import { adminRoutes } from './routes/adminRoutes';
import { tenantRoutes } from './routes/tenantRoutes';
import { corsOptions } from './config/corsOptions';
import { PrismaStore } from './store/SessionStore';
import { logger } from './config/logger';
import { errorHandler } from './middleware/errorHandler';
import { swaggerSpec } from './config/swagger';
import { RoleService } from './services/RoleService';
import { AdminBootstrapService } from './services/AdminBootstrapService';

dotenv.config();

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

app.use(pinoHttp({ logger }));
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET as string,
    name: 'sid',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 30 * 60 * 1000, // 30 min idle timeout
    },
    store: new PrismaStore(),
  })
);

if (!isProduction) {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

app.use(publicRoutes);
app.use(privateRoutes);
app.use('/items', itemRoutes);
app.use('/api-keys', apiKeyRoutes);
app.use('/admin', adminRoutes);
app.use('/tenant', tenantRoutes);
app.use(errorHandler);

const port = Number(process.env.API_PORT) || 8081;

app.listen(port, async () => {
  await RoleService.verifyDBRoles();
  await AdminBootstrapService.ensureInitialAdmin();
  logger.info(`Server running on port ${port}`);
});
