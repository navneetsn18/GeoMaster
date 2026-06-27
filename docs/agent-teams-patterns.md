# Agent Teams Patterns & Reference

> **Status:** Experimental — requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`
> **Minimum version:** Claude Code v2.1.178 (February 5, 2026)
> **Compiled:** June 26, 2026

---

## Configuration Reference

### 1. Configuration Fields (settings.json)

#### Enabling Agent Teams

| Field | Type | Default | Required | Purpose |
|-------|------|---------|----------|---------|
| `env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` | String | `"0"` | **Yes** | Set to `"1"` to enable the feature. Can be set in `settings.json` under `env`, or in the shell environment. |

**Example:**
```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

#### Display and Interaction

| Field | Type | Default | Required | Purpose |
|-------|------|---------|----------|---------|
| `teammateMode` | String enum | `"in-process"` (since v2.1.179) | No | How teammate panes are displayed: `"in-process"`, `"auto"`, `"tmux"`, or `"iterm2"` (v2.1.186+). |

| Mode | Requirement | Behavior |
|------|-------------|---------|
| `in-process` | Any terminal | Teammates share main terminal; arrow keys to navigate. |
| `auto` | tmux or iTerm2 | Split panes if available, falls back to in-process. |
| `tmux` | tmux or iTerm2 | Forces split pane using tmux. |
| `iterm2` | `it2` CLI + Python API enabled | Forces iTerm2 native split panes. |

**Not supported for split panes:** VS Code integrated terminal, Windows Terminal, Ghostty.

**Per-session override:**
```bash
claude --teammate-mode auto
```

**In-process keyboard controls:** ↑↓ select teammate, Enter open/message, Escape interrupt, x stop, Ctrl+T toggle task list.

#### Other Settings

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `cleanupPeriodDays` | Number | **30** | Controls retention of `~/.claude/tasks/{team-name}/` and session transcripts. `0` = disable all persistence (destroys `/resume` capability). |
| `disableAllHooks` | Boolean | `false` | If `true`, disables ALL hooks including team hooks (TeammateIdle, TaskCreated, TaskCompleted). **No per-hook granularity** — cannot disable only team hooks while keeping PreToolUse/PostToolUse active. Workaround: remove specific hook entries from config instead. |

---

### 2. CLI Flags

| Flag | Values | Purpose |
|------|--------|---------|
| `--teammate-mode <value>` | `in-process`, `auto`, `tmux`, `iterm2` | Overrides `teammateMode` setting for this session. |

**Not exposed as flags:** feature enable (env var only), teammate count, cleanup period, effort level, team name.

---

### 3. Runtime Files

Agent teams are not pre-authored — Claude Code generates and maintains these automatically.

| Path | Contents | Persistence |
|------|----------|-------------|
| `~/.claude/teams/{team-name}/config.json` | Runtime state (member names, agentIds, pane IDs) | Deleted on session exit |
| `~/.claude/tasks/{team-name}/` | Task list (all tasks, states, assignments) | Persists; governed by `cleanupPeriodDays` |

**Team name:** `session-` + first 8 characters of session ID (e.g., `session-a1b2c3d4`). Cannot be overridden.

**Do not edit either directory by hand** — changes are overwritten on the next state update.

**Team config structure:**
```json
{
  "members": [
    {
      "name": "teammate-name",
      "agentId": "unique-id-for-reference-only",
      "agentType": "general-purpose"
    }
  ]
}
```

---

### 4. Agent Tool — Spawning Teammates

The `Agent` tool spawns or resumes a teammate. (`Task` is a deprecated alias still accepted.)

| Parameter | Type | Default | Required | Purpose |
|-----------|------|---------|----------|---------|
| `description` | String | — | **Yes** | Short summary for the lead to use when deciding whether to delegate. |
| `prompt` | String | — | **Yes** | Task instruction and context. Teammates do NOT inherit the lead's conversation history; include all necessary context here. |
| `subagent_type` | String | — | **Yes** | Agent type: `"explore"`, `"plan"`, `"general-purpose"`, or a custom subagent name. |
| `name` | String | *(auto-generated)* | No | Human-readable name for addressing via SendMessage. Auto-generated format is undocumented — prefer setting this explicitly. |
| `model` | String | Lead's model (via `/config`) | No | Override model: `"sonnet"`, `"opus"`, `"haiku"`. |
| `mode` | String | `"default"` | No | Execution mode: `"default"`, `"plan"` (plan mode), `"acceptEdits"` (auto-accept modifications), `"bypassPermissions"`. |
| `run_in_background` | Boolean | `false` | No | Spawn agent without blocking the lead. Completion does not automatically trigger any action — monitor via TeammateIdle hook or the agent panel. |
| `max_turns` | Number | *(unlimited)* | No | Maximum turns before agent stops. On limit: terminates with `error_max_turns` result subtype — NOT silent, NOT idle. Must resume via SendMessage or new spawn. |
| `isolation` | String | `"worktree"` | No | Use `"worktree"` for an isolated Git worktree. **Bug #32974:** Fails immediately in non-Git repos even with `WorktreeCreate` hook configured. Workaround: `git init`. |
| `team_name` | String | *(ignored)* | No | **Deprecated since v2.1.178.** Accepted for backward compatibility but ignored; teams form implicitly. |
| `resume` | String | — | No | **Removed in v2.1.178.** Use `SendMessage(to: agentId)` instead. |

---

### 5. SendMessage Tool — Inter-Agent Communication

| Parameter | Type | Required | Purpose |
|-----------|------|----------|---------|
| `to` | String | **Yes** | Recipient. See valid values below. |
| `message` | String or Object | **Yes** | Message content. Plain string for normal messages; `{type: "shutdown_request"}` for graceful shutdown. |

**Valid `to` values:**

| Value | When to use |
|-------|-------------|
| Teammate name (e.g., `"researcher"`) | Primary messaging between team members. Always prefer over agentId. |
| agentId (UUID-like from team config) | Resume a stopped agent within the same session. |
| `"main"` | Send a message to the lead/main session. |

**Requires** `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` — unavailable without the feature flag.

**Important:** Plain text output from an agent is NOT delivered to teammates. You MUST use SendMessage explicitly to communicate.

**Known bug #43706:** Teammate-to-lead (`"main"`) SendMessage messages are silently dropped. Lead-to-teammate and peer-to-peer work reliably. Use TeammateIdle hook or task status as lead notification instead.

**Shutdown request:**
```json
{ "type": "shutdown_request" }
```
Teammate can approve (graceful exit) or reject with an explanation.

---

### 6. Teammate Lifecycle

**Spawn:** Lead invokes `Agent(name="X", subagent_type="...", prompt="...")`. Teammate is registered in team config. Teammate loads CLAUDE.md and project/user MCP servers and skills (but NOT the lead's conversation history).

**Active:** Teammate claims tasks from the shared list, runs autonomously, and can send/receive messages via SendMessage.

**Idle:** After finishing all tasks. In in-process mode (v2.1.181+), idle rows hide after 30 seconds but the teammate remains running and addressable. Rows reappear on next turn.

**Shutdown:** Via `SendMessage(to: "name", message: {type: "shutdown_request"})` or when the session ends. Shutdown waits for the current tool call to complete — can be slow.

**Session resumption (`/resume`):**
- ❌ In-process teammates are NOT restored.
- ✅ Task list persists.
- Tell the lead to spawn new teammates after resume.

**Resuming a stopped teammate within the same session:**
```
SendMessage(to: agentId)   // agentId from team config
```
The agent auto-resumes in the background without a new `Agent()` call.

---

### 7. Agent Types and Tool Access

#### Built-in Types

| Agent Type | Default Model | Modification Tools | Bash | WebFetch | Edit/Write | Resumable |
|------------|---------------|--------------------|------|----------|------------|-----------|
| `explore` | Haiku | ❌ | ❌ | ✅ | ❌ | ❌ One-shot |
| `plan` | Inherits lead | ❌ | ❌ | ✅ | ❌ | ❌ One-shot |
| `general-purpose` | Sonnet/Opus | ✅ | ✅ | ✅ | ✅ | ✅ Returns agentId |

**Note on WebSearch:** WebSearch (for finding pages via query) is distinct from WebFetch (for reading a known URL). Whether `general-purpose` has WebSearch is not explicitly confirmed in the official tool access table.

**Always available regardless of allowlist:** SendMessage, task management tools.

#### Custom Subagent Types

Define in `.claude/subagents.json` (project scope) or `~/.claude/subagents.json` (user scope):

```yaml
---
name: security-reviewer
description: Audits code for security vulnerabilities
tools:
  - Read
  - Search
model: opus
---
Security review instructions here...
```

When used as a teammate:
- ✅ `tools` allowlist is honored
- ✅ `model` is honored
- ✅ `body` is appended to the teammate's system prompt
- ❌ `skills` and `mcpServers` frontmatter are NOT applied — teammates load those from project/user settings instead

**Plugin-defined caveman types available as teammates:** `caveman:cavecrew-builder`, `caveman:cavecrew-investigator`, `caveman:cavecrew-reviewer`. These have specific tool restrictions (builder: Read/Edit/Write/Grep/Glob; investigator: Read/Grep/Glob/Bash; reviewer: Read/Grep/Bash).

---

### 8. Hook Events for Agent Teams

Three hook events are specific to agent teams. All three can block the triggering action.

#### Hook Configuration Location

Register hooks in `.claude/settings.json` (project-scoped, Git-safe) or `~/.claude/settings.json` (user-scoped):

```json
{
  "hooks": {
    "TeammateIdle": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "/path/to/your/hook-script.sh"
          }
        ]
      }
    ]
  }
}
```

#### Exit Code Semantics

| Exit Code | Meaning |
|-----------|---------|
| `0` | Allow the action to proceed. |
| `1` | Error — treated as a warning; action proceeds but error is logged. |
| `2` | **Block** the action and send feedback from stdout to the triggering agent. |

#### TeammateIdle

Fires when a teammate finishes a turn and has no more assigned tasks.

**Payload:**
```json
{
  "session_id": "...",
  "transcript_path": "...",
  "cwd": "...",
  "permission_mode": "default",
  "hook_event_name": "TeammateIdle",
  "teammate_name": "tester",
  "team_name": "session-a1b2c3d4"
}
```

**Exit 2 response (block + feedback):**
```json
{
  "continue": false,
  "systemMessage": "Run linter before going idle."
}
```

**Use cases:** Auto-assign follow-up tasks; run linters, type checkers, or test suites; redirect teammate to different work.

#### TaskCreated

Fires when a task is being created, before it appears in the task list.

**Payload:**
```json
{
  "session_id": "...",
  "transcript_path": "...",
  "cwd": "...",
  "permission_mode": "default",
  "hook_event_name": "TaskCreated",
  "task_id": "task-001",
  "task_subject": "Implement user authentication",
  "task_description": "Add login and signup endpoints",
  "teammate_name": "implementer",
  "team_name": "session-a1b2c3d4"
}
```

**Exit 2 response:**
```json
{
  "continue": false,
  "stopReason": "Task lacks acceptance criteria."
}
```

**Use cases:** Validate task descriptions; reject tasks missing context; enforce acceptance criteria at creation time.

#### TaskCompleted

Fires when a task is being marked complete, before it closes.

**Payload:**
```json
{
  "session_id": "...",
  "transcript_path": "...",
  "cwd": "...",
  "permission_mode": "default",
  "hook_event_name": "TaskCompleted",
  "task_id": "task-001",
  "task_subject": "Implement user authentication",
  "task_description": "Add login and signup endpoints",
  "teammate_name": "implementer",
  "team_name": "session-a1b2c3d4"
}
```

**Exit 2 response:**
```json
{
  "continue": false,
  "stopReason": "Integration tests failed — must pass before closure."
}
```

**Use cases:** Run integration tests before closing; enforce acceptance criteria; block completion on dependency failures.

---

### 9. Task Management

**States:** `pending` → `in-progress` → `completed`

**Task structure:**
```json
{
  "task_id": "task-001",
  "subject": "Implement user authentication",
  "description": "Add login and signup endpoints",
  "state": "in-progress",
  "assigned_to": "implementer",
  "depends_on": ["task-000"],
  "created_at": "...",
  "completed_at": "..."
}
```

**Claiming:** Lead assigns explicitly, OR teammates self-claim the next unblocked task. File locking prevents race conditions.

**Dependencies:** Blocked tasks cannot be claimed until dependencies complete. Auto-unblocks on upstream completion. Known issue: task status can lag, leaving dependent tasks blocked longer than expected.

**Sweet spot:** 5-6 self-contained tasks per teammate. Example: 15 tasks → 3 teammates at 5 tasks each.

---

### 10. Permissions

- Teammates inherit the lead's permission mode at spawn.
- `--dangerously-skip-permissions` on the lead propagates to all teammates.
- Individual teammate permission modes can be changed after spawn (not at spawn time).
- There is no mechanism to set per-teammate permission modes at spawn.

---

### 11. Concurrency Guidance

- **Recommended team size:** 3–5 teammates.
- **Above 3–5:** Coordination overhead increases faster than parallelism gains.
- **Rate limits:** Spawning many teammates simultaneously multiplies API usage — respect Claude API rate limits.
- **File conflicts:** Ensure teammates own non-overlapping file sets. The default worktree isolation prevents filesystem conflicts, but merge conflicts can still occur.
- **One team per session. No nested teams. Lead is fixed.**

---

### 12. Version History

| Version | Date | Key Changes |
|---------|------|-------------|
| v2.1.178 | Feb 5, 2026 | Initial release. Teams form implicitly on first teammate spawn. `TeamCreate`/`TeamDelete` removed. `team_name` parameter ignored. `resume` parameter removed (use SendMessage). |
| v2.1.179 | ~Jun 12, 2026 | Default mode changed from `"auto"` to `"in-process"`. Idle row hiding in in-process mode. |
| v2.1.181 | Jun 17, 2026 | `/config key=value` command added. |
| v2.1.186 | Jun 22, 2026 | `"iterm2"` teammate mode added. Teammates inherit lead's effort level. Fixed Agent allowed-types enforcement. |

---

### 13. Known Limitations

- `/resume` and `/rewind` do NOT restore in-process teammates.
- Task status can lag (known issue) — manually nudge or check actual completion.
- Shutdown is slow — teammates finish their current tool call before exiting.
- One team per session only.
- No nested teams (teammates cannot spawn teammates).
- Lead is permanent; leadership cannot transfer.
- Permissions cannot be set per-teammate at spawn time.
- Split panes not supported in VS Code integrated terminal, Windows Terminal, or Ghostty.
- No lead conversation history is passed to teammates — they start cold.
- `skills` and `mcpServers` defined in subagent frontmatter are NOT applied to teammates (they load from project/user settings instead).
- **Bug #43706:** Teammate-to-lead SendMessage silently dropped — use TeammateIdle hook or task status for lead notifications.
- **Bug #32974:** `isolation="worktree"` fails in non-Git repos even with WorktreeCreate hook — `git init` as workaround.
- **`disableAllHooks: true` has no granularity** — disables ALL hooks globally; cannot target only team hooks.

---

## Use Case Patterns

### Use Case 1: Large Codebase API Migration (Parallel Investigation + Surgical Edits)

**Scenario:** A Node.js backend migrates from a deprecated `legacy-fetch` client to `http-client` across ~200 files in 8 service subdirectories. Call patterns differ by usage type (simple GET, POST with body, error-handled calls). A single session cannot hold all context without drift.

**Team Structure:**
- **Scout** (`caveman:cavecrew-investigator`) — read-only; maps every `legacy-fetch` call site, clusters by usage pattern
- **Surgeon** (`caveman:cavecrew-builder`) — applies 1-2 file edits per invocation, called repeatedly
- **QA** (`caveman:cavecrew-reviewer`) — reviews each edit batch before the next begins

**Tool access requirements:**
- Scout: Read, Grep, Glob, Bash (for recursive grep)
- Surgeon: Read, Edit (for precise line edits)
- QA: Read, Grep, Bash (for `git diff`)

**Workflow:**
1. Orchestrator → Scout: "Find all imports and call sites of `legacy-fetch` across `./src`. Group by pattern: simple GET, POST with body, error-handled. Output a file:line table per pattern."
2. Scout replies with grouped table (e.g., 3 patterns, 47/89/64 files each).
3. Orchestrator → Surgeon (2 files at a time per batch): "In `src/payments/client.js` lines 12 and 34, replace `legacy-fetch(url, opts)` with `httpClient.get(url, { ...opts })`."
4. After each batch, Orchestrator → QA with the diff content: "Review these changes for correctness."
5. If QA blocks, Orchestrator relays QA's findings to Surgeon for correction. If QA passes, advance to next batch.
6. After pattern-1 complete, Orchestrator → Scout: "Verify no remaining `legacy-fetch` references in pattern-1 files."
7. Repeat for patterns 2 and 3.

**Why teammates vs. subagents:** Scout accumulates the full file map without re-scanning; QA builds a model of what "correct" looks like across batches. Cold subagents would re-derive pattern groupings every call.

**Configuration sketch** (spawn via Agent tool, no settings.json pre-definition needed):
```
Agent(name="Scout", subagent_type="caveman:cavecrew-investigator", prompt="...")
Agent(name="Surgeon", subagent_type="caveman:cavecrew-builder", prompt="...")
Agent(name="QA", subagent_type="caveman:cavecrew-reviewer", prompt="...")
```

**Success criteria:** Zero remaining `legacy-fetch` imports (Scout final pass); no unresolved QA blocks; `tsc --noEmit` passes after each pattern completes.

---

### Use Case 2: Research Pipeline (Web Research → Synthesis → Decision Document)

**Scenario:** Engineering team needs a technology evaluation report comparing four observability platforms (Datadog, Grafana Cloud, Honeycomb, New Relic) on pricing, Kubernetes integration depth, OpenTelemetry support, and query language ergonomics.

**Team Structure:**
- **Researcher** (`general-purpose`) — web search and page fetching, collects raw evidence per platform per dimension
- **Synthesizer** (`general-purpose`) — receives raw evidence bundles, distills to comparison tables and key findings
- **Writer** (`general-purpose`) — receives structured findings, produces the final decision document

**Tool access requirements:**
- Researcher: WebSearch, WebFetch (confirm `general-purpose` has WebSearch specifically)
- Synthesizer: Read (receives text input via messages)
- Writer: Write (to produce the document)

**Workflow:**
1. Orchestrator → Researcher: "Fetch current pricing pages and OTel docs for Datadog. Report: pricing tiers, K8s agent setup complexity, native OTel support yes/no with caveats, query language name. Note the fetch date for each source."
2. Repeat step 1 for the other three platforms.
3. Orchestrator bundles all four raw-note sets → Synthesizer: "Produce a comparison matrix (platforms as columns, dimensions as rows) and 3-bullet key finding per platform."
4. Synthesizer replies with structured matrix and findings.
5. Orchestrator → Writer: "Using this matrix and findings, write a 2-page decision doc: Executive Summary / Comparison Matrix / Platform Analysis / Recommendation. Audience: VP Eng who knows Kubernetes."
6. Orchestrator → Synthesizer: "Review this document [paste Writer's output] for factual accuracy against the raw notes. Flag any claims not supported by the source data."

**Why teammates vs. subagents:** Researcher accumulates context across all four fetches and can notice cross-platform patterns. Synthesizer holds the full matrix as it answers Writer follow-ups.

**Success criteria:** All four platforms covered on all four dimensions; no pricing data unverified (Researcher notes fetch dates); Synthesizer confirms Writer introduced no unsupported comparative claims (step 6).

---

### Use Case 3: PR Review + Iterative Fix Cycle

**Scenario:** A PR adds JWT authentication middleware to an Express app. Automated pre-review: find correctness bugs and security issues, apply targeted fixes, re-review to confirm fixes didn't introduce new problems.

**Team Structure:**
- **Reviewer** (`caveman:cavecrew-reviewer`) — reads the diff, produces severity-tagged findings, never edits
- **Fixer** (`caveman:cavecrew-builder`) — receives specific file:line findings, applies targeted fixes
- **Auditor** (`caveman:cavecrew-reviewer`) — second review pass after fixes, focused only on changed lines

**Tool access requirements:**
- Reviewer: Read, Grep, Bash (to access `git diff` output passed by Orchestrator)
- Fixer: Read, Edit (must re-read file before each edit to account for line number shifts from previous edits)
- Auditor: Read, Grep

**Workflow:**
1. Orchestrator → Reviewer: "Review `src/middleware/auth.js` lines 1-120 and `src/routes/protected.js` lines 45-78. Flag: security issues (JWT validation, timing attacks), correctness bugs, logic gaps. Format: `path:line: SEVERITY: problem. fix.`"
2. Reviewer returns findings with severity tags.
3. Orchestrator → Fixer (one finding at a time, CRITICAL first): "Fix `src/middleware/auth.js:34`: JWT signature not verified. Use `jwt.verify()` not `jwt.decode()`. Re-read the file before editing to confirm current line numbers."
4. After all fixes, Orchestrator → Auditor: "Re-review the fixed lines in auth.js and protected.js. Confirm original findings are resolved and no new issues introduced."
5. If Auditor raises a new finding, loop back to Fixer. Exit when Auditor issues a clean pass.

**Recommended hook:**
```json
{
  "hooks": {
    "TeammateIdle": [{
      "matcher": "",
      "hooks": [{"type": "command", "command": "./hooks/check-reviewer-complete.sh"}]
    }]
  }
}
```
Use a TeammateIdle hook to detect if Reviewer goes idle before completing a full pass on a large diff.

**Success criteria:** All CRITICAL and HIGH findings resolved (Auditor confirms); no new findings from Auditor's final pass; MEDIUM findings fixed or explicitly deferred with rationale in the PR description.

---

### Use Case 4: Test Generation + Validation Loop

**Scenario:** A payments module (`src/payments/`) has 1,400 lines with 23% test coverage. Target: 80% coverage via targeted test generation across multiple iterations.

**Team Structure:**
- **Mapper** (`caveman:cavecrew-investigator`) — reads coverage report and source, identifies uncovered branches sorted by business criticality
- **TestWriter** (`caveman:cavecrew-builder`) — writes test cases for 2-3 uncovered branches per invocation
- **Validator** (`general-purpose`) — runs the test suite, interprets failures, distinguishes "bad test assumption" from "source bug"

**Tool access requirements:**
- Mapper: Read, Grep, Glob, Bash (for reading coverage JSON)
- TestWriter: Read, Edit, Write (for test file modifications)
- Validator: Bash (for `npm test`, `npm run coverage`)

**Workflow:**
1. Orchestrator → Mapper: "Read `coverage/payments.json` and `src/payments/*.js`. List uncovered branches sorted by business criticality. For each: function name, file:line, what condition is untested, parameter signature."
2. Mapper returns prioritized list (e.g., 14 uncovered branches). **Mapper should also write this list to `coverage/remaining-branches.json`** to enable recovery if context is lost.
3. Orchestrator picks top 3 → TestWriter: "Write Jest tests for these 3 branches. Add to `tests/payments/refunds.test.js`. Do not modify source files or `tests/setup.js`."
4. Orchestrator → Validator: "Run `npm test -- --testPathPattern=payments/refunds`. Report which new tests pass, which fail, and for each failure: bad test assumption or source bug?"
5. If Validator reports bad assumptions → Orchestrator relays diagnosis to TestWriter for correction. Loop until all new tests pass.
6. Orchestrator → Validator: "Run `npm run coverage -- --collectCoverageFrom='src/payments/**'`. Report current coverage percentage."
7. If below 80% AND Mapper has remaining branches: Orchestrator → Mapper: "Continue from your ranked list. Which 3 branches are next?" Loop from step 3.
8. **Loop exit condition:** If Mapper reports no remaining testable branches, or coverage ≥ 80%, end loop. Document any excluded branches and why they are untestable.

**Success criteria:** `src/payments/` coverage ≥ 80% (Validator confirms); all generated tests pass consistently; `git diff src/payments/` is clean (no source files modified); excluded branches documented.

---

### Use Case 5: Multi-File Feature Implementation with Architect + Implementer Separation

**Scenario:** Adding a webhook delivery system to a SaaS platform: registration endpoint, queue-backed dispatcher, retry logic with exponential backoff, delivery log. Touches 6+ files across 3 layers. Risk: implementer making architectural decisions mid-flight (e.g., placing retry logic in the route handler instead of the service layer).

**Team Structure:**
- **Architect** (`plan`) — reads codebase structure, produces concrete implementation plan with file names, function signatures, and layer boundary decisions. Does not write code.
- **Implementer** (`caveman:cavecrew-builder`) — receives one file + its spec per invocation from the plan. Hard 1-2 file scope limit per turn.
- **Inspector** (`caveman:cavecrew-investigator`) — validates each completed file integrates correctly with existing code (imports resolve, interfaces match, no duplicate logic)

**Tool access requirements:**
- Architect: Read (plan type — no Bash; file reading only; sufficient if architecture is derivable from source files)
- Implementer: Read, Edit, Write
- Inspector: Read, Grep, Glob, Bash (for import resolution checks and grep)

**Workflow:**
1. Orchestrator → Architect: "Read `src/routes/`, `src/services/`, `src/db/schema.js`. Design a webhook delivery system. Output: ordered implementation plan with file paths, function signatures, layer boundary decisions, and which existing files need modification."
2. Architect returns 7-step plan. **Orchestrator writes the plan to `docs/webhook-plan.md`** so it can be referenced if context is lost or Architect needs to be re-consulted.
3. Orchestrator → Implementer (step 1): "Create `src/db/migrations/004_webhooks.sql` with this exact schema: [paste from plan]. Do not modify any other file."
4. After Implementer confirms → Orchestrator → Inspector: "Read `src/db/migrations/004_webhooks.sql` and existing migrations for format comparison. Confirm: migration matches existing format, no column naming conflicts."
5. Inspector confirms or flags. If flagged: Orchestrator → Implementer with Inspector's specific feedback for correction.
6. Advance to step 2 of the plan. Repeat steps 3-5 through all 7 plan steps.
7. After all steps, Orchestrator → Inspector: "Verify all 7 files from `docs/webhook-plan.md` exist. Check that import paths between them resolve correctly. Grep for retry logic outside `src/services/webhookDispatcher.js` — output should be empty."
8. If the Orchestrator needs plan clarification mid-implementation: send a message directly to Architect by name (`SendMessage(to: "Architect", ...)`). Architect may have gone idle between steps — this is expected; the message will resume it.

**Success criteria:** All 7 plan files exist; Inspector's final import-path check passes; `tsc --noEmit` passes on each new file; Inspector grep for misplaced retry logic returns empty.

---

## Gaps & Recommendations

### Gaps in Reference Documentation

#### P0 — Blocks Practitioners From Using the Feature

**G1. Hook registration syntax is absent.**
The hook payload schemas are documented but the settings.json `hooks` block structure is never shown. Practitioners cannot write a working hook without this. The reference doc includes examples for all three hook events (see Configuration Reference above), but the official docs must include complete worked examples including the shell script side.

**G2. Hook exit code semantics for exit 0 and exit 1 are undefined.**
Exit 2 (block + feedback) is documented. Exit 0 (allow) and exit 1 (error/warning) are undocumented. A hook author writing a shell script cannot reason about failure behavior without knowing all three codes.

**G3. Broadcast — RESOLVED: broadcast is real but costly.**
Teammates CAN broadcast to all teammates. Messages are routed via per-teammate inbox files at `~/.claude/teams/{team-name}/inboxes/{name}.json`. Broadcast sends one message per recipient inbox — the API has no single-call broadcast primitive. Use sparingly: token cost scales with team size.

#### P1 — Causes Silent Failures

**G4. `max_turns` behavior when hit is undocumented.**
Does the teammate go idle? Stop mid-task leaving it in-progress? Mark the task complete? This is a silent failure mode for any workflow that sets a turn budget.

**G5. SendMessage to a busy teammate — queue or drop?**
What happens if you send a message to a teammate that is currently mid-turn (executing tools)? Does it queue? Block? Drop? This is critical for Orchestrator patterns where the lead sends follow-up instructions.

**G6. Can teammates create tasks? — RESOLVED: yes.**
Teammates have access to `TaskCreate`, `TaskUpdate`, `TaskList`, and `TaskGet` tools. The TaskCreated hook fires for teammate-created tasks with `teammate_name` set. Dynamic workflows are fully supported: a Researcher discovering 3 subtasks can call TaskCreate for each; other teammates auto-claim them.

**G7. Auto-generated teammate name format is undocumented.**
The `name` parameter is optional, but SendMessage requires a name to address teammates. What does the auto-generated name look like? Can two teammates share an auto-generated name? Practitioners should always set `name` explicitly until this is documented.

**G8. `isolation: "worktree"` behavior in non-Git directories.**
The worktree base path, cleanup timing, and behavior when the project has uncommitted changes that the worktree won't see are all undocumented.

#### P2 — Reduces Confidence / Causes Confusion

**G9. `cleanupPeriodDays` — RESOLVED: default is 30 days.**
Default: 30 days. Covers task lists (`~/.claude/tasks/`), session transcripts, shell snapshots, and backups older than N days — deleted at startup. `0` = disable persistence entirely (no transcripts written, existing deleted, `/resume` broken). Valid range: any non-negative integer; 999 ≈ 3 years.

**G10. Effort levels — RESOLVED: 5 levels defined.**

| Level | Thinking Budget | Use When |
|-------|-----------------|----------|
| Low | Minimal | Trivial edits, obvious bugs |
| Medium | Standard (default) | Everyday dev work |
| High | High | Complex multi-file refactors |
| Max | Maximum | Algorithmic problems, mysterious bugs |
| Ultra Code | Adaptive | Long autonomous sessions with variable complexity |

Set with `/effort [level]`. Teammates inherit lead's level as of v2.1.186 (previously not passed to split-pane teammates).

**G11. "5-6 tasks per teammate" rationale is unexplained.**
The number is treated as authoritative but has no stated basis. Is it a context window concern (tasks × avg task context approaching a limit)? Coordination overhead finding from internal testing? Practitioners need to know whether to adjust it for long-running tasks vs. short ones.

**G12. Version number internal inconsistency.**
Idle row hiding is attributed to v2.1.179 in the display modes section and to v2.1.181 in the version history table. One is wrong.

**G13. v2.1.178 migration path absent.**
`TeamCreate` and `TeamDelete` were removed in v2.1.178 but their original function is not documented. Users on v2.1.177 or earlier have no documented migration path.

**G14. Changelog gap v2.1.182–v2.1.185.**
Four versions with no documented changes. Practitioners on these versions cannot determine their feature set.

**G15. No minimum viable example.**
The docs lack a complete end-to-end example: two teammates, one task, one SendMessage exchange, from feature-flag enable through task completion. This is the most effective onboarding tool and it's entirely absent.

---

### Corrections Needed

**C1. Broadcast claim must be resolved** (see G3 above). One of two statements is factually wrong.

**C2. "Teammates don't inherit lead's model by default"** — the mechanism is `/config` UI but the exact settings.json field for default teammate model is not named. Practitioners cannot set this programmatically.

**C3. Configuration sketch format in use cases uses `"agents": {}` key** — this key does not appear anywhere in the Researcher's inventory or the official settings reference. Teammates are spawned via the `Agent()` tool, not pre-defined in settings.json. The configuration sketches in Use Cases 1-5 are misleading as written; they should show `Agent()` tool invocations instead.

**C4. `run_in_background` completion behavior** — the inventory says "completion does NOT trigger automatic behavior" but this session demonstrated that background agents DO generate task notifications. The docs are likely referring specifically to in-session teammate behavior (no automatic next-task assignment), not absence of all notifications. The distinction needs to be clarified.

**C5. `Explore` and `Plan` as persistent teammates** — both are listed as "one-shot; cannot be resumed." Can they receive SendMessage messages during their run? Can they be kept alive between messages from the Orchestrator, or do they terminate after their first turn? Use Case 5 relies on Architect (Plan type) being available for re-consultation, but Plan's one-shot nature may not support this.

---

### Use Case Risk Flags

#### Use Case 1 — API Migration

| Risk | Severity | What Goes Wrong |
|------|----------|----------------|
| Orchestrator context overflow | CRITICAL | Lead sends ~100 sequential Surgeon round trips; context fills before migration completes. Mitigation: use a dedicated Coordinator teammate for orchestration, and track progress in a file on disk rather than in the lead's context. |
| Scout message size | HIGH | A 200-file:line table in a single message may exceed undocumented size limits. Mitigation: Scout should chunk output by pattern, not send all 200 at once. |
| QA tool access gap | HIGH | If QA's Bash access is not confirmed, it cannot run `git diff`; the Orchestrator must paste diff content into the message. |
| Wrong tool for the job | MEDIUM | Pattern-1 (47 identical GET replacements) should be a `jscodeshift` codemod, not 24 Surgeon invocations. Agents are expensive for mechanical identical transformations. |
| No inter-pattern type checking | MEDIUM | Pattern-1 edits may break pattern-2 file imports. Add `tsc --noEmit` between patterns. |

#### Use Case 2 — Research Pipeline

| Risk | Severity | What Goes Wrong |
|------|----------|----------------|
| WebSearch availability unconfirmed | HIGH | `general-purpose` tool access table does not explicitly confirm WebSearch. If absent, Researcher cannot discover pages — only fetch known URLs. Verify before using this pattern. |
| Synthesizer never sees Writer's output | HIGH | The workflow as written never sends Writer's document to Synthesizer for validation. Add step 6 explicitly (see workflow above). |
| Page freshness unverifiable | MEDIUM | WebFetch does not return Last-Modified headers. Researcher can only note the fetch date, not the page's actual update date. |
| Better as parallel subagents | MEDIUM | Four independent research tasks could run as parallel background subagents (faster, cheaper). The persistent Researcher's accumulation benefit is marginal for 4 sequential queries. |

#### Use Case 3 — PR Review + Fix Cycle

| Risk | Severity | What Goes Wrong |
|------|----------|----------------|
| Line number drift on sequential edits | HIGH | After Fixer edits line 34, line 67 is no longer at line 67. Fixer must re-read the file before each edit. This must be in the Fixer's spawn prompt. |
| Two teammates of same agent type | HIGH | Whether Reviewer and Auditor (both `caveman:cavecrew-reviewer`) can coexist without naming conflicts is undocumented. |
| TeammateIdle gap on large diffs | MEDIUM | Reviewer may go idle mid-analysis on a large diff with no hook to catch this. Configure TeammateIdle hook for Reviewer. |
| No runtime validation | MEDIUM | Auditor reviews code only; no `npm test` execution. A syntactically correct fix can still fail at runtime. |

#### Use Case 4 — Test Generation Loop

| Risk | Severity | What Goes Wrong |
|------|----------|----------------|
| Missing loop exit condition | CRITICAL | If Mapper exhausts testable branches before 80%, the loop has no exit path. See the updated workflow above for the required exit condition. |
| Mapper context accumulation | HIGH | 5+ iterations of coverage discussions make Mapper's context very long. Mitigate by writing remaining branches to `coverage/remaining-branches.json` and spawning fresh Mapper subagents per iteration if the session becomes too long. |
| Test infrastructure scope creep | MEDIUM | New tests may require modifications to `tests/setup.js` or `tests/helpers/`. The "Do not modify source files" constraint doesn't address test infrastructure. |
| Validator npm environment | MEDIUM | Confirm `npm` is in PATH in the Validator's worktree environment. Set tool allowlist if needed. |

#### Use Case 5 — Architect + Implementer + Inspector

| Risk | Severity | What Goes Wrong |
|------|----------|----------------|
| Plan type tool limitation | HIGH | Architect (Plan type) has no Bash access. If the project's architecture requires understanding build outputs or generated files, Architect's file-read-only toolset is insufficient. Consider `general-purpose` for Architect if deeper investigation is needed. |
| Static plan with no revision path | HIGH | If step 5 reveals the Architect's interface assumption was wrong, there is no documented way to loop back to Architect for plan revision. Mitigate by writing the plan to `docs/webhook-plan.md` and using SendMessage to Architect by name for mid-implementation clarification. |
| Implementer interface blindness | MEDIUM | Implementer for step 3 doesn't know what schema step 1 produced. Include relevant prior outputs in each Implementer invocation, even if it means repeating them in the prompt. |
| No integration test in success criteria | MEDIUM | `tsc --noEmit` and import resolution are structural checks only. Add a behavioral test step (e.g., `npm run test:integration`) to the success criteria. |

---

### Recommendations

**R1 — Add hook registration examples to official docs (P0)**
Every hook event should include a complete worked example: settings.json registration block + a minimal shell script. Practitioners cannot use hooks without this.

**R2 — Resolve broadcast contradiction and document the correct behavior (P0)**
Determine definitively whether broadcast SendMessage exists. If it does, document the syntax. If it doesn't, remove the claim from the Active Phase section.

**R3 — Document all hook exit code semantics explicitly (P0)**
A table showing exit 0 / exit 1 / exit 2 behavior for each hook type, with examples of when each is appropriate.

**R4 — Add a "Teammates vs. Subagents" decision guide (P1)**
This is the most common practitioner question. The guide should cover: when context accumulation justifies teammates (iterative loops, multi-step coordination) vs. when parallel subagents are cheaper and sufficient (independent parallel tasks, one-shot research). Include approximate token cost comparison.

**R5 — Add a minimum viable example (P1)**
A complete end-to-end example: enable the flag, spawn two teammates, assign tasks, exchange one message per teammate, confirm task completion. This single example would reduce onboarding time by hours.

**R6 — Define effort levels (P1)**
Document what effort levels exist, what they do, and what the behavior was before v2.1.186.

**R7 — Definitively answer: can teammates create tasks? (P1)**
This single ambiguity blocks an entire class of dynamic workflows. If the answer is no, practitioners need to design around it (pre-create all tasks at session start). If yes, document the syntax.

**R8 — Add tool access confirmation to use case patterns (P1)**
Each use case should include a "Tool access requirements" section that cross-references the tool access table and confirms the chosen agent type has the required tools. This prevents the most common use-case failure mode (assuming a tool that isn't available).

**R9 — Explain the "5-6 tasks" rationale (P2)**
State explicitly what this number is based on. If it's a context window concern, give the math. If it's an empirical finding, say so. Practitioners need to know whether to adjust it for their task sizes.

**R10 — Fix the version inconsistency for idle row hiding (P2)**
v2.1.179 vs. v2.1.181 — determine which is correct and fix both the display modes section and the version history table.

**R11 — Document `cleanupPeriodDays` default and valid range (P2)**
State the default (absent = never clean up?), valid range, and what "cleanup" actually does (delete? archive?).

**R12 — Add failure recovery patterns to use cases (P2)**
Each use case should include a short "Error paths" section: what to do when a teammate crashes, when SendMessage delivery fails, or when a hook script returns an unexpected exit code.

**R13 — Warn practitioners to always set `name` explicitly (P2)**
Until auto-generated name format is documented, spawning unnamed teammates and then addressing them via SendMessage is a reliability risk. The docs should recommend always setting `name`.

**R14 — Add a TaskCompleted hook example to iterative use cases (P2)**
Use Cases 3, 4, and 5 all rely on SendMessage reply as the task completion signal, with no hook-based fallback if a teammate crashes mid-task. Show how to wire a TaskCompleted hook as a reliability backstop.
