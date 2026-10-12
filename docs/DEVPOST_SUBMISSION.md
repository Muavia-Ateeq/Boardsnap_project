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
BoardSnap lets students and engineering teams upload or capture a whiteboard photo from their phone or laptop. Its six-stage pipeline cleans and scores the image, calls configured hosted vision/OCR workflows, builds a heuristic Mermaid diagram, and asks a configurable LLM provider to draft notes and quiz questions from the extracted board content. Users can also ask questions using the current board as context.

---

## How We Built It
We structured BoardSnap into a collaborative monorepo with distinct layers owned end-to-end by our four team members:

1. **Frontend & Interactive Workspace (Moyeon)**:
   - Built with React, Vite, and Tailwind CSS.
   - Live WebRTC camera capture with custom alignment reticle.
   - Interactive Before/After image comparison with split slider and AI bounding-box inspection overlays.
   - Live Mermaid flowchart rendering with SVG export, active recall quiz with answer reveals, and flashcard flip modes.
   - Includes illustrative sample boards for exploring the interface; these are not evaluation data.

2. **Backend API & Agent Orchestration (Ammar)**:
   - Node.js & Express REST API with MongoDB storage.
   - Pipeline runner with a sharpness-based quality gate and asynchronous job status.
   - Board-context chat controller and Markdown export.

3. **Computer Vision & Graph Synthesis (Muavia)**:
   - OpenCV cleanup pipeline: 4-corner quad detection, `warpPerspective`, and specular highlight reduction.
   - Integrates a configurable hosted Roboflow detection workflow; this repository does not include project-trained detector weights.
   - Spatial heuristics associate arrows and shapes; full-board OCR transcripts are currently represented as sequential Mermaid nodes.

4. **Language Layer, Grounding & Evaluation (Awais)**:
   - Integrates a configurable hosted OCR workflow with an EasyOCR fallback; TrOCR is used by a standalone benchmark helper, not the live OCR route.
   - Prompts the selected LLM provider to use supplied board evidence; outputs can still be incorrect and should be reviewed.
   - Chat receives the current board context directly; vector-database retrieval is not implemented.

---

## Current Evaluation Status
The repository does not currently contain a project-trained detector, a labeled
end-to-end evaluation set, or reproducible evidence for model accuracy,
hallucination rate, or end-to-end latency. The sample boards are illustrative
demo content and are not model predictions or benchmark data. No quantitative
performance results are claimed. See [the evaluation status](./EVALUATION_REPORT.md)
for the implemented pipeline and requirements for future measurements.

---

## Challenges We Overcame
1. **Multi-service integration**: The app coordinates a browser frontend, an Express API, vision endpoints, and a language-model provider.
2. **Image quality and OCR variability**: Blur, glare, handwriting, and third-party workflow configuration can affect results. The app exposes a quality check, but it is a heuristic rather than a measured OCR-confidence score.
3. **Diagram reconstruction**: Spatial association is heuristic; full-board transcript lines currently become sequential nodes rather than a verified reconstruction of every drawn relationship.

---

## What We Learned
- Keeping service boundaries explicit makes the pipeline easier to configure and test.
- Structured JSON prompts simplify integrating language-model responses with the user interface.
- Generated notes and chat answers need user review; grounding instructions alone do not prove factual accuracy.

---

## What's Next for BoardSnap
- **Multilingual OCR**: Adding Urdu and Arabic handwriting recognition for international classrooms.
- **Mind-Maps and Tables**: Extending the graph builder to support hierarchical tree structures and nested matrix grids.
- **Multi-Board Study Guides**: Merging 5+ whiteboards from an entire semester lecture series into a single comprehensive exam cram guide.

---

## Built With
- **Frontend:** React 18, Tailwind CSS, Vite, Lucide Icons, Mermaid.js
- **Vision & ML:** Python, OpenCV, EasyOCR, configurable Roboflow workflows; TrOCR benchmark helper
- **Backend & Agent:** Node.js, Express, Multer, MongoDB
- **Language:** Gemini, xAI Grok, or Groq API through a configurable provider

---

## Links
- **Demo Video:** [https://youtube.com/watch?v=boardsnap-demo](https://youtube.com/watch?v=boardsnap-demo) (Under 3 minutes, 2:40 target)
- **GitHub Repository:** [https://github.com/Muavia-Ateeq/Boardsnap_project](https://github.com/Muavia-Ateeq/Boardsnap_project)
