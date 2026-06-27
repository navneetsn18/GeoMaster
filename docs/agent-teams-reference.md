# Agent Teams Reference Guide

Source: https://code.claude.com/docs/en/agent-teams  
Version: v2.1.186+  
Status: Experimental — `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` required

---

## Quick Decision: Teams vs Subagents vs Single Session

| Signal | Use |
|--------|-----|
| Workers need to message each other, debate, challenge findings | Agent teams |
| Workers just report results back | Subagents |
| Sequential tasks, same-file edits, many dependencies | Single session |
| Research, review, new modules, competing hypotheses | Agent teams |
| Routine tasks, cost-sensitive | Single session |

**Teams cost significantly more tokens.** Each teammate = full independent context window.

---

## Enable

```json
// .claude/settings.json or ~/.claude/settings.json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

Or shell: `export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`

---

## Architecture

```
Team Lead (main session)
├── Spawns teammates
├── Manages task list
└── Coordinates via shared mailbox

Teammates (separate Claude Code instances)
├── Own context window (no lead history)
├── Load: CLAUDE.md, MCP servers, skills from project
├── Message each other directly by name
└── Self-claim tasks from shared list

Shared infrastructure
├── Task list: ~/.claude/tasks/{team-name}/     ← persists across resumes
└── Team config: ~/.claude/teams/{team-name}/config.json  ← deleted on exit
```

Team name = `session-` + first 8 chars of session ID.

**Do not hand-edit team config** — overwritten on every state update.

---

## Spawning Teammates

Natural language — Claude decides count, or specify explicitly:

```text
Spawn three teammates: one on UX, one on architecture, one devil's advocate.
```

```text
Spawn 4 teammates to refactor these modules in parallel. Use Sonnet for each.
```

Models: teammates don't inherit lead's model by default. Set in `/config` → "Default teammate model", or specify in prompt. To mirror lead: set "Default (leader's model)".

Teammates inherit lead's **effort level**.

### Using Subagent Definitions as Teammates

Define a role once, reuse as both subagent and teammate:

```text
Spawn a teammate using the security-reviewer agent type to audit the auth module.
```

- Honors definition's `tools` allowlist and `model`
- Definition body appended to teammate's system prompt (not replaced)
- `SendMessage` and task tools always available even with restricted `tools`
- `skills` and `mcpServers` from definition frontmatter NOT applied — loaded from project/user settings instead

---

## Display Modes

| Mode | Description | Requires |
|------|-------------|---------|
| `in-process` | All teammates in main terminal, agent panel below prompt | Any terminal |
| `auto` | Split panes if tmux/iTerm2 available, else in-process | tmux or iTerm2 |
| `tmux` | Split panes, auto-detects tmux vs iTerm2 | tmux or iTerm2 |
| `iterm2` | iTerm2 native split panes explicitly | `it2` CLI + Python API enabled |

Default: `in-process` (changed from `auto` in v2.1.179).

```json
// ~/.claude/settings.json
{ "teammateMode": "auto" }
```

```bash
claude --teammate-mode auto
```

Install:
- tmux: via package manager
- iTerm2: install `it2` CLI, enable Python API in iTerm2 → Settings → General → Magic

### In-Process Controls
- `↑↓` — select teammate in agent panel
- `Enter` — open transcript + message directly
- `Escape` — interrupt teammate's current turn
- `x` on selected — stop teammate
- `Ctrl+T` — toggle task list

Idle row hides after 30s (v2.1.181+), reappears on next turn. Teammate still running.

---

## Task System

States: `pending` → `in progress` → `completed`

Dependencies supported — blocked task can't be claimed until dependencies complete. Unblocks automatically when dependency finishes.

Claiming uses **file locking** to prevent race conditions.

Lead assigns OR teammates self-claim after finishing current task.

5-6 tasks per teammate = sweet spot. 15 tasks → start with 3 teammates.

---

## Communication

- Messages delivered automatically (lead doesn't poll)
- Idle notification sent automatically when teammate stops
- Shared task list visible to all
- Point-to-point: send to one teammate by name
- Broadcast: send one message per recipient (no group send)

**Names**: lead assigns at spawn. For predictable names, specify in spawn prompt:

```text
Spawn a teammate named "security-bot" to review auth.
```

---

## Plan Approval Flow

```text
Spawn an architect teammate to refactor the auth module.
Require plan approval before they make any changes.
```

1. Teammate works in read-only plan mode
2. Sends plan approval request to lead
3. Lead approves or rejects with feedback
4. Rejected → teammate revises and resubmits
5. Approved → teammate exits plan mode, begins implementation

Control lead's judgment via prompt criteria:
```text
Only approve plans that include test coverage.
Reject plans that modify the database schema.
```

---

## Hooks for Quality Gates

| Hook | Trigger | Exit 2 Effect |
|------|---------|---------------|
| `TeammateIdle` | Teammate about to go idle | Send feedback, keep working |
| `TaskCreated` | Task being created | Prevent creation + send feedback |
| `TaskCompleted` | Task being marked complete | Prevent completion + send feedback |

---

## Permissions

- Teammates start with lead's permission settings
- `--dangerously-skip-permissions` on lead → all teammates get it
- Can change individual teammate modes after spawn
- Cannot set per-teammate modes at spawn time

---

## Shutdown

```text
Ask the researcher teammate to shut down
```

Teammate can approve (graceful exit) or reject with explanation.

Team config directory auto-deleted on session exit. Task directory persists (governed by `cleanupPeriodDays`).

---

## Best Practices

### Team Size
- **Start with 3-5 teammates** for most workflows
- Scale only when work genuinely parallelizes
- Three focused > five scattered

### Task Sizing
- Too small: coordination overhead exceeds benefit
- Too large: long runs without check-ins, wasted effort risk
- Right: self-contained unit with clear deliverable (function, test file, review)

### Context
Teammates load CLAUDE.md, MCP, skills — but NOT lead's conversation history. Put task-specific details in spawn prompt:

```text
Spawn a security reviewer with the prompt: "Review src/auth/ for vulnerabilities.
Focus on token handling, session management, input validation. App uses JWT in
httpOnly cookies. Report issues with severity ratings."
```

### Anti-patterns
- Don't let two teammates edit the same file (overwrites)
- Don't let team run unattended too long
- Don't use teams for sequential tasks or same-file work
- If lead starts doing work instead of delegating: `"Wait for your teammates to complete their tasks before proceeding"`

### Ramp-up
Start with research/review tasks (no code writing) to learn coordination before parallel implementation.

---

## Use Case Patterns

### Parallel Code Review
```text
Spawn three teammates to review PR #142:
- One focused on security implications
- One checking performance impact
- One validating test coverage
Have them each review and report findings.
```

### Competing Hypotheses (Debugging)
```text
Users report the app exits after one message instead of staying connected.
Spawn 5 agent teammates to investigate different hypotheses. Have them talk to
each other to try to disprove each other's theories, like a scientific debate.
Update the findings doc with whatever consensus emerges.
```

Why adversarial: anchoring bias means sequential investigation stops at first plausible theory. Debate forces survival-of-the-fittest for hypotheses.

### Parallel Feature Development
```text
Spawn 3 teammates, each owning a separate module. No shared files.
```

### Cross-layer Coordination
Frontend teammate + backend teammate + test teammate, each owning their layer.

---

## Limitations (Current)

| Limitation | Workaround |
|-----------|------------|
| `/resume` and `/rewind` don't restore in-process teammates | Tell lead to spawn new teammates |
| Task status can lag (blocking dependent tasks) | Update manually or tell lead to nudge |
| Shutdown can be slow (finishes current request first) | Wait it out |
| One team per session | N/A |
| No nested teams (teammates can't spawn teammates) | N/A |
| Lead is fixed for session lifetime | N/A |
| Split panes: no VS Code integrated terminal, Windows Terminal, Ghostty | Use in-process mode |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Teammates not appearing | Check agent panel (↑↓); idle rows hide after 30s; task may not warrant a team |
| Too many permission prompts | Pre-approve in permission settings before spawning |
| Teammate stops on error | Select in panel → Enter → give new instructions or spawn replacement |
| Lead shuts down early | "Keep going, not all tasks are complete" |
| Orphaned tmux sessions | `tmux ls` → `tmux kill-session -t <name>` |

---

## Token Cost Awareness

- Scales linearly with teammate count
- Research/review/new features: usually worth the cost
- Routine tasks: single session more efficient
- See: https://code.claude.com/docs/en/costs#agent-team-token-costs

---

## Related

- Subagents: https://code.claude.com/docs/en/sub-agents
- Git worktrees (manual parallel sessions): https://code.claude.com/docs/en/worktrees
- Hooks: https://code.claude.com/docs/en/hooks
- Settings: https://code.claude.com/docs/en/settings
