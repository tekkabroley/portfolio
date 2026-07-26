# Family Auth Security Plan (Issues #4, #5, #6)

Implementation plan for hardening the private family gallery. These three issues share the same auth surface and should be delivered together (or in the order below) so each layer builds on the previous one.

| Issue | Title | Priority |
| --- | --- | --- |
| [#4](https://github.com/tekkabroley/portfolio/issues/4) | Replace forgeable family session cookie with a signed token | High |
| [#5](https://github.com/tekkabroley/portfolio/issues/5) | Restrict private S3 image proxy to an allowlisted path prefix | High |
| [#6](https://github.com/tekkabroley/portfolio/issues/6) | Stop shipping family gallery photo paths in static HTML | High |

**Current architecture (constraints):**

- Astro static site (`output` defaults to static; no Cloudflare adapter today)
- Auth and image proxy live in Cloudflare Pages Functions under `functions/`
- `functions/family/_middleware.js` gates `/family/*` page requests
- `functions/api/family-image.js` streams private S3 objects after a cookie check
- PIN login is `POST /api/verify-pin` → sets `family_auth=valid_session`

---

## Goals

1. A static cookie value must no longer grant access.
2. An authenticated session must not grant bucket-wide S3 read access.
3. Family photo paths / filenames must not appear in build output or unauthenticated HTML.

## Non-goals (for this work)

- Full account system / multi-user auth
- Migrating the whole site to SSR (unless we later choose that for #6)
- Reworking the public gallery

---

## Recommended delivery order

```text
#4 signed sessions  →  #5 path allowlist  →  #6 hide photo list behind auth
```

Reasoning: path validation alone is weak if the cookie is forgeable; hiding HTML paths alone is weak if the image proxy accepts arbitrary keys once “authenticated.”

---

## Issue #4 — Signed session cookie

### Problem (today)

```js
Set-Cookie: family_auth=valid_session; ...
// later
cookies['family_auth'] === 'valid_session'
```

Anyone who knows that string (it is in source) can forge the cookie and bypass the PIN.

### Intended design

**Cookie format (example):**

```text
family_auth=<payload>.<signature>
payload   = base64url(JSON.stringify({ exp: <unix_seconds>, nonce: <random> }))
signature = base64url(HMAC-SHA256(payload, SESSION_SECRET))
```

Keep existing cookie attributes: `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000` (30 days). Put the same expiry in the payload so forged Max-Age alone cannot extend life.

### Implementation steps

1. **Add shared auth helper** at `functions/_lib/session.js` (or similar) used by all three function entrypoints:
   - `createSessionCookie(env)` → `Set-Cookie` header value
   - `getSessionCookie(request)` → raw cookie value
   - `verifySession(request, env)` → `{ ok: boolean }`
   - Use Web Crypto (`crypto.subtle`) — available in Workers; no new npm dependency required for signing
2. **`functions/api/verify-pin.js`**
   - On successful PIN match, set cookie via `createSessionCookie(env)`
   - Fail closed if `SESSION_SECRET` or `FAMILY_PIN` is missing
3. **`functions/family/_middleware.js`**
   - Replace string compare with `verifySession`
   - Invalid/expired → redirect to `/family-login`
4. **`functions/api/family-image.js`**
   - Same `verifySession` check before any S3 work
5. **Env / docs**
   - Add Cloudflare Pages secret: `SESSION_SECRET` (long random string, e.g. `openssl rand -hex 32`)
   - Document in `README.md` env table
6. **Optional (same PR or follow-up):** basic rate limit on `/api/verify-pin`
   - Prefer Cloudflare rate limiting rules in the dashboard if available
   - Or a simple KV/Durable Object counter later; do not block #4 on this

### Acceptance criteria

- [ ] Setting `family_auth=valid_session` manually no longer unlocks `/family` or `/api/family-image`
- [ ] Correct PIN still unlocks the gallery for ~30 days
- [ ] Expired or tampered cookie signatures are rejected
- [ ] Missing `SESSION_SECRET` fails closed (no access)

### Test plan

- Deploy to a preview environment with `SESSION_SECRET` set
- Login with correct PIN → gallery works; image requests work
- Clear cookies, set forged `valid_session` → redirected / 403
- Tamper signature bytes → rejected
- Wait or craft expired `exp` → rejected

---

## Issue #5 — Restrict S3 proxy paths

### Problem (today)

```js
const imagePath = url.searchParams.get('path');
const s3Url = `https://${bucketName}.s3.${awsRegion}.amazonaws.com/${imagePath}`;
```

Any authenticated caller can request arbitrary keys in `PRIVATE_S3_BUCKET`.

### Intended design

Validate before signing the S3 request:

1. Require `path` query param
2. URL-decode once
3. Reject if empty, contains `..`, `\`, leading `/`, `://`, or NUL
4. Normalize to forward slashes
5. Require prefix `family/`
6. Allow only safe filename characters after the prefix (e.g. `[A-Za-z0-9._/-]+` with no `//`)
7. Optionally (recommended): allowlist exact keys derived from `src/content/family/*.md` at build or deploy time

### Implementation steps

1. **Add `functions/_lib/family-path.js`**
   - `normalizeFamilyImagePath(raw) → string | null`
   - Returns normalized `family/...` key or `null` if invalid
2. **Use it in `family-image.js`** before constructing `s3Url`
   - Invalid → `400` with a generic message (do not echo raw path details useful to attackers)
3. **Allowlist (preferred hardening)**
   - Generate `functions/_data/family-allowlist.json` (or embed in a module) from gallery markdown image paths during `npm run build` / a small script
   - Or hardcode allowlist generation in `scripts/` reading frontmatter `image` fields and extracting the S3 key
   - Proxy rejects any path not in the allowlist even if it starts with `family/`
4. **Keep auth check first** (`verifySession` from #4), then path validation, then S3 fetch

### Acceptance criteria

- [ ] `?path=family/DSC00355.JPG` (valid) still works when authenticated
- [ ] `?path=../secrets.txt`, `?path=/etc/passwd`, `?path=other-prefix/x.jpg` → 400
- [ ] `?path=family/../../other` → 400
- [ ] Unknown `family/not-in-collection.jpg` → 400 if allowlist is implemented

### Test plan

- Authenticated curl/browser checks for valid and invalid paths
- Confirm S3 is never called for rejected paths (log or early return)

---

## Issue #6 — Stop shipping family photo paths in static HTML

### Problem (today)

`src/pages/family.astro` is prerendered. `dist/family/index.html` contains every `/api/family-image?path=family/...` URL. Middleware can block page delivery in production, but:

- Paths leak in the static artifact and git-adjacent build output
- `npm run preview` serves the page with no Functions middleware
- Defense is a single edge check

### Recommendation: authenticated API + client shell (not full SSR)

The repo is static-first and has no `@astrojs/cloudflare` adapter. Adding SSR for one page is a larger platform change (adapter, dual rendering mode, local preview story). Prefer keeping Pages Functions and moving the **photo list** behind auth.

**Chosen approach**

```text
Static /family page (shell only, no photo paths)
        │
        ▼
GET /api/family-photos   ← checks signed session (#4)
        │
        ▼
JSON list of { src, alt, ... }
        │
        ▼
Client JS renders grid + lightbox
        │
        ▼
Existing /api/family-image?path=...  ← session + path rules (#4/#5)
```

### Implementation steps

1. **Add `functions/api/family-photos.js`**
   - `verifySession` or 401/403
   - Return JSON array of photo descriptors
   - Source of truth options (pick one):
     - **A (simplest):** commit/generate `functions/_data/family-photos.json` from `src/content/family` at build time
     - **B:** read allowlist module shared with #5
   - Response headers: `Cache-Control: private, no-store`
2. **Rewrite `src/pages/family.astro`**
   - Keep layout, title, empty-state copy
   - Remove `getCollection("family")` from the page (so build HTML has no paths)
   - Add a small client script/island that:
     - `fetch('/api/family-photos', { credentials: 'same-origin' })`
     - On 401/403 → `window.location = '/family-login'`
     - On success → render the masonry grid (reuse existing markup/classes)
   - Keep lightbox behavior (extract shared module later if desired)
3. **Middleware**
   - Keep `functions/family/_middleware.js` as defense-in-depth for the shell page
   - API routes under `/api/*` rely on their own session checks (middleware does not cover them today)
4. **Local preview caveat**
   - Document that family APIs require `wrangler pages dev` (or deploy preview), not plain `astro preview`
   - Optional follow-up: add a `pages:dev` npm script once wrangler is adopted

### Alternative considered: SSR `prerender = false`

Viable if we want zero client fetch, but requires:

- `@astrojs/cloudflare` adapter
- Hybrid output mode
- Reworking deploy/preview tooling

Defer unless the API+shell approach proves awkward.

### Acceptance criteria

- [ ] `dist/family/index.html` contains no `family-image?path=` URLs and no `DSC*.JPG` family filenames
- [ ] Authenticated users still see the full family gallery
- [ ] Unauthenticated users hitting `/family` are redirected to login (middleware)
- [ ] Unauthenticated `GET /api/family-photos` returns 401/403 and no photo metadata
- [ ] Image loads still go through `/api/family-image` with #4 + #5 checks

### Test plan

- `npm run build` and grep `dist/family` for `family-image` / `DSC0` — expect no matches
- Preview deploy: login → photos appear; logout / private window → no list, no paths
- Confirm lightbox still works after client render

---

## Shared work across all three issues

### New / updated files (expected)

| Path | Role |
| --- | --- |
| `functions/_lib/session.js` | Create/verify HMAC session cookie |
| `functions/_lib/family-path.js` | Normalize + validate S3 keys |
| `functions/_data/family-photos.json` (or generated) | Photo list + allowlist source |
| `functions/api/verify-pin.js` | Issue signed cookie |
| `functions/family/_middleware.js` | Verify signed cookie |
| `functions/api/family-image.js` | Verify session + path rules |
| `functions/api/family-photos.js` | Authenticated photo list JSON |
| `src/pages/family.astro` | Auth shell + client fetch/render |
| `scripts/generate-family-data.mjs` (optional) | Build-time sync from content collection |
| `README.md` | Document `SESSION_SECRET` and preview notes |

### Environment variables

| Variable | Used by | Notes |
| --- | --- | --- |
| `FAMILY_PIN` | PIN login | Existing |
| `SESSION_SECRET` | Signed cookies | **New** — required |
| `AWS_ACCESS_KEY_ID` | Image proxy | Existing |
| `AWS_SECRET_ACCESS_KEY` | Image proxy | Existing |
| `AWS_REGION` | Image proxy | Existing |
| `PRIVATE_S3_BUCKET` | Image proxy | Existing |

Rotate `FAMILY_PIN` is optional; adding `SESSION_SECRET` is mandatory for #4.

### Suggested PR strategy

**Option A — one PR:** “Harden family gallery auth (#4 #5 #6)”  
Best if you want one review cycle and atomic security improvement.

**Option B — stacked PRs:**

1. `#4` session helper + wire pin/middleware/image
2. `#5` path validation (+ allowlist generation)
3. `#6` family-photos API + shell page

Stacked PRs are easier to review; land in that order.

---

## Risks and decisions

| Risk / decision | Recommendation |
| --- | --- |
| Web Crypto in Pages Functions | Use `crypto.subtle`; avoid Node-only APIs |
| Cookie name reuse | Keep `family_auth` so old clients just re-login |
| Allowlist drift when adding photos | Generate from `src/content/family` in the same script pipeline as collection configs |
| SSR vs API shell for #6 | Prefer API shell to avoid adapter migration |
| Rate limiting PIN guesses | Nice-to-have; Cloudflare dashboard rule first |

---

## Definition of done (all three)

1. Forged static cookie cannot access family pages or images.
2. Authenticated clients can only fetch allowlisted `family/*` objects.
3. Built static HTML for `/family` reveals no private photo paths.
4. README documents `SESSION_SECRET` and how to exercise family auth locally/on preview.
5. Issues #4, #5, and #6 can be closed with links to the shipping PR(s).
