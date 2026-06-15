# Agent ROI

Measure what your AI coding actually achieved.

Most tools tell you how many tokens you spent.

Agent ROI tells you what those tokens achieved.

[中文文档](README.zh-CN.md)

## What is Agent ROI

Most AI usage tools answer:

`How much did I spend?`

Agent ROI answers:

`What did that spending achieve?`

It connects local AI coding activity with repository change signals so you can review cost, tokens, Git output, and task-level attribution in one place.

## Why not ccusage

`ccusage` focuses on usage.

Agent ROI focuses on ROI.

The goal is not to replace usage tools. The goal is to answer a different question:

```text
AI Cost
↓
Git Activity
↓
Task Attribution
↓
ROI
```

## Features

- Codex historical session scanning
- Codex cost estimation
- Claude latest snapshot import
- Git activity analysis
- Repository ROI report
- Task Attribution (time-window based)

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

## Quick Start

Scan local data:

```bash
agent-roi scan
```

See today's activity:

```bash
agent-roi today
```

See the current repository ROI report:

```bash
agent-roi report
```

## Task Attribution

Task Attribution is time-window based.

Start a task:

```bash
agent-roi task start "Fix purchase button"
```

Run Codex or Claude manually during the task window, then stop it:

```bash
agent-roi task stop
```

Review recent tasks:

```bash
agent-roi task report
```

Example summary:

```text
Task: Fix purchase button

AI Cost: $1.25
Tokens: 1,500,000
Commits: 2
Files Changed: 7
Lines Added: 421
Cost Per Commit: $0.63
Cost Per 1000 LOC: $2.97
```

Attribution rules in V0.1:

- project path must match
- time window must match
- Codex sessions are included
- Claude latest snapshots are not included in task historical attribution

See [docs/attribution.md](docs/attribution.md) for the detailed attribution model.

## Cost Estimation

Codex cost is estimated from a local pricing table.

Estimated cost is useful for ROI analysis, but it may differ from final provider billing.

Unknown models are marked as:

`unknown_model`

Pricing details are documented in [docs/pricing.md](docs/pricing.md).

## Claude Code Limitations

Claude historical session-level usage is not available locally in a form that supports reliable full backfill.

V0.1 only supports:

- latest snapshot import

Important limitations:

- Claude data is latest snapshot only
- Claude historical session-level usage is not reconstructed
- Claude data is excluded from task historical attribution

## Roadmap

### V0.1

- Codex historical scan
- Claude latest snapshot
- Repository ROI report
- Task Attribution

### V0.2

- Claude incremental capture
- watch mode
- pricing improvements

### V0.3

- local dashboard

### V1.0

- PR ROI
- Team ROI

## Contributing

Contributions are welcome.

If you want to improve parsers, pricing data, attribution logic, or reporting UX, feel free to open an issue or submit a pull request.
