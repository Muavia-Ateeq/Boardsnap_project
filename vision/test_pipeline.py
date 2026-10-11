"""
BoardSnap – Vision Service Test & Verification Suite
====================================================
Owner: Muavia | Event: Banana Hacks 2026 | Theme: Image AI

Tests all 4 vision processing components:
  1. OpenCV Clean: Board corners, warpPerspective, glare inpainting, CLAHE, quality score.
  2. Region Detector: Bounding boxes schema, confidence scores, normalization.
  3. Handwriting OCR: Region token handling and formatting.
  4. Spatial Graph Builder: Euclidean distance matching, arrow-to-box association, Mermaid LR generation.
"""

import io
import json
import base64
from unittest.mock import patch
import numpy as np
import cv2
from PIL import Image

import main
from main import clean_whiteboard, _fallback_regions, _build_graph


def test_clean_step():
    print("[1/4] Testing OpenCV Cleanup & Quality Gate...")
    # Create a dummy whiteboard image with high contrast shapes
    canvas = np.full((600, 800, 3), 245, dtype=np.uint8)
    cv2.rectangle(canvas, (100, 100), (300, 250), (20, 20, 30), 3)
    cv2.putText(canvas, "Clean Test Board", (120, 180), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (20, 20, 30), 2)
    # Add glare spot
    cv2.circle(canvas, (400, 200), 80, (255, 255, 255), -1)

    _, encoded = cv2.imencode(".png", canvas)
    raw_bytes = encoded.tobytes()

    cleaned_img, metrics, quality = clean_whiteboard(raw_bytes)

    assert cleaned_img is not None, "Cleaned image should not be None"
    assert "textConfidence" in metrics, "Metrics must include textConfidence"
    assert "contrastBoost" in metrics, "Metrics must include contrastBoost"
    assert quality > 0.0, f"Quality score should be positive, got {quality}"
    print(f"      PASS: Quality Score = {quality:.3f}, Metrics: {metrics}")
    return True


def test_region_detector():
    print("[2/4] Testing Region Detector Schema...")
    regions = _fallback_regions("test fixture")
    assert len(regions) > 0, "Detector fallback should return at least one region"
    for r in regions:
        assert hasattr(r, "id"), "Region missing id"
        assert hasattr(r, "type"), "Region missing type"
        assert len(r.box) == 4, "Bounding box must have [x, y, w, h]"
        assert 0.0 <= r.confidence <= 1.0, f"Confidence {r.confidence} out of range [0, 1]"
    print(f"      PASS: Validated {len(regions)} regions with bounding boxes & confidence scores")
    return True


def test_ocr_step():
    print("[3/4] Testing OCR crop wiring (recognizer mocked; no accuracy claim)...")
    regions = [{
        "id": "r1",
        "type": "text",
        "box": [10, 10, 40, 20],
        "label": "handwriting",
        "confidence": 0.9,
    }]
    image = np.full((600, 800, 3), 255, dtype=np.uint8)
    ok, encoded = cv2.imencode(".png", image)
    assert ok
    image_b64 = base64.b64encode(encoded.tobytes()).decode("ascii")
    with patch.object(main, "_trocr_read", return_value="mock transcription") as recognizer:
        processed = main._ocr_regions(regions, image_b64)
    assert recognizer.call_count == 1, "Text region should be sent to OCR"
    assert processed[0]["text"] == "mock transcription", "OCR result should be attached to the region"
    print("      PASS: OCR crop and response wiring only; TrOCR inference is covered separately.")
    return True


def test_graph_builder():
    print("[4/4] Testing Spatial Graph Builder & Mermaid AST...")
    sample_regions = [
        {"id": "r1", "type": "box", "box": [10, 20, 20, 10], "label": "Start Process", "text": "Start"},
        {"id": "r2", "type": "arrow", "box": [32, 23, 10, 4], "label": "Proceed", "text": ""},
        {"id": "r3", "type": "box", "box": [45, 20, 20, 10], "label": "Database Sink", "text": "Save Data"},
    ]

    nodes, edges, mermaid = _build_graph(sample_regions)

    assert len(nodes) == 2, f"Expected 2 nodes, got {len(nodes)}"
    assert len(edges) == 1, f"Expected 1 edge, got {len(edges)}"
    assert edges[0]["from"] == "N0", "Edge source should be N0"
    assert edges[0]["to"] == "N1", "Edge destination should be N1"
    assert "graph LR" in mermaid, "Mermaid string must start with 'graph LR'"
    assert "N0" in mermaid and "N1" in mermaid, "Mermaid must contain node identifiers"

    print("      PASS: Graph Builder connected arrow between shapes successfully!")
    print("\nGenerated Mermaid Flowchart:")
    for line in mermaid.splitlines():
        print(f"        {line}")
    return True


def run_all_tests():
    print("=" * 65)
    print("  BoardSnap Vision Pipeline - Unit & Integration Test Suite")
    print("=" * 65)
    all_pass = all([
        test_clean_step(),
        test_region_detector(),
        test_ocr_step(),
        test_graph_builder(),
    ])
    print("=" * 65)
    if all_pass:
        print("  Smoke checks passed. OCR is mocked here; this is not an accuracy benchmark.")
    print("=" * 65 + "\n")


if __name__ == "__main__":
    run_all_tests()
