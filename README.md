# Banner Creator / Social Studio

React/TypeScript workspace for AI banner planning, image generation/editing, reusable avatars, canvas editing, and short video storyboards. Uses Supabase Auth and the separate [Banner Creator API](https://github.com/Viral-Ad-Media/banner-creator-api); provider and service-role keys stay on the server.

## Local setup

Use Node.js 22.12+ and npm. Clone both repositories into sibling directories named `banner-creator` and `banner-creator-api`.

```bash
npm ci
npm --prefix ../banner-creator-api ci
cp .env.example .env.local
cp ../banner-creator-api/.env.example ../banner-creator-api/.env
```

Configure the frontend:

```dotenv
VITE_API_BASE_URL=/api
VITE_BACKEND_URL=http://localhost:4000
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Only public browser configuration belongs in `VITE_*` variables. Set Gemini/OpenRouter and Supabase service-role credentials in the **API's** `.env`. See its [README](https://github.com/Viral-Ad-Media/banner-creator-api#readme) for server configuration.

Initialize a new Supabase database using the API's `supabase/schema.sql`. For an existing database, apply `supabase/migrations/20261005_audit_hardening.sql` before deploying the matching API. Do not replace an existing database with the fresh schema. Configure Supabase Email Auth and allowed redirect/site URLs; keep email confirmation enabled for production.

In separate terminals:

```bash
npm run backend:dev
npm run dev
```

Open `http://localhost:3000`; Vite proxies `/api` to the API at `http://localhost:4000`.

```bash
npm run check       # frontend types, regression tests, production build
npm run check:all   # both sibling repositories
npm audit
npm run preview    # preview an existing production build
```

CI runs `npm ci`, checks, and a dependency audit. Regression tests cover shared canvas dimensions, wrapping, explicit layer deletion, and image-deduplicated draft serialization. They do not exercise paid providers or browser media encoders; test those on a staging deployment with the supported browser and actual provider accounts.

## Workspace behavior

- **Banners:** plan a campaign, generate backgrounds, add text/CTA/assets, and edit layers. Card downloads and editor saves use the shared canvas renderer so overlays are included. Document height is 800 px, with width derived from the selected aspect ratio. Shapes, text wrapping, gradients, fonts, and layer order are composited into PNG exports. Fonts load before export; unavailable fonts use browser fallback.
- **Projects:** use Save/Load in the banner workspace to persist an editable project to your account. Saving is explicit; load restores campaign settings, backgrounds, and layers. New generations can reference the selected project. The API enforces owner access and project quotas.
- **Activity:** browse paginated generation history and open stored plan/image results or recover a video. Account output recovery survives clearing local drafts; provider video retention still applies. A recovered background is not a replacement for explicitly saving an editable project.
- **Drafts:** banner, image, and video workspaces save account-scoped drafts asynchronously in IndexedDB. Images are deduplicated within each draft. Existing localStorage drafts migrate only after a successful save. Storage failures display an error. Browser drafts stay on that device; project saves and generation history are server-backed. Closing the browser before a debounce/transaction completes can lose the latest edit.
- **Images/avatars:** uploads are resized/compressed before dispatch. PNG/JPEG/WebP inputs must fit the API's 1,000,000-character data URL limit; the optimized upload target is approximately 700 KB. The avatar library supports up to 12 entries per account.
- **Video:** generate clips and poll by server-issued `generationId`. Recent account video jobs recover when reopening the workspace. Legacy browser jobs with only a provider operation name are not trusted; recover through Activity. Gemini image-to-video uses 8 seconds. Pending video work reserves credits until the provider confirms success/failure.
- **Reels:** export one completed render per current scene, in storyboard order. Audio is mixed through Web Audio into the recorded output. All scenes must be complete and at least two are required. Export is recorded in real time and requires `MediaRecorder`, canvas capture, and Web Audio support. Output is WebM or MP4 according to browser support; silent provider clips remain silent. Keep the tab active during export.

Keyboard delete/undo shortcuts ignore editable form fields, and each layer's trash button deletes that layer. A transient profile-load failure offers retry without discarding a valid session. Generation request keys persist across interrupted requests and are chosen atomically across tabs to avoid buying duplicate work.

Gemini does not accept a 4:5 background ratio in this integration, so it generates a 3:4 background and the canvas crops it to the final 4:5 document. Video downloads are capped at **4,000,000 bytes** by the API; oversized clips return 413. Larger delivery needs an object-storage or streaming implementation.

## Plans and billing

| Tier       | Monthly credits | Project limit |
| ---------- | --------------: | ------------: |
| FREE       |             120 |             5 |
| PRO        |            3000 |           100 |
| ENTERPRISE |           50000 |          1000 |

Plans cost 3 credits, image generation/editing 5, and video 25. The API reserves credits transactionally before dispatch, settles successful work once, and releases confirmed failures. Billing periods use UTC and the generation's creation month. Available credits account for pending reservations. Provider timeouts may leave an uncertain reservation requiring operator review; starting duplicate paid work is not automatically authorized.

**Paid self-service billing is unavailable.** Checkout/portal endpoints return 501 and never grant paid entitlements. Pricing links contact support for paid access. PRO/ENTERPRISE require an operator to verify entitlement until real payment processing and signed subscription webhooks are implemented. There is no implemented team-management workflow.

The API needs a private scheduled `npm run reconcile` job to settle pending videos when users close the browser. See the API README for verified manual resolution of unknown dispatch outcomes and historical billing review.

## Deployment

Deploy the frontend and API as separate projects, each using its own repository root. Frontend: `npm ci`, `npm run build`, output `dist`.

Production frontend environment:

```dotenv
VITE_API_BASE_URL=https://your-api-domain/api
VITE_BACKEND_URL=https://your-api-domain
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

`VITE_BACKEND_URL` controls the development proxy; production calls use `VITE_API_BASE_URL`. Vite embeds these values at build time, so rebuild after changing them. Set the exact frontend origin in API `CORS_ORIGIN`. [vercel.json](vercel.json) supports SPA deep links. Tailwind CSS is compiled during the build; there is no runtime Tailwind CDN dependency.

Rollout order: apply the API database migration → deploy API → deploy this frontend → configure reconciliation. Generation requests require `Idempotency-Key` and video routes require `generationId`; old API/frontend versions are not interchangeable. Verify login, project save/load, composited PNG exports, activity recovery, credits, and video/reel audio in staging before production deployment. These source changes do not apply migrations, merge PRs, or deploy production automatically.

## Routes and code

Public routes: `/`, `/features`, `/pricing`, `/about`, `/contact`, `/privacy`, `/terms`. Authentication: `/auth` and `/auth?mode=register`. Protected workspace: `/app`.

| Path                                                                         | Responsibility                                         |
| ---------------------------------------------------------------------------- | ------------------------------------------------------ |
| `App.tsx`, `components/AppWorkspace.tsx`                                     | Routes, session recovery, workspace shell              |
| `components/CopyGenerator.tsx`, `components/CanvasEditor.tsx`                | Banner planning and editing                            |
| `components/ImageStudio.tsx`, `components/workspace/VideoGeneratorPanel.tsx` | Image and video workflows                              |
| `components/workspace/ProjectToolbar.tsx`, `ActivitiesPanel.tsx`             | Cloud projects and stored outputs                      |
| `services/apiClient.ts`, `generationRequest.ts`                              | Authenticated requests, deadlines, stable request keys |
| `services/canvasRenderer.ts`, `draftStore.ts`                                | Shared export composition and IndexedDB persistence    |
| `global.css`, `tailwind.config.cjs`, `postcss.config.cjs`                    | Compiled styling                                       |

For request schemas, credit lifecycle, shared limits, and operator procedures, use the [API documentation](https://github.com/Viral-Ad-Media/banner-creator-api#readme).

## Troubleshooting

- **401:** verify the Supabase project/public key and active login. Transient API failures should be retried, not handled by deleting the session.
- **400/413:** verify supported image types, compress inputs, or use smaller cloud project snapshots. API JSON requests are limited to 4 MB.
- **402:** available credits or resource quota is exhausted, including held credits. Check Activity; paid checkout is unavailable.
- **409 / UNKNOWN:** keep the existing request key and inspect Activity. Operators must verify uncertain provider outcomes before releasing or settling credits.
- **429/503:** wait and retry; shared rate limiting fails closed if its database is unavailable.
- **Draft storage error:** free browser storage and retry; use explicit project saves for account recovery.
- **Reel export error:** use a browser supporting the required recording APIs and verify every current scene has a completed render.
