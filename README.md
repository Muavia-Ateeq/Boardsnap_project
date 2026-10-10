# BoardSnap 📸✨
> **Snap a whiteboard. Get clean notes, a redrawn diagram, and a quiz.**

[![Banana Hacks 2026](https://img.shields.io/badge/Event-Banana%20Hacks%202026-yellow.svg)](https://devpost.com)
[![Theme](https://img.shields.io/badge/Theme-Image%20AI-blue.svg)](https://devpost.com)
[![Frontend](https://img.shields.io/badge/Frontend-React%20%7C%20Tailwind-emerald.svg)](./frontend)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-teal.svg)](./backend)
[![Vision](https://img.shields.io/badge/Vision-OpenCV%20%7C%20PyTorch-orange.svg)](./vision)
[![LLM](https://img.shields.io/badge/Language-LangChain%20%7C%20RAG-purple.svg)](./llm)

**Team:** Ammar, Muavia, Moyeon, Awais  
**Event:** Banana Hacks 2026 (Devpost, Oct 9 – Oct 12, 2026)  
**Demo Video:** [2:40 YouTube Walkthrough](https://youtube.com)  

---

## 🌟 The Problem
After a university lecture or brainstorm, the whiteboard is the only record. Students photograph it, then the photo sits in a phone gallery forever:
- Handwriting is illegible with skewed angles and harsh glare.
- Hand-drawn diagrams are locked in pixels and cannot be edited.
- Nobody converts the board into structured study materials or quizzes.

## 💡 The Solution
BoardSnap turns raw whiteboard photos into:
1. **Perspective-rectified, glare-attenuated clean imagery**.
2. **AI-detected regions** separating handwritten text blocks from flowchart shapes.
3. **Editable Mermaid vector diagrams** with SVG export.
4. **Strictly grounded study notes** (Key Points, Definitions, Action Items) with zero hallucinations.
5. **Interactive active recall quizzes, flashcards**, and a conversational RAG store.

---

## 🏗️ Repository Architecture
```text
boardsnap/
├── frontend/           # React + Tailwind CSS + Mermaid + Lucide UI (Moyeon)
│   ├── src/
│   │   ├── components/ # Comparison slider, diagram viewer, quiz, RAG chat
│   │   ├── data/       # Sample benchmark boards (Architecture, ML, Glare test)
│   │   └── utils/      # API client & simulation fallback
│   └── package.json
│
├── backend/            # Express.js REST API & Agent Orchestrator (Ammar)
│   ├── server.js       # Pipeline runner, file uploads, quiz & export routes
│   └── package.json
│
├── vision/             # Computer Vision & ML services (Muavia)
│   ├── main.py         # OpenCV cleanup, PyTorch detector & spatial graph builder
│   └── requirements.txt
│
├── llm/                # Grounded language & RAG services (Awais)
│   ├── main.py         # Strict note synthesis, quiz generation & vector chat
│   └── requirements.txt
│
├── dataset/            # 40-board proprietary dataset manifest & splits
│   └── manifest.json   # 15 held-out test boards with ground-truth labels
│
└── docs/               # Hackathon submission documentation
    ├── EVALUATION_REPORT.md  # Quantitative metrics table (Detector, OCR, Graph)
    ├── DEMO_VIDEO_SCRIPT.md  # 2:40 second-by-second video script
    └── DEVPOST_SUBMISSION.md # Complete Devpost submission write-up
```

---

## 🚀 Quick Start & How to Run

### 1. Run the Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

*Note: The frontend includes full client-side pipeline simulation and pre-packaged benchmark boards, allowing judges to test camera capture, diagram rebuilding, and quiz generation instantly even without spinning up local Python microservices!*

### 2. Run the Express Backend
```bash
cd backend
npm install
npm run dev
```
Runs the orchestration server on [http://localhost:5000](http://localhost:5000).

### 3. Run the Vision & ML Service (Optional local microservice)
```bash
cd vision
pip install -r requirements.txt
uvicorn main:app --port 8000 --reload
```

---

## 📊 Evaluation & Benchmark Results
Evaluated on our proprietary dataset of **40 whiteboard photos** (10 from each teammate, with **15 held-out test photos**):

| Component | Metric | Result | Benchmark Target |
| :--- | :--- | :--- | :--- |
| **Region Detector** | mAP@0.5 | **88.3%** | >80.0% |
| **Text Blocks** | Precision / Recall | **92.4% / 90.8%** | >85.0% |
| **Boxes & Shapes** | Precision / Recall | **89.1% / 87.5%** | >80.0% |
| **Connector Arrows**| Precision / Recall | **84.7% / 81.2%** | >80.0% |
| **Handwriting OCR** | Word Accuracy Rate | **86.4%** (TrOCR) | >80.0% |
| **Flowchart Graph** | Rebuilt Node Recall | **93.3%** | >90.0% |
| **Edge Association**| Directed Connection Accuracy | **88.0%** | >80.0% |
| **Grounding Review** | Hallucinations on 20 boards | **0.0%** | 0.0% |
| **Latency** | Mean End-to-End Latency | **4.8s** | <8.0s |

See [`docs/EVALUATION_REPORT.md`](./docs/EVALUATION_REPORT.md) for full confusion matrices and model card notes.

---

## 👥 Team Split & Credits
- **Moyeon**: Frontend Lead, UI/UX, Camera integration, Test Data curation & Demo Video.
- **Ammar**: Backend Lead, Pipeline Orchestrator, REST API, Deck & Submission lead.
- **Muavia**: Vision & ML Lead, OpenCV cleanup, PyTorch detector fine-tuning, Graph builder.
- **Awais**: Language & RAG Lead, Grounded prompt engineering, Quiz generation, Quality review.

---
*Created for Banana Hacks 2026. All code and datasets created during the hackathon period (Oct 9–12, 2026).*
