# Agent ROI

衡量 AI Coding 到底产出了什么。

很多工具会告诉你花了多少 Token。

Agent ROI 更关心这些 Token 最终换来了什么工程结果。

[English README](README.md)

## Agent ROI 是什么

大多数 AI 使用统计工具回答的是：

`我花了多少钱？`

Agent ROI 回答的是：

`这笔花费最终产出了什么？`

它把本地 AI Coding 记录、成本估算、Git 活动和任务时间窗归因串起来，帮助你从“消耗”走到“结果”。

## 为什么不是 ccusage

`ccusage` 更聚焦 usage。

Agent ROI 更聚焦 ROI。

这不是替代关系，而是问题定义不同。Agent ROI 想回答的是：

```text
AI Cost
↓
Git Activity
↓
Task Attribution
↓
ROI
```

如果你已经在用 usage 工具，Agent ROI 可以作为它的补充层，而不是竞争层。

## 当前功能

- Codex 历史 session 扫描
- Codex 成本离线估算
- Claude latest snapshot 导入
- Git activity 分析
- Repository ROI report
- Task Attribution（基于时间窗口）

## 安装方式

```bash
npm install
npm run build
```

直接运行：

```bash
node dist/index.js --help
```

或者挂成全局 CLI：

```bash
npm link
agent-roi --help
```

## 快速开始

先扫描本机数据：

```bash
agent-roi scan
```

查看今日 AI Coding 活动：

```bash
agent-roi today
```

查看当前仓库最近 7 天 ROI：

```bash
agent-roi report
```

## Task Attribution

Task Attribution 采用基于时间窗口的归因方式。

开始一个任务：

```bash
agent-roi task start "Fix purchase button"
```

在这个时间段里手动使用 Codex 或 Claude，结束后执行：

```bash
agent-roi task stop
```

查看最近任务：

```bash
agent-roi task report
```

示例输出：

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

V0.1 的归因规则：

- `project_path` 必须匹配
- session 时间必须落在任务时间窗内
- Codex session 会计入
- Claude latest snapshot 不计入 task 历史归因

更完整的说明见 [docs/attribution.md](docs/attribution.md)。

## 成本估算说明

Codex 的 cost 来自本地价格表估算，不是直接读取官方账单值。

因此它适合做 ROI 观察，但不应该被当成精确结算结果。

无法识别价格的模型会标记为：

`unknown_model`

详细规则见 [docs/pricing.md](docs/pricing.md)。

## Claude Code 限制

Claude 本地数据目前不提供可稳定回扫的历史 session-level usage 结构。

所以 V0.1 只支持：

- latest snapshot 导入

需要明确的是：

- Claude 数据不是完整历史
- 不会重建 Claude 历史 session 消耗
- Claude 不参与 task historical attribution

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

## 参与贡献

欢迎贡献。

如果你想改进 parser、价格表、归因规则，或者 CLI 报告体验，都很适合提 issue 或直接发 PR。
