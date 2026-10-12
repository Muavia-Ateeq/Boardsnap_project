"""Focused tests for real detector/OCR wiring; no network or model download."""

import asyncio
import base64
import io
import json
import unittest
from unittest.mock import Mock, patch

import numpy as np
from PIL import Image, ImageDraw
from fastapi import HTTPException

import main
from benchmark_ocr import edit_distance


class VisionTests(unittest.TestCase):
    def image_base64(self):
        image = Image.new("RGB", (100, 80), "white")
        buffer = io.BytesIO()
        image.save(buffer, format="PNG")
        return base64.b64encode(buffer.getvalue()).decode("ascii")

    def test_roboflow_workflow_sends_configured_key_and_normalizes_box(self):
        workflow_response = {
            "outputs": [{
                "predictions": {
                    "image": {"width": 100, "height": 80},
                    "predictions": [{
                        "x": 20, "y": 20, "width": 30, "height": 20,
                        "class": "handwriting", "confidence": 0.91,
                    }],
                },
            }],
        }
        response = Mock()
        response.json.return_value = workflow_response
        with (
            patch.object(main, "ROBOFLOW_WORKFLOW_URL", "https://example.invalid/workflow"),
            patch("requests.post", return_value=response) as post,
        ):
            regions = main._roboflow_detect(self.image_base64(), "test-workflow", "test-secret")

        response.raise_for_status.assert_called_once()
        self.assertEqual(post.call_args.kwargs["headers"]["Authorization"], "Bearer test-secret")
        self.assertEqual(post.call_args.args[0], "https://example.invalid/workflow")
        self.assertEqual(regions[0].type, "text")
        self.assertEqual(regions[0].box, [5.0, 12.5, 30.0, 25.0])

    def test_detector_requires_configuration_instead_of_fake_regions(self):
        with (
            patch.object(main, "ROBOFLOW_API_KEY", ""),
            patch.object(main, "ROBOFLOW_WORKFLOW_URL", ""),
            patch.object(main, "ALLOW_DEMO_DETECTOR_FALLBACK", False),
        ):
            with self.assertRaises(HTTPException) as caught:
                asyncio.run(main.detect_regions(file=None, clean_image_b64=self.image_base64()))
        self.assertEqual(caught.exception.status_code, 503)
        self.assertIn("ROBOFLOW_API_KEY", caught.exception.detail)

    def test_detector_request_failure_is_reported_as_gateway_error(self):
        with (
            patch.object(main, "ROBOFLOW_API_KEY", "test-secret"),
            patch.object(main, "ROBOFLOW_WORKFLOW_URL", "https://example.invalid/workflow"),
            patch.object(main, "_roboflow_detect", side_effect=RuntimeError("upstream unavailable")),
        ):
            with self.assertRaises(HTTPException) as caught:
                asyncio.run(main.detect_regions(file=None, clean_image_b64=self.image_base64()))
        self.assertEqual(caught.exception.status_code, 502)

    def test_ocr_applies_local_recognition_to_text_regions(self):
        regions = [{
            "id": "r1", "type": "text", "box": [10, 10, 30, 20],
            "label": "handwriting", "confidence": 0.9,
        }]
        reader = Mock()
        reader.readtext.return_value = [
            ([[20, 20], [40, 20], [40, 35], [20, 35]], "Written words", 0.9),
        ]
        with patch.object(main, "_get_easyocr_reader", return_value=reader):
            result = main._ocr_regions(regions, self.image_base64())
        self.assertEqual(result[0]["text"], "Written words")
        self.assertEqual(result[0]["label"], "Written words")

    def test_ocr_preserves_multiple_local_recognition_results(self):
        regions = [{
            "id": "r1", "type": "text", "box": [0, 0, 100, 100],
            "label": "handwriting", "confidence": 0.9,
        }]
        reader = Mock()
        reader.readtext.return_value = [
            ([[20, 20], [80, 20], [80, 35], [20, 35]], "First line", 0.9),
            ([[20, 45], [80, 45], [80, 60], [20, 60]], "Second line", 0.9),
        ]

        with patch.object(main, "_get_easyocr_reader", return_value=reader):
            result = main._ocr_regions(regions, self.image_base64())

        self.assertEqual([region["text"] for region in result], ["First line", "Second line"])
        reader.readtext.assert_called_once()

    def test_multiline_text_crop_is_split_for_line_recognition(self):
        image = Image.new("RGB", (500, 180), "white")
        draw = ImageDraw.Draw(image)
        draw.text((20, 25), "First handwritten line", fill="black")
        draw.text((20, 115), "Second handwritten line", fill="black")

        lines = main._split_text_lines(image)

        self.assertEqual(len(lines), 2)
        self.assertLess(lines[0].height, image.height)
        self.assertLess(lines[1].height, image.height)

    def test_ocr_does_not_hide_model_load_error(self):
        with patch.object(main, "_get_trocr", side_effect=ModuleNotFoundError("transformers")):
            with self.assertRaises(ModuleNotFoundError):
                main._trocr_read(Image.new("RGB", (30, 20), "white"))

    def test_ocr_endpoint_reports_local_fallback_failure(self):
        region = {"id": "r1", "type": "text", "box": [0, 0, 50, 50]}
        with (
            patch.object(main, "ROBOFLOW_API_KEY", ""),
            patch.object(main, "ROBOFLOW_OCR_WORKFLOW_URL", ""),
            patch.object(main, "ALLOW_LOCAL_OCR_FALLBACK", True),
            patch.object(main.importlib.util, "find_spec", return_value=object()),
            patch.object(main, "_ocr_regions", side_effect=RuntimeError("model failed")),
        ):
            with self.assertRaises(HTTPException) as caught:
                asyncio.run(main.read_text_regions(
                    regions_json=json.dumps([region]),
                    clean_image_b64=self.image_base64(),
                ))
        self.assertEqual(caught.exception.status_code, 503)

    def test_ocr_endpoint_rejects_disabled_local_fallback(self):
        region = {"id": "r1", "type": "text", "box": [0, 0, 50, 50]}
        with (
            patch.object(main, "ROBOFLOW_API_KEY", ""),
            patch.object(main, "ROBOFLOW_OCR_WORKFLOW_URL", ""),
            patch.object(main, "ALLOW_LOCAL_OCR_FALLBACK", False),
        ):
            with self.assertRaises(HTTPException) as caught:
                asyncio.run(main.read_text_regions(
                    regions_json=json.dumps([region]),
                    clean_image_b64=self.image_base64(),
                ))
        self.assertEqual(caught.exception.status_code, 503)
        self.assertIn("Local OCR fallback is disabled", caught.exception.detail)

    def test_roboflow_ocr_sends_full_image_once_and_appends_transcription(self):
        image_b64 = self.image_base64()
        regions = [{
            "id": "shape-1",
            "type": "box",
            "box": [10, 10, 30, 20],
            "label": "detected shape",
            "confidence": 0.9,
        }]

        with patch.object(main, "_roboflow_ocr_text", return_value="Full board handwriting") as ocr:
            result = main._roboflow_ocr_regions(regions, image_b64, "test-secret")

        ocr.assert_called_once_with(image_b64, "test-secret")
        self.assertEqual(result[0], regions[0])
        self.assertEqual(result[1]["type"], "transcription")
        self.assertEqual(result[1]["box"], [0, 0, 100, 100])
        self.assertEqual(result[1]["text"], "Full board handwriting")

    def test_roboflow_ocr_adds_transcription_when_detector_finds_no_regions(self):
        with patch.object(main, "_roboflow_ocr_text", return_value="Handwritten board text"):
            result = main._roboflow_ocr_regions([], self.image_base64(), "test-secret")

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["type"], "transcription")
        self.assertEqual(result[0]["text"], "Handwritten board text")

    def test_roboflow_ocr_accepts_empty_transcription(self):
        response = Mock()
        response.json.return_value = {"outputs": [{"output": ""}]}
        image_b64 = self.image_base64()
        with (
            patch.object(main, "ROBOFLOW_OCR_WORKFLOW_URL", "https://example.invalid/ocr"),
            patch("requests.post", return_value=response) as post,
        ):
            self.assertEqual(main._roboflow_ocr_text(image_b64, "test-secret"), "")

        sent_image = post.call_args.kwargs["json"]["inputs"]["image"]
        self.assertEqual(sent_image, {"type": "base64", "value": image_b64})
        authorization = post.call_args.kwargs["headers"]["Authorization"]
        scheme, _, credential = authorization.partition(" ")
        self.assertEqual((scheme, credential), ("Bearer", "test-secret"))

    def test_roboflow_ocr_extracts_qwen_vl_output(self):
        response = Mock()
        response.json.return_value = {
            "outputs": [{
                "qwen_vl_output": {
                    "output": "Text written on the board",
                    "thinking": "",
                },
            }],
        }
        with (
            patch.object(main, "ROBOFLOW_OCR_WORKFLOW_URL", "https://example.invalid/ocr"),
            patch("requests.post", return_value=response),
        ):
            text = main._roboflow_ocr_text(self.image_base64(), "test-secret")

        self.assertEqual(text, "Text written on the board")

    def test_ocr_endpoint_uses_roboflow_when_configured(self):
        region = {"id": "r1", "type": "text", "box": [0, 0, 50, 50]}
        recognized = [{**region, "text": "Workflow OCR"}]
        image_b64 = self.image_base64()
        with (
            patch.object(main, "ROBOFLOW_API_KEY", "test-secret"),
            patch.object(main, "ROBOFLOW_OCR_WORKFLOW_URL", "https://example.invalid/ocr"),
            patch.object(main, "_roboflow_ocr_regions", return_value=recognized) as ocr,
        ):
            result = asyncio.run(main.read_text_regions(
                regions_json=json.dumps([region]),
                clean_image_b64=image_b64,
            ))

        ocr.assert_called_once_with([region], image_b64, "test-secret")
        self.assertEqual(result["regions"][0]["text"], "Workflow OCR")
        self.assertEqual(result["model"], "Roboflow Qwen-VL")

    def test_edit_distance_counts_word_and_character_edits(self):
        self.assertEqual(edit_distance(["one", "two"], ["one", "three"]), 1)
        self.assertEqual(edit_distance("kitten", "sitting"), 3)

    def test_clean_pipeline_decodes_image_and_returns_quality(self):
        image = np.full((240, 320, 3), 245, dtype=np.uint8)
        image[40:100, 40:200] = 15
        success, encoded = main.cv2.imencode(".png", image)
        self.assertTrue(success)
        cleaned, metrics, quality = main.clean_whiteboard(encoded.tobytes())
        self.assertGreater(cleaned.size, 0)
        self.assertIn("contrastBoost", metrics)
        self.assertGreaterEqual(quality, 0)
        self.assertLessEqual(quality, 1)

    def test_graph_builder_produces_nodes_edge_and_mermaid(self):
        regions = [
            {"id": "box1", "type": "box", "box": [5, 20, 20, 20], "label": "Start"},
            {"id": "arrow1", "type": "arrow", "box": [35, 27, 10, 5], "label": "next"},
            {"id": "box2", "type": "box", "box": [55, 20, 20, 20], "label": "Finish"},
        ]
        nodes, edges, mermaid = main._build_graph(regions)
        self.assertEqual(len(nodes), 2)
        self.assertEqual(len(edges), 1)
        self.assertIn("graph LR", mermaid)

    def test_graph_builder_converts_ocr_line_breaks_for_mermaid(self):
        regions = [{
            "id": "box1", "type": "box", "box": [5, 20, 20, 20],
            "label": "Start\nProcess",
        }]
        nodes, _, mermaid = main._build_graph(regions)
        self.assertEqual(nodes[0]["label"], "Start\nProcess")
        self.assertIn("Start<br/>Process", mermaid)

    def test_graph_builder_uses_qwen_transcript_lines_in_reading_order(self):
        regions = [
            {"id": "box1", "type": "box", "box": [60, 60, 20, 20], "label": "Old detected label"},
            {
                "id": "qwen-vl-transcription",
                "type": "transcription",
                "box": [0, 0, 100, 100],
                "label": "Full-board OCR",
                "text": "First step\nSecond step\nFinal step",
            },
        ]

        nodes, edges, mermaid = main._build_graph(regions)

        self.assertEqual([node["label"] for node in nodes], [
            "First step",
            "Second step",
            "Final step",
        ])
        self.assertEqual(
            [(edge["from"], edge["to"]) for edge in edges],
            [("N0", "N1"), ("N1", "N2")],
        )
        self.assertIn("graph TD", mermaid)
        self.assertIn('N0["First step"]', mermaid)
        self.assertIn("N1 --> N2", mermaid)

    def test_graph_builder_uses_one_node_for_single_qwen_line(self):
        regions = [{
            "id": "qwen-vl-transcription",
            "type": "transcription",
            "box": [0, 0, 100, 100],
            "text": "Only step",
        }]

        nodes, edges, mermaid = main._build_graph(regions)

        self.assertEqual([node["label"] for node in nodes], ["Only step"])
        self.assertEqual(edges, [])
        self.assertIn('N0["Only step"]', mermaid)


if __name__ == "__main__":
    unittest.main()
