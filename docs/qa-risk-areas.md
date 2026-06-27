# GeoMaster QA Risk Areas

**Last updated:** 2026-06-26  
**Author:** QA (WorldPlan team)

This document catalogues known and anticipated risk areas for the GeoMaster application. Each item includes the risk description, potential failure mode, and recommended mitigation. Items are roughly ordered by perceived severity.

---

## 1. Map Library Country Code Mismatch (HIGH)

**Risk:** The topojson world map file uses ISO 3166-1 **numeric** codes internally (e.g. `840` for the United States), while the backend stores and returns ISO 3166-1 **alpha-2** codes (e.g. `US`). If the frontend maps clicks to numeric codes but submits or compares against alpha-2, guesses will always fail.

**Failure mode:** User clicks the correct country; the API receives the wrong code and returns `isCorrect: false`; score never advances.

**Detection test:**
- Log the `countryCode` value sent to `POST /api/game/session/{id}/guess` and verify it is exactly 2 uppercase letters.
- Add a CI test that cross-references the topojson property names against the backend's accepted country list.

**Mitigation:**
- Maintain a mapping file (`topojson-numeric-to-alpha2.json`) and apply it in the click handler before submission.
- Backend should validate and reject non-alpha-2 codes with a clear `400 INVALID_COUNTRY_CODE` error so mismatches surface immediately in testing.

---

## 2. JWT Expiration Handling on Frontend (HIGH)

**Risk:** The frontend stores the JWT in `localStorage` but may not check expiry before making API calls. If the token expires mid-session, every API call silently fails (or throws an unhandled 401) without redirecting the user.

**Failure mode:** User is mid-game; token expires; guess submissions return 401; score stops accumulating; user sees no feedback.

**Specific scenarios to test:**
- Token expires between session start and first guess.
- Token expires mid-session (simulate by setting short `exp` in test environment).
- Token is manually deleted from `localStorage` mid-game.

**Mitigation:**
- Decode the JWT on load and set a `setTimeout` to refresh/logout before expiry.
- Implement a global Axios/fetch interceptor that catches 401 responses, clears the token, and redirects to `/login`.
- Show a "Session expired — please log in again" toast, not a blank error.

---

## 3. Race Conditions in Guess Submission (HIGH)

**Risk:** The map is an SVG where multiple countries can be clicked in rapid succession. If the click handler does not debounce or queue requests, two `POST /guess` calls may be in-flight simultaneously, potentially submitting the same country twice or causing out-of-order streak counts on the backend.

**Failure mode:**
- Double-click sends two identical guesses; backend records both; score doubles.
- Click A then click B very fast; B resolves before A; streak counting is off-by-one.

**Specific scenarios to test (see frontend-test-plan X-4, X-5):**
- Programmatically dispatch two click events on the same country within 50 ms.
- Use `cy.clock()` to confirm only one API call fires per country.

**Mitigation:**
- Disable the SVG click handler immediately on first click and re-enable only after the response resolves (or on error).
- Backend should also be idempotent per `(sessionId, countryCode)` pair — second duplicate guess returns the same result rather than double-counting.

---

## 4. Score Calculation Edge Cases (MEDIUM-HIGH)

**Risk:** The time bonus cutoff at exactly 53,000 ms is subtle. Off-by-one errors in the `floor()` calculation or `>` vs `>=` boundary checks will produce wrong scores.

**Critical boundaries:**
- `timeTakenMs = 2999`: `timeBonus = 50` (full bonus — under the 3 s threshold)
- `timeTakenMs = 3000`: `timeBonus = 50` (still full — no penalty yet)
- `timeTakenMs = 3001`: `timeBonus = floor(50 - floor((3001-3000)/1000)) = 50 - 0 = 50` (floor gives 0 seconds penalty)
  - Wait: `floor((3001-3000)/1000) = floor(0.001) = 0` → bonus still 50. First second of penalty kicks in at 4000 ms.
- `timeTakenMs = 4000`: `timeBonus = 50 - 1 = 49`
- `timeTakenMs = 52999`: `floor((52999-3000)/1000) = floor(49.999) = 49` → bonus = 1
- `timeTakenMs = 53000`: `floor((53000-3000)/1000) = 50` → bonus = max(0, 50-50) = 0
- `timeTakenMs = 53001`: same as 53000 — bonus 0

**Streak multiplier boundaries:**
- Streak 4 → 1.0x; Streak 5 → 1.5x (test the transition explicitly)
- Streak 9 → 1.5x; Streak 10 → 2.0x
- Streak 19 → 2.0x; Streak 20 → 3.0x

**Mitigation:**
- `GameServiceTest.java` covers these boundary values (see `CorrectAnswerScoring` nested class).
- Frontend must replicate the same formula client-side for instant score preview; add a shared utility test or snapshot test for the JS calculation.

---

## 5. Empty State Handling in Leaderboard (MEDIUM)

**Risk:** If the leaderboard API returns an empty array `[]`, React components that assume at least one entry (e.g. accessing `entries[0].rank`) will throw runtime errors.

**Failure mode:** Leaderboard page crashes with "Cannot read properties of undefined"; white screen shown to user.

**Scenarios:**
- New deployment with zero completed sessions.
- Daily/weekly period with no activity.
- Friends leaderboard with no friends.

**Mitigation:**
- Guard all `entries[0]` accesses; render the empty-state component when `entries.length === 0`.
- Add Playwright/Cypress test with mocked empty response (see frontend-test-plan D-10 to D-12).
- Backend must return `[]` (not `null` or omit the field) — document this in api-contracts.md.

---

## 6. Docker Networking Between Services (MEDIUM)

**Risk:** The frontend container makes API calls to the backend. If `VITE_API_BASE_URL` in the frontend container points to `localhost` rather than the Docker service name (e.g. `http://backend:8080`), all API calls will fail inside Docker Compose.

**Failure mode:** App loads but all API calls return `ERR_CONNECTION_REFUSED`; entire game is broken in the containerised environment.

**Specific checks:**
- `docker compose up` → open browser to `http://localhost:3000` → open DevTools Network tab → confirm requests go to the right host.
- Verify the nginx/Vite proxy config forwards `/api/*` to the backend service name.

**Mitigation:**
- In `docker-compose.yml`, set `VITE_API_BASE_URL=/api` (relative) and let the frontend's nginx proxy resolve it to the backend container.
- Add a smoke test step in CI that runs `docker compose up -d` and then calls `./scripts/smoke-test.sh`.

---

## 7. CORS Headers on All Endpoints (MEDIUM)

**Risk:** The Spring Boot backend must return correct CORS headers when the frontend (served from a different origin in development or different Docker port) makes cross-origin requests. Missing or misconfigured CORS will block all API calls in the browser.

**Failure mode:** Browser DevTools shows `CORS policy: No 'Access-Control-Allow-Origin' header`; all API calls blocked.

**Specific scenarios to test:**
- `OPTIONS` preflight to `POST /api/auth/login` returns `200` with `Access-Control-Allow-Origin`.
- `Access-Control-Allow-Methods` includes `GET, POST, PUT, DELETE, OPTIONS`.
- `Access-Control-Allow-Headers` includes `Authorization, Content-Type`.
- Production domain is in the allowed origins list (not `*` in prod).

**Mitigation:**
- Add `@CrossOrigin` or a global `CorsConfigurationSource` bean in the Spring Security config.
- Add a smoke-test assertion: `curl -v -X OPTIONS $BASE_URL/auth/login -H "Origin: http://localhost:3000"` and check for the header.

---

## 8. topojson Country Name vs. Backend Name Parity (MEDIUM)

**Risk:** The `countries[].name` returned by the backend session start (e.g. "South Korea") may differ from what the topojson file labels that country's path (e.g. "Korea, Republic of"). If the prompt shows a name the user cannot match to a visible label, the game is confusing or unplayable.

**Mitigation:**
- Maintain a canonical name map in the frontend; render the human-friendly prompt name from the backend, not from the topojson property.
- QA: verify at least the 10 most commonly misnamed countries (South Korea, North Korea, Russia, Democratic Republic of Congo, etc.).

---

## 9. Session Timeout / Abandoned Sessions (LOW-MEDIUM)

**Risk:** If a user starts a session and closes the tab without completing it, the session stays in-progress on the backend indefinitely. This may inflate `gamesPlayed` counts or lock resources.

**Mitigation:**
- Backend should expire sessions after a configurable idle period (e.g. 30 minutes without a guess).
- Frontend should call `POST /complete` via `beforeunload` or `visibilitychange` for partial sessions.

---

## 10. Frontend Score Drift from Backend Score (LOW)

**Risk:** If the frontend calculates and displays a score locally (for instant feedback) using a JS implementation of the scoring formula, and the backend uses a Java implementation, minor floating-point or rounding differences could cause the displayed score to differ from the final persisted score shown on the ScoreCard and leaderboard.

**Failure mode:** User sees "3750 pts" during game but ScoreCard shows "3748 pts"; erodes trust.

**Mitigation:**
- The backend is the source of truth; `currentScore` returned by each `POST /guess` response should be used to update the UI rather than accumulating client-side.
- If instant UI feedback is needed before the API responds, reconcile with the API response when it arrives.

---

## Summary Table

| # | Risk | Severity | Area |
|---|------|----------|------|
| 1 | topojson numeric vs alpha-2 code mismatch | HIGH | Frontend/Backend contract |
| 2 | JWT expiration mid-session | HIGH | Frontend auth |
| 3 | Race condition on rapid country clicks | HIGH | Frontend/Backend |
| 4 | Scoring edge cases (floor, boundary) | MEDIUM-HIGH | Backend logic |
| 5 | Empty leaderboard crashes UI | MEDIUM | Frontend |
| 6 | Docker networking misconfiguration | MEDIUM | Infra |
| 7 | Missing CORS headers | MEDIUM | Backend config |
| 8 | Country name parity | MEDIUM | Data |
| 9 | Abandoned session cleanup | LOW-MEDIUM | Backend |
| 10 | Frontend/backend score drift | LOW | Full-stack |
