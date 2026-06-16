# Recommend

`agent-roi recommend` answers:

`Based on my recent task data, what should I do differently?`

It converts recent task attribution patterns into short, actionable suggestions.

## Default Scope

- Last 30 Days
- completed tasks only
- Codex task attribution only
- Claude snapshots excluded

## What It Produces

Each recommendation includes:

- a title
- a finding
- a suggested action

It does not produce:

- dashboards
- scores
- gamification
- long AI essays

## Example Output

```text
Recommendations (Last 30 Days)

1. Break Large Tasks

Tasks under 45m produced 5.3x more commits per dollar than tasks over 2h.

Consider splitting large tasks into smaller units.

2. Investigate Potential Waste

2 tasks consumed $5.91 with zero commits.
```

## Current Recommendation Themes

- Break Large Tasks
- Review Expensive Tasks
- Investigate Potential Waste
- Review Prompting Strategy
- Project Concentration Risk

## Interpretation

Recommendations are rule-based prompts.

They are intentionally short and practical.

They should be treated as suggested follow-up actions, not as final truth about your workflow.

## Related Commands

- `agent-roi insights`
  Review the patterns that can trigger recommendations.
- `agent-roi waste`
  Drill into suspicious budget burn.
- `agent-roi compare`
  Check whether recent recommendations are improving trends over time.
