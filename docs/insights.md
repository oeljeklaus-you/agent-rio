# Insights

`agent-roi insights` turns recent task attribution data into a small set of patterns worth noticing.

It is for:

- spotting concentration
- spotting efficiency patterns
- spotting suspicious waste signals

It is not for:

- dashboards
- scores
- final ROI judgment

## Default Scope

- Last 30 Days
- completed tasks only
- Codex task attribution only
- Claude snapshots excluded

## Output Categories

Insights V0.2 Lite only shows:

- Cost
- Waste
- Efficiency

## What It Helps Answer

- Are a small number of tasks driving most of my AI spend?
- Are short tasks more efficient than long ones?
- Are there obvious suspicious patterns in my recent work?

## Example Output

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

## Interpretation

Insights are hint-style prompts.

They help you review patterns, but they do not prove that a task was good or bad.

Reasons:

- task attribution is time-window based
- Git output is only one kind of result
- some valuable tasks may not end with commits
- cost coverage can be incomplete for unknown models

## Related Commands

- `agent-roi waste`
  Focus on suspicious budget burn.
- `agent-roi recommend`
  Turn recent patterns into suggested next actions.
- `agent-roi leaderboard`
  Rank recent tasks by cost and efficiency.
- `agent-roi compare`
  Check whether recent task trends are getting better or worse.
