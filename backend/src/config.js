import path from 'path';
import { fileURLToPath } from 'url';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function positiveInteger(name, fallback) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
}

export const config = {
  port: positiveInteger('PORT', 5000),
  visionServiceUrl: (process.env.VISION_SERVICE_URL || 'http://localhost:8000').replace(/\/+$/, ''),
  llmServiceUrl: (process.env.LLM_SERVICE_URL || 'http://localhost:8001').replace(/\/+$/, ''),
  visionRequestTimeoutMs: positiveInteger('VISION_REQUEST_TIMEOUT_MS', 300000),
  llmRequestTimeoutMs: positiveInteger('LLM_REQUEST_TIMEOUT_MS', 60000),
  pipelineStepRetries: positiveInteger('PIPELINE_STEP_RETRIES', 2),
  maxUploadBytes: positiveInteger('MAX_UPLOAD_BYTES', 10 * 1024 * 1024),
  mongodbUri: process.env.MONGODB_URI || '',
  mongodbDatabase: process.env.MONGODB_DATABASE || 'boardsnap',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5173',
  uploadDir: path.resolve(process.env.UPLOAD_DIR || path.join(backendRoot, 'uploads')),
};
