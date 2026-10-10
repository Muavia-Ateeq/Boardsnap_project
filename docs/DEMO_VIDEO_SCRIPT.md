# BoardSnap - 2:40 Demo Video Script
**Target Duration:** 2 minutes 40 seconds (Strict limit: Under 3 minutes)  
**Platform:** Public YouTube  
**Speakers:** Moyeon, Ammar, Muavia, Awais  
**Event:** Banana Hacks 2026 (Devpost)

---

### [0:00 - 0:20] Hook & Problem Statement
- **Speaker:** Moyeon (On Camera / Voiceover)
- **Visual:** Hold up a phone showing a dark, skewed, glare-covered photo of a classroom whiteboard. Zoom in on messy handwriting that is impossible to read.
- **Audio:**  
  *"We’ve all done it: class ends or a team brainstorm finishes, and you snap a quick photo of the whiteboard. But be honest—that photo just rots in your camera roll. The handwriting is skewed, the glare makes it unreadable, diagrams can't be edited, and nobody turns it into study material. A whiteboard photo is NOT notes. That’s why our team built BoardSnap."*

---

### [0:20 - 0:50] Inspiration & Engineering Approach
- **Speaker:** Ammar (Voiceover)
- **Visual:** Quick cuts of GitHub commits, architecture sketch, and team task board showing Ammar, Muavia, Moyeon, and Awais.
- **Audio:**  
  *"I’m Ammar. For Banana Hacks, we wanted to build something that isn't just another thin API wrapper. Pure LLMs hallucinate whiteboard text and can't understand spatial arrows. So we split the engineering: Muavia built our OpenCV cleanup and fine-tuned a custom shape detector in PyTorch; Awais built our strictly grounded LLM pipeline and RAG index; Moyeon engineered our high-speed React app and gathered our 40-board test dataset; and I architected the agentic orchestration API."*

---

### [0:50 - 1:50] Live Product Walkthrough
- **Visual:** Full-screen browser demo of BoardSnap (Moyeon driving UI).
- **Speaker:** Ammar (Voiceover) with Moyeon on screen actions.
- **Actions & Narration:**
  - **[0:50 - 1:05] Upload & Autonomous Quality Check**:  
    *Moyeon drags in a messy whiteboard photo. Show the 6-stage autonomous pipeline ticker running.*  
    *"Watch what happens when Moyeon uploads this raw, skewed architecture board. In under 5 seconds, our OpenCV pipeline rectifies perspective, filters specular glare, and runs a quality check. If a photo is too blurry, BoardSnap stops early and politely requests a retake."*
  - **[1:05 - 1:20] Region Detection & Diagram Rebuilding**:  
    *Moyeon toggles the 'Show Regions' overlay on the side-by-side view, showing bounding boxes around text and arrows. Then scroll to the rebuilt Mermaid flowchart.*  
    *"Look at the side-by-side: our custom detector separates text blocks from shapes and arrows. Our graph builder connects arrow paths to boxes and reconstructs the flowchart into an editable, interactive Mermaid diagram that you can copy or export as SVG."*
  - **[1:20 - 1:38] Grounded Notes & Export**:  
    *Scroll to Structured Notes: Title, Key Takeaways, Definitions, and Action Items. Click 'Copy Markdown' and show '100% Grounded' badge.*  
    *"Next, our grounded language layer turns the extracted board into structured study notes—complete with key concepts, definitions, and action items. Every single line is verified against extracted board text—zero hallucinations."*
  - **[1:38 - 1:50] Active Recall Quiz & RAG Chat**:  
    *Moyeon clicks option B on Question 1—it turns green with explanation revealed. Switch to Flashcard mode. Type 'What did we decide about the DLQ?' in RAG chat.*  
    *"Finally, BoardSnap generates active recall quiz questions and flashcards. You can even chat with your board using our RAG store to query past decisions with exact citations."*

---

### [1:50 - 2:20] How It Works & Quantitative Benchmark
- **Speaker:** Muavia & Awais
- **Visual:** Pipeline architecture graphic, followed by the Evaluation Table from `docs/EVALUATION_REPORT.md` shown on screen.
- **Muavia [1:50 - 2:05]:**  
  *"Under the hood, we trained our region detector on whiteboard primitives, achieving 88.1% macro precision across 288 test shapes. For OCR, we benchmarked Tesseract against PaddleOCR and TrOCR, achieving 86.4% word accuracy with our contextual lexicon filter. Our spatial graph builder successfully linked 88% of flowchart arrows."*
- **Awais [2:05 - 2:20]:**  
  *"On the language side, we reviewed 20 boards line-by-line and verified a 0% hallucination rate because the model is strictly constrained to extracted tokens. Across our 40 real-world board photos gathered across the team, average end-to-end processing time was just 4.8 seconds."*

---

### [2:20 - 2:40] Impact & Next Steps
- **Speaker:** Ammar
- **Visual:** Team photo / credits slide, Devpost banner, and GitHub link.
- **Audio:**  
  *"BoardSnap empowers university students, teachers, and engineering teams to turn transient whiteboards into permanent, actionable study guides. Next month, we plan to add multilingual Urdu OCR support and multi-board synthesizers. Thank you to the Banana Hacks organizers—try BoardSnap live today!"*

---

### Production Checklist for Moyeon:
1. Screen recording in 1080p 60fps with clear audio.
2. Video length between 2:30 and 2:45 (do NOT exceed 3:00).
3. Set YouTube visibility to **Public** or **Unlisted** (Devpost judges need access).
4. Include repo link and Devpost link in description.
