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
  *"I’m Ammar. For Banana Hacks, we split the engineering across the React workspace, an Express orchestration API, OpenCV image cleanup, configurable Roboflow vision workflows, and a language-model service. The pipeline turns an uploaded board into reviewable OCR output, a heuristic diagram, draft notes, and quiz questions."*

---

### [0:50 - 1:50] Live Product Walkthrough
- **Visual:** Full-screen browser demo of BoardSnap (Moyeon driving UI).
- **Speaker:** Ammar (Voiceover) with Moyeon on screen actions.
- **Actions & Narration:**
  - **[0:50 - 1:05] Upload & Autonomous Quality Check**:  
    *Moyeon drags in a messy whiteboard photo. Show the 6-stage autonomous pipeline ticker running.*  
    *"Watch what happens when Moyeon uploads this raw, skewed architecture board. In under 5 seconds, our OpenCV pipeline rectifies perspective, filters specular glare, and runs a quality check. If a photo is too blurry, BoardSnap stops early and politely requests a retake."*
  - **[1:05 - 1:20] Region Detection & Diagram Rebuilding**:
    *Moyeon toggles the 'Show Regions' overlay on the side-by-side view, showing detected regions. Then scroll to the generated Mermaid flowchart.*
    *"The configured vision workflow proposes regions. Our graph builder uses spatial heuristics to create a Mermaid diagram that you can copy or export as SVG."*
  - **[1:20 - 1:38] Grounded Notes & Export**:
    *Scroll to Structured Notes: Title, Key Takeaways, Definitions, and Action Items. Click 'Copy Markdown'.*
    *"Next, our language layer drafts structured notes from the extracted board content. AI output can be imperfect, so the app clearly asks users to review it."*
  - **[1:38 - 1:50] Active Recall Quiz & Board Chat**:
    *Moyeon clicks an answer, switches to Flashcard mode, and asks a question about the current board.*
    *"Finally, BoardSnap generates quiz questions and flashcards. You can also ask a question with the current board content supplied as context."*

---

### [1:50 - 2:20] How It Works & Quantitative Benchmark
- **Speaker:** Muavia & Awais
- **Visual:** Pipeline architecture graphic, followed by the Evaluation Table from `docs/EVALUATION_REPORT.md` shown on screen.
- **Muavia [1:50 - 2:05]:**  
  *"Under the hood, OpenCV cleans and scores the image, configured Roboflow workflows provide detection and OCR, and a spatial heuristic builds a Mermaid diagram. We have not yet published verified model-accuracy measurements, so we describe these as implementation capabilities rather than benchmark results."*
- **Awais [2:05 - 2:20]:**  
  *"The language service uses the current board as context for notes, quizzes, and chat. Its prompts request evidence-based output, but generated answers still need human review. Our bundled sample boards are interface demos, not evaluation data."*

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
