# Leaderboard

`agent-roi leaderboard` ranks recent tasks so you can quickly see the most expensive, most efficient, and least efficient work.

## Default Scope

- Last 30 Days
- completed tasks only
- Codex task attribution only
- Claude snapshots excluded

## Sections

The command can show:

- Most Expensive Tasks
- Most Efficient Tasks
- Least Efficient Tasks

Each section is hidden when there is not enough relevant data.

## Example Output

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

## Interpretation

This is a ranking view, not a score system.

It helps you compare recent tasks quickly, but it does not assign a universal ROI score or final quality judgment.

## Related Commands

- `agent-roi insights`
  See broader recent patterns behind the rankings.
- `agent-roi waste`
  Focus on suspicious low-output tasks.
- `agent-roi compare`
  Compare recent 7 day performance against the prior 7 days.
