import fs from 'fs/promises';
import path from 'path';
import { postJson, postVisionForm, ServiceError } from './serviceClient.js';

const PIPELINE_STEPS = [
  { step: 1, title: 'Perspective Rectification', detail: 'Cleaning, straightening, and measuring image quality.' },
  { step: 2, title: 'Quality Gate Evaluation', detail: 'Checking whether the board is readable enough to process.' },
  { step: 3, title: 'Region & Shape Detection', detail: 'Finding text blocks, boxes, and arrows.' },
  { step: 4, title: 'Handwriting OCR', detail: 'Reading text from detected board regions.' },
  { step: 5, title: 'Diagram Graph Builder', detail: 'Connecting shapes and arrows into an editable Mermaid diagram.' },
  { step: 6, title: 'Grounded Notes & Quiz', detail: 'Generating study notes and questions from extracted board content.' },
];

function validateCleanResponse(payload) {
  if (
    typeof payload.cleanImageB64 !== 'string' ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(payload.cleanImageB64) ||
    typeof payload.quality !== 'number' ||
    !Number.isFinite(payload.quality) ||
    typeof payload.isQualityPass !== 'boolean'
  ) {
    throw new ServiceError('/vision/clean returned an invalid response');
  }
  return payload;
}

function requireArray(payload, key, endpoint) {
  if (!Array.isArray(payload?.[key])) {
    throw new ServiceError(`${endpoint} response is missing ${key}`);
  }
  return payload[key];
}

function validateNotes(notes) {
  if (
    !notes ||
    typeof notes.title !== 'string' ||
    !Array.isArray(notes.keyPoints) ||
    !Array.isArray(notes.definitions) ||
    !Array.isArray(notes.actionItems)
  ) {
    throw new ServiceError('/llm/notes returned notes with an invalid shape');
  }
  return notes;
}

function validateQuiz(quiz) {
  if (
    !Array.isArray(quiz) ||
    quiz.some((item) => !item || typeof item.q !== 'string' || typeof item.a !== 'string')
  ) {
    throw new ServiceError('/llm/quiz returned a quiz with an invalid shape');
  }
  return quiz;
}

export function createBoardPipeline({ repository, config }) {
  async function callWithRetry(operation, label) {
    let lastError;
    for (let attempt = 1; attempt <= config.pipelineStepRetries; attempt += 1) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (!error.retryable || attempt === config.pipelineStepRetries) break;
        console.warn(`[BoardSnap] Retrying ${label} (${attempt + 1}/${config.pipelineStepRetries})`);
      }
    }
    throw lastError;
  }

  async function updateProgress(boardId, step) {
    await repository.update(boardId, {
      status: 'processing',
      progress: {
        currentStep: step.step,
        totalSteps: PIPELINE_STEPS.length,
        stepInfo: { step: step.step, title: step.title, detail: step.detail },
      },
      updatedAt: new Date(),
    });
  }

  async function run(board) {
    const { id: boardId, file } = board;
    try {
      await updateProgress(boardId, PIPELINE_STEPS[0]);
      const rawImage = await fs.readFile(file.path);
      const cleaned = validateCleanResponse(await callWithRetry(
        () => postVisionForm(
          config.visionServiceUrl,
          '/vision/clean',
          {
            file: {
              value: new Blob([rawImage], { type: file.mimetype }),
              filename: file.originalname,
            },
          },
          config.visionRequestTimeoutMs,
        ),
        'vision cleanup',
      ));

      const cleanFilename = `${boardId}_clean.png`;
      await fs.writeFile(path.join(config.uploadDir, cleanFilename), Buffer.from(cleaned.cleanImageB64, 'base64'));
      const cleanImageUrl = `/uploads/${encodeURIComponent(cleanFilename)}`;
      const common = {
        quality: cleaned.quality,
        isQualityPass: cleaned.isQualityPass,
        metrics: cleaned.metrics || {},
        cleanImageUrl,
      };

      await updateProgress(boardId, PIPELINE_STEPS[1]);
      if (!cleaned.isQualityPass) {
        await repository.update(boardId, {
          ...common,
          status: 'done',
          progress: null,
          regions: [],
          diagram: { nodes: [], edges: [], mermaid: '' },
          notes: null,
          quiz: [],
          completedAt: new Date(),
          updatedAt: new Date(),
        });
        return;
      }

      await updateProgress(boardId, PIPELINE_STEPS[2]);
      const detected = await callWithRetry(
        () => postVisionForm(config.visionServiceUrl, '/vision/detect', {
          clean_image_b64: cleaned.cleanImageB64,
        }, config.visionRequestTimeoutMs),
        'region detection',
      );
      const detectedRegions = requireArray(detected, 'regions', '/vision/detect');

      await updateProgress(boardId, PIPELINE_STEPS[3]);
      const recognized = await callWithRetry(
        () => postVisionForm(config.visionServiceUrl, '/vision/ocr', {
          regions_json: JSON.stringify(detectedRegions),
          clean_image_b64: cleaned.cleanImageB64,
        }, config.visionRequestTimeoutMs),
        'OCR',
      );
      const regions = requireArray(recognized, 'regions', '/vision/ocr');

      await updateProgress(boardId, PIPELINE_STEPS[4]);
      const diagram = await callWithRetry(
        () => postVisionForm(config.visionServiceUrl, '/vision/graph', {
          regions_json: JSON.stringify(regions),
        }, config.visionRequestTimeoutMs),
        'diagram graph construction',
      );
      if (
        !Array.isArray(diagram.nodes) ||
        !Array.isArray(diagram.edges) ||
        typeof diagram.mermaid !== 'string'
      ) {
        throw new ServiceError('/vision/graph returned an invalid response');
      }

      await updateProgress(boardId, PIPELINE_STEPS[5]);
      const notes = validateNotes(await callWithRetry(
        () => postJson(config.llmServiceUrl, '/llm/notes', { regions, diagram }, config.llmRequestTimeoutMs),
        'grounded notes generation',
      ));

      const quiz = validateQuiz(await callWithRetry(
        () => postJson(config.llmServiceUrl, '/llm/quiz', { notes }, config.llmRequestTimeoutMs),
        'quiz generation',
      ));

      await repository.update(boardId, {
        ...common,
        status: 'done',
        progress: null,
        regions,
        diagram,
        notes,
        quiz,
        completedAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error(`[BoardSnap] Pipeline failed for ${boardId}:`, error);
      await repository.update(boardId, {
        status: 'failed',
        progress: null,
        error: error.message,
        failedAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  return { run };
}
