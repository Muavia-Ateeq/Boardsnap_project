import { sampleBoards } from '../data/sampleBoards';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');
const BOARD_POLL_INTERVAL_MS = 1000;
const BOARD_PROCESSING_TIMEOUT_MS = 10 * 60 * 1000;

export function resolveApiAssetUrl(assetUrl) {
  if (typeof assetUrl !== 'string' || !assetUrl.startsWith('/uploads/')) {
    return assetUrl;
  }

  try {
    const apiOrigin = new URL(API_BASE, window.location.origin).origin;
    return new URL(assetUrl, apiOrigin).toString();
  } catch {
    return assetUrl;
  }
}

function createAbortSignal(timeoutMs) {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(timeoutMs);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  controller.signal.addEventListener('abort', () => clearTimeout(timeoutId), { once: true });
  return controller.signal;
}

export const apiService = {
  // Check if live backend server is reachable
  async checkBackendHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`, { method: 'GET', signal: createAbortSignal(2000) });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Upload whiteboard image
  async uploadBoard(fileOrSampleId, onProgress) {
    // If it's a sample ID string
    if (typeof fileOrSampleId === 'string') {
      const found = sampleBoards.find(b => b.id === fileOrSampleId);
      if (found) {
        return this.simulateProcessing(found, onProgress);
      }
    }

    // Try live API first if it's a file
    let response;
    try {
      const formData = new FormData();
      formData.append('image', fileOrSampleId);

      response = await fetch(`${API_BASE}/boards`, {
        method: 'POST',
        body: formData,
      });
    } catch (e) {
      console.warn("Live backend unreachable, falling back to client-side pipeline simulation:", e);
      if (!import.meta.env.DEV) {
        throw new Error(`Could not reach the BoardSnap API: ${e.message}`);
      }
    }

    if (response) {
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || error.error || `Board upload failed (${response.status}).`);
      }

      let board = await response.json();
      const deadline = Date.now() + BOARD_PROCESSING_TIMEOUT_MS;
      while (board.status === 'queued' || board.status === 'processing') {
        if (board.progress && onProgress) onProgress(board.progress);
        if (Date.now() >= deadline) {
          throw new Error('Board processing timed out. Please try again.');
        }
        await new Promise(resolve => setTimeout(resolve, BOARD_POLL_INTERVAL_MS));
        const statusResponse = await fetch(`${API_BASE}/boards/${encodeURIComponent(board.id)}`);
        if (!statusResponse.ok) {
          const error = await statusResponse.json().catch(() => ({}));
          throw new Error(error.error || `Could not retrieve board status (${statusResponse.status}).`);
        }
        board = await statusResponse.json();
      }
      if (board.status === 'failed') {
        throw new Error(board.error || 'Board processing failed. Please try again.');
      }
      return board;
    }

    if (!import.meta.env.DEV) {
      throw new Error('The BoardSnap API is unavailable. Please try again later.');
    }

    // Fallback: Client-side image processing simulation
    const simulatedBoard = {
      ...sampleBoards[0],
      id: `b_${Date.now()}`,
      name: fileOrSampleId.name || "Uploaded Whiteboard",
      rawImageUrl: URL.createObjectURL(fileOrSampleId),
      cleanImageUrl: URL.createObjectURL(fileOrSampleId),
    };

    return this.simulateProcessing(simulatedBoard, onProgress);
  },

  // Simulate pipeline steps with realistic delay and updates
  async simulateProcessing(boardData, onProgress) {
    const steps = [
      { step: 1, title: "Perspective Rectification & Glare Suppression", detail: "Running OpenCV warpPerspective + Bilateral Glare Filter...", time: 600 },
      { step: 2, title: "Quality Gate Evaluation", detail: `Evaluating sharpness & contrast... Score: ${(boardData.quality * 100).toFixed(0)}%`, time: 500 },
      { step: 3, title: "Region & Shape Detection", detail: "PyTorch detector identifying text blocks, boxes, and arrows...", time: 700 },
      { step: 4, title: "Handwriting OCR & Context Correction", detail: "Reading handwritten tokens and applying lexical disambiguation...", time: 800 },
      { step: 5, title: "Graph Construction & Mermaid Synthesis", detail: "Linking directional arrows with bounding boxes to build flowchart graph...", time: 600 },
      { step: 6, title: "Structured Study Guide Generation", detail: "Grounded LLM structuring summary, definitions, action items & quiz...", time: 700 }
    ];

    for (let i = 0; i < steps.length; i++) {
      if (onProgress) {
        onProgress({
          currentStep: i + 1,
          totalSteps: steps.length,
          stepInfo: steps[i],
          boardId: boardData.id
        });
      }
      await new Promise(r => setTimeout(r, steps[i].time));

      // If board is rejected at quality gate (Step 2)
      if (i === 1 && !boardData.isQualityPass) {
        return boardData;
      }
    }

    return boardData;
  },

  // Regenerate Quiz
  async regenerateQuiz(boardId) {
    let response;
    if (!sampleBoards.some(board => board.id === boardId)) {
      try {
        response = await fetch(`${API_BASE}/boards/${encodeURIComponent(boardId)}/quiz`, { method: 'POST' });
      } catch (error) {
        // Use sample data only when the API cannot be reached.
        if (!import.meta.env.DEV) {
          throw new Error(`Could not reach the BoardSnap API: ${error.message}`);
        }
      }
    }
    if (response) {
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || error.error || `Quiz generation failed (${response.status}).`);
      }
      return response.json();
    }
    const board = sampleBoards.find(b => b.id === boardId) || sampleBoards[0];
    return board.quiz;
  },

  // Chat over saved boards
  async chatWithBoard(boardId, query) {
    let response;
    if (!sampleBoards.some(board => board.id === boardId)) {
      try {
        response = await fetch(`${API_BASE}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ boardId, query })
        });
      } catch (error) {
        // Use sample data only when the API cannot be reached.
        if (!import.meta.env.DEV) {
          throw new Error(`Could not reach the BoardSnap API: ${error.message}`);
        }
      }
    }
    if (response) {
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || error.error || `Board chat failed (${response.status}).`);
      }
      return response.json();
    }

    // Client-side grounded answering based on query
    const lower = query.toLowerCase();
    if (lower.includes("dlq") || lower.includes("dead letter")) {
      return {
        answer: "According to the whiteboard architecture, the Dead Letter Queue (DLQ) stores events that fail after 3 retry attempts. A PagerDuty alert is automatically triggered if the DLQ depth exceeds 100 messages.",
        source: "Whiteboard Region #8 (DLQ Box) & Region #9 (Notes bullet #3)"
      };
    }
    if (lower.includes("latency") || lower.includes("speed")) {
      return {
        answer: "The whiteboard specifies an ingestion latency target of under 500ms for the FastAPI gateway component.",
        source: "Whiteboard Region #9 (Key Requirements, Bullet 2)"
      };
    }
    if (lower.includes("db") || lower.includes("database") || lower.includes("postgres")) {
      return {
        answer: "The worker pool writes processed events to the 'Postgres Analytics Store' after consumption from the buffer.",
        source: "Whiteboard Diagram Node 'DB' and Edge from Worker Pool"
      };
    }
    return {
      answer: `Based strictly on the content extracted from this board: The diagram describes an event-driven system with FastAPI ingestion, a partitioned buffer, asynchronous workers, and error recovery. All notes are verified against detected handwriting regions.`,
      source: "Extracted Whiteboard Graph & OCR Text"
    };
  }
};
