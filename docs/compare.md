# Compare

`agent-roi compare` compares the last 7 days with the previous 7 days.

It helps answer:

`Am I getting better or worse?`

## Default Scope

- Current Period: Last 7 Days
- Previous Period: Previous 7 Days
- completed tasks only
- Codex task attribution only
- Claude snapshots excluded

## What It Shows

The command compares:

- AI Cost
- Tasks
- Commits
- Waste Cost
- Efficiency
- Takeaway

Efficiency prefers `commits/$`.

If commit data is too thin or cost is zero, it falls back to `LOC/$1`.

## Example Output

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

## Interpretation

Compare is a trend signal, not a definitive ROI judgment.

It is useful for checking direction, not proving value with certainty.

Reasons:

- task attribution is time-window based
- Git output is only one type of outcome
- some valuable work may not end with commits
- cost coverage can be incomplete for unknown models

## Product Boundaries

- local-only
- no cloud
- no telemetry
- Claude snapshots excluded from task comparison

## Related Commands

- `agent-roi insights`
  Review pattern-style hints for the last 30 days.
- `agent-roi waste`
  Focus on suspicious low-output tasks.
- `agent-roi recommend`
  Turn recent task patterns into suggested actions.
- `agent-roi leaderboard`
  Rank recent tasks by cost and efficiency.
