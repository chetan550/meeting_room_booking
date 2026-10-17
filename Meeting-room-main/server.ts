import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { getDataSource } from './server/infrastructure/database/data-source.js';
import { seedDatabase } from './server/infrastructure/database/seeder.js';
import { createApiRouter } from './server/presentation/routes/api.router.js';

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  const dataSource = await getDataSource();
  await seedDatabase(dataSource);
  console.log('Database initialized and seeded.');

  const apiRouter = createApiRouter(dataSource);
  app.use('/api', apiRouter);

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Meeting Room Booking System running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
