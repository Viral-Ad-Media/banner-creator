# Banner Creator (Social Studio AI)

AI-assisted social content studio for generating campaign-ready banners, editing visuals, and exporting final assets.

## Overview

This project is a Vite + React + TypeScript application with two primary workflows:

1. `Banner Generator`: turns a user prompt into structured campaign copy, image prompts, generated visuals, and editable layouts.
2. `Image Studio`: prompt-driven image editing with undo history and export.

The app uses the Gemini API through `@google/genai` for:

- structured banner plan generation (`gemini-2.5-flash`)
- image generation and editing (`gemini-2.5-flash-image`)

## Key Features

- Multi-slide campaign planning from a single prompt.
- Aspect ratio presets for social formats (`1:1`, `4:5`, `9:16`, `16:9`, `3:4` internal editor support).
- Optional uploaded background and brand asset support.
- Visual editor with:
  - drag/resize/rotate
  - text styling
  - layer ordering
  - background pan/zoom/opacity
  - AI background generation and magic image edits
- Image Studio with iterative edit history and undo.
- Export/download as PNG.

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS (CDN config in `index.html`)
- `@google/genai`
- `lucide-react`

## Prerequisites

- Node.js 18+ (recommended: Node.js 20+)
- npm 9+
- Gemini API key

## Environment Configuration

Create `.env.local` in the project root:

```bash
VITE_GEMINI_API_KEY=your_api_key_here
```

Supported fallback names in this codebase:

- `VITE_GEMINI_API_KEY` (recommended)
- `GEMINI_API_KEY`
- `API_KEY`

`vite.config.ts` also maps selected env values into `process.env.*` for compatibility with client code paths.

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run dev
```

3. Open:

```text
http://localhost:3000
```

## Production Build

```bash
npm run build
npm run preview
```

## Scripts

- `npm run dev`: start Vite dev server.
- `npm run build`: create production bundle.
- `npm run preview`: serve production build locally.

## Project Structure

```text
.
├── App.tsx
├── index.tsx
├── index.html
├── components
│   ├── CopyGenerator.tsx
│   ├── ImageStudio.tsx
│   ├── CanvasEditor.tsx
│   └── ui
│       └── Button.tsx
├── services
│   └── geminiService.ts
├── vite.config.ts
└── tsconfig.json
```

## Architecture Notes

### App Shell

- `App.tsx` controls tab state between `CopyGenerator` and `ImageStudio`.

### Banner Generator Flow (`components/CopyGenerator.tsx`)

1. Collect prompt/config/assets.
2. Request a structured banner plan from `generateBannerPlan`.
3. Generate images for each slot with `generateImage` (or use uploaded background).
4. Open `CanvasEditor` per slide for manual refinement.
5. Save edited assets and export.

Important implementation details:

- Async request guard (`generationRunRef`) prevents stale generation results from previous runs overwriting current state.
- Image map initialization is batched when a shared uploaded background is used.
- Popup polling/timers are tracked and cleaned up to avoid leaks.

### Canvas Editor (`components/CanvasEditor.tsx`)

- Maintains canvas elements and background transform state.
- Stores history snapshots for undo/redo.
- Exports composed result via an offscreen `<canvas>`.

Recent optimization in this codebase:

- history snapshots now use a shared deep-clone helper (`structuredClone` with JSON fallback) instead of repeated ad-hoc cloning paths.

### Image Studio (`components/ImageStudio.tsx`)

- Upload source image.
- Run iterative prompt edits with Gemini.
- Keep bounded edit history (memory protection) and allow undo.

### Gemini Service (`services/geminiService.ts`)

- Lazy API client initialization.
- Structured schema-driven JSON output for banner plans.
- Data URL parsing/validation helpers for image generation/edit workflows.
- Better error surfacing when image models return text refusals instead of image bytes.

## Data & State Model (High Level)

- `plan`: structured campaign object with `main_banner`, `additional_banners`, and `seo`.
- `generatedImages`: rendered/edited preview images by slot id.
- `rawBackgrounds`: pristine generated/uploaded backgrounds used when entering editor.
- `savedLayers`: persisted editor element state per slot.
- `editorBackgrounds`: persisted editor background mode/value/transform state.

## API and Model Behavior

- Banner planning uses `gemini-2.5-flash` with JSON schema response.
- Image generation/editing uses `gemini-2.5-flash-image`.
- `4:5` is mapped to `3:4` in image generation config where required by model constraints.

## Troubleshooting

### “Missing Gemini API key”

- Ensure `.env.local` exists and includes `VITE_GEMINI_API_KEY`.
- Restart the dev server after changing env variables.

### Popup-based social connect does not open

- Browser popup blocking is enabled. Allow popups for local dev host.

### Image generation/edit fails with refusal

- Simplify prompts and avoid disallowed content.
- Retry with less specific or less sensitive wording.

### Slow editor behavior with large assets

- Use smaller input files where possible.
- Reduce number of stacked elements before export.

## Security Notes

- Do not commit `.env.local`.
- Treat API keys as secrets.
- Client-side API usage is acceptable for prototyping, but production deployments should usually proxy model calls through a secure backend.

## Suggested Next Improvements

1. Add automated tests for service parsing and core state reducers.
2. Add explicit loading/error toasts (instead of inline status only).
3. Move Tailwind config from CDN runtime setup to a build-time Tailwind pipeline.
4. Add model/provider abstraction for easier provider swaps.
