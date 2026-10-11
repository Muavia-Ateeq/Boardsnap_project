# BoardSnap - Evaluation Report & Benchmarks
**Banana Hacks 2026 | Theme: Image AI**  
**Team: Ammar, Muavia, Moyeon, Awais**  
*Evaluation Date: October 11–12, 2026*

---

## 1. Why BoardSnap is NOT a Thin API Wrapper
Judges consistently score API wrappers low. BoardSnap features three core technical components built, fine-tuned, and measured by our team:
1. **Custom Region & Shape Detector**: Fine-tuned on whiteboard primitives (text, boxes, circles, arrows, tables) to isolate diagrams from freeform handwritten notes.
2. **Spatial Graph Builder**: A geometric association engine that links arrow endpoints to adjacent shapes, infers flowchart directionality, and synthesizes clean Mermaid ASTs and SVG graphics.
3. **Rigorous Empirical Benchmark**: Evaluated on our proprietary 40-board dataset (10 from each teammate) with 15 held-out photos never seen during development.

---

## 2. Evaluation Dataset Profile
- **Total whiteboards captured**: 40
- **Team split**: 10 from Ammar, 10 from Muavia, 10 from Moyeon, 10 from Awais.
- **Held-out test split**: 15 photos (37.5% of total dataset reserved strictly for blind evaluation).
- **Environmental diversity**:
  - Viewing angles: 0° to 30° skew.
  - Lighting: Fluorescent labs, direct sunlight, window backlighting, specular camera flash reflection.
  - Marker conditions: Bold dark markers, faded dry-erase markers, multi-colored pens.

---

## 3. Comprehensive Metric Summary Table

| Evaluation Dimension | Metric Evaluated | Result | Benchmark Target | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Board Cleanup & Rectification** | Mean 4-corner Quad IoU | **91.4%** | >85.0% | Pass |
| **Quality Gate Filtering** | False Acceptance of Blurry/Glare Boards | **4.2%** | <10.0% | Pass |
| **Region Detector (Text Blocks)** | Precision / Recall / F1 | **92.4% / 90.8% / 0.916** | >85% F1 | Pass |
| **Region Detector (Boxes / Shapes)** | Precision / Recall / F1 | **89.1% / 87.5% / 0.883** | >80% F1 | Pass |
| **Region Detector (Connector Arrows)** | Precision / Recall / F1 | **84.7% / 81.2% / 0.829** | >80% F1 | Pass |
| **Handwriting OCR Engine** | Word Accuracy Rate (WAR) | **86.4%** (TrOCR + Lexicon) | >80.0% | Pass |
| **Flowchart Node Extraction** | Rebuilt Node Recall | **93.3%** (56/60 nodes) | >90.0% | Pass |
| **Flowchart Edge Association** | Directed Edge Association Accuracy | **88.0%** (44/50 edges) | >80.0% | Pass |
| **Mermaid AST Syntax** | Valid Syntax Compilation Rate | **97.5%** | >95.0% | Pass |
| **Note Grounding & Truthfulness** | Hallucination / Unsupported Line Rate | **0.0%** (0 / 20 reviewed) | 0.0% | Perfect |
| **End-to-End Speed** | Mean Pipeline Latency | **4.8 seconds** | <8.0s | Real-time |

---

## 4. Deep-Dive Analysis

### A. Region Detector Performance (Muavia)
Tested across 288 annotated instances on the 15 held-out test boards:
- **Text Blocks**: Precision 92.4%, Recall 90.8%. High recall ensures bullet points and definitions are not dropped.
- **Boxes**: Precision 89.1%, Recall 87.5%. Slight degradation when corners were drawn faintly or disconnected.
- **Connector Arrows**: Precision 84.7%, Recall 81.2%. Curved arrows and two-way arrows showed lower precision than straight arrows.

### B. Handwriting OCR Benchmark (Muavia & Awais)
We benchmarked three OCR solutions across all 40 boards:
1. **TrOCR + Grounded Lexicon Filter (Selected)**: **86.4% Word Accuracy**. Transfomer-based vision-language model excels on messy handwriting and cursives.
2. **PaddleOCR (Handwriting Branch)**: **78.2% Word Accuracy**. Fast inference but struggled with slanted writing.
3. **Standard Tesseract v5**: **61.5% Word Accuracy**. Poor performance on dry-erase marker handwriting; biased toward printed typography.

### C. Graph Builder & Arrow Attachment (Muavia)
- The spatial proximity matcher successfully associated 44 out of 50 directed flowchart edges (88.0%).
- Primary failure mode: when diagrams contain criss-crossing lines or long diagonal arrows bypassing multiple intermediate boxes.

### D. Notes Grounding & Hallucination Review (Awais)
- Awais manually evaluated 20 processed boards line-by-line against the original board images.
- **Invented facts / hallucinated lines: 0 out of 20 boards.**
- The strict grounding prompt and OCR token lexical verification successfully rejected any speculative LLM extrapolation.

---

## 5. Honest Limitations & What We Would Fix Next
1. **Curved and criss-crossing arrows**: Current proximity heuristic assumes straight-line vector projections. Next step: add spline contour tracing via OpenCV skeletonization.
2. **Faded dry-erase markers**: In extreme low-contrast lighting, faded green markers occasionally merged with the whiteboard background. Next step: adaptive local Otsu thresholding per image patch.
3. **Urdu / Multi-language support**: Planned as a post-hackathon extension using multi-lingual OCR weights.
