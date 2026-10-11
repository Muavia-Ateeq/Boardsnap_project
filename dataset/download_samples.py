"""
BoardSnap – Roboflow dataset downloader
=======================================
Downloads two public Roboflow Universe datasets used as the BoardSnap benchmark:

  1. Whiteboard (taerua/whiteboard-ctvgi) v1
     - 8,784 images, instance-segmentation labels
     - Classes: pen, whiteboard

  2. Handwriting Detection (handwriting-detection-zfowd/handwriting-detection-eoxpj) v8
     - 361 images, object-detection labels
     - Class: handwriting

Both are licensed CC BY 4.0. Keep attribution when redistributing exports.

Usage (PowerShell):
    pip install -r dataset\requirements.txt
    $env:ROBOFLOW_API_KEY = "your-api-key-here"
    python dataset\download_samples.py

Optional flags:
    --format      Export format (default: yolov8).  Any Roboflow export format works.
    --output-dir  Destination root directory (default: dataset\roboflow).
    --overwrite   Re-download even if the directory already exists.
"""

import argparse
import json
import os
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Datasets to download
# ---------------------------------------------------------------------------
DATASETS = [
    {
        "workspace": "taerua",
        "project": "whiteboard-ctvgi",
        "version": 1,
        "label": "whiteboard-v1",
        "description": "Whiteboard region & pen segmentation (8 784 images, CC BY 4.0)",
        "source_url": "https://universe.roboflow.com/taerua/whiteboard-ctvgi",
        "license": "CC BY 4.0",
    },
    {
        "workspace": "handwriting-detection-zfowd",
        "project": "handwriting-detection-eoxpj",
        "version": 8,
        "label": "handwriting-v8",
        "description": "Handwriting region detection (361 images, CC BY 4.0)",
        "source_url": "https://universe.roboflow.com/handwriting-detection-zfowd/handwriting-detection-eoxpj",
        "license": "CC BY 4.0",
    },
]

# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Download BoardSnap Roboflow datasets",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--format",
        default="yolov8",
        help="Roboflow export format (default: yolov8)",
    )
    parser.add_argument(
        "--output-dir",
        default=str(Path(__file__).parent / "roboflow"),
        help="Root directory where datasets are saved (default: dataset/roboflow)",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Re-download even if destination directory already exists",
    )
    return parser.parse_args()


# ---------------------------------------------------------------------------
# Download helpers
# ---------------------------------------------------------------------------

def check_roboflow_installed() -> None:
    try:
        import roboflow  # noqa: F401
    except ImportError:
        print("[ERROR] 'roboflow' package not found.")
        print("        Run:  pip install -r dataset\\requirements.txt")
        sys.exit(1)


def get_api_key() -> str:
    key = os.environ.get("ROBOFLOW_API_KEY", "").strip()
    if not key:
        print("[ERROR] ROBOFLOW_API_KEY environment variable is not set.")
        print("        Set it with:")
        print('            $env:ROBOFLOW_API_KEY = "your-api-key"   # PowerShell')
        print('            export ROBOFLOW_API_KEY="your-api-key"   # bash/zsh')
        print("        Get a free API key at https://app.roboflow.com/")
        sys.exit(1)
    return key


def download_dataset(ds: dict, api_key: str, fmt: str, output_dir: Path, overwrite: bool) -> dict:
    """Download one dataset and return a manifest entry."""
    from roboflow import Roboflow

    dest = output_dir / ds["label"]
    if dest.exists() and not overwrite:
        print(f"  [SKIP] {ds['label']} already exists at {dest}  (use --overwrite to re-download)")
        image_count = sum(1 for _ in dest.rglob("*.jpg")) + sum(1 for _ in dest.rglob("*.png"))
        return {**ds, "local_path": str(dest), "image_count": image_count, "status": "cached"}

    print(f"  [GET ] {ds['label']}  ({ds['description']})")
    rf = Roboflow(api_key=api_key)
    project = rf.workspace(ds["workspace"]).project(ds["project"])
    version = project.version(ds["version"])

    # Roboflow SDK downloads into the CWD by default; we temporarily switch.
    prev_cwd = Path.cwd()
    dest.parent.mkdir(parents=True, exist_ok=True)
    os.chdir(dest.parent)
    try:
        dataset = version.download(fmt, location=str(dest), overwrite=overwrite)
    finally:
        os.chdir(prev_cwd)

    image_count = sum(1 for _ in dest.rglob("*.jpg")) + sum(1 for _ in dest.rglob("*.png"))
    print(f"  [OK ] {image_count} images saved to {dest}")

    return {**ds, "local_path": str(dest), "image_count": image_count, "status": "downloaded"}


# ---------------------------------------------------------------------------
# Manifest writer
# ---------------------------------------------------------------------------

def write_manifest(results: list[dict], output_dir: Path) -> None:
    manifest_path = Path(__file__).parent / "manifest.json"
    manifest = {
        "boardsnap_dataset": {
            "description": "BoardSnap benchmark dataset – Roboflow Universe exports",
            "note": (
                "These datasets detect whiteboard and handwriting regions. "
                "They do NOT provide transcribed text for OCR training. "
                "Evaluate each task on its matching held-out split."
            ),
            "datasets": results,
        }
    }
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"\n  Manifest written to {manifest_path}")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> None:
    args = parse_args()
    check_roboflow_installed()
    api_key = get_api_key()

    output_dir = Path(args.output_dir)
    fmt = args.format

    print("\nBoardSnap – Roboflow Dataset Downloader")
    print("=" * 45)
    print(f"  Format     : {fmt}")
    print(f"  Output dir : {output_dir}")
    print(f"  Datasets   : {len(DATASETS)}")
    print()

    results = []
    for ds in DATASETS:
        try:
            entry = download_dataset(ds, api_key, fmt, output_dir, args.overwrite)
            results.append(entry)
        except Exception as exc:
            print(f"  [FAIL] {ds['label']}: {exc}")
            results.append({**ds, "status": "failed", "error": str(exc)})

    write_manifest(results, output_dir)

    ok = [r for r in results if r.get("status") in ("downloaded", "cached")]
    fail = [r for r in results if r.get("status") == "failed"]

    print("\nSummary")
    print("-------")
    for r in results:
        icon = "✓" if r.get("status") in ("downloaded", "cached") else "✗"
        count = r.get("image_count", "?")
        print(f"  {icon} {r['label']:30s}  {count} images  [{r.get('status', '?')}]")

    if fail:
        print(f"\n[WARN] {len(fail)} dataset(s) failed. Check API key and network.")
        sys.exit(1)
    else:
        total = sum(r.get("image_count", 0) for r in ok)
        print(f"\n  All {len(ok)} datasets ready. Total images: {total}")
        print("  Attribution: CC BY 4.0 – cite source URLs in your submission.")


if __name__ == "__main__":
    main()
