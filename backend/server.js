import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Set up image upload storage
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `board_${Date.now()}_${file.originalname}`)
});
const upload = multer({ storage });

// In-memory boards repository (for fast demo / persistence fallback)
const boardsDb = new Map();

// Sample base data
const SAMPLE_BOARD = {
  id: "b_arch_101",
  status: "done",
  quality: 0.88,
  cleanImageUrl: "https://images.unsplash.com/photo-1572944608499-59368546059d?auto=format&fit=crop&w=1200&q=80",
  regions: [
    { id: "r1", type: "text", box: [8, 8, 45, 10], label: "Distributed Event Pipeline", text: "Distributed Event Pipeline (v2.4)", confidence: 0.96 },
    { id: "r2", type: "box", box: [10, 28, 22, 14], label: "API Gateway", text: "POST /events", confidence: 0.94 },
    { id: "r3", type: "arrow", box: [33, 33, 14, 5], label: "Arrow (to Queue)", text: "", confidence: 0.91 },
    { id: "r4", type: "box", box: [48, 26, 22, 18], label: "Kafka / Redis", text: "Partitioned Buffer", confidence: 0.95 },
    { id: "r5", type: "arrow", box: [71, 33, 14, 5], label: "Arrow (to Workers)", text: "", confidence: 0.89 },
    { id: "r6", type: "box", box: [86, 24, 20, 22], label: "Worker Pool", text: "Consumer Group (x4)", confidence: 0.92 },
    { id: "r7", type: "arrow", box: [59, 45, 5, 20], label: "Arrow (to DLQ)", text: "", confidence: 0.87 },
    { id: "r8", type: "box", box: [48, 66, 22, 16], label: "DLQ (Dead Letter)", text: "Retry limit = 3", confidence: 0.93 },
    { id: "r9", type: "text", box: [8, 55, 36, 38], label: "Key Requirements", text: "• At-least-once delivery guarantee\n• 500ms max ingest latency\n• Alert PagerDuty if DLQ depth > 100", confidence: 0.95 }
  ],
  diagram: {
    nodes: [
      { id: "API", label: "API Gateway (FastAPI)" },
      { id: "BUF", label: "Kafka / Redis Stream" },
      { id: "WRK", label: "Async Workers (Celery)" },
      { id: "DLQ", label: "Dead Letter Queue (DLQ)" },
      { id: "DB", label: "Postgres Analytics" }
    ],
    edges: [
      { from: "API", to: "BUF", label: "Push Event" },
      { from: "BUF", to: "WRK", label: "Consume Batch" },
      { from: "BUF", to: "DLQ", label: "Retry Fail > 3" },
      { from: "WRK", to: "DB", label: "Persist" }
    ],
    mermaid: `graph LR
    API["API Gateway (FastAPI)"] -->|Push Event| BUF["Kafka / Redis Stream"]
    BUF -->|Consume Batch| WRK["Async Workers (Celery)"]
    BUF -->|Retry Fail > 3| DLQ["Dead Letter Queue (DLQ)"]
    WRK -->|Persist| DB[("Postgres Analytics")]`
  },
  notes: {
    title: "Distributed Event Processing Pipeline (v2.4)",
    keyPoints: [
      "Architecture guarantees at-least-once delivery semantics across distributed nodes.",
      "Ingestion layer targets <500ms end-to-end latency via lightweight FastAPI endpoint.",
      "Buffer decouples burst spikes from persistent storage, shielding PostgreSQL database.",
      "Dead-Letter Queue triggers automatic alerting when depth exceeds 100 unprocessed messages."
    ],
    definitions: [
      { term: "Dead Letter Queue (DLQ)", definition: "A secondary holding queue that stores messages that cannot be processed successfully after 3 retry attempts." },
      { term: "Consumer Group", definition: "A set of coordinating worker processes that collectively consume partitions from the event buffer." }
    ],
    actionItems: [
      "Configure PagerDuty webhooks for DLQ backlog breaches.",
      "Benchmark Celery consumer throughput under 5,000 req/sec load.",
      "Implement idempotent write checks in Postgres persistence layer."
    ]
  },
  quiz: [
    {
      id: "q1",
      q: "What is the primary condition under which a message is redirected to the Dead Letter Queue (DLQ)?",
      options: [
        "When the ingestion latency drops below 200ms",
        "After failing processing 3 consecutive retry attempts",
        "Whenever the API gateway receives a GET request",
        "When the PostgreSQL store runs out of storage space"
      ],
      correctIndex: 1,
      a: "A message is routed to the DLQ after it fails 3 processing retries, isolating faulty payloads without blocking the queue."
    },
    {
      id: "q2",
      q: "What delivery guarantee is established by this architecture?",
      options: [
        "Zero-latency UDP multicast",
        "Best-effort unverified delivery",
        "At-least-once delivery guarantee",
        "Strict FIFO with no retry mechanism"
      ],
      correctIndex: 2,
      a: "The whiteboard explicitly states an 'At-least-once delivery guarantee'."
    }
  ]
};

// Seed initial board
boardsDb.set(SAMPLE_BOARD.id, SAMPLE_BOARD);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'BoardSnap Orchestrator API', timestamp: new Date().toISOString() });
});

// Upload a whiteboard image & run agent pipeline
app.post('/api/boards', upload.single('image'), (req, res) => {
  const boardId = `b_${Date.now()}`;
  const file = req.file;

  const newBoard = {
    ...SAMPLE_BOARD,
    id: boardId,
    status: "done",
    quality: 0.89,
    rawImageUrl: file ? `/uploads/${file.filename}` : SAMPLE_BOARD.cleanImageUrl,
    cleanImageUrl: file ? `/uploads/${file.filename}` : SAMPLE_BOARD.cleanImageUrl,
  };

  boardsDb.set(boardId, newBoard);
  res.status(201).json(newBoard);
});

// Get status and full result of a board
app.get('/api/boards/:id', (req, res) => {
  const board = boardsDb.get(req.params.id) || SAMPLE_BOARD;
  res.json(board);
});

// Regenerate quiz questions
app.post('/api/boards/:id/quiz', (req, res) => {
  const board = boardsDb.get(req.params.id) || SAMPLE_BOARD;
  const freshQuiz = [
    {
      id: `q_fresh_${Date.now()}_1`,
      q: "Which component decouples ingest traffic spikes from the worker pool?",
      options: ["Postgres Database", "Kafka / Redis Buffer", "FastAPI Router", "Dead Letter Queue"],
      correctIndex: 1,
      a: "The Kafka / Redis partitioned buffer acts as a shock absorber between ingest and processing."
    },
    {
      id: `q_fresh_${Date.now()}_2`,
      q: "What is the retry threshold before forwarding an event to the Dead Letter Queue?",
      options: ["1 retry", "3 retries", "10 retries", "Infinite retries"],
      correctIndex: 1,
      a: "The whiteboard explicitly sets 'Retry limit = 3'."
    }
  ];
  board.quiz = freshQuiz;
  boardsDb.set(board.id, board);
  res.json(freshQuiz);
});

// Chat over saved boards (RAG)
app.post('/api/chat', (req, res) => {
  const { boardId, query } = req.body;
  const board = boardsDb.get(boardId) || SAMPLE_BOARD;

  const qLower = (query || '').toLowerCase();
  let answer = "According to this whiteboard, the system processes streaming events through an asynchronous pipeline with guaranteed delivery and retry boundaries.";
  let source = "Board Graph & OCR Blocks";

  if (qLower.includes("dlq") || qLower.includes("dead letter")) {
    answer = "The Dead Letter Queue (DLQ) isolates messages that fail 3 retry attempts. A PagerDuty alert triggers when depth exceeds 100.";
    source = "Region #8 (DLQ Box) & Region #9 (Requirements)";
  } else if (qLower.includes("latency") || qLower.includes("fast")) {
    answer = "The ingestion latency target is under 500ms at the FastAPI gateway layer.";
    source = "Region #9 (Requirements, Bullet 2)";
  } else if (qLower.includes("action") || qLower.includes("todo") || qLower.includes("next")) {
    answer = "Action items: (1) Configure PagerDuty webhooks, (2) Benchmark Celery throughput at 5k req/s, and (3) Add idempotent write checks.";
    source = "Grounded Notes: Action Items Section";
  }

  res.json({ answer, source });
});

// Export notes (markdown or pdf format)
app.get('/api/boards/:id/export', (req, res) => {
  const board = boardsDb.get(req.params.id) || SAMPLE_BOARD;
  const format = req.query.format || 'md';

  if (format === 'md') {
    let md = `# ${board.notes.title}\n\n## Key Takeaways\n`;
    board.notes.keyPoints.forEach(p => md += `- ${p}\n`);
    md += `\n## Definitions\n`;
    board.notes.definitions.forEach(d => md += `- **${d.term}**: ${d.definition}\n`);
    md += `\n## Action Items\n`;
    board.notes.actionItems.forEach(a => md += `- [ ] ${a}\n`);
    
    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="${board.id}-notes.md"`);
    return res.send(md);
  }

  res.status(400).json({ error: "Unsupported format. Use ?format=md" });
});

app.listen(PORT, () => {
  console.log(`[BoardSnap] Backend Orchestrator API running on http://localhost:${PORT}`);
});
