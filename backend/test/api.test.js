import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { after, before, test } from 'node:test';
import { createApp } from '../src/app.js';
import { createMemoryBoardRepository } from '../src/repositories/boardRepository.js';

const sampleRegions = [
  { id: 'r1', type: 'box', box: [10, 20, 20, 10], label: 'Start', confidence: 0.95 },
];
const sampleDiagram = {
  nodes: [{ id: 'n1', label: 'Start' }],
  edges: [],
  mermaid: 'graph LR\n  n1["Start"]',
};
const sampleNotes = {
  title: 'Test board',
  keyPoints: ['Start here.'],
  definitions: [],
  actionItems: [],
};

let mockServices;
let apiServer;
let uploadDir;
let repository;
let baseUrl;
let rejectCleanRequest = false;
let failQualityGate = false;

before(async () => {
  uploadDir = await fs.mkdtemp(path.join(os.tmpdir(), 'boardsnap-api-'));
  mockServices = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks).toString();
    let result;
    if (req.url === '/vision/clean' && rejectCleanRequest) {
      res.writeHead(422, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ detail: 'Image could not be decoded.' }));
      return;
    } else if (req.url === '/vision/clean') {
      result = {
        cleanImageB64: Buffer.from('clean image').toString('base64'),
        quality: failQualityGate ? 0.2 : 0.9,
        isQualityPass: !failQualityGate,
        metrics: { textConfidence: '90%' },
      };
    } else if (req.url === '/vision/detect') {
      result = { regions: sampleRegions };
    } else if (req.url === '/vision/ocr') {
      result = { regions: sampleRegions.map((region) => ({ ...region, text: 'Start' })) };
    } else if (req.url === '/vision/graph') {
      result = sampleDiagram;
    } else if (req.url === '/llm/notes') {
      assert.match(body, /"regions"/);
      result = sampleNotes;
    } else if (req.url === '/llm/quiz') {
      result = [{ q: 'Where do we start?', a: 'At the start.', options: ['Start'], correctIndex: 0 }];
    } else if (req.url === '/llm/chat') {
      result = { answer: 'The board says start.', source: 'Region r1' };
    } else if (req.url === '/vision/fail') {
      res.writeHead(422, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ detail: 'Image could not be decoded.' }));
      return;
    } else {
      res.writeHead(404);
      res.end();
      return;
    }
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(result));
  });
  await new Promise((resolve) => mockServices.listen(0, '127.0.0.1', resolve));
  const serviceUrl = `http://127.0.0.1:${mockServices.address().port}`;
  repository = createMemoryBoardRepository();
  const app = createApp({
    repository,
    config: {
      port: 0,
      visionServiceUrl: serviceUrl,
      llmServiceUrl: serviceUrl,
      visionRequestTimeoutMs: 2000,
      llmRequestTimeoutMs: 2000,
      pipelineStepRetries: 1,
      maxUploadBytes: 1024 * 1024,
      corsOrigin: 'https://frontend.example,https://preview.example',
      mongodbUri: '',
      uploadDir,
    },
  });
  apiServer = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => apiServer.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${apiServer.address().port}`;
});

after(async () => {
  await Promise.all([
    new Promise((resolve) => apiServer.close(resolve)),
    new Promise((resolve) => mockServices.close(resolve)),
  ]);
  await fs.rm(uploadDir, { recursive: true, force: true });
});

async function waitForBoard(id) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const response = await fetch(`${baseUrl}/api/boards/${id}`);
    assert.equal(response.status, 200);
    const board = await response.json();
    if (board.status === 'done' || board.status === 'failed') return board;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error('Board processing did not finish within the test timeout');
}

test('image upload runs vision and language stages and serves board actions', async () => {
  const form = new FormData();
  form.append('image', new Blob(['raw image'], { type: 'image/png' }), 'board.png');
  const upload = await fetch(`${baseUrl}/api/boards`, { method: 'POST', body: form });
  assert.equal(upload.status, 202);
  const queuedBoard = await upload.json();
  assert.equal(queuedBoard.status, 'queued');
  assert.equal('file' in queuedBoard, false);

  const board = await waitForBoard(queuedBoard.id);
  assert.equal(board.status, 'done');
  assert.equal(board.quality, 0.9);
  assert.equal(board.regions[0].text, 'Start');
  assert.deepEqual(board.diagram, sampleDiagram);
  assert.deepEqual(board.notes, sampleNotes);
  assert.equal(board.quiz.length, 1);

  const quizResponse = await fetch(`${baseUrl}/api/boards/${board.id}/quiz`, { method: 'POST' });
  assert.equal(quizResponse.status, 200);
  assert.equal((await quizResponse.json())[0].q, 'Where do we start?');

  const chatResponse = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ boardId: board.id, query: 'Where?' }),
  });
  assert.deepEqual(await chatResponse.json(), { answer: 'The board says start.', source: 'Region r1' });

  const chatGetUrl = new URL('/api/chat', baseUrl);
  chatGetUrl.searchParams.set('boardId', board.id);
  chatGetUrl.searchParams.set('query', 'Where?');
  const chatGetResponse = await fetch(chatGetUrl);
  assert.equal(chatGetResponse.status, 200);
  assert.deepEqual(await chatGetResponse.json(), { answer: 'The board says start.', source: 'Region r1' });

  const exportResponse = await fetch(`${baseUrl}/api/boards/${board.id}/export?format=md`);
  assert.equal(exportResponse.status, 200);
  assert.match(await exportResponse.text(), /# Test board/);
});

test('health endpoint allows configured frontend origins', async () => {
  const response = await fetch(`${baseUrl}/api/health`, {
    headers: { Origin: 'https://frontend.example' },
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://frontend.example');
});

test('upload and lookup errors are explicit rather than demo successes', async () => {
  const upload = await fetch(`${baseUrl}/api/boards`, { method: 'POST', body: new FormData() });
  assert.equal(upload.status, 400);
  assert.equal((await upload.json()).error, 'An image is required in the "image" form field.');

  const unsupportedForm = new FormData();
  unsupportedForm.append('image', new Blob(['not image'], { type: 'text/plain' }), 'notes.txt');
  const unsupportedUpload = await fetch(`${baseUrl}/api/boards`, {
    method: 'POST',
    body: unsupportedForm,
  });
  assert.equal(unsupportedUpload.status, 415);

  const missingBoard = await fetch(`${baseUrl}/api/boards/not-a-board`);
  assert.equal(missingBoard.status, 404);
});

test('vision errors leave a failed job with the underlying error instead of sample results', async () => {
  rejectCleanRequest = true;
  const form = new FormData();
  form.append('image', new Blob(['bad image'], { type: 'image/png' }), 'broken.png');
  const upload = await fetch(`${baseUrl}/api/boards`, { method: 'POST', body: form });
  assert.equal(upload.status, 202);
  const queuedBoard = await upload.json();

  const board = await waitForBoard(queuedBoard.id);
  assert.equal(board.status, 'failed');
  assert.match(board.error, /Image could not be decoded/);
  assert.equal(board.processingMode, undefined);
  rejectCleanRequest = false;
});

test('quality gate rejects an unreadable image without running later stages', async () => {
  failQualityGate = true;
  const form = new FormData();
  form.append('image', new Blob(['blurry image'], { type: 'image/png' }), 'blurry.png');
  const upload = await fetch(`${baseUrl}/api/boards`, { method: 'POST', body: form });
  const queuedBoard = await upload.json();

  const board = await waitForBoard(queuedBoard.id);
  assert.equal(board.status, 'done');
  assert.equal(board.isQualityPass, false);
  assert.equal(board.quality, 0.2);
  assert.deepEqual(board.regions, []);
  assert.equal(board.notes, null);
  failQualityGate = false;
});
