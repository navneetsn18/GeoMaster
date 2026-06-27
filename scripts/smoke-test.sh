#!/bin/bash
# Smoke test: verify GeoMaster is running correctly
# Usage: ./scripts/smoke-test.sh [BASE_URL]
# Default BASE_URL: http://localhost:8080/api

set -euo pipefail

BASE_URL="${1:-http://localhost:8080/api}"
PASS=0
FAIL=0

# ── Colour helpers ─────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Colour

ok()   { echo -e "   ${GREEN}[PASS]${NC} $1"; PASS=$((PASS+1)); }
fail() { echo -e "   ${RED}[FAIL]${NC} $1"; FAIL=$((FAIL+1)); }
info() { echo -e "   ${YELLOW}[INFO]${NC} $1"; }

# ── Prerequisite check ─────────────────────────────────────────────────────────
if ! command -v jq &>/dev/null; then
  echo "Error: jq is required but not installed. Install with: brew install jq"
  exit 1
fi
if ! command -v curl &>/dev/null; then
  echo "Error: curl is required but not installed."
  exit 1
fi

echo ""
echo "=== GeoMaster Smoke Test ==="
echo "Target: $BASE_URL"
echo ""

# Use a unique suffix so re-runs don't hit duplicate-email conflicts
SUFFIX=$(date +%s)
TEST_USER="smoketest_${SUFFIX}"
TEST_EMAIL="smoke_${SUFFIX}@test.com"
TEST_PASSWORD="Test123!"

# ── 1. Register user ───────────────────────────────────────────────────────────
echo "1. Registering test user ($TEST_EMAIL)..."
REGISTER=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$TEST_USER\",\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

REGISTER_BODY=$(echo "$REGISTER" | head -n -1)
REGISTER_STATUS=$(echo "$REGISTER" | tail -n 1)

TOKEN=$(echo "$REGISTER_BODY" | jq -r '.token // empty')

if [ "$REGISTER_STATUS" = "201" ] && [ -n "$TOKEN" ]; then
  ok "Registration returned 201 with token"
  info "Token: ${TOKEN:0:20}..."
else
  fail "Registration failed (HTTP $REGISTER_STATUS): $REGISTER_BODY"
  TOKEN=""
fi

# ── 2. Login ───────────────────────────────────────────────────────────────────
echo ""
echo "2. Logging in..."
LOGIN=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

LOGIN_BODY=$(echo "$LOGIN" | head -n -1)
LOGIN_STATUS=$(echo "$LOGIN" | tail -n 1)
LOGIN_TOKEN=$(echo "$LOGIN_BODY" | jq -r '.token // empty')

if [ "$LOGIN_STATUS" = "200" ] && [ -n "$LOGIN_TOKEN" ]; then
  ok "Login returned 200 with token"
  TOKEN="$LOGIN_TOKEN" # prefer the login token from here on
else
  fail "Login failed (HTTP $LOGIN_STATUS): $LOGIN_BODY"
fi

# ── 3. Auth/me ─────────────────────────────────────────────────────────────────
echo ""
echo "3. Fetching authenticated user profile (/auth/me)..."
if [ -n "$TOKEN" ]; then
  ME=$(curl -s -w "\n%{http_code}" "$BASE_URL/auth/me" \
    -H "Authorization: Bearer $TOKEN")
  ME_BODY=$(echo "$ME" | head -n -1)
  ME_STATUS=$(echo "$ME" | tail -n 1)

  if [ "$ME_STATUS" = "200" ]; then
    ME_USERNAME=$(echo "$ME_BODY" | jq -r '.username // empty')
    ok "/auth/me returned 200 (username: $ME_USERNAME)"
  else
    fail "/auth/me failed (HTTP $ME_STATUS): $ME_BODY"
  fi
else
  info "Skipping /auth/me (no valid token)"
fi

# ── 4. Start game session ──────────────────────────────────────────────────────
echo ""
echo "4. Starting game session..."
SESSION_ID=""
COUNTRY_CODE=""

if [ -n "$TOKEN" ]; then
  SESSION=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/game/session/start" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"mapType":"WORLD"}')

  SESSION_BODY=$(echo "$SESSION" | head -n -1)
  SESSION_STATUS=$(echo "$SESSION" | tail -n 1)
  SESSION_ID=$(echo "$SESSION_BODY" | jq -r '.sessionId // empty')
  COUNTRY_COUNT=$(echo "$SESSION_BODY" | jq '.countries | length // 0')
  COUNTRY_CODE=$(echo "$SESSION_BODY" | jq -r '.countries[0].code // empty')

  if [ "$SESSION_STATUS" = "201" ] && [ -n "$SESSION_ID" ]; then
    ok "Session started (ID: $SESSION_ID, Countries: $COUNTRY_COUNT)"
  else
    fail "Session start failed (HTTP $SESSION_STATUS): $SESSION_BODY"
  fi
else
  info "Skipping session start (no valid token)"
fi

# ── 5. Submit a guess ─────────────────────────────────────────────────────────
echo ""
echo "5. Submitting correct guess..."
POINTS_EARNED=0

if [ -n "$TOKEN" ] && [ -n "$SESSION_ID" ] && [ -n "$COUNTRY_CODE" ]; then
  GUESS=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/game/session/$SESSION_ID/guess" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"countryCode\":\"$COUNTRY_CODE\",\"isCorrect\":true,\"timeTakenMs\":5000}")

  GUESS_BODY=$(echo "$GUESS" | head -n -1)
  GUESS_STATUS=$(echo "$GUESS" | tail -n 1)
  POINTS_EARNED=$(echo "$GUESS_BODY" | jq '.pointsEarned // 0')

  if [ "$GUESS_STATUS" = "200" ]; then
    ok "Guess accepted (points earned: $POINTS_EARNED)"
    # Validate scoring: timeTakenMs=5000 → timeBonus = max(0, 50 - max(0, floor((5000-3000)/1000))) = 50-2 = 48
    # Expected: floor((100+48)*1.0) = 148
    EXPECTED=148
    if [ "$POINTS_EARNED" = "$EXPECTED" ]; then
      ok "Scoring formula verified (expected $EXPECTED, got $POINTS_EARNED)"
    else
      fail "Scoring mismatch: expected $EXPECTED pts for 5000ms correct, got $POINTS_EARNED"
    fi
  else
    fail "Guess submission failed (HTTP $GUESS_STATUS): $GUESS_BODY"
  fi
else
  info "Skipping guess submission (missing token, session, or country code)"
fi

# ── 6. Complete session ────────────────────────────────────────────────────────
echo ""
echo "6. Completing game session..."
FINAL_SCORE=0

if [ -n "$TOKEN" ] && [ -n "$SESSION_ID" ]; then
  COMPLETE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/game/session/$SESSION_ID/complete" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{}')

  COMPLETE_BODY=$(echo "$COMPLETE" | head -n -1)
  COMPLETE_STATUS=$(echo "$COMPLETE" | tail -n 1)
  FINAL_SCORE=$(echo "$COMPLETE_BODY" | jq '.finalScore // 0')

  if [ "$COMPLETE_STATUS" = "200" ]; then
    ok "Session completed (final score: $FINAL_SCORE)"
  else
    fail "Session completion failed (HTTP $COMPLETE_STATUS): $COMPLETE_BODY"
  fi
else
  info "Skipping session completion (missing token or session ID)"
fi

# ── 7. Check global leaderboard ───────────────────────────────────────────────
echo ""
echo "7. Checking global leaderboard..."
LB=$(curl -s -w "\n%{http_code}" "$BASE_URL/leaderboard?mapType=WORLD&period=ALL_TIME")
LB_BODY=$(echo "$LB" | head -n -1)
LB_STATUS=$(echo "$LB" | tail -n 1)
LB_COUNT=$(echo "$LB_BODY" | jq 'if type=="array" then length else 0 end')

if [ "$LB_STATUS" = "200" ]; then
  ok "Leaderboard returned 200 ($LB_COUNT entries)"
else
  fail "Leaderboard fetch failed (HTTP $LB_STATUS): $LB_BODY"
fi

# ── 8. Check friends leaderboard (requires auth) ──────────────────────────────
echo ""
echo "8. Checking friends leaderboard..."
if [ -n "$TOKEN" ]; then
  FLB=$(curl -s -w "\n%{http_code}" "$BASE_URL/leaderboard/friends?period=ALL_TIME" \
    -H "Authorization: Bearer $TOKEN")
  FLB_BODY=$(echo "$FLB" | head -n -1)
  FLB_STATUS=$(echo "$FLB" | tail -n 1)

  if [ "$FLB_STATUS" = "200" ]; then
    FLB_COUNT=$(echo "$FLB_BODY" | jq 'if type=="array" then length else 0 end')
    ok "Friends leaderboard returned 200 ($FLB_COUNT entries)"
  else
    fail "Friends leaderboard failed (HTTP $FLB_STATUS): $FLB_BODY"
  fi
else
  info "Skipping friends leaderboard (no valid token)"
fi

# ── 9. User profile ────────────────────────────────────────────────────────────
echo ""
echo "9. Checking user profile..."
if [ -n "$TOKEN" ]; then
  PROFILE=$(curl -s -w "\n%{http_code}" "$BASE_URL/user/profile" \
    -H "Authorization: Bearer $TOKEN")
  PROFILE_BODY=$(echo "$PROFILE" | head -n -1)
  PROFILE_STATUS=$(echo "$PROFILE" | tail -n 1)

  if [ "$PROFILE_STATUS" = "200" ]; then
    GAMES_PLAYED=$(echo "$PROFILE_BODY" | jq '.gamesPlayed // 0')
    ok "User profile returned 200 (gamesPlayed: $GAMES_PLAYED)"
  else
    fail "User profile failed (HTTP $PROFILE_STATUS): $PROFILE_BODY"
  fi
else
  info "Skipping user profile (no valid token)"
fi

# ── 10. User history ───────────────────────────────────────────────────────────
echo ""
echo "10. Checking user game history..."
if [ -n "$TOKEN" ]; then
  HISTORY=$(curl -s -w "\n%{http_code}" "$BASE_URL/user/history?page=0&size=5" \
    -H "Authorization: Bearer $TOKEN")
  HISTORY_BODY=$(echo "$HISTORY" | head -n -1)
  HISTORY_STATUS=$(echo "$HISTORY" | tail -n 1)

  if [ "$HISTORY_STATUS" = "200" ]; then
    TOTAL=$(echo "$HISTORY_BODY" | jq '.totalElements // 0')
    ok "User history returned 200 (totalElements: $TOTAL)"
  else
    fail "User history failed (HTTP $HISTORY_STATUS): $HISTORY_BODY"
  fi
else
  info "Skipping user history (no valid token)"
fi

# ── Summary ────────────────────────────────────────────────────────────────────
echo ""
echo "==================================================="
echo -e "=== Smoke test complete: ${GREEN}${PASS} passed${NC}, ${RED}${FAIL} failed${NC} ==="
echo "==================================================="
echo ""

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
