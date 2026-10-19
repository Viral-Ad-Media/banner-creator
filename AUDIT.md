# Audit resolution — October 6, 2026

Reviewed the merged frontend at `5409136` and the API fix branch at `5c32ae6`, then applied follow-up fixes. The original review covered both repositories at `e771a78` / `4ca2fd4`. This is source and regression-test verification; production configuration and paid provider behavior are not certified by these tests.

## Original findings

| Finding                                    | Implemented resolution                                                                                   |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| F01: browser plan changes                  | API SQL revokes client table writes; entitlements are service-owned.                                     |
| F02: unpaid mock upgrades                  | Checkout/portal return 501 without entitlement mutation. Real payment integration remains unavailable.   |
| F03: foreign video jobs                    | Routes require an owned application generation ID, with provider IDs read from stored records.           |
| F04: concurrent overspending               | SQL account locks, reservations, idempotent keys, and one-time settlement.                               |
| F05: truncated usage sums                  | SQL aggregation; regression includes more than 1000 usage rows.                                          |
| F06: forged records/quota bypass           | Service-only write RPCs and transactional project/avatar limits.                                         |
| F07: vulnerable dependencies               | Updated locks and dependency audits; API follow-up includes patched proxy-addr.                          |
| F08: cross-account project references      | Route/RPC checks and ownership trigger.                                                                  |
| F09: premature video success/charge        | Pending jobs retain holds; provider-confirmed terminal results settle/release once.                      |
| F10: missing project/output recovery       | Explicit account project save/load, activity result recovery, and restored video jobs.                   |
| F11: upload/body mismatch                  | Optimized PNG/JPEG/WebP inputs; bounded JSON/data URLs; editing also optimizes generated sources.        |
| F12: background-only downloads             | Shared canvas composition includes text, CTA, assets, and edited layers.                                 |
| F13: template/editor dimensions            | Shared 800-pixel-height geometry for every aspect ratio.                                                 |
| F14: export divergence                     | Shared wrapping, font loading, shape/text composition, opacity, and geometry; italic-font follow-up.     |
| F15: wrong deletion/form shortcuts         | Explicit layer IDs; editable targets, including inherited contenteditable, ignored by shortcuts.         |
| F16: silent reel exports                   | Web Audio destination audio track included in MediaRecorder stream.                                      |
| F17: duplicated scene renders              | One latest attempt per current scene in storyboard order; full completion required.                      |
| F18: invalid input/internal error exposure | User input gets 4xx; internal and malformed provider output gets generic 5xx.                            |
| F19: transient sign-out                    | Retryable profile failures retain sessions; service outages return 503; stale profile responses ignored. |
| F20: process-local limits/proxy handling   | SQL-backed limiter with expiry cleanup, user keys, and explicit trusted proxy count.                     |
| F21: wrong sibling name                    | Independent checks and corrected `../banner-creator-api` scripts/docs.                                   |
| F22: unbounded provider work               | Shared deadlines, no blind image retry, bounded video/JSON reads, redirect-body cancellation.            |
| F23: unvalidated planner output            | Server schemas validate provider plans; malformed output retains its request key and hold.               |
| F24: synchronous duplicate drafts          | Debounced IndexedDB drafts, image deduplication, preserved failed restores, retry UI.                    |
| F25: runtime CSS CDN                       | Build-time Tailwind CSS.                                                                                 |

## Follow-up defects fixed

- Profile results could restore an old account after sign-out or a newer auth event. Refreshes are invalidated and the newest event is processed.
- Request-key cleanup could turn paid success into a client failure or remove a newer attempt's key. Cleanup is conditional and best effort after dispatch.
- Failed draft reads could delete saved work or autosave blank state over it. Records are preserved, autosave pauses, and recovery can be retried.
- Image Studio flushed every dependency change, defeating its debounce. It now flushes on unmount and debounces edits.
- Large generated images could fail subsequent editing; shared generation services now optimize inputs and respect the two-reference limit.
- Terminal video rows without a stored operation returned a pending conflict. Final status is now available; missing successful output has an explicit recovery conflict.
- Provider polling could erase the stored operation ID, and malformed provider JSON could appear as user validation failure. Identity is retained; invalid provider output uses an upstream error.
- Redirect bodies, error bodies, and JSON payload allocation needed bounds/cancellation. New provider tests cover these paths.
- An image prompt phrase bypassed generation and could produce an empty charged success. The bypass was removed.

## Validation and remaining rollout work

`npm run check` runs types, regression tests, and builds in each repository. The combined suite covers accounting, permissions, quotas, owner access, uncertain dispatch, auth races, key cleanup, draft serialization, scene selection, and canvas composition calls. PGlite serializes concurrent requests; canvas tests use a context stub. They do not replace real concurrent database clients or actual browser visual/audio checks.

Before rollout, apply the API hardening migration, verify deployed grants with two accounts, configure the private reconciliation scheduler, and check one real generation/recovery per provider in staging. Verify exported banner appearance and reel audio in the intended browser. Historic mock entitlements and mischarged legacy jobs require operator investigation; source changes cannot establish historical payment/provider outcomes.

Paid billing and object-storage delivery for video over 4,000,000 bytes are not implemented. Unknown dispatches are not automatically refunded because paid work may have been accepted. Cloud project saves are explicit and must fit the documented request budget. These limits are described in both READMEs.
