import { createApp } from './app.js';
import { createRoutes } from './routes/v1/index.js';
import knex from 'knex';
import pino from 'pino';

const logger = pino({ transport: { target: 'pino-pretty' } });

async function bootstrap() {
  logger.info('Starting SponsorAgent backend...');

  // Database
  const db = knex({
    client: 'pg',
    connection: process.env.DATABASE_URL,
    pool: { min: 2, max: 10 },
  });

  // Verify connection
  try {
    await db.raw('SELECT 1');
    logger.info('Database connected');
  } catch (err) {
    logger.error('Database connection failed', { error: String(err) });
    process.exit(1);
  }

  // Run migrations
  try {
    await db.migrate.latest({ directory: './src/migrations' });
    logger.info('Database migrations complete');
  } catch (err) {
    logger.error('Migration failed', { error: String(err) });
    process.exit(1);
  }

  // Create Express app
  const app = createApp();

  // Mount API routes
  app.use('/api/v1', createRoutes(db));

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });

  // Global error handler
  app.use((err: any, _req: any, res: any, _next: any) => {
    logger.error('Unhandled error', { error: err.message, stack: err.stack });
    const status = err.status ?? err.statusCode ?? 500;
    res.status(status).json({
      success: false,
      error: {
        code: err.code ?? 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
      },
    });
  });

  // Start server
  const port = Number(process.env.PORT ?? 3000);
  app.listen(port, () => {
    logger.info(`SponsorAgent backend listening on port ${port}`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down...');
    await db.destroy();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap().catch((err) => {
  logger.error('Fatal startup error', { error: String(err), stack: (err as Error).stack });
  process.exit(1);
});
