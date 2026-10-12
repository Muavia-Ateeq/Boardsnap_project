// Illustrative demo boards for exploring the interface; these are not benchmark data.

export const sampleBoards = [
  {
    id: "b_arch_101",
    name: "System Architecture: Distributed Queue",
    category: "Architecture & Flowchart",
    description: "CS class whiteboard with microservice architecture flowchart and bullet notes",
    quality: 0.88,
    isQualityPass: true,
     rawImageUrl: "https://images.unsplash.com/photo-1769731738826-a51acd5bddc7?auto=format&fit=crop&w=1200&q=80",
    cleanImageUrl: "https://images.unsplash.com/photo-1769731738826-a51acd5bddc7?auto=format&fit=crop&w=1200&q=80",
    metrics: {
      perspectiveCorrection: "Rectified (-14° skew)",
      contrastBoost: "+42%",
      glareSuppressed: "High (Specular filter)",
      textConfidence: "94.2%",
      diagramNodesDetected: 5,
      diagramEdgesDetected: 5
    },
    regions: [
      { id: "r1", type: "text", box: [8, 8, 45, 10], label: "Distributed Event Pipeline", text: "Distributed Event Pipeline (v2.4)", confidence: 0.96 },
      { id: "r2", type: "box", box: [10, 28, 22, 14], label: "API Gateway", text: "POST /events", confidence: 0.94 },
      { id: "r3", type: "arrow", box: [33, 33, 14, 5], label: "Arrow (to Queue)", text: "", confidence: 0.91 },
      { id: "r4", type: "box", box: [48, 26, 22, 18], label: "Kafka / Redis", text: "Partitioned Buffer", confidence: 0.95 },
      { id: "r5", type: "arrow", box: [71, 33, 14, 5], label: "Arrow (to Workers)", text: "", confidence: 0.89 },
      { id: "r6", type: "box", box: [86, 24, 20, 22], label: "Worker Pool", text: "Consumer Group (x4)", confidence: 0.92 },
      { id: "r7", type: "arrow", box: [59, 45, 5, 20], label: "Arrow (to Dead Letter)", text: "", confidence: 0.87 },
      { id: "r8", type: "box", box: [48, 66, 22, 16], label: "DLQ (Dead Letter)", text: "Retry limit = 3", confidence: 0.93 },
      { id: "r9", type: "text", box: [8, 55, 36, 38], label: "Key Requirements", text: "• At-least-once delivery guarantee\n• 500ms max ingest latency\n• Alert PagerDuty if DLQ depth > 100", confidence: 0.95 }
    ],
    diagram: {
      nodes: [
        { id: "API", label: "API Gateway (FastAPI)" },
        { id: "BUF", label: "Kafka / Redis Stream" },
        { id: "WRK", label: "Async Workers (Python Celery)" },
        { id: "DLQ", label: "Dead Letter Queue (DLQ)" },
        { id: "DB", label: "Postgres Analytics Store" }
      ],
      edges: [
        { from: "API", to: "BUF", label: "Push Event" },
        { from: "BUF", to: "WRK", label: "Consume Batch" },
        { from: "BUF", to: "DLQ", label: "Failed after 3 retries" },
        { from: "WRK", to: "DB", label: "Write Processed" }
      ],
      mermaid: `graph LR
    API["API Gateway (FastAPI)"] -->|Push Event| BUF["Kafka / Redis Stream"]
    BUF -->|Consume Batch| WRK["Async Workers (Celery)"]
    BUF -->|Retry Fail > 3| DLQ["Dead Letter Queue (DLQ)"]
    WRK -->|Persist| DB[("Postgres Analytics")]
    
    style API fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0f172a
    style BUF fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#0f172a
    style WRK fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#0f172a
    style DLQ fill:#fee2e2,stroke:#dc2626,stroke-width:2px,color:#0f172a
    style DB fill:#f3e8ff,stroke:#7c3aed,stroke-width:2px,color:#0f172a`
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
      },
      {
        id: "q3",
        q: "What threshold triggers a PagerDuty alert according to the whiteboard notes?",
        options: [
          "DLQ depth > 100 messages",
          "API latency > 10 seconds",
          "Worker pool size < 2 nodes",
          "Database connection pool exhausted"
        ],
        correctIndex: 0,
        a: "The board specifies: 'Alert PagerDuty if DLQ depth > 100'."
      }
    ],
    chatContext: [
      { role: "assistant", content: "I've ingested your 'Distributed Event Processing Pipeline' whiteboard. Ask me any questions about the components, retry limits, or action items!" }
    ]
  },
  {
    id: "b_ml_102",
    name: "ML Training & Eval Lifecycle",
    category: "Machine Learning / Data",
    description: "Data validation, model training, evaluation gate, and artifact registry flow",
    quality: 0.91,
    isQualityPass: true,
    rawImageUrl: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=80",
    cleanImageUrl: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=80",
    metrics: {
      perspectiveCorrection: "Rectified (-8° skew)",
      contrastBoost: "+38%",
      glareSuppressed: "Medium",
      textConfidence: "96.1%",
      diagramNodesDetected: 4,
      diagramEdgesDetected: 4
    },
    regions: [
      { id: "r1", type: "text", box: [10, 8, 40, 10], label: "ML Pipeline Spec", text: "Model CI/CD Gateways", confidence: 0.97 },
      { id: "r2", type: "box", box: [8, 30, 20, 15], label: "Data Validation", text: "Great Expectations", confidence: 0.93 },
      { id: "r3", type: "arrow", box: [29, 36, 12, 4], label: "Arrow", text: "", confidence: 0.91 },
      { id: "r4", type: "box", box: [42, 28, 22, 18], label: "Training Node", text: "PyTorch Lightning", confidence: 0.95 },
      { id: "r5", type: "arrow", box: [65, 36, 12, 4], label: "Arrow", text: "", confidence: 0.90 },
      { id: "r6", type: "box", box: [78, 28, 18, 18], label: "Eval Gate", text: "F1 > 0.85 & Latency < 40ms", confidence: 0.94 }
    ],
    diagram: {
      nodes: [
        { id: "DAT", label: "Raw Dataset (S3)" },
        { id: "VAL", label: "Schema & Drift Check" },
        { id: "TRN", label: "PyTorch Lightning Training" },
        { id: "GATE", label: "Quality Gate (F1 >= 0.85)" },
        { id: "REG", label: "Model Registry (HuggingFace)" }
      ],
      edges: [
        { from: "DAT", to: "VAL", label: "Batch Load" },
        { from: "VAL", to: "TRN", label: "Passed Schema" },
        { from: "TRN", to: "GATE", label: "Checkpoint" },
        { from: "GATE", to: "REG", label: "Approved (F1 > 0.85)" }
      ],
      mermaid: `graph LR
    DAT[("Raw Dataset (S3)")] -->|Validate| VAL["Schema & Drift Validation"]
    VAL -->|Clean Split| TRN["PyTorch Lightning Trainer"]
    TRN -->|Weights| GATE{"Eval Gate: F1 >= 0.85"}
    GATE -->|Pass| REG["Model Registry"]
    GATE -->|Fail| ALERT["Send Slack Warning"]

    style DAT fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0f172a
    style VAL fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#0f172a
    style TRN fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#0f172a
    style GATE fill:#fbcfe8,stroke:#db2777,stroke-width:2px,color:#0f172a
    style REG fill:#f3e8ff,stroke:#7c3aed,stroke-width:2px,color:#0f172a`
    },
    notes: {
      title: "Machine Learning Production Pipeline Gates",
      keyPoints: [
        "Strict gating prevents regression in automated retraining loops.",
        "Datasets are checked against baseline drift thresholds prior to compute allocation.",
        "Evaluation gate mandates minimum F1 score of 0.85 and inference latency under 40ms."
      ],
      definitions: [
        { term: "Drift Validation", definition: "Statistical comparison of incoming feature distributions against training baseline to detect covariate shift." },
        { term: "Eval Gate", definition: "Automated threshold check that halts deployment if candidate metrics do not meet predefined SLA." }
      ],
      actionItems: [
        "Export baseline drift distributions from validation set.",
        "Set up HuggingFace Model Registry webhook for deployment triggers."
      ]
    },
    quiz: [
      {
        id: "q1",
        q: "What is the minimum required F1 score at the evaluation gate?",
        options: [
          "F1 >= 0.70",
          "F1 >= 0.85",
          "F1 >= 0.95",
          "F1 >= 0.99"
        ],
        correctIndex: 1,
        a: "The gate requires an F1 score >= 0.85 and inference latency < 40ms."
      }
    ],
    chatContext: [
      { role: "assistant", content: "I've ingested your ML Training Pipeline notes. Ask me about drift validation or model gating!" }
    ]
  },
  {
    id: "b_bad_103",
    name: "Dark / Extreme Glare Whiteboard (Quality Reject)",
    category: "Edge Case & Rejection Test",
    description: "Intentionally blurry whiteboard photo with extreme specular flash reflection to test rejection flow",
    quality: 0.32,
    isQualityPass: false,
    rawImageUrl: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80",
    cleanImageUrl: null,
    metrics: {
      perspectiveCorrection: "Failed (Corner confidence < 40%)",
      contrastBoost: "Insufficient",
      glareSuppressed: "Failed (Specular blowout > 45% of surface)",
      textConfidence: "28.4%",
      diagramNodesDetected: 0,
      diagramEdgesDetected: 0
    },
    rejectionReason: "Quality check failed: Image is too dark with high specular glare covering center text. Contrast ratio is 1.4:1 (minimum 3.0:1 required).",
    suggestedFix: "Please retake the photo: stand directly in front of the board, avoid flashlight glare, and ensure overhead room lighting is turned on.",
    regions: [],
    diagram: null,
    notes: null,
    quiz: null
  }
];
