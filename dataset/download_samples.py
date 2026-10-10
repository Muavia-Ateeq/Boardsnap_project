"""Download whiteboard and handwriting datasets from Roboflow Universe."""

import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import sys


BASE_DIR = Path(__file__).resolve().parent
IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
DATASETS = {
    "whiteboard": {
        "workspace": "taerua",
        "project": "whiteboard-ctvgi",
        "version": 1,
        "task": "instance-segmentation",
        "classes": ["pen", "whiteboard"],
        "license": "CC BY 4.0",
    },
    "handwriting": {
        "workspace": "handwriting-detection-zfowd",
        "project": "handwriting-detection-eoxpj",
        "version": 8,
        "task": "object-detection",
        "classes": ["handwriting"],
        "license": "CC BY 4.0",
    },
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Download whiteboard and handwriting datasets from Roboflow."
    )
    parser.add_argument(
        "--format",
        default="yolov8",
        help="Roboflow export format for both datasets (default: yolov8).",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        help="Destination root (defaults to dataset/roboflow).",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Allow Roboflow to replace existing exports.",
    )
    args = parser.parse_args()

    if not os.getenv("ROBOFLOW_API_KEY"):
        parser.error("Set the ROBOFLOW_API_KEY environment variable first.")
    return args


def count_split_images(dataset_dir: Path) -> dict[str, int]:
    counts: dict[str, int] = {}
    for split in ("train", "valid", "test"):
        split_dir = dataset_dir / split
        if split_dir.is_dir():
            counts[split] = sum(
                1
                for path in split_dir.rglob("*")
                if path.is_file() and path.suffix.lower() in IMAGE_SUFFIXES
            )
    return counts


def download_dataset() -> int:
    args = parse_args()
    api_key = os.environ["ROBOFLOW_API_KEY"]

    try:
        from roboflow import Roboflow
    except ImportError as error:
        print(
            "Roboflow SDK is required. Install it with: "
            "pip install -r dataset/requirements.txt",
            file=sys.stderr,
        )
        raise SystemExit(1) from error

    client = Roboflow(api_key=api_key)
    output_root = (args.output_dir or BASE_DIR / "roboflow").resolve()
    downloaded_datasets = {}

    for name, config in DATASETS.items():
        output_dir = output_root / f"{name}-v{config['version']}"
        version = (
            client.workspace(config["workspace"])
            .project(config["project"])
            .version(config["version"])
        )
        version.download(
            args.format,
            location=str(output_dir),
            overwrite=args.overwrite,
        )
        downloaded_datasets[name] = {
            **config,
            "source_url": (
                f"https://universe.roboflow.com/{config['workspace']}/"
                f"{config['project']}"
            ),
            "format": args.format,
            "output_dir": os.path.relpath(output_dir, BASE_DIR),
            "image_counts_by_split": count_split_images(output_dir),
        }
        print(
            f"Downloaded {name}: "
            f"{downloaded_datasets[name]['image_counts_by_split']}"
        )

    manifest = {
        "source": "Roboflow Universe",
        "downloaded_at": datetime.now(timezone.utc).isoformat(),
        "datasets": downloaded_datasets,
    }
    manifest_path = BASE_DIR / "manifest.json"
    manifest_path.write_text(
        json.dumps(manifest, indent=2) + "\n",
        encoding="utf-8",
    )

    print(f"Dataset exports saved under: {output_root}")
    print(f"Dataset details saved to: {manifest_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(download_dataset())
