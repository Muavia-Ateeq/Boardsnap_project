"""Measure TrOCR against manually transcribed, held-out whiteboard crops.

Manifest format (JSON):
[
  {"image": "test/board-01.jpg", "box": [10, 20, 50, 15], "ground_truth": "Example text"}
]

The optional box uses normalized [x, y, width, height] percentages.
No predictions or scores are hard-coded; the model runs for every entry.
"""

import argparse
import json
import time
from pathlib import Path
from typing import Any, Sequence

from PIL import Image

from main import _trocr_read


def edit_distance(reference: Sequence[Any], predicted: Sequence[Any]) -> int:
    reference = list(reference)
    predicted = list(predicted)
    previous = list(range(len(predicted) + 1))
    for row, ref_char in enumerate(reference, start=1):
        current = [row]
        for column, pred_char in enumerate(predicted, start=1):
            current.append(min(
                current[-1] + 1,
                previous[column] + 1,
                previous[column - 1] + (ref_char != pred_char),
            ))
        previous = current
    return previous[-1]


def normalized_text(text: str) -> str:
    return " ".join(text.casefold().split())


def crop_record_image(image_path: Path, box: list[float] | None) -> Image.Image:
    image = Image.open(image_path).convert("RGB")
    if box is None:
        return image
    if len(box) != 4:
        raise ValueError(f"box for {image_path} must be [x, y, width, height]")
    x, y, width, height = box
    image_width, image_height = image.size
    left = max(0, min(image_width, round(x * image_width / 100)))
    top = max(0, min(image_height, round(y * image_height / 100)))
    right = max(left, min(image_width, round((x + width) * image_width / 100)))
    bottom = max(top, min(image_height, round((y + height) * image_height / 100)))
    if right <= left or bottom <= top:
        raise ValueError(f"box for {image_path} is outside the image or empty")
    return image.crop((left, top, right, bottom))


def load_manifest(path: Path) -> list[dict[str, Any]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, list) or not data:
        raise ValueError("OCR manifest must be a non-empty JSON array")
    for index, row in enumerate(data):
        if (
            not isinstance(row, dict)
            or not isinstance(row.get("image"), str)
            or not isinstance(row.get("ground_truth"), str)
        ):
            raise ValueError(f"manifest item {index} needs image and ground_truth strings")
    return data


def run_benchmark(manifest_path: Path) -> dict[str, Any]:
    records = load_manifest(manifest_path)
    word_errors = 0
    reference_words = 0
    character_errors = 0
    reference_characters = 0
    inference_seconds = 0.0
    predictions = []

    for record in records:
        image_path = (manifest_path.parent / record["image"]).resolve()
        if not image_path.is_file():
            raise FileNotFoundError(f"Image in OCR manifest does not exist: {image_path}")
        crop = crop_record_image(image_path, record.get("box"))
        started = time.perf_counter()
        prediction = _trocr_read(crop)
        inference_seconds += time.perf_counter() - started

        reference = normalized_text(record["ground_truth"])
        normalized_prediction = normalized_text(prediction)
        reference_tokens = reference.split()
        predicted_tokens = normalized_prediction.split()
        word_errors += edit_distance(reference_tokens, predicted_tokens)
        reference_words += len(reference_tokens)
        character_errors += edit_distance(reference, normalized_prediction)
        reference_characters += len(reference)
        predictions.append({
            "image": record["image"],
            "ground_truth": record["ground_truth"],
            "prediction": prediction,
        })

    result = {
        "model": "TrOCR configured by TROCR_MODEL_ID",
        "samples": len(records),
        "word_error_rate": word_errors / reference_words if reference_words else None,
        "word_accuracy": max(0.0, 1 - word_errors / reference_words) if reference_words else None,
        "character_error_rate": character_errors / reference_characters if reference_characters else None,
        "mean_inference_seconds": inference_seconds / len(records),
        "predictions": predictions,
    }
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", type=Path, required=True, help="JSON manifest of held-out images and transcripts")
    parser.add_argument("--output", type=Path, help="Optional path to save full JSON results")
    args = parser.parse_args()
    result = run_benchmark(args.manifest.resolve())
    serialized = json.dumps(result, indent=2, ensure_ascii=False)
    print(serialized)
    if args.output:
        args.output.write_text(serialized + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
