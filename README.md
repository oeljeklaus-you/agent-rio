# Agent ROI

Track what your AI coding spend actually produced.

A local-first CLI and dashboard for AI coding spend, task attribution, waste detection, recommendations, and trend signals.

Connect:

```text
AI Cost
→ Tasks
→ Git Activity
→ Insights
→ Recommendations
```

[中文文档](README.zh-CN.md)

## Why Agent ROI

Most AI coding tools can tell you:

- Tokens
- Cost

But they usually cannot answer:

- Which tasks were the most expensive?
- Which tasks were the most efficient?
- Which tasks may have wasted budget?
- What did the AI spend actually produce?

Agent ROI exists to answer those questions.

## Dashboard

Open a local dashboard when you want a faster visual pass over your recent tasks, project coverage, waste signals, and recommendations.

```bash
agent-roi ui --open
```

![Agent ROI dashboard overview](.github/assets/dashboard-overview.png)

What the dashboard currently gives you:

- `Overview`
  A visual summary of spend, coverage gaps, trend direction, waste signals, and the next recommendation.
- `Health`
  A data health page that explains why recent tasks did or did not match Codex task attribution.
- `Projects`
  A searchable, filterable view of tracked vs untracked projects, sessions, tokens, and latest activity.
- `Tasks`
  A searchable, filterable review queue for recent completed tasks, attribution status, and Git output.
- `Budget / Compare / Insights / Waste / Recommendations / Leaderboard`
  The same local analyses from the CLI, organized into dedicated pages.

## Example Output

Insights:

```text
Insights (Last 30 Days)

Scope
- 7 completed tasks
- Claude snapshots excluded

Cost
- Top 33% of tasks consumed 66% of AI cost.

Waste
- 1 task consumed $8.32 with zero commits.

Efficiency
- Tasks under 45m produced 10.4x more commits per dollar than tasks over 2h.
```

Waste:

```text
Waste Report (Last 30 Days)

Potential Waste

1. Refactor CSS
   Cost: $5.42
   Duration: 1h 32m
   Tokens: 2.4M
   Commits: 0
   Files Changed: 1
   Reason: AI cost with no commits
```

Recommendations:

```text
Recommendations (Last 30 Days)

1. Break Large Tasks

Tasks under 45m produced 5.3x more commits per dollar than tasks over 2h.

Consider splitting large tasks into smaller units.

2. Investigate Potential Waste

2 tasks consumed $5.91 with zero commits.
```

Leaderboard:

```text
Leaderboard (Last 30 Days)

Most Expensive Tasks

1. Refactor auth flow
   Cost: $8.32

2. Refactor CSS
   Cost: $5.42

Most Efficient Tasks

1. Fix purchase button
   Cost: $0.42
   LOC Per Dollar: 238 LOC/$1

Least Efficient Tasks

1. Refactor auth flow
   Cost: $8.32
   Reason: high cost with low output
```

Watch:

```text
Watching...

Project:
agent-roi

Branch:
feature_add_tariff

Task Started:
feature_add_tariff

Press Ctrl+C to stop.
```

Compare:

```text
Compare

Current Period:
Last 7 Days

Previous Period:
Previous 7 Days

Summary
- AI Cost: $12.41 → $9.32 (-25%)
- Tasks: 8 → 10 (+25%)
- Commits: 6 → 9 (+50%)
- Waste Cost: $4.20 → $1.10 (-74%)
- Efficiency: 2.1 commits/$ → 3.4 commits/$ (+62%)

Takeaway:
You spent less and produced more Git output.
```

Budget:

```text
Budget (This Month)

Scope
- Codex only
- Claude snapshots excluded

Spend
- $12.41 spent this month
- 12 Codex sessions
- 1.2M tokens

Projection
- $37.23 projected month-end spend
- $1.24/day over 10 of 30 days

Status
- Projected over budget by $7.23 on a $30.00 monthly budget.
```

Debug attribution:

```text
Attribution Debug

Coverage
- 6 recent completed tasks
- 2 matched to Codex sessions
- 4 still unmatched

Why unmatched
- 2 tasks had no matching project path
- 1 task had project activity outside the task window

Next steps
- Run agent-roi watch in active repos
- Keep task windows aligned with real work
```

## Quick Start

```bash
agent-roi scan

agent-roi watch

# work normally on Git branches
# switch branches when changing tasks
# press Ctrl+C to stop

agent-roi report

agent-roi insights

agent-roi waste

agent-roi recommend

agent-roi leaderboard

agent-roi compare

agent-roi budget --budget 30

agent-roi ui --open

agent-roi debug attribution
```

## Core Workflow

```text
scan
↓
watch / task
↓
report
↓
insights
↓
waste
↓
recommend
↓
leaderboard
↓
compare
↓
budget
↓
ui
↓
debug attribution
```

What each step does:

- `scan`
  Import local AI usage.
- `watch`
  Auto-manage task attribution from Git branches in the foreground.
- `task`
  Start and stop tasks manually when watch mode is not the right fit.
- `report`
  Understand repository-level ROI.
- `insights`
  Discover patterns.
- `waste`
  Find potentially wasteful tasks.
- `recommend`
  Get actionable suggestions.
- `leaderboard`
  See your most expensive and most efficient tasks.
- `compare`
  Compare the last 7 days with the previous 7 days.
- `budget`
  Track current month Codex spend and projected month-end budget.
- `ui`
  Open the local dashboard for overview, projects, tasks, budget, waste, recommendations, and rankings.
- `debug attribution`
  Explain why completed tasks did or did not match Codex attribution.

## Commands

- `agent-roi scan`
  Import local AI usage into SQLite.
- `agent-roi task`
  Start, stop, and review attributed tasks.
- `agent-roi watch`
  Auto-start and auto-stop tasks by polling the current Git branch every 15 seconds.
- `agent-roi ui`
  Open the local dashboard. Use `--open` to launch it in your browser and `--budget <usd>` to show a budget target.
- `agent-roi debug attribution`
  Inspect attribution coverage, unmatched task reasons, and suggested next steps.
- `agent-roi report`
  Show repository-level ROI for the current Git repo.
- `agent-roi insights`
  Show lightweight task insights for the last 30 days.
- `agent-roi waste`
  Show potential waste candidates for the last 30 days.
- `agent-roi recommend`
  Turn recent task patterns into concrete suggestions.
- `agent-roi leaderboard`
  Rank recent tasks by cost and efficiency.
- `agent-roi compare`
  Compare the last 7 days with the previous 7 days.
- `agent-roi budget`
  Track current month Codex spend and projected month-end budget.

## What Agent ROI Solves

- It connects AI spend to task windows instead of only showing raw usage.
- It helps you review whether expensive work actually produced commits, file changes, or code movement.
- It turns recent task history into insights, waste checks, recommendations, and ranked task lists.

## Current Limits

Current version:

- Codex historical attribution supported
- Claude latest snapshot supported
- Claude historical attribution NOT supported
- Local-first
- No cloud
- No telemetry
- No account required

## Installation

```bash
npm install
npm run build
```

Run directly:

```bash
node dist/index.js --help
```

Or link it as a CLI:

```bash
npm link
agent-roi --help
```

## Task Attribution

Task attribution is time-window based.

That means Agent ROI uses:

- project path matching
- task start / stop windows
- Codex session attribution

It does not use:

- prompt intent inference
- diff semantics
- Claude historical reconstruction

See [docs/attribution.md](docs/attribution.md) for the full model.

## Attribution Debugging

`agent-roi debug attribution` is the fastest way to answer:

`Why do I have scan data, but thin task insights?`

It summarizes:

- how many recent completed tasks matched Codex data
- how many recent completed tasks are still unmatched
- whether the likely issue is project path mismatch or time-window mismatch
- whether recent tasks have partial cost coverage
- which next step is most useful now

Use it when:

- `task report` shows `No matched Codex task data`
- the dashboard has lots of empty task-based views
- you want to know whether to run `watch`, create more tasks, or tighten task windows

## Compare

`agent-roi compare` helps answer:

`Am I getting better or worse?`

It compares the last 7 days with the 7 days before that.

Default scope:

- Current Period: Last 7 Days
- Previous Period: Previous 7 Days
- completed tasks only
- Codex task attribution only
- Claude snapshots excluded

Interpretation:

- compare is a trend signal, not a definitive ROI judgment
- local-only
- no cloud
- no telemetry

See [docs/compare.md](docs/compare.md) for the full comparison behavior.

## Watch Mode

`agent-roi watch` is a foreground watch mode, not a daemon.

It works by polling the current Git branch every 15 seconds and mapping branch changes to task start / stop events.

What it does:

- automatically starts a task from the current branch name
- automatically stops the previous task when the branch changes
- stops the current task on `Ctrl+C`

What it does not do:

- no background service
- no system hook
- no prompt listening
- no Claude or Codex conversation reading
- no uploads
- local-only

Limits:

- requires a Git repository
- does not support Detached HEAD

See [docs/watch.md](docs/watch.md) for the full watch mode behavior.

## Docs

- [docs/attribution.md](docs/attribution.md)
- [docs/ui.md](docs/ui.md)
- [docs/insights.md](docs/insights.md)
- [docs/waste.md](docs/waste.md)
- [docs/recommend.md](docs/recommend.md)
- [docs/leaderboard.md](docs/leaderboard.md)
- [docs/compare.md](docs/compare.md)
- [docs/watch.md](docs/watch.md)
- [docs/pricing.md](docs/pricing.md)

## Roadmap

Near-term:

- watch mode
- compare
- trend analysis
- budget tracking

Future:

- branch attribution
- PR attribution
- team analytics

## Contributing

Contributions are welcome.

If you want to improve parsers, pricing data, attribution logic, or CLI reporting UX, feel free to open an issue or submit a pull request.
