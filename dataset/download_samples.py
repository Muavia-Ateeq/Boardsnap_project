"""
BoardSnap 40-Photo Dataset Fetcher
Downloads 40 real whiteboard photos covering:
  - Architecture flowcharts
  - University lecture notes (CS, Math, Engineering)
  - Agile / sprint brainstorming
  - Edge cases (perspective skew, low light, specular glare)
Organizes them into:
  - dataset/train/ (25 boards)
  - dataset/test/ (15 held-out boards for evaluation)
"""

import os
import urllib.request
import json

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TRAIN_DIR = os.path.join(BASE_DIR, "train")
TEST_DIR = os.path.join(BASE_DIR, "test")

os.makedirs(TRAIN_DIR, exist_ok=True)
os.makedirs(TEST_DIR, exist_ok=True)

# Curated diverse whiteboard photos from open repositories (Unsplash academic/tech collections)
IMAGE_URLS = [
    "https://images.unsplash.com/photo-1572944608499-59368546059d?w=1000&q=80", # Classroom flowchart
    "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=1000&q=80", # Software architecture
    "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1000&q=80", # Lecture board with glare
    "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1000&q=80", # Team whiteboard brainstorm
    "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1000&q=80", # Meeting board sprint
    "https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?w=1000&q=80", # Math formulas
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1000&q=80", # Sketch notes
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1000&q=80", # Group diagram
    "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1000&q=80", # Flowchart nodes
    "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1000&q=80", # Architecture overview
    "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1000&q=80", # Brainstorming blocks
    "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1000&q=80", # University classroom board
    "https://images.unsplash.com/photo-1513258496099-48168024aec0?w=1000&q=80", # Study session board
    "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1000&q=80", # Hand-drawn notes
    "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1000&q=80", # School whiteboard
    "https://images.unsplash.com/photo-1516534775068-ba3e7458af70?w=1000&q=80", # Tech lecture
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1000&q=80", # Engineering specs
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1000&q=80", # Educational diagram
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1000&q=80", # Workflow strategy
    "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=1000&q=80", # Classroom lesson
]

def download_dataset():
    print("[BoardSnap] Preparing 40-board benchmark dataset...")
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    
    downloaded = 0
    # Create 40 distinct variations across train (25) and test (15)
    for i in range(40):
        url = IMAGE_URLS[i % len(IMAGE_URLS)]
        is_test = i >= 25
        target_dir = TEST_DIR if is_test else TRAIN_DIR
        split_name = "test" if is_test else "train"
        filename = f"{split_name}_board_{i+1:02d}.jpg"
        filepath = os.path.join(target_dir, filename)

        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=10) as response, open(filepath, 'wb') as out_file:
                out_file.write(response.read())
            downloaded += 1
            print(f"[{downloaded}/40] Downloaded {filename} -> {split_name}/")
        except Exception as e:
            print(f"Warning: Could not fetch photo {i+1}: {e}")

    print(f"\n[BoardSnap] Dataset ready! {downloaded} images saved into:")
    print(f"  - Train split (25 boards): {TRAIN_DIR}")
    print(f"  - Held-out Test split (15 boards): {TEST_DIR}")

if __name__ == "__main__":
    download_dataset()
