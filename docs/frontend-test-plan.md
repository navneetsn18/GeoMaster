# GeoMaster Frontend Test Plan

**Coverage scope:** Manual + automated (Playwright/Cypress) tests organized by page.  
**Browsers:** Chrome (primary), Firefox, Safari (smoke only).  
**Viewport:** 1280x800 desktop; 375x812 mobile smoke.

---

## Table of Contents

1. [Auth Pages](#auth-pages)
2. [Game Page (World Map)](#game-page-world-map)
3. [Leaderboard Page](#leaderboard-page)
4. [Dark / Light Theme](#dark--light-theme)
5. [Cross-Cutting Concerns](#cross-cutting-concerns)

---

## Auth Pages

### Login Page (`/login`)

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| A-1 | **Happy path** | Enter valid email + password, click Submit | Redirects to `/` (dashboard); no error toast visible |
| A-2 | **Wrong password** | Enter registered email + incorrect password, click Submit | Error toast appears: "Invalid credentials"; stays on `/login` |
| A-3 | **Non-existent email** | Enter unknown email + any password, click Submit | Error toast appears (should not reveal whether email exists) |
| A-4 | **Empty form submission** | Click Submit without filling any fields | Both fields show inline validation errors; no network request fired |
| A-5 | **Invalid email format** | Type `notanemail`, click Submit | Email field shows format validation error |
| A-6 | **Already-logged-in redirect** | Navigate to `/login` while authenticated (JWT in localStorage) | Immediately redirects to `/`; login page never renders |
| A-7 | **Network error** | Disable network, attempt login | Error toast: "Network error, please try again" |
| A-8 | **Loading state** | Click Submit | Button shows spinner / disabled state until response returns |
| A-9 | **JWT stored on success** | Successful login | Token stored in `localStorage` under key `geomaster_token` |

### Signup Page (`/signup`)

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| B-1 | **Happy path** | Fill username + email + matching passwords, click Register | Redirects to `/`; welcome toast shown |
| B-2 | **Mismatched passwords** | Enter different values in Password and Confirm Password | Inline error: "Passwords do not match"; Submit stays disabled |
| B-3 | **Existing email** | Submit form with already-registered email | Error toast from API: "Email is already registered" (409) |
| B-4 | **Existing username** | Submit form with already-taken username | Error toast from API: "Username is already taken" (409) |
| B-5 | **Username too short** | Enter 2-char username | Inline validation error before submission |
| B-6 | **Weak password** | Password under 8 chars / no uppercase / no digit | Inline validation error with specific guidance |
| B-7 | **Loading state** | Click Register | Button disables + spinner until response |
| B-8 | **Already-logged-in redirect** | Visit `/signup` while authenticated | Redirects to `/` |

---

## Game Page (World Map)

### Page Load

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| C-1 | **Map renders** | Navigate to `/game` | SVG world map fully visible; no blank area; all country paths clickable |
| C-2 | **First country prompt shown** | Page load complete | Target country name displayed in the prompt area (e.g. "Find: Brazil") |
| C-3 | **Score starts at 0** | Page load complete | Score display shows `0` |
| C-4 | **Streak starts at 0** | Page load complete | Streak counter shows `0` |
| C-5 | **Unauthenticated redirect** | Navigate to `/game` without JWT | Redirects to `/login` |

### Correct Guess

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| C-6 | **Country turns green** | Click the correct country | That country's SVG path fills green |
| C-7 | **Score increases** | Click correct country fast (< 3 s) | Score increases by 150 (100 base + 50 time bonus, 1x) |
| C-8 | **Streak increments** | Click correct country | Streak counter increments by 1 |
| C-9 | **Next country shown** | After correct click | A new country name appears in the prompt |
| C-10 | **Streak multiplier indicator** | Reach streak of 5 | UI shows "1.5x" multiplier badge |
| C-11 | **Score with 1.5x multiplier** | Correct answer at streak = 5, fast | Score increases by 225 (floor(150 * 1.5)) |

### Wrong Guess

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| C-12 | **Country turns red** | Click a wrong country | Clicked country fills red briefly (~ 1 s), then reverts |
| C-13 | **Score unchanged** | Click wrong country | Score value does not change |
| C-14 | **Streak resets** | Click wrong country while streak = 7 | Streak counter resets to 0 |
| C-15 | **Multiplier resets** | Click wrong country while 1.5x active | Multiplier badge returns to 1.0x |
| C-16 | **Next country shown** | After wrong guess | Prompt still shows next country (game continues) |

### Already-Guessed Country

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| C-17 | **Click already-correct country** | Click a country already coloured green | No action: score unchanged, streak unchanged, no API call fired |
| C-18 | **Click already-wrong country** | Click a country already coloured red (reverted) | Treat as a new wrong guess OR ignore — behaviour must be defined; document outcome |

### Session Completion

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| C-19 | **ScoreCard modal appears** | Answer all countries in session | ScoreCard modal/overlay appears; game map is no longer interactive |
| C-20 | **ScoreCard shows correct stats** | View ScoreCard | Displays: Final Score, Correct/Total, Accuracy %, Best Streak |
| C-21 | **Accuracy formula** | 27 correct / 30 total | Accuracy shown as 90% |
| C-22 | **Play Again** | Click "Play Again" on ScoreCard | ScoreCard closes; new session starts; score/streak reset to 0 |
| C-23 | **View Leaderboard** | Click "Leaderboard" on ScoreCard | Navigates to `/leaderboard` |
| C-24 | **Score posted to backend** | Session completes | POST `/api/game/session/{id}/complete` called; score appears in leaderboard |

### Score Calculation Verification (UI ↔ Backend Parity)

| # | Scenario | Expected Points | Formula Check |
|---|----------|-----------------|---------------|
| C-25 | Correct, 1000 ms, streak=0 | 150 | floor((100+50)*1.0) |
| C-26 | Correct, 1000 ms, streak=5 | 225 | floor((100+50)*1.5) |
| C-27 | Correct, 1000 ms, streak=10 | 300 | floor((100+50)*2.0) |
| C-28 | Correct, 1000 ms, streak=20 | 450 | floor((100+50)*3.0) |
| C-29 | Correct, 60000 ms, streak=0 | 100 | floor((100+0)*1.0) |
| C-30 | Wrong answer, streak=5 | 0 | always 0 on wrong |

---

## Leaderboard Page

### Tab Rendering

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| D-1 | **Global / All-Time tab** | Click "Global" tab | Loads without error; table shows rank, username, score columns |
| D-2 | **Global / Weekly tab** | Click "Weekly" | Table updates with this-week's data; no error |
| D-3 | **Global / Daily tab** | Click "Daily" | Table updates with today's data; no error |
| D-4 | **Friends tab** | Click "Friends" (authenticated) | Shows only friend sessions; no strangers |
| D-5 | **Friends tab unauthenticated** | Visit `/leaderboard` without JWT | Friends tab hidden or redirect to login on click |
| D-6 | **Tab loading state** | Click any tab | Spinner/skeleton shown while fetching |
| D-7 | **Tab error state** | Tab fetch returns 500 | Error message shown in table area; no crash |

### Current User Highlight

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| D-8 | **Current user row highlighted** | Authenticated user present in leaderboard | User's row visually distinct (e.g. bold, coloured background) |
| D-9 | **Current user not in leaderboard** | User has no sessions | No highlight; no crash |

### Empty State

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| D-10 | **Empty global leaderboard** | Navigate to leaderboard with zero sessions in DB | Empty-state illustration + copy (e.g. "No scores yet — be the first!") |
| D-11 | **Empty friends leaderboard** | User has no friends or friends have no sessions | Friendly empty-state message; no blank table rows |
| D-12 | **Empty weekly** | No sessions this week | Empty-state shown; no error |

### Data Integrity

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| D-13 | **Top entry is rank 1** | View leaderboard | First row always shows rank = 1 |
| D-14 | **Entries ordered by score desc** | View leaderboard | Each subsequent row has score <= previous row |
| D-15 | **At most 50 entries shown** | API returns 50 | Table has exactly 50 rows (or backend paginates) |

---

## Dark / Light Theme

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| E-1 | **Toggle from light to dark** | Click theme toggle | Background, text, and map colours switch to dark palette; no FOUC |
| E-2 | **Toggle from dark to light** | Click toggle again | Reverts to light palette |
| E-3 | **Preference persisted across reload** | Switch to dark; reload page | Dark theme is active on reload (loaded from `localStorage`) |
| E-4 | **Preference key** | Check localStorage after toggle | Key `geomaster_theme` set to `"dark"` or `"light"` |
| E-5 | **System preference respected** | Set OS to dark mode; visit fresh with no stored preference | Dark theme applied by default |
| E-6 | **Map colours adapt** | Switch theme | Country paths, borders, and ocean fill render correctly in both themes |
| E-7 | **Score colours readable in both themes** | View score during game in both themes | Score text and multiplier badge legible in both palettes |

---

## Cross-Cutting Concerns

### JWT / Session Handling

| # | Scenario | Expected Result |
|---|----------|-----------------|
| X-1 | **Expired token** | 401 returned by any protected endpoint | User silently redirected to `/login`; token removed from localStorage |
| X-2 | **Token present but malformed** | Guard rejects it | Redirect to `/login` |
| X-3 | **Logout clears token** | Click logout | `geomaster_token` removed; redirect to `/login` |

### Rapid-Click / Race Conditions

| # | Scenario | Expected Result |
|---|----------|-----------------|
| X-4 | **Double-click on country** | Click same country twice fast | Only one guess submitted; second click ignored while first request is in-flight |
| X-5 | **Fast multi-country clicks** | Click 3 countries in < 200 ms | Each guess queued and submitted sequentially; no duplicate or out-of-order scores |

### Accessibility (Smoke)

| # | Scenario | Expected Result |
|---|----------|-----------------|
| X-6 | **Keyboard navigation on login form** | Tab through fields + Enter to submit | Works without mouse |
| X-7 | **Screen reader label on map** | Inspect SVG country path | Each path has `aria-label` with country name |

---

## Test Environment Notes

- Seed data: create a known user (`qa_user / qa@geomaster.test / Secure123!`) before running leaderboard tests.
- API mocking: for pure UI unit tests use MSW (Mock Service Worker) to intercept fetch calls.
- Timer control: use `vi.useFakeTimers()` (Vitest) or `cy.clock()` (Cypress) to control `timeTakenMs` for scoring tests.
- Country code fixture: maintain a `countries.json` fixture with ISO alpha-2 codes matching the topojson file to avoid runtime mismatch bugs.
