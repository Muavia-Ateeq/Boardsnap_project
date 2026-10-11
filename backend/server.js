import 'dotenv/config';
import { createApp } from './src/app.js';
import { createBoardRepository } from './src/repositories/boardRepository.js';
import { config } from './src/config.js';

const repository = await createBoardRepository(config);
const app = createApp({ repository, config });

const server = app.listen(config.port, () => {
  console.log(`[BoardSnap] API running on http://localhost:${config.port}`);
  console.log(`[BoardSnap] Board storage: ${config.mongodbUri ? 'MongoDB' : 'in-memory (ephemeral)'}`);
});

async function shutdown(signal) {
  console.log(`[BoardSnap] ${signal} received; shutting down`);
  server.close(async (error) => {
    if (error) {
      console.error('[BoardSnap] HTTP server shutdown failed:', error);
      process.exitCode = 1;
    }
    await repository.close();
  });
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
