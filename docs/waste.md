# Waste

`agent-roi waste` focuses on tasks that may have consumed AI coding budget without much visible Git output.

It is for:

- reviewing suspicious tasks
- checking whether budget burn matched output
- finding patterns worth investigating

It is not for:

- declaring absolute waste
- dashboards
- scores

## Default Scope

- Last 30 Days
- completed tasks only
- Codex task attribution only
- Claude snapshots excluded

## Output Rules

The command outputs:

- `Potential Waste`
- at most 10 tasks
- sorted by cost DESC
- one explicit `Reason` for every shown task

## Example Output

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

## Interpretation

Potential waste is a review prompt, not a final verdict.

A task may still be valuable if it was:

- debugging
- investigation
- design work
- an abandoned experiment
- work that was committed later outside the task window

## Related Commands

- `agent-roi insights`
  See broader recent patterns.
- `agent-roi recommend`
  Turn waste signals into next-step suggestions.
- `agent-roi compare`
  Compare waste cost in the current 7 day period against the previous 7 days.
