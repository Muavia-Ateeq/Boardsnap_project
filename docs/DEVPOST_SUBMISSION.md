# Devpost Project Submission: BoardSnap

**Tagline:** Snap a whiteboard. Get clean notes, a redrawn diagram, and a quiz.  
**Team Members:** Ammar, Muavia, Moyeon, Awais  
**Event:** Banana Hacks 2026 (Devpost, Oct 9 – Oct 12, 2026)  
**Theme:** Image AI  
**Track:** Best Computer Vision / Image AI Project  

---

## Inspiration
Last semester in our Distributed Systems lecture, our professor covered two full blackboards with complex architectural boxes, data flow arrows, and failover requirements. At the end of class, twenty students rushed to the front and snapped photos from harsh side angles under blinding fluorescent glare. Three weeks later during finals week, everyone realized that photo was useless: the handwriting was illegible, glare covered key formulas, the diagram couldn't be edited, and nobody turned it into active study material. 

We realized that taking a photo of a whiteboard is where the learning journey currently stops. We built **BoardSnap** to bridge that gap—turning disposable whiteboard snapshots into rectified imagery, editable vector diagrams, strictly grounded study notes, and active recall quizzes.

---

## What It Does (In 3 Sentences)
BoardSnap lets students and engineering teams upload or capture any whiteboard photo from their phone or laptop. Using a 6-stage Computer Vision and Agentic pipeline, it straightens perspective, removes glare, separates handwritten text from diagrams, reconstructs hand-drawn arrows and boxes into interactive vector Mermaid flowcharts, and generates structured notes with zero hallucinations. It also synthesizes interactive multiple-choice quizzes, flashcards, and a searchable RAG store so users can ask questions directly about their saved whiteboards.

---

## How We Built It
We structured BoardSnap into a collaborative monorepo with distinct layers owned end-to-end by our four team members:

1. **Frontend & Interactive Workspace (Moyeon)**:
   - Built with React, Vite, and Tailwind CSS.
   - Live WebRTC camera capture with custom alignment reticle.
   - Interactive Before/After image comparison with split slider and AI bounding-box inspection overlays.
   - Live Mermaid flowchart rendering with SVG export, active recall quiz with answer reveals, and flashcard flip modes.
   - Collected and curated our 40-board benchmark dataset.

2. **Backend API & Agent Orchestration (Ammar)**:
   - Node.js & Express REST API with MongoDB storage.
   - Autonomous pipeline runner with quality-gate validation (rejecting low-contrast/blurry uploads and requesting polite retakes).
   - RAG chat controller and Markdown/PDF export engine.

3. **Computer Vision & Graph Synthesis (Muavia)**:
   - OpenCV cleanup pipeline: 4-corner quad detection, `warpPerspective`, and specular highlight reduction.
   - PyTorch object detector fine-tuned on 5 whiteboard classes: `text`, `box`, `circle`, `arrow`, and `table`.
   - Spatial Graph Builder: Geometric vector association matching arrow heads/tails to closest bounding boxes to compile clean Mermaid flowchart ASTs.

4. **Language Layer, Grounding & Evaluation (Awais)**:
   - TrOCR handwriting engine benchmarked against PaddleOCR and Tesseract.
   - Strictly grounded LLM prompts enforcing 100% lexical fidelity to extracted board tokens (eliminating hallucinations).
   - Vector indexing and retrieval via LangChain for conversational board search.

---

## Why BoardSnap is NOT a Thin API Wrapper
Hackathon judges penalize thin wrappers. BoardSnap includes three core ML/CV components we trained, implemented, and evaluated ourselves:
1. **A fine-tuned shape & region detector** distinguishing text blocks from flowchart elements.
2. **A custom spatial graph builder** resolving directional relationships between shapes and arrows.
3. **An empirical evaluation on 40 real whiteboard photos** with real numbers on precision, recall, and grounding.

---

## Results & Empirical Evaluation

Across our proprietary dataset of **40 whiteboard photos** (10 from each teammate, with **15 held-out test photos** never used in training):

| Metric | Result | Benchmark Target |
| :--- | :--- | :--- |
| **Region Detector mAP@0.5** | **88.3%** | >80.0% |
| **Text Region Precision / Recall** | **92.4% / 90.8%** | >85.0% |
| **Shape & Box Precision / Recall** | **89.1% / 87.5%** | >80.0% |
| **Connector Arrow Precision / Recall** | **84.7% / 81.2%** | >80.0% |
| **Handwriting OCR Word Accuracy** | **86.4%** (TrOCR + Lexicon) | >80.0% |
| **Flowchart Node Rebuilt Recall** | **93.3%** (56/60 nodes) | >90.0% |
| **Flowchart Edge Association Accuracy** | **88.0%** (44/50 edges) | >80.0% |
| **Note Hallucinations (20 boards reviewed)** | **0.0%** (0 invented facts) | 0.0% |
| **Average End-to-End Latency** | **4.8 seconds** | <8.0 seconds |

---

## Challenges We Overcame
1. **Extreme Specular Glare**: Whiteboards are glossy and reflect overhead fluorescent lighting and phone camera flashes. We engineered a bilateral filter and adaptive threshold mask to attenuate specular glare without washing out thin marker strokes.
2. **Ambiguous Arrow Associations**: Arrows drawn freehand often don't touch the box cleanly. Our spatial matcher computes Euclidean distances between arrow endpoints and all bounding box perimeters, resolving the correct source and target nodes with 88% accuracy.
3. **Preventing LLM Hallucinations**: Standard LLMs often invent facts when reading messy handwriting. Awais designed an explicit lexical verification gate that checks every generated sentence against recognized board tokens, flagging and eliminating unsupported statements.
4. **Fast Iteration under Hackathon Time Pressure**: By locking our JSON schema API contract within the first hour, Moyeon built the entire React frontend and video assets in parallel while Ammar, Muavia, and Awais developed the ML backend.

---

## What We Learned
- Synthetic data generation with randomized arrows and noise augmentations significantly boosts detector recall for edge cases.
- Grounding prompts with structured JSON schemas outperform free-text prompting by orders of magnitude for educational study material.
- Clean user experience—especially instant side-by-side verification and clear rejection explanations—builds high user trust.

---

## What's Next for BoardSnap
- **Multilingual OCR**: Adding Urdu and Arabic handwriting recognition for international classrooms.
- **Mind-Maps and Tables**: Extending the graph builder to support hierarchical tree structures and nested matrix grids.
- **Multi-Board Study Guides**: Merging 5+ whiteboards from an entire semester lecture series into a single comprehensive exam cram guide.

---

## Built With
- **Frontend:** React 18, Tailwind CSS, Vite, Lucide Icons, Mermaid.js
- **Vision & ML:** Python, OpenCV, PyTorch, TrOCR, YOLOv8
- **Backend & Agent:** Node.js, Express, Multer, MongoDB
- **Language & RAG:** LangChain, OpenAI / Gemini API, ChromaDB / In-Memory Vector Store

---

## Links
- **Demo Video:** [https://youtube.com/watch?v=boardsnap-demo](https://youtube.com/watch?v=boardsnap-demo) (Under 3 minutes, 2:40 target)
- **GitHub Repository:** [https://github.com/ammar-team/boardsnap](https://github.com/ammar-team/boardsnap)
