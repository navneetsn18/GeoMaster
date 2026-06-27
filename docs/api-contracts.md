# GeoMaster API Contract Document

**Base URL:** `http://localhost:8080/api`  
**Auth scheme:** Bearer token (JWT) in `Authorization` header  
**Content-Type:** `application/json` for all request bodies

---

## Table of Contents

1. [Auth Endpoints](#auth-endpoints)
   - [POST /api/auth/register](#post-apiauthregister)
   - [POST /api/auth/login](#post-apiauthlogin)
   - [GET /api/auth/me](#get-apiauthme)
2. [Game Endpoints](#game-endpoints)
   - [POST /api/game/session/start](#post-apigamesessionstart)
   - [POST /api/game/session/{sessionId}/guess](#post-apigamesessionsessionidguess)
   - [POST /api/game/session/{sessionId}/complete](#post-apigamesessionsessionidcomplete)
3. [Leaderboard Endpoints](#leaderboard-endpoints)
   - [GET /api/leaderboard](#get-apileaderboard)
   - [GET /api/leaderboard/friends](#get-apileaderboardfriends)
4. [User Endpoints](#user-endpoints)
   - [GET /api/user/profile](#get-apiuserprofile)
   - [GET /api/user/history](#get-apiuserhistory)
   - [POST /api/user/friends/{friendId}](#post-apiuserfriendsfriendid)
   - [GET /api/user/friends](#get-apiuserfriends)

---

## Auth Endpoints

### POST /api/auth/register

Register a new user account.

**Auth required:** No

**Request Body:**

| Field      | Type   | Required | Constraints                        |
|------------|--------|----------|------------------------------------|
| `username` | string | yes      | 3–30 chars, alphanumeric + `_`     |
| `email`    | string | yes      | Valid email format                 |
| `password` | string | yes      | Min 8 chars, 1 uppercase, 1 digit  |

```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**Response — 201 Created:**

| Field          | Type   | Description                     |
|----------------|--------|---------------------------------|
| `token`        | string | JWT access token                |
| `user.id`      | string | UUID of created user            |
| `user.username`| string | Chosen username                 |
| `user.email`   | string | Registered email                |
| `user.createdAt`| string | ISO-8601 timestamp             |

```json
{
  "token": "string",
  "user": {
    "id": "string (UUID)",
    "username": "string",
    "email": "string",
    "createdAt": "string (ISO-8601)"
  }
}
```

**Error Responses:**

| Status | Code                 | Condition                         |
|--------|----------------------|-----------------------------------|
| 400    | `VALIDATION_ERROR`   | Missing/invalid fields            |
| 409    | `EMAIL_TAKEN`        | Email already registered          |
| 409    | `USERNAME_TAKEN`     | Username already taken            |
| 500    | `INTERNAL_ERROR`     | Unexpected server error           |

```json
{ "error": "EMAIL_TAKEN", "message": "Email is already registered" }
```

**Example:**

```bash
curl -s -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "geoking",
    "email": "geoking@example.com",
    "password": "Secure123!"
  }'

# 201 Created
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "username": "geoking",
    "email": "geoking@example.com",
    "createdAt": "2026-06-26T10:00:00Z"
  }
}
```

---

### POST /api/auth/login

Authenticate an existing user.

**Auth required:** No

**Request Body:**

| Field      | Type   | Required |
|------------|--------|----------|
| `email`    | string | yes      |
| `password` | string | yes      |

```json
{
  "email": "string",
  "password": "string"
}
```

**Response — 200 OK:**

| Field          | Type   | Description          |
|----------------|--------|----------------------|
| `token`        | string | JWT access token     |
| `user.id`      | string | UUID                 |
| `user.username`| string |                      |
| `user.email`   | string |                      |

```json
{
  "token": "string",
  "user": {
    "id": "string (UUID)",
    "username": "string",
    "email": "string"
  }
}
```

**Error Responses:**

| Status | Code                  | Condition                       |
|--------|-----------------------|---------------------------------|
| 400    | `VALIDATION_ERROR`    | Missing fields                  |
| 401    | `INVALID_CREDENTIALS` | Wrong email or password         |
| 404    | `USER_NOT_FOUND`      | No account for that email       |
| 500    | `INTERNAL_ERROR`      | Unexpected server error         |

**Example:**

```bash
curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "geoking@example.com",
    "password": "Secure123!"
  }'

# 200 OK
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "username": "geoking",
    "email": "geoking@example.com"
  }
}
```

---

### GET /api/auth/me

Return the currently authenticated user's profile.

**Auth required:** Yes

**Request Body:** None

**Response — 200 OK:**

| Field          | Type   | Description                       |
|----------------|--------|-----------------------------------|
| `id`           | string | UUID                              |
| `username`     | string |                                   |
| `email`        | string |                                   |
| `totalScore`   | number | Cumulative all-time score         |
| `gamesPlayed`  | number | Total completed sessions          |
| `bestStreak`   | number | All-time best answer streak       |
| `createdAt`    | string | ISO-8601                          |

```json
{
  "id": "string (UUID)",
  "username": "string",
  "email": "string",
  "totalScore": "number",
  "gamesPlayed": "number",
  "bestStreak": "number",
  "createdAt": "string (ISO-8601)"
}
```

**Error Responses:**

| Status | Code              | Condition                   |
|--------|-------------------|-----------------------------|
| 401    | `UNAUTHORIZED`    | Missing or invalid JWT      |
| 500    | `INTERNAL_ERROR`  | Unexpected server error     |

**Example:**

```bash
curl -s http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..."

# 200 OK
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "username": "geoking",
  "email": "geoking@example.com",
  "totalScore": 4250,
  "gamesPlayed": 17,
  "bestStreak": 12,
  "createdAt": "2026-06-26T10:00:00Z"
}
```

---

## Game Endpoints

### POST /api/game/session/start

Start a new game session and receive the shuffled country list for that map type.

**Auth required:** Yes

**Request Body:**

| Field        | Type   | Required | Allowed values                                   |
|--------------|--------|----------|--------------------------------------------------|
| `mapType`    | string | yes      | `WORLD`, `EUROPE`, `ASIA`, `AMERICAS`, `AFRICA`  |
| `regionCode` | string | no       | Sub-region filter code (e.g. `"WEST_AFRICA"`)    |

```json
{
  "mapType": "string",
  "regionCode": "string (optional)"
}
```

**Response — 201 Created:**

| Field                   | Type     | Description                                       |
|-------------------------|----------|---------------------------------------------------|
| `sessionId`             | string   | UUID identifying this session                     |
| `mapType`               | string   | Echo of requested map type                        |
| `regionCode`            | string   | Echo of regionCode filter (null if not supplied)  |
| `countries`             | array    | Ordered list of country objects for this session  |
| `countries[].code`      | string   | ISO 3166-1 alpha-2 country code                   |
| `countries[].name`      | string   | English country name                              |
| `countries[].flagUrl`   | string   | URL to the country's flag image                   |
| `totalCountries`        | number   | Total number of countries in this session         |

```json
{
  "sessionId": "string (UUID)",
  "mapType": "string",
  "regionCode": "string (nullable)",
  "countries": [
    { "code": "string (ISO alpha-2)", "name": "string", "flagUrl": "string" }
  ],
  "totalCountries": "number"
}
```

**Error Responses:**

| Status | Code              | Condition                        |
|--------|-------------------|----------------------------------|
| 400    | `INVALID_MAP_TYPE`| Unknown mapType value            |
| 401    | `UNAUTHORIZED`    | Missing or invalid JWT           |
| 500    | `INTERNAL_ERROR`  | Unexpected server error          |

**Example:**

```bash
curl -s -X POST http://localhost:8080/api/game/session/start \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..." \
  -H "Content-Type: application/json" \
  -d '{"mapType":"WORLD"}'

# 201 Created
{
  "sessionId": "sess-uuid-1234",
  "mapType": "WORLD",
  "regionCode": null,
  "countries": [
    { "code": "BR", "name": "Brazil", "flagUrl": "https://flagcdn.com/br.svg" },
    { "code": "DE", "name": "Germany", "flagUrl": "https://flagcdn.com/de.svg" },
    { "code": "JP", "name": "Japan", "flagUrl": "https://flagcdn.com/jp.svg" }
  ],
  "totalCountries": 195
}
```

---

### POST /api/game/session/{sessionId}/guess

Submit a single country guess within an active session.

**Auth required:** Yes

**Path Parameters:**

| Parameter   | Type   | Description                   |
|-------------|--------|-------------------------------|
| `sessionId` | string | UUID from session/start       |

**Request Body:**

| Field         | Type    | Required | Description                                  |
|---------------|---------|----------|----------------------------------------------|
| `countryCode` | string  | yes      | ISO 3166-1 alpha-2 of the clicked country    |
| `isCorrect`   | boolean | yes      | Whether the guess matches the current target |
| `timeTakenMs` | number  | yes      | Milliseconds taken to make this guess        |

```json
{
  "countryCode": "string (ISO alpha-2)",
  "isCorrect": "boolean",
  "timeTakenMs": "number"
}
```

**Response — 200 OK:**

| Field           | Type    | Description                                                  |
|-----------------|---------|--------------------------------------------------------------|
| `correct`       | boolean | Whether the guess was correct                                |
| `pointsEarned`  | number  | Points awarded for this guess (0 if wrong)                   |
| `streakBonus`   | number  | Extra points from the streak multiplier (0 if no multiplier) |
| `totalScore`    | number  | Running session total after this guess                       |
| `currentStreak` | number  | Streak count after this guess                                |
| `bestStreak`    | number  | Best streak reached so far in this session                   |

```json
{
  "correct": "boolean",
  "pointsEarned": "number",
  "streakBonus": "number",
  "totalScore": "number",
  "currentStreak": "number",
  "bestStreak": "number"
}
```

**Error Responses:**

| Status | Code                  | Condition                                         |
|--------|-----------------------|---------------------------------------------------|
| 400    | `VALIDATION_ERROR`    | Missing fields or invalid country code            |
| 401    | `UNAUTHORIZED`        | Missing or invalid JWT                            |
| 403    | `SESSION_NOT_OWNED`   | Session belongs to a different user               |
| 404    | `SESSION_NOT_FOUND`   | sessionId does not exist                          |
| 409    | `SESSION_COMPLETED`   | Session already marked complete                   |
| 500    | `INTERNAL_ERROR`      | Unexpected server error                           |

**Example:**

```bash
curl -s -X POST http://localhost:8080/api/game/session/sess-uuid-1234/guess \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..." \
  -H "Content-Type: application/json" \
  -d '{"countryCode":"BR","isCorrect":true,"timeTakenMs":2500}'

# 200 OK
{
  "correct": true,
  "pointsEarned": 150,
  "streakBonus": 0,
  "totalScore": 150,
  "currentStreak": 1,
  "bestStreak": 1
}
```

---

### POST /api/game/session/{sessionId}/complete

Mark a game session as finished and persist the final score to the leaderboard.

**Auth required:** Yes

**Path Parameters:**

| Parameter   | Type   | Description              |
|-------------|--------|--------------------------|
| `sessionId` | string | UUID from session/start  |

**Request Body:** None (or empty `{}`)

**Response — 200 OK:**

| Field             | Type    | Description                                        |
|-------------------|---------|----------------------------------------------------|
| `finalScore`      | number  | Total score for this session                       |
| `correctCount`    | number  | Number of correct guesses                          |
| `totalCount`      | number  | Total number of countries in this session          |
| `accuracy`        | number  | correctCount / totalCount, as 0.0–1.0              |
| `timeTakenMs`     | number  | Total session duration in milliseconds             |
| `bestStreak`      | number  | Highest streak reached during session              |
| `previousBest`    | number  | User's previous personal best score for this map  |
| `newPersonalBest` | boolean | True if finalScore exceeds previousBest            |

```json
{
  "finalScore": "number",
  "correctCount": "number",
  "totalCount": "number",
  "accuracy": "number",
  "timeTakenMs": "number",
  "bestStreak": "number",
  "previousBest": "number",
  "newPersonalBest": "boolean"
}
```

**Error Responses:**

| Status | Code                  | Condition                              |
|--------|-----------------------|----------------------------------------|
| 401    | `UNAUTHORIZED`        | Missing or invalid JWT                 |
| 403    | `SESSION_NOT_OWNED`   | Session belongs to a different user    |
| 404    | `SESSION_NOT_FOUND`   | sessionId does not exist               |
| 409    | `SESSION_ALREADY_COMPLETED` | Already completed               |
| 500    | `INTERNAL_ERROR`      | Unexpected server error                |

**Example:**

```bash
curl -s -X POST http://localhost:8080/api/game/session/sess-uuid-1234/complete \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..." \
  -H "Content-Type: application/json" \
  -d '{}'

# 200 OK
{
  "finalScore": 3750,
  "correctCount": 27,
  "totalCount": 30,
  "accuracy": 0.9,
  "timeTakenMs": 482000,
  "bestStreak": 12,
  "previousBest": 3200,
  "newPersonalBest": true
}
```

---

## Leaderboard Endpoints

### GET /api/leaderboard

Retrieve the global leaderboard, optionally filtered by map type and time period.

**Auth required:** No

**Query Parameters:**

| Parameter | Type   | Required | Default    | Allowed values                                     |
|-----------|--------|----------|------------|----------------------------------------------------|
| `mapType` | string | no       | `WORLD`    | `WORLD`, `EUROPE`, `ASIA`, `AMERICAS`, `AFRICA`    |
| `period`  | string | no       | `ALL_TIME` | `ALL_TIME`, `WEEKLY`, `DAILY`                      |
| `limit`   | number | no       | `50`       | 1–100                                              |

**Response — 200 OK:**

Array of leaderboard entry objects (max 50 by default):

| Field          | Type   | Description                         |
|----------------|--------|-------------------------------------|
| `rank`         | number | Position in leaderboard (1-indexed) |
| `userId`       | string | UUID                                |
| `username`     | string |                                     |
| `score`        | number | Session score                       |
| `correctCount` | number | Number of correct guesses           |
| `accuracy`     | number | 0.0–1.0                             |
| `completedAt`  | string | ISO-8601                            |

```json
[
  {
    "rank": "number",
    "userId": "string (UUID)",
    "username": "string",
    "score": "number",
    "correctCount": "number",
    "accuracy": "number",
    "completedAt": "string (ISO-8601)"
  }
]
```

**Error Responses:**

| Status | Code              | Condition                        |
|--------|-------------------|----------------------------------|
| 400    | `INVALID_PARAM`   | Unknown mapType or period value  |
| 500    | `INTERNAL_ERROR`  | Unexpected server error          |

**Example:**

```bash
curl -s "http://localhost:8080/api/leaderboard?mapType=WORLD&period=ALL_TIME"

# 200 OK
[
  {
    "rank": 1,
    "userId": "a1b2...",
    "username": "geoking",
    "score": 18500,
    "correctCount": 189,
    "accuracy": 0.97,
    "completedAt": "2026-06-25T14:30:00Z"
  }
]
```

---

### GET /api/leaderboard/friends

Retrieve the leaderboard scoped to the authenticated user's friends.

**Auth required:** Yes

**Query Parameters:**

| Parameter | Type   | Required | Default    | Allowed values                                     |
|-----------|--------|----------|------------|----------------------------------------------------|
| `mapType` | string | no       | `WORLD`    | `WORLD`, `EUROPE`, `ASIA`, `AMERICAS`, `AFRICA`    |
| `period`  | string | no       | `ALL_TIME` | `ALL_TIME`, `WEEKLY`, `DAILY`                      |

**Response — 200 OK:** Same structure as `GET /api/leaderboard`.

**Error Responses:**

| Status | Code              | Condition                        |
|--------|-------------------|----------------------------------|
| 400    | `INVALID_PARAM`   | Unknown mapType or period value  |
| 401    | `UNAUTHORIZED`    | Missing or invalid JWT           |
| 500    | `INTERNAL_ERROR`  | Unexpected server error          |

**Example:**

```bash
curl -s "http://localhost:8080/api/leaderboard/friends?period=WEEKLY" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..."

# 200 OK
[
  {
    "rank": 1,
    "userId": "b2c3...",
    "username": "mapfan99",
    "score": 9200,
    "correctCount": 83,
    "accuracy": 0.91,
    "completedAt": "2026-06-24T09:00:00Z"
  }
]
```

---

## User Endpoints

### GET /api/user/profile

Return the authenticated user's extended profile including stats.

**Auth required:** Yes

**Response — 200 OK:**

| Field            | Type   | Description                           |
|------------------|--------|---------------------------------------|
| `id`             | string | UUID                                  |
| `username`       | string |                                       |
| `email`          | string |                                       |
| `totalScore`     | number | All-time cumulative score             |
| `gamesPlayed`    | number | Total completed sessions              |
| `bestStreak`     | number | All-time highest streak               |
| `averageAccuracy`| number | Average accuracy across all sessions  |
| `friendCount`    | number | Number of accepted friends            |
| `createdAt`      | string | ISO-8601                              |

```json
{
  "id": "string (UUID)",
  "username": "string",
  "email": "string",
  "totalScore": "number",
  "gamesPlayed": "number",
  "bestStreak": "number",
  "averageAccuracy": "number",
  "friendCount": "number",
  "createdAt": "string (ISO-8601)"
}
```

**Error Responses:**

| Status | Code              | Condition               |
|--------|-------------------|-------------------------|
| 401    | `UNAUTHORIZED`    | Missing or invalid JWT  |
| 500    | `INTERNAL_ERROR`  | Unexpected server error |

**Example:**

```bash
curl -s http://localhost:8080/api/user/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..."

# 200 OK
{
  "id": "a1b2c3d4-...",
  "username": "geoking",
  "email": "geoking@example.com",
  "totalScore": 54200,
  "gamesPlayed": 42,
  "bestStreak": 22,
  "averageAccuracy": 0.89,
  "friendCount": 7,
  "createdAt": "2026-06-01T08:00:00Z"
}
```

---

### GET /api/user/history

Return a paginated list of the authenticated user's completed game sessions.

**Auth required:** Yes

**Query Parameters:**

| Parameter | Type   | Required | Default | Description          |
|-----------|--------|----------|---------|----------------------|
| `page`    | number | no       | `0`     | Zero-based page index|
| `size`    | number | no       | `10`    | Page size (max 100)  |

**Response — 200 OK:**

| Field              | Type   | Description                          |
|--------------------|--------|--------------------------------------|
| `content`          | array  | Array of session summaries           |
| `totalElements`    | number | Total number of sessions             |
| `totalPages`       | number |                                      |
| `currentPage`      | number | Zero-based                           |
| `content[].sessionId` | string | UUID                            |
| `content[].mapType`   | string |                                 |
| `content[].finalScore`| number |                                 |
| `content[].accuracy`  | number | 0.0–1.0                         |
| `content[].bestStreak`| number |                                 |
| `content[].completedAt`| string | ISO-8601                       |

```json
{
  "content": [
    {
      "sessionId": "string (UUID)",
      "mapType": "string",
      "finalScore": "number",
      "accuracy": "number",
      "bestStreak": "number",
      "completedAt": "string (ISO-8601)"
    }
  ],
  "totalElements": "number",
  "totalPages": "number",
  "currentPage": "number"
}
```

**Error Responses:**

| Status | Code              | Condition                        |
|--------|-------------------|----------------------------------|
| 400    | `INVALID_PARAM`   | page or size out of range        |
| 401    | `UNAUTHORIZED`    | Missing or invalid JWT           |
| 500    | `INTERNAL_ERROR`  | Unexpected server error          |

**Example:**

```bash
curl -s "http://localhost:8080/api/user/history?page=0&size=5" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..."

# 200 OK
{
  "content": [
    {
      "sessionId": "sess-uuid-1234",
      "mapType": "WORLD",
      "finalScore": 3750,
      "accuracy": 0.9,
      "bestStreak": 12,
      "completedAt": "2026-06-26T10:13:02Z"
    }
  ],
  "totalElements": 42,
  "totalPages": 9,
  "currentPage": 0
}
```

---

### POST /api/user/friends/{friendId}

Send or accept a friend request to/from another user.

**Auth required:** Yes

**Path Parameters:**

| Parameter  | Type   | Description             |
|------------|--------|-------------------------|
| `friendId` | string | UUID of the target user |

**Request Body:** None

**Response — 200 OK:**

| Field     | Type   | Description              |
|-----------|--------|--------------------------|
| `message` | string | Confirmation message     |

```json
{
  "message": "Friend added"
}
```

**Error Responses:**

| Status | Code                  | Condition                                 |
|--------|-----------------------|-------------------------------------------|
| 400    | `CANNOT_FRIEND_SELF`  | friendId matches the authenticated user   |
| 401    | `UNAUTHORIZED`        | Missing or invalid JWT                    |
| 404    | `USER_NOT_FOUND`      | friendId does not exist                   |
| 409    | `ALREADY_FRIENDS`     | Friendship already exists                 |
| 500    | `INTERNAL_ERROR`      | Unexpected server error                   |

**Example:**

```bash
curl -s -X POST http://localhost:8080/api/user/friends/b2c3d4e5-... \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..."

# 200 OK
{ "message": "Friend added" }
```

---

### GET /api/user/friends

Return a list of accepted friends for the authenticated user.

**Auth required:** Yes

**Response — 200 OK:**

Array of friend objects:

| Field        | Type   | Description                            |
|--------------|--------|----------------------------------------|
| `id`         | string | UUID of the friend                     |
| `username`   | string |                                        |
| `totalScore` | number | Friend's all-time cumulative score     |
| `gamesPlayed`| number |                                        |
| `bestStreak` | number |                                        |
| `friendSince`| string | ISO-8601, when friendship was accepted |

```json
[
  {
    "id": "string (UUID)",
    "username": "string",
    "totalScore": "number",
    "gamesPlayed": "number",
    "bestStreak": "number",
    "friendSince": "string (ISO-8601)"
  }
]
```

**Error Responses:**

| Status | Code              | Condition               |
|--------|-------------------|-------------------------|
| 401    | `UNAUTHORIZED`    | Missing or invalid JWT  |
| 500    | `INTERNAL_ERROR`  | Unexpected server error |

**Example:**

```bash
curl -s http://localhost:8080/api/user/friends \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..."

# 200 OK
[
  {
    "id": "b2c3d4e5-...",
    "username": "mapfan99",
    "totalScore": 31000,
    "gamesPlayed": 28,
    "bestStreak": 15,
    "friendSince": "2026-06-10T12:00:00Z"
  }
]
```

---

## Error Envelope

All error responses use this envelope:

```json
{
  "error": "string (error code)",
  "message": "string (human-readable description)",
  "timestamp": "string (ISO-8601)"
}
```

## Scoring Algorithm Reference

```
correctAnswer:
  base         = 100
  timeBonus    = max(0, 50 - max(0, floor((timeTakenMs - 3000) / 1000)))
  multiplier   = streak >= 20 ? 3.0
               : streak >= 10 ? 2.0
               : streak >= 5  ? 1.5
               : 1.0
  points       = floor((base + timeBonus) * multiplier)

wrongAnswer:
  points = 0
  streak = 0
```

Time bonus breakpoints:
- `timeTakenMs <= 3000` → full 50-point bonus (total 150 points at 1x)
- `timeTakenMs = 53000` → bonus = max(0, 50 - 50) = 0 (cutoff: exactly 0 at 53 s)
- `timeTakenMs > 53000` → bonus = 0 (floor of base 100 only)
