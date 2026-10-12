# BoardSnap Evaluation Status

## Verified project status

The current repository contains a runnable application pipeline and automated
contract/unit tests. It does not contain a project-trained detector, a labeled
end-to-end whiteboard benchmark set, or reproducible evidence for model
accuracy, grounding rate, or end-to-end latency. No quantitative performance
results are claimed here.

The boards bundled in `frontend/src/data/sampleBoards.js` are illustrative
interface demos. They are not labeled evaluation data and must not be counted
as model predictions or benchmark samples.

## What is implemented

- OpenCV-based image cleanup, perspective-correction heuristics, glare
  inpainting, contrast enhancement, and a Laplacian sharpness quality gate.
- Region detection through a configured Roboflow Workflow; this checkout does
  not include trained project detector weights.
- Full-board OCR through a configured Roboflow workflow, with EasyOCR as the
  local fallback. The TrOCR helper is used by the standalone OCR benchmark
  script; it is not the active `/vision/ocr` endpoint path.
- Spatial heuristics for connecting detected shapes and arrows. When full-board
  OCR transcription is supplied, the graph builder currently makes sequential
  nodes from non-empty transcript lines.
- LLM-generated notes, quiz questions, and chat answers based on the board
  content supplied in each request. Chat currently sends board context to the
  selected provider and does not use vector-database retrieval.

## How to report measurements

Before publishing accuracy, latency, or hallucination-rate claims, save the
test images and annotations/transcripts, document the train/validation/test
split, run the production code on the held-out test set, and retain the raw
predictions and scoring procedure. OCR needs manually transcribed ground truth;
the Roboflow region-detection datasets listed in `dataset/manifest.json` do
not provide OCR transcripts.

The TrOCR crop benchmark can be run against a manually transcribed JSON
manifest using `vision/benchmark_ocr.py`. Its results apply only to that
manifest and that TrOCR checkpoint, not to the live OCR endpoint.
