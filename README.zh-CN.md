# Agent ROI

Track what your AI coding spend actually produced.

Connect:

```text
AI Cost
→ Tasks
→ Git Activity
→ Insights
→ Recommendations
```

[English README](README.md)

## Why Agent ROI

大多数 AI coding 工具可以告诉你：

- Tokens
- Cost

但通常回答不了：

- 哪些任务最贵？
- 哪些任务最有效率？
- 哪些任务可能浪费了预算？
- AI 花费最终产出了什么？

Agent ROI 试图回答这些问题。

## 示例输出

Insights：

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

Waste：

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

Recommend：

```text
Recommendations (Last 30 Days)

1. Break Large Tasks

Tasks under 45m produced 5.3x more commits per dollar than tasks over 2h.

Consider splitting large tasks into smaller units.

2. Investigate Potential Waste

2 tasks consumed $5.91 with zero commits.
```

Leaderboard：

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

Watch：

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

Compare：

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
```

每一步的作用：

- `scan`
  导入本地 AI usage。
- `watch`
  在前台根据 Git branch 自动管理 task attribution。
- `task`
  在不适合 watch mode 时手动 start / stop task。
- `report`
  看仓库级 ROI。
- `insights`
  发现模式。
- `waste`
  找出潜在浪费任务。
- `recommend`
  给出可执行建议。
- `leaderboard`
  查看最贵和最高效的任务。
- `compare`
  比较最近 7 天和前 7 天的变化。

## Commands

- `agent-roi scan`
  将本地 AI usage 导入 SQLite。
- `agent-roi task`
  启动、停止并查看 task attribution 任务。
- `agent-roi watch`
  每 15 秒轮询当前 Git branch，并自动 start / stop task。
- `agent-roi report`
  查看当前 Git 仓库的 ROI 报告。
- `agent-roi insights`
  查看最近 30 天的轻量任务洞察。
- `agent-roi waste`
  查看最近 30 天的潜在浪费任务。
- `agent-roi recommend`
  把最近任务模式转成可执行建议。
- `agent-roi leaderboard`
  查看最近任务的成本和效率排行榜。
- `agent-roi compare`
  比较最近 7 天和前 7 天。

## 它解决什么问题

- 不再只看 usage，而是把 AI 花费和 task window 关联起来。
- 帮你回看高成本工作到底有没有产出 commits、文件变化或代码变化。
- 把最近任务历史转成 insights、waste 检查、recommendations 和排行榜。

## 当前限制

当前版本：

- Codex historical attribution supported
- Claude latest snapshot supported
- Claude historical attribution NOT supported
- Local-first
- No cloud
- No telemetry
- No account required

## 安装

```bash
npm install
npm run build
```

直接运行：

```bash
node dist/index.js --help
```

或者挂成 CLI：

```bash
npm link
agent-roi --help
```

## Task Attribution

Task attribution 基于时间窗口。

Agent ROI 当前使用：

- project path matching
- task start / stop windows
- Codex session attribution

它不使用：

- prompt 意图推断
- diff 语义归因
- Claude 历史 reconstruction

完整说明见 [docs/attribution.md](docs/attribution.md)。

## Compare

`agent-roi compare` 用来回答：

`Am I getting better or worse?`

它会比较最近 7 天和之前 7 天。

默认范围：

- Current Period: Last 7 Days
- Previous Period: Previous 7 Days
- completed tasks only
- Codex task attribution only
- Claude snapshots excluded

解释：

- compare is a trend signal, not a definitive ROI judgment
- local-only
- no cloud
- no telemetry

完整说明见 [docs/compare.md](docs/compare.md)。

## Watch Mode

`agent-roi watch` 是前台 watch mode，不是 daemon。

它通过每 15 秒轮询当前 Git branch，自动把 branch 名映射成 task 的 start / stop。

它会：

- 用当前 branch 名自动创建 task
- branch 变化时自动结束旧 task 并启动新 task
- 在 `Ctrl+C` 时自动 stop 当前 task

它不会：

- 启动后台服务
- 使用系统级 hook
- 监听 prompt
- 读取 Claude / Codex 对话内容
- 上传数据
- 离开本机运行

限制：

- 必须在 Git 仓库里使用
- 不支持 Detached HEAD

完整说明见 [docs/watch.md](docs/watch.md)。

## 文档

- [docs/attribution.md](docs/attribution.md)
- [docs/insights.md](docs/insights.md)
- [docs/waste.md](docs/waste.md)
- [docs/recommend.md](docs/recommend.md)
- [docs/leaderboard.md](docs/leaderboard.md)
- [docs/compare.md](docs/compare.md)
- [docs/watch.md](docs/watch.md)
- [docs/pricing.md](docs/pricing.md)

## Roadmap

Near-term：

- watch mode
- compare
- trend analysis
- budget tracking

Future：

- branch attribution
- PR attribution
- team analytics

## 参与贡献

欢迎贡献。

如果你想改进 parser、价格表、归因规则或 CLI 报告体验，都很适合提 issue 或直接发 PR。
