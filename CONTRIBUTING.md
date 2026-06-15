# Contributing

Thanks for your interest in contributing to Agent ROI.

## Scope

Agent ROI is intentionally local-first and lightweight.

Good contributions usually improve one of these areas:

- local parser reliability
- pricing coverage and documentation
- Git and task attribution clarity
- CLI reporting quality
- tests and release hardening

## Development

Install dependencies:

```bash
npm install
```

Build:

```bash
npm run build
```

Run tests:

```bash
npm test
```

## Before Opening a PR

Please try to keep changes focused and easy to review.

Before submitting:

1. Run `npm test`
2. Run `npm run build`
3. Update docs if behavior or limitations changed
4. Do not overstate Claude support beyond what local data actually provides

## Reporting Issues

When possible, include:

- operating system
- Node.js version
- CLI command used
- expected behavior
- actual behavior
- sanitized sample log or session shape if parsing is involved

## Design Principles

- local-first
- deterministic where possible
- explicit limitations over hidden heuristics
- ROI-oriented, not just token counting
