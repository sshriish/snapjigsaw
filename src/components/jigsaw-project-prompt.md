# Project Build Prompt: "SnapJigsaw" (working title)

Use this as a prompt for an AI coding assistant (Claude Code, Cursor, etc.) or as a spec for a developer.

---

## 1. Concept Summary

A web app (must work on both laptop and phone browsers) where:

1. User opens the app and sees a live camera preview inside a bordered box.
2. A 4-second countdown runs (with a countdown beep), then a photo is automatically captured with a shutter sound.
3. User gets a **retake option** here if the photo came out bad (eyes closed, blur, bad lighting) — before anything else happens.
4. User picks a visual **filter** (cinematic, vintage, sepia, black & white, VHS/grain, warm film, cool tone, grainy 35mm, polaroid-classic). The filter is **baked into the image at this point** — what they see is what they'll solve and what they'll eventually get.
5. The filtered photo is sliced into a jigsaw puzzle at the user's chosen difficulty (3x3 easy / 4x4 default / 5x5 hard — harder tiers unlock as the user collects more polaroids) and shown scrambled on screen.
6. The user solves the puzzle: drag pieces into place on desktop, tap-to-swap on mobile. An optional **ghost preview** (faint outline of the full image, fading out after a few seconds) can be toggled for an easier mode. An optional **rotation mode** adds rotated pieces for advanced difficulty.
7. A visible **attempt counter** ("Attempt 1 of 3") and a **streak** ("2 of 3 to your next polaroid") are shown during solving, plus a non-punishing stopwatch for personal bests.
8. The user can **discard** a puzzle at any point and start over with a new photo — this does not break their streak, it just restarts the current attempt.
9. After **3 successful solves in a row**, the user is awarded a **digital polaroid**: the final image (filter already applied) rendered in a polaroid frame, with a handwritten-style date stamp and optional caption.
10. **After the puzzle is solved and the polaroid is being generated**, an AI enhancement pass runs on the final image only — sharpening/denoising/upscaling it so it looks good enough to post on Instagram or elsewhere, compensating for a possibly bad laptop webcam. This step never touches the puzzle-solving image, only the final reward image, so puzzle generation stays fast.
11. Earned polaroids are saved to a personal **Polaroid Wall** — a scrapbook-style gallery — where the user can revisit, download, or share them. Hitting streak milestones (e.g. 3-in-a-row without a discard) can unlock rarer polaroid frame styles.

---

## 2. Core Screens / Components

- **Landing / Start screen** — brief instructions, difficulty selector (locked tiers shown as locked), "Start" button, camera permission prompt.
- **Capture screen** — live camera feed in a bordered box, 4-second visible countdown with beep, shutter animation/sound at capture, retake button.
- **Filter selection screen** — thumbnail previews of the captured photo with each filter applied; user picks one; this becomes the final image used for both the puzzle and the eventual polaroid.
- **Puzzle screen** — scrambled grid (3x3/4x4/5x5) in a bordered box, piece tray or in-place scramble, drag/tap-to-swap interaction, discard button, attempt counter, streak indicator, ghost-preview toggle, rotation-mode toggle (if unlocked), stopwatch.
- **Success screen** — shown after each successful solve, showing updated streak progress; on the 3rd in a row, transitions into the Polaroid Reveal flow.
- **Polaroid Reveal screen** — runs the AI enhancement pass on the final image, then shows an animated "developing" reveal of the polaroid; lets the user add a caption, choose an unlocked frame style, save, download, or share.
- **Polaroid Wall / Gallery screen** — grid of all previously earned polaroids, viewable anytime, downloadable individually.

---

## 3. Functional Requirements

### Camera capture
- Use `getUserMedia` for camera access; front camera by default, with a camera-switch option on mobile if multiple exist.
- Must work on both desktop webcams and mobile phone cameras — test aspect ratios/orientations for both.
- 4-second visible countdown with an audible beep before auto-capture.
- Retake option shown immediately after capture, before the filter step.

### Filters (applied first, before puzzle generation)
- Filter set: cinematic, vintage, sepia, black & white, VHS/grain, warm film tone, cool tone, grainy 35mm, classic polaroid.
- Implement via CSS filters or canvas pixel manipulation (canvas preferred, since the result needs to be "baked in" to a static image used for both slicing and the final polaroid, not just a live CSS overlay).
- Once chosen, the filtered image is final — it's the one image used for the puzzle, and later, the polaroid.

### AI image enhancement (runs once, only on the final image, only after a successful 3-streak — right before the polaroid reveal)
- Purpose: fix quality issues from a poor laptop/phone camera (noise, low light, softness) so the final polaroid image is sharp enough to post on social media.
- **Architecture goal: fully client-side.** Prefer running enhancement entirely in-browser so there's no cost and no privacy concern from uploading photos to a third party.
  - Recommended approach: TensorFlow.js with a lightweight pretrained super-resolution / denoise model (e.g. a distilled ESRGAN-style model converted to TF.js, or a simpler unsharp-mask + auto brightness/contrast/denoise pipeline via canvas/WebGL if a full ML model proves too heavy for phones).
  - This keeps everything free and private, and avoids any API key/rate-limit management.
- **If a hosted API is preferred instead** (e.g. because in-browser model quality isn't good enough), use only genuinely free-tier options and be explicit about the limits:
  - Hugging Face Inference API free tier (can host Real-ESRGAN/GFPGAN-style models) — free but rate-limited, and calling it directly from the browser means the API key/token is exposed client-side, which is a real limitation for a public app (fine for personal/small-scale use, but worth flagging).
  - If this route is chosen, add a fallback: if the API call fails or is rate-limited, fall back to the client-side enhancement so the flow never breaks.
- Only apply this pass to the final polaroid image — never to the puzzle-solving image — so puzzle scrambling/loading stays fast.

### Jigsaw puzzle mechanics
- Difficulty tiers: 3x3 (9 pieces, easy/default unlocked), 4x4 (16 pieces, default), 5x5 (25 pieces, hard). Harder tiers unlock progressively as the user earns more polaroids (define thresholds, e.g. 4x4 unlocked from the start, 5x5 unlocks after N polaroids).
- Slice the chosen (filtered) image into a grid using canvas `drawImage` with source rectangles, based on the selected tier.
- Scramble piece positions on puzzle start; ensure the scramble is always solvable given the interaction model (trivial for a swap-based puzzle).
- Interaction:
  - Desktop: drag-and-drop pieces into an empty grid.
  - Mobile: tap one piece then tap another to swap positions.
- Snap-to-place with a tolerance radius (avoid requiring pixel-perfect drops).
- Piece-lock feedback: snap sound + short animation + haptic vibration (Vibration API) on supported mobile devices.
- **Ghost preview toggle**: shows a faint, low-opacity outline of the full solved image for the first few seconds of a puzzle, then fades out. User-togglable, could be tied to difficulty (auto-off on hard mode).
- **Rotation mode** (advanced/optional): pieces also need rotating to the correct orientation, not just repositioning — offer as a toggle once unlocked, likely paired with harder tiers.
- **Attempt counter**: show "Attempt 1 of 3" (or similar) clearly during solving so the stakes toward the next polaroid are visible.
- **Discard**: available at any time during solving; discarding does not count as a failed attempt against the streak, it just resets the current puzzle so the user can retake a photo and try again.
- **Stopwatch**: a gentle, non-punishing timer shown during solving, tracked for the user's personal best times — purely informational, doesn't affect scoring.

### Streaks and rewards
- Track successful solves toward the current streak; a "successful trial" = a fully completed puzzle without discarding it mid-solve.
- A discard restarts the *current* puzzle attempt but does not reduce or reset the streak count — only an abandoned (started, then left unsolved) puzzle should be treated as neutral/no-op as well, since discard is the intended path for "I don't like this one."
- On the 3rd success in a row: trigger AI enhancement + Polaroid Reveal.
- Track longer streaks too (e.g. 3-in-a-row without ever discarding at all) as the unlock condition for rarer polaroid frame styles — this is a stricter bonus condition layered on top of the base 3-streak reward.

### Polaroid reward
- Render the final (filtered + AI-enhanced) image inside a polaroid frame graphic — white border, slight rotation for realism, optional.
- Multiple frame styles: a default style always available, and rarer styles unlocked via stricter streak conditions.
- Handwritten-style font for a date stamp; optional free-text caption field.
- "Developing" reveal animation (fade-in from blank/blurred to sharp).
- Save to a persistent, fully client-side **Polaroid Wall** (localStorage/IndexedDB — no login required for the MVP).
- Allow download as an image file, and native sharing via the Web Share API on supported mobile browsers (good for direct-to-Instagram-story style sharing).

### Cross-device requirements
- Fully responsive on both desktop (mouse/keyboard, webcam) and mobile (touch, phone camera) — verify both the drag path and the tap-to-swap path work well.
- Build as a **PWA** (manifest + service worker) so it can be installed on phones and reused like an app; since the architecture is fully client-side, most of it should also work offline (camera + puzzle + gallery), with the only online dependency being an optional hosted AI-enhancement fallback if you choose to include one.

---

## 4. Non-Functional Requirements

- **Privacy**: since the architecture is fully client-side, photos never need to leave the user's device — worth stating this clearly in the UI as a trust signal ("your photos stay on your device").
- **Performance**: puzzle should scramble and become interactive within about a second of the filter being chosen. The AI enhancement pass is the only deliberately "slow" step, and it only ever runs once per polaroid, after the puzzle is already solved — so it doesn't block the core loop.
- **Accessibility**: puzzle piece borders/edges distinguishable for colorblind users; consider keyboard-navigable piece selection as an alternative to drag-and-drop on desktop.
- **Resilience**: handle camera permission denial, no camera found, and low-light/blur gracefully (clear messaging, easy retry).

---

## 5. Suggested Tech Stack

- Frontend: React (or plain JS) + Canvas API for filtering/slicing
- Camera: `getUserMedia` (WebRTC)
- AI enhancement: TensorFlow.js running in-browser (primary, free, private); optional Hugging Face free-tier Inference API as a fallback only if in-browser quality isn't sufficient
- Storage: LocalStorage/IndexedDB for the Polaroid Wall (no backend needed for the MVP)
- PWA: Service worker + manifest for installability

---

## 6. Decisions Locked In

1. **Streak definition**: 3 successful solves in a row → polaroid. A discard does not break the streak; it only resets the current attempt.
2. **AI enhancement timing**: runs once, only on the final image, only after the 3rd successful solve — never during puzzle-solving.
3. **Architecture**: fully client-side; no mandatory backend or paid API.
4. **Filter timing**: applied immediately after capture/retake, before the puzzle is generated — the filtered image is used for both solving and the eventual polaroid.
5. **Storage**: local-device storage (no login) for the MVP Polaroid Wall.

## Still open (minor, can decide during build)
- Exact unlock thresholds for 5x5 difficulty and rotation mode (e.g. after X total polaroids).
- Exact bonus condition for rare frame styles (e.g. "3-in-a-row with zero discards" vs. some other streak variant).
- Whether to include the Hugging Face free-tier fallback at all, or keep it 100% in-browser from day one and add it later only if enhancement quality turns out insufficient.
