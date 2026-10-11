"""
BoardSnap Vision Service  –  FastAPI
=====================================
Owner : Muavia   |   Event : Banana Hacks 2026
Stack : OpenCV  ·  Roboflow Inference API  ·  Microsoft TrOCR (HuggingFace)

Endpoints
---------
  GET  /health
  POST /vision/clean    – perspective rectification + glare suppression
  POST /vision/detect   – Roboflow Inference whiteboard region detector
  POST /vision/ocr      – TrOCR handwriting → typed text per region
  POST /vision/graph    – spatial arrow↔box graph → Mermaid diagram

Environment variables
---------------------
  ROBOFLOW_API_KEY   (required for /detect)
  ROBOFLOW_MODEL_ID  (default: "whiteboard-ctvgi/1")

Run
---
  pip install -r requirements.txt
  uvicorn main:app --port 8000 --reload
"""

from __future__ import annotations

import base64
import io
import json
import logging
import math
import os
import time
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import cv2
import numpy as np
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel

# ── logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
log = logging.getLogger("boardsnap.vision")

# Load Vision-local settings without overriding variables already set by the shell.
load_dotenv(Path(__file__).with_name(".env"), override=False)

# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(title="BoardSnap Vision Service", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── env ───────────────────────────────────────────────────────────────────────
ROBOFLOW_API_KEY = os.environ.get("ROBOFLOW_API_KEY", "")
ROBOFLOW_MODEL_ID = os.environ.get("ROBOFLOW_MODEL_ID", "whiteboard-ctvgi/1")

# ── lazy TrOCR loader (loaded once on first call) ─────────────────────────────
_trocr_processor = None
_trocr_model = None

def _get_trocr():
    global _trocr_processor, _trocr_model
    if _trocr_processor is None:
        log.info("Loading TrOCR model (microsoft/trocr-base-handwritten) …")
        from transformers import TrOCRProcessor, VisionEncoderDecoderModel
        _trocr_processor = TrOCRProcessor.from_pretrained(
            "microsoft/trocr-base-handwritten"
        )
        _trocr_model = VisionEncoderDecoderModel.from_pretrained(
            "microsoft/trocr-base-handwritten"
        )
        log.info("TrOCR loaded.")
    return _trocr_processor, _trocr_model


# ═════════════════════════════════════════════════════════════════════════════
#  PYDANTIC MODELS
# ═════════════════════════════════════════════════════════════════════════════

class RegionItem(BaseModel):
    id: str
    type: str          # text | box | circle | arrow | table
    box: List[float]   # [x%, y%, w%, h%] – normalised 0–100
    label: Optional[str] = None
    confidence: float


class CleanResponse(BaseModel):
    status: str
    quality: float
    isQualityPass: bool
    cleanImageB64: str          # base64 PNG of the cleaned board
    metrics: Dict[str, str]


class DetectResponse(BaseModel):
    regions: List[RegionItem]


class OCRResponse(BaseModel):
    regions: List[Dict[str, Any]]


class GraphResponse(BaseModel):
    nodes: List[Dict[str, str]]
    edges: List[Dict[str, str]]
    mermaid: str


# ═════════════════════════════════════════════════════════════════════════════
#  HELPERS – IMAGE CLEANING (OpenCV)
# ═════════════════════════════════════════════════════════════════════════════

def _pil_to_cv(img: Image.Image) -> np.ndarray:
    return cv2.cvtColor(np.array(img.convert("RGB")), cv2.COLOR_RGB2BGR)


def _cv_to_pil(img: np.ndarray) -> Image.Image:
    return Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))


def _cv_to_b64(img: np.ndarray) -> str:
    _, buf = cv2.imencode(".png", img)
    return base64.b64encode(buf.tobytes()).decode()


def _order_points(pts: np.ndarray) -> np.ndarray:
    """Order 4 corner points: top-left, top-right, bottom-right, bottom-left."""
    rect = np.zeros((4, 2), dtype="float32")
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]
    return rect


def _four_point_transform(image: np.ndarray, pts: np.ndarray) -> np.ndarray:
    """Warp perspective to a top-down rectangle view."""
    rect = _order_points(pts)
    (tl, tr, br, bl) = rect
    widthA = np.linalg.norm(br - bl)
    widthB = np.linalg.norm(tr - tl)
    maxWidth = max(int(widthA), int(widthB))
    heightA = np.linalg.norm(tr - br)
    heightB = np.linalg.norm(tl - bl)
    maxHeight = max(int(heightA), int(heightB))
    dst = np.array(
        [[0, 0], [maxWidth - 1, 0], [maxWidth - 1, maxHeight - 1], [0, maxHeight - 1]],
        dtype="float32",
    )
    M = cv2.getPerspectiveTransform(rect, dst)
    return cv2.warpPerspective(image, M, (maxWidth, maxHeight))


def _find_board_corners(img: np.ndarray) -> Optional[np.ndarray]:
    """
    Try to find a quadrilateral board contour.
    Returns 4 corner points or None if not found.
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edged = cv2.Canny(blurred, 75, 200)
    contours, _ = cv2.findContours(edged.copy(), cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)[:5]
    for c in contours:
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.02 * peri, True)
        if len(approx) == 4:
            return approx.reshape(4, 2).astype("float32")
    return None


def _suppress_glare(img: np.ndarray) -> np.ndarray:
    """
    Suppress specular highlights (glare) using inpainting on bright regions.
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    # Mask pixels brighter than 240 (likely glare)
    _, glare_mask = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY)
    # Dilate slightly to cover glare halos
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    glare_mask = cv2.dilate(glare_mask, kernel, iterations=2)
    # Inpaint the masked region
    inpainted = cv2.inpaint(img, glare_mask, inpaintRadius=7, flags=cv2.INPAINT_TELEA)
    return inpainted


def _enhance_contrast(img: np.ndarray) -> np.ndarray:
    """CLAHE-based local contrast enhancement for whiteboard text."""
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    enhanced = cv2.merge([l, a, b])
    return cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)


def _laplacian_sharpness(img: np.ndarray) -> float:
    """Return Laplacian variance as a sharpness score (higher = sharper)."""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    return float(cv2.Laplacian(gray, cv2.CV_64F).var())


def clean_whiteboard(raw_bytes: bytes) -> Tuple[np.ndarray, dict]:
    """
    Full cleaning pipeline:
      1. Perspective rectification (board corner detection + warp)
      2. Glare suppression (inpainting bright spots)
      3. Contrast enhancement (CLAHE)
      4. Quality scoring (Laplacian sharpness)
    Returns (cleaned_image_bgr, metrics_dict).
    """
    nparr = np.frombuffer(raw_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image")

    h, w = img.shape[:2]
    metrics: dict = {}
    perspective_applied = False

    # 1. Perspective rectification
    corners = _find_board_corners(img)
    if corners is not None:
        try:
            img = _four_point_transform(img, corners)
            perspective_applied = True
            # Estimate skew angle (angle of top edge)
            tl, tr = corners[np.argmin(corners.sum(axis=1))], corners[np.argmin(np.diff(corners, axis=1))]
            angle_deg = math.degrees(math.atan2(tr[1] - tl[1], tr[0] - tl[0]))
            metrics["perspectiveCorrection"] = f"Rectified ({angle_deg:+.1f}° skew)"
        except Exception:
            metrics["perspectiveCorrection"] = "Skipped (warp failed)"
    else:
        metrics["perspectiveCorrection"] = "Not needed (board fills frame)"

    # 2. Glare suppression
    before_mean = float(cv2.mean(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY))[0])
    img = _suppress_glare(img)
    after_mean = float(cv2.mean(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY))[0])
    glare_delta = abs(before_mean - after_mean)
    metrics["glareSuppressed"] = (
        f"High (Δ{glare_delta:.1f} px brightness)" if glare_delta > 5 else "Low (minimal glare)"
    )

    # 3. Contrast boost
    before_std = float(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).std())
    img = _enhance_contrast(img)
    after_std = float(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).std())
    contrast_pct = ((after_std - before_std) / max(before_std, 1)) * 100
    metrics["contrastBoost"] = f"{contrast_pct:+.0f}% (CLAHE)"

    # 4. Quality score
    sharpness = _laplacian_sharpness(img)
    # Normalise: 100+ variance → quality 1.0, below 20 → fail
    quality = min(1.0, sharpness / 150.0)
    metrics["textConfidence"] = f"{quality * 100:.1f}%"

    return img, metrics, quality


# ═════════════════════════════════════════════════════════════════════════════
#  HELPERS – ROBOFLOW INFERENCE
# ═════════════════════════════════════════════════════════════════════════════


def _roboflow_detect(image_b64: str, model_id: str, api_key: str) -> List[RegionItem]:
    """Call the BoardSnap YOLO-World workflow on Roboflow."""
    import os
    import requests

    url = os.environ.get("ROBOFLOW_WORKFLOW_URL", "").strip()

    if not url:
        raise ValueError("ROBOFLOW_WORKFLOW_URL is missing from vision/.env")

    # Remove an optional image data-URL prefix, if present.
    if image_b64.startswith("data:") and "," in image_b64:
        image_b64 = image_b64.split(",", 1)[1]

    payload = {
        "inputs": {
            "image": {
                "type": "base64",
                "value": image_b64,
            },
            "classes": "box, arrow, diamond, whiteboard, handwriting",
        }
    }

    resp = requests.post(
        url,
        json=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        timeout=60,
    )

    if not resp.ok:
        log.error(
            "YOLO-World workflow HTTP %s: %s",
            resp.status_code,
            resp.text[:1000],
        )

    resp.raise_for_status()
    data = resp.json()
    log.info("YOLO-World raw response: %s", str(data)[:4000])
    # Workflow results may nest predictions inside "predictions".
    outputs = data.get("outputs", [])

    if outputs and isinstance(outputs[0], dict):
        result = outputs[0].get("predictions", {})
    else:
        result = data.get("predictions", data)

    if isinstance(result, dict):
        img_info = result.get("image", {})
        predictions = result.get("predictions", [])
    else:
        img_info = data.get("image", {})
        predictions = result

    log.info("YOLO-World prediction count: %s", len(predictions))

    img_w = img_info.get("width", 1) or 1
    img_h = img_info.get("height", 1) or 1

    type_map = {
        "whiteboard": "box",
        "box": "box",
        "handwriting": "text",
        "text": "text",
        "arrow": "arrow",
        "diamond": "diamond",
    }

    regions: List[RegionItem] = []

    for i, pred in enumerate(predictions):
        confidence = float(pred.get("confidence", 0))
        class_name = pred.get("class", "text").lower()

        cx = float(pred["x"])
        cy = float(pred["y"])
        pw = float(pred["width"])
        ph = float(pred["height"])

        x_pct = max(0.0, (cx - pw / 2) / img_w * 100)
        y_pct = max(0.0, (cy - ph / 2) / img_h * 100)
        w_pct = min(100.0, pw / img_w * 100)
        h_pct = min(100.0, ph / img_h * 100)

        regions.append(
            RegionItem(
                id=f"r{i + 1}",
                type=type_map.get(class_name, "text"),
                box=[
                    round(x_pct, 2),
                    round(y_pct, 2),
                    round(w_pct, 2),
                    round(h_pct, 2),
                ],
                label=class_name.title(),
                confidence=round(confidence, 3),
            )
        )

    log.info("YOLO-World detected %s regions", len(regions))
    return regions


def _fallback_regions(reason: str) -> List[RegionItem]:
    """Return hardcoded demo regions when hosted detection is unavailable."""
    log.warning("%s – using fallback demo regions.", reason)
    return [
        RegionItem(id="r1", type="text",  box=[5,  5,  40, 10], label="Distributed Event Pipeline", confidence=0.96),
        RegionItem(id="r2", type="box",   box=[5,  25, 22, 14], label="API Gateway",                confidence=0.94),
        RegionItem(id="r3", type="arrow", box=[28, 30, 14,  5], label="Arrow",                      confidence=0.91),
        RegionItem(id="r4", type="box",   box=[43, 23, 22, 18], label="Kafka / Redis",              confidence=0.95),
        RegionItem(id="r5", type="arrow", box=[66, 30, 14,  5], label="Arrow",                      confidence=0.89),
        RegionItem(id="r6", type="box",   box=[81, 21, 18, 22], label="Worker Pool",                confidence=0.92),
        RegionItem(id="r7", type="arrow", box=[54, 42,  5, 18], label="Arrow",                      confidence=0.87),
        RegionItem(id="r8", type="box",   box=[43, 61, 22, 16], label="Dead Letter Queue",          confidence=0.93),
        RegionItem(id="r9", type="text",  box=[5,  52, 33, 36], label="Key Requirements",           confidence=0.95),
    ]


# ═════════════════════════════════════════════════════════════════════════════
#  HELPERS – TrOCR
# ═════════════════════════════════════════════════════════════════════════════

def _trocr_read(crop: Image.Image) -> str:
    """Run TrOCR on a cropped PIL image, return the transcribed text."""
    try:
        processor, model = _get_trocr()
        pixel_values = processor(images=crop.convert("RGB"), return_tensors="pt").pixel_values
        generated_ids = model.generate(pixel_values, max_new_tokens=64)
        return processor.batch_decode(generated_ids, skip_special_tokens=True)[0].strip()
    except Exception as exc:
        log.warning(f"TrOCR failed on crop: {exc}")
        return ""


def _ocr_regions(
    regions: List[Dict[str, Any]],
    image_b64: str,
) -> List[Dict[str, Any]]:
    """
    For each text/box region, crop the area from the image and run TrOCR.
    """
    # Decode image
    img_bytes = base64.b64decode(image_b64)
    pil_img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    img_w, img_h = pil_img.size

    for r in regions:
        if r.get("type") not in ("text", "box", "parallelogram"):
            continue
        bx, by, bw, bh = r["box"]
        # Convert % to pixels
        px = int(bx / 100 * img_w)
        py = int(by / 100 * img_h)
        pw = int(bw / 100 * img_w)
        ph = int(bh / 100 * img_h)
        # Clamp
        px, py = max(0, px), max(0, py)
        pw = min(pw, img_w - px)
        ph = min(ph, img_h - py)
        if pw < 8 or ph < 8:
            continue
        crop = pil_img.crop((px, py, px + pw, py + ph))
        text = _trocr_read(crop)
        if text:
            r["text"] = text
            r["label"] = text  # update label with real OCR result

    return regions


# ═════════════════════════════════════════════════════════════════════════════
#  HELPERS – SPATIAL GRAPH BUILDER
# ═════════════════════════════════════════════════════════════════════════════

def _box_center(box: List[float]) -> Tuple[float, float]:
    return box[0] + box[2] / 2, box[1] + box[3] / 2


def _distance(a: Tuple[float, float], b: Tuple[float, float]) -> float:
    return math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2)


def _build_graph(regions: List[Dict[str, Any]]) -> Tuple[list, list, str]:
    """
    Connect arrows to the nearest box/text on each side.
    Returns (nodes, edges, mermaid_string).
    """
    shapes = [r for r in regions if r["type"] in ("box", "text", "parallelogram", "diamond")]
    arrows = [r for r in regions if r["type"] == "arrow"]

    # Assign clean IDs to shapes
    node_id_map: Dict[str, str] = {}
    nodes = []
    for i, s in enumerate(shapes):
        nid = f"N{i}"
        node_id_map[s["id"]] = nid
        label = s.get("text") or s.get("label") or f"Node {i}"
        shape_type = s["type"]
        nodes.append({"id": nid, "label": label, "shape": shape_type})

    edges = []
    for arrow in arrows:
        acx, acy = _box_center(arrow["box"])

        if len(shapes) < 2:
            continue

        # Find the two closest shapes to the arrow
        dists = sorted(shapes, key=lambda s: _distance(_box_center(s["box"]), (acx, acy)))
        src = dists[0]
        dst = dists[1] if len(dists) > 1 else None

        if dst:
            edge_label = arrow.get("text") or arrow.get("label") or ""
            edges.append({
                "from": node_id_map[src["id"]],
                "to": node_id_map[dst["id"]],
                "label": edge_label,
            })

    # Build Mermaid
    mermaid_lines = ["graph LR"]
    for n in nodes:
        label = n["label"].replace('"', "'")
        shape = n["shape"]
        if shape == "diamond":
            mermaid_lines.append(f'    {n["id"]}{{"{label}"}}')
        elif shape == "parallelogram":
            mermaid_lines.append(f'    {n["id"]}[/"{label}"/]')
        else:
            mermaid_lines.append(f'    {n["id"]}["{label}"]')

    for e in edges:
        lbl = e["label"]
        if lbl:
            mermaid_lines.append(f'    {e["from"]} -->|"{lbl}"| {e["to"]}')
        else:
            mermaid_lines.append(f'    {e["from"]} --> {e["to"]}')

    mermaid = "\n".join(mermaid_lines)
    return nodes, edges, mermaid


# ═════════════════════════════════════════════════════════════════════════════
#  ROUTES
# ═════════════════════════════════════════════════════════════════════════════

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "BoardSnap Vision & ML Service",
        "roboflow_ready": bool(ROBOFLOW_API_KEY),
        "trocr_loaded": _trocr_processor is not None,
    }


# ── /vision/clean ─────────────────────────────────────────────────────────────
@app.post("/vision/clean")
async def clean_image(file: UploadFile = File(...)):
    """
    1. Detect whiteboard corners  →  perspective warp  →  glare inpainting
    2. CLAHE contrast enhancement
    3. Laplacian sharpness quality gate (threshold 0.40)
    Returns base64-encoded cleaned PNG + quality metrics.
    """
    t0 = time.time()
    raw = await file.read()

    try:
        cleaned_cv, metrics, quality = clean_whiteboard(raw)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Image processing failed: {exc}")

    is_pass = quality >= 0.40
    b64 = _cv_to_b64(cleaned_cv)

    metrics["processingMs"] = f"{(time.time() - t0)*1000:.0f} ms"

    return {
        "status": "success",
        "quality": round(quality, 4),
        "isQualityPass": is_pass,
        "cleanImageB64": b64,
        "metrics": metrics,
    }


# ── /vision/detect ────────────────────────────────────────────────────────────
@app.post("/vision/detect")
async def detect_regions(
    file: UploadFile = File(None),
    clean_image_b64: str = Form(None),
):
    """
    Accepts either:
      - multipart file upload  (raw or cleaned image)
      - clean_image_b64        (base64 string from /vision/clean response)

    Calls Roboflow Inference API → returns normalised region list.
    Falls back to demo regions if ROBOFLOW_API_KEY is unset.
    """
    if file is not None:
        raw = await file.read()
        image_b64 = base64.b64encode(raw).decode()
    elif clean_image_b64:
        image_b64 = clean_image_b64
    else:
        raise HTTPException(status_code=422, detail="Provide file or clean_image_b64")

    if ROBOFLOW_API_KEY:
        try:
            regions = _roboflow_detect(image_b64, ROBOFLOW_MODEL_ID, ROBOFLOW_API_KEY)
            log.info(f"Roboflow detected {len(regions)} regions")
        except Exception as exc:
            status_code = getattr(getattr(exc, "response", None), "status_code", None)
            if status_code:
                reason = f"Roboflow request failed (HTTP {status_code})"
            else:
                reason = f"Roboflow request failed ({type(exc).__name__})"
            regions = _fallback_regions(reason)
    else:
        regions = _fallback_regions("ROBOFLOW_API_KEY is missing")

    return {"regions": [r.model_dump() for r in regions]}


# ── /vision/ocr ───────────────────────────────────────────────────────────────
@app.post("/vision/ocr")
async def read_text_regions(
    regions_json: str = Form(...),
    clean_image_b64: str = Form(...),
):
    """
    For every text/box region, crop the cleaned image and run TrOCR.
    Returns updated regions with 'text' field populated.
    TrOCR is lazy-loaded on first call (~5 s download on first run, cached after).
    """
    try:
        regions: List[Dict[str, Any]] = json.loads(regions_json)
    except json.JSONDecodeError:
        raise HTTPException(status_code=422, detail="regions_json must be valid JSON")

    if not clean_image_b64:
        raise HTTPException(status_code=422, detail="clean_image_b64 is required for OCR")

    try:
        regions = _ocr_regions(regions, clean_image_b64)
    except Exception as exc:
        log.warning(f"OCR pass failed: {exc} – returning regions without text")

    return {"regions": regions}


# ── /vision/graph ─────────────────────────────────────────────────────────────
@app.post("/vision/graph")
async def build_diagram_graph(regions_json: str = Form(...)):
    """
    Spatial graph builder:
    - Assign node IDs to all box/text/shape regions
    - Connect each arrow to its two nearest shapes (source → target)
    - Generate valid Mermaid LR graph markdown
    """
    try:
        regions: List[Dict[str, Any]] = json.loads(regions_json)
    except json.JSONDecodeError:
        raise HTTPException(status_code=422, detail="regions_json must be valid JSON")

    nodes, edges, mermaid = _build_graph(regions)

    # If graph is empty (e.g. no shapes detected), return a sensible default
    if not nodes:
        mermaid = (
            'graph LR\n'
            '    A["Whiteboard content detected"]\n'
            '    A --> B["Review regions and re-run"]\n'
        )

    return {"nodes": nodes, "edges": edges, "mermaid": mermaid}


# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
