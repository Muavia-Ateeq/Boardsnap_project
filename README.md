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
│   ├── main.py         # OpenCV cleanup, Roboflow detection, TrOCR & spatial graph builder
│   └── requirements.txt
│
├── llm/                # Grounded language & RAG services (Awais)
│   ├── main.py         # Strict note synthesis, quiz generation & vector chat
│   └── requirements.txt
│
├── dataset/            # Roboflow dataset downloader and download manifest
│   └── roboflow/       # Downloaded dataset exports (not committed)
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

The Node backend calls the vision service at `http://localhost:8000` by default.
Set `VISION_SERVICE_URL` if it is hosted elsewhere. To use hosted region
detection, set `ROBOFLOW_API_KEY` before starting the vision service; without a
key, its detect endpoint returns demo regions. Image uploads run through clean,
detect, OCR, and graph generation. If the vision service is unreachable or a
step fails, the backend returns the existing demo result with
`processingMode: "demo"` and a `pipelineWarning`.

### 4. Download an annotated whiteboard dataset

The downloader fetches two separate public Roboflow Universe datasets in YOLOv8
format, including their annotations and native train/valid/test splits:

- [Whiteboard](https://universe.roboflow.com/taerua/whiteboard-ctvgi), version
  1: 8,784 images, instance-segmentation classes `pen` and `whiteboard`.
- [Handwriting detection](https://universe.roboflow.com/handwriting-detection-zfowd/handwriting-detection-eoxpj),
  version 8: 361 images, object-detection class `handwriting`.

Both project pages list the dataset license as CC BY 4.0. Keep the source
attribution when using or redistributing the exports. These datasets detect
whiteboard regions and handwriting regions; the handwriting labels do not
provide transcribed text for OCR training.

In PowerShell, install the downloader dependency, set your Roboflow API key,
and run the downloader:

```powershell
pip install -r dataset\requirements.txt
$env:ROBOFLOW_API_KEY = "your-roboflow-api-key"
python dataset\download_samples.py
```

The exports are saved separately under `dataset\roboflow\whiteboard-v1` and
`dataset\roboflow\handwriting-v8`. `dataset\manifest.json` records the source,
license, and downloaded image counts. The API key is read from the environment
and is not written to the manifest. Use `--format` to select another export
format, `--output-dir` to choose a different destination root, or
`--overwrite` to replace existing exports.

---

## 📊 Evaluation & Benchmark Results
No quantitative results are claimed for the Roboflow exports yet. Evaluate each
task against its matching held-out split and report those measurements before
using them as benchmark results.

---

## 👥 Team Split & Credits
- **Moyeon**: Frontend Lead, UI/UX, Camera integration, Test Data curation & Demo Video.
- **Ammar**: Backend Lead, Pipeline Orchestrator, REST API, Deck & Submission lead.
- **Muavia**: Vision & ML Lead, OpenCV cleanup, PyTorch detector fine-tuning, Graph builder.
- **Awais**: Language & RAG Lead, Grounded prompt engineering, Quiz generation, Quality review.

---
*Created for Banana Hacks 2026. All code and datasets created during the hackathon period (Oct 9–12, 2026).*
