# BoardSnap Vision Pipeline Model Card

Updated: October 11, 2026

## What the repository actually runs

1. **Image cleanup:** OpenCV contour-based board corner detection, perspective
   warp, glare inpainting, CLAHE contrast enhancement, and a Laplacian-variance
   quality score.
2. **Region detection:** a remotely configured Roboflow Workflow. The workflow
   URL selects the hosted workflow/model; the API key authorizes the request.
   The repository does not contain trained YOLO weights. The implementation
   supplies prompts for `box, arrow, diamond, whiteboard, handwriting` to the
   hosted workflow.
3. **Handwriting recognition:** Hugging Face
   `microsoft/trocr-base-handwritten`, loaded on first OCR request. It is a
   pretrained model, not a model fine-tuned by this project.
4. **Diagram graph:** a spatial heuristic associates each arrow with the two
   nearest detected shapes and compiles a Mermaid flowchart.

## Dataset status and model claims

The dataset downloader targets Roboflow Universe exports in YOLOv8 format:

- `taerua/whiteboard-ctvgi`, version 1: classes `pen` and `whiteboard`.
- `handwriting-detection-zfowd/handwriting-detection-eoxpj`, version 8:
  class `handwriting`.

These are annotation datasets, not OCR transcriptions. The repository's
`dataset/manifest.json` records `not_downloaded`, so the exports and labels are
not present in this checkout. No project-trained detector weights or
ground-truth OCR evaluation corpus are present here.

**Verified accuracy figures: none.** Prior benchmark numbers and the earlier
OCR benchmark script were not backed by model inference over a labeled test
set. The current `benchmark_ocr.py` runs the configured TrOCR model over a
user-provided held-out manifest and reports measured predictions, WER, CER,
and latency. Do not report accuracy until that benchmark has been run against
real handwritten images with manually checked transcripts.

## Setup requirements

- Configure `ROBOFLOW_API_KEY` and the full inference endpoint URL copied from
  the deployed Roboflow Workflow page in `vision/.env`.
- Install `vision/requirements.txt`.
- TrOCR model weights download from Hugging Face on first use (network required)
  and are cached by Hugging Face.
- With detector fallback disabled (the default), missing or failed Roboflow
  configuration produces an explicit HTTP error rather than sample regions.
- OCR dependency/model errors produce an explicit HTTP error; they are not
  reported as successful empty OCR results.

## Known limitations

- The selected Roboflow workflow cannot be confirmed from this source tree
  alone; its endpoint determines the actual hosted model and class mapping.
- The two downloaded datasets have region labels, not transcribed handwriting.
- `microsoft/trocr-base-handwritten` is primarily intended for English
  handwriting and may perform poorly on dense multi-line text, whiteboard
  diagrams, or non-Latin scripts.
- A detector's `handwriting` region is a crop proposal, not recognized text.
- The graph association is a nearest-centre heuristic; crossing and diagonal
  arrows can be connected incorrectly.
- The Laplacian quality score is a sharpness heuristic, not OCR confidence.

## API

All endpoints are served by the FastAPI application on port 8000 by default:

| Endpoint | Purpose |
| --- | --- |
| `GET /health` | Reports configured detector and installed/loaded OCR status |
| `POST /vision/clean` | Rectifies and scores an uploaded image |
| `POST /vision/detect` | Calls the configured Roboflow Workflow |
| `POST /vision/ocr` | Runs TrOCR on detected text/shape crops |
| `POST /vision/graph` | Builds nodes, edges, and Mermaid from regions |
