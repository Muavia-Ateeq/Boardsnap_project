import cors from 'cors';
import express from 'express';
import fs from 'fs';
import multer from 'multer';
import { randomUUID } from 'crypto';
import { createBoardPipeline } from './services/boardPipeline.js';
import { postJson, ServiceError } from './services/serviceClient.js';

function markdownNotes(board) {
  const { title, keyPoints, definitions, actionItems } = board.notes;
  return [
    `# ${title}`,
    '',
    '## Key Takeaways',
    ...keyPoints.map((point) => `- ${point}`),
    '',
    '## Definitions',
    ...definitions.map(({ term, definition }) => `- **${term}**: ${definition}`),
    '',
    '## Action Items',
    ...actionItems.map((item) => `- [ ] ${item}`),
    '',
  ].join('\n');
}

function safeOriginalName(filename) {
  return filename.split(/[\\/]/).pop() || 'whiteboard-image';
}

export function createApp({ repository, config }) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
  const app = express();
  const pipeline = createBoardPipeline({ repository, config });

  app.disable('x-powered-by');
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use('/uploads', express.static(config.uploadDir, { fallthrough: false }));

  const upload = multer({
    storage: multer.diskStorage({
      destination: config.uploadDir,
      filename: (_req, file, callback) => {
        const extensionByType = {
          'image/jpeg': '.jpg',
          'image/png': '.png',
          'image/webp': '.webp',
          'image/gif': '.gif',
          'image/bmp': '.bmp',
          'image/tiff': '.tiff',
        };
        callback(null, `${randomUUID()}${extensionByType[file.mimetype]}`);
      },
    }),
    limits: { fileSize: config.maxUploadBytes, files: 1 },
    fileFilter: (_req, file, callback) => {
      if (!/^image\/(jpeg|png|webp|gif|bmp|tiff)$/.test(file.mimetype)) {
        callback(new Error('Upload must be a supported image (JPEG, PNG, WebP, GIF, BMP, or TIFF).'));
        return;
      }
      callback(null, true);
    },
  });

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'BoardSnap Orchestrator API',
      storage: config.mongodbUri ? 'mongodb' : 'memory',
      timestamp: new Date().toISOString(),
    });
  });

  app.post('/api/boards', upload.single('image'), async (req, res, next) => {
    if (!req.file) {
      res.status(400).json({ error: 'An image is required in the "image" form field.' });
      return;
    }

    const board = {
      id: `b_${randomUUID()}`,
      name: safeOriginalName(req.file.originalname),
      status: 'queued',
      quality: null,
      isQualityPass: null,
      rawImageUrl: `/uploads/${encodeURIComponent(req.file.filename)}`,
      cleanImageUrl: null,
      regions: [],
      diagram: { nodes: [], edges: [], mermaid: '' },
      notes: null,
      quiz: [],
      progress: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      file: {
        path: req.file.path,
        originalname: safeOriginalName(req.file.originalname),
        mimetype: req.file.mimetype,
      },
    };

    try {
      await repository.create(board);
      void pipeline.run(board).catch((error) => {
        console.error(`[BoardSnap] Could not persist pipeline failure for ${board.id}:`, error);
      });
      const { file: _file, ...publicBoard } = board;
      res.status(202).json(publicBoard);
    } catch (error) {
      await fs.promises.unlink(req.file.path).catch(() => {});
      next(error);
    }
  });

  app.get('/api/boards/:id', async (req, res, next) => {
    try {
      const board = await repository.get(req.params.id);
      if (!board) {
        res.status(404).json({ error: 'Board not found.' });
        return;
      }
      const { file: _file, ...publicBoard } = board;
      res.json(publicBoard);
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/boards/:id/quiz', async (req, res, next) => {
    try {
      const board = await repository.get(req.params.id);
      if (!board) {
        res.status(404).json({ error: 'Board not found.' });
        return;
      }
      if (board.status !== 'done' || !board.isQualityPass || !board.notes) {
        res.status(409).json({ error: 'Quiz generation requires a successfully processed board.' });
        return;
      }
      const payload = await postJson(
        config.llmServiceUrl,
        '/llm/quiz',
        { notes: board.notes },
        config.llmRequestTimeoutMs,
      );
      if (!Array.isArray(payload) || payload.some((item) => !item || typeof item.q !== 'string' || typeof item.a !== 'string')) {
        throw new ServiceError('/llm/quiz returned a quiz with an invalid shape');
      }
      await repository.update(board.id, { quiz: payload, updatedAt: new Date() });
      res.json(payload);
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/chat', async (req, res, next) => {
    try {
      const { boardId, query } = req.body || {};
      if (typeof boardId !== 'string' || !boardId.trim() || typeof query !== 'string' || !query.trim()) {
        res.status(400).json({ error: 'boardId and a non-empty query are required.' });
        return;
      }
      const board = await repository.get(boardId);
      if (!board) {
        res.status(404).json({ error: 'Board not found.' });
        return;
      }
      if (board.status !== 'done' || !board.isQualityPass) {
        res.status(409).json({ error: 'Chat is available after a board passes quality checks.' });
        return;
      }
      const answer = await postJson(
        config.llmServiceUrl,
        '/llm/chat',
        {
          board_id: boardId,
          query: query.trim(),
          regions: board.regions,
          diagram: board.diagram,
          notes: board.notes,
        },
        config.llmRequestTimeoutMs,
      );
      if (typeof answer.answer !== 'string' || typeof answer.source !== 'string') {
        throw new ServiceError('/llm/chat returned an invalid response');
      }
      res.json(answer);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/boards/:id/export', async (req, res, next) => {
    try {
      const board = await repository.get(req.params.id);
      if (!board) {
        res.status(404).json({ error: 'Board not found.' });
        return;
      }
      const format = req.query.format || 'md';
      if (format !== 'md') {
        res.status(400).json({ error: 'Unsupported format. Use ?format=md' });
        return;
      }
      if (board.status !== 'done' || !board.notes) {
        res.status(409).json({ error: 'Notes are not available for export yet.' });
        return;
      }
      res
        .type('text/markdown')
        .attachment(`${board.id}-notes.md`)
        .send(markdownNotes(board));
    } catch (error) {
      next(error);
    }
  });

  app.use((error, _req, res, _next) => {
    if (error instanceof multer.MulterError) {
      const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      res.status(status).json({ error: status === 413 ? 'Image exceeds the upload size limit.' : error.message });
      return;
    }
    if (error instanceof ServiceError) {
      res.status(error.status >= 400 && error.status < 500 ? 502 : 503).json({
        error: 'A required processing service failed.',
        detail: error.message,
      });
      return;
    }
    if (error.status === 404 && error.path?.startsWith('/uploads/')) {
      res.status(404).json({ error: 'Image file not found.' });
      return;
    }
    if (/^Upload must be/.test(error.message || '')) {
      res.status(415).json({ error: error.message });
      return;
    }
    console.error('[BoardSnap] Request failed:', error);
    res.status(500).json({ error: 'Internal server error.' });
  });

  return app;
}
