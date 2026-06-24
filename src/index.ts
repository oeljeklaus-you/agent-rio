#!/usr/bin/env node

import { Command } from 'commander';
import { runBudgetCommand } from './commands/budget.js';
import { runCompareCommand } from './commands/compare.js';
import { runDebugAttributionCommand } from './commands/debug.js';
import { runInsightsCommand } from './commands/insights.js';
import { runLeaderboardCommand } from './commands/leaderboard.js';
import { runRecommendCommand } from './commands/recommend.js';
import { runReportCommand } from './commands/report.js';
import { runScanCommand } from './commands/scan.js';
import { runTaskReportCommand, runTaskStartCommand, runTaskStopCommand } from './commands/task.js';
import { runTodayCommand } from './commands/today.js';
import { runUiCommand } from './commands/ui.js';
import { runWatchCommand } from './commands/watch.js';
import { runWasteCommand } from './commands/waste.js';

const program = new Command();

program
  .name('agent-roi')
  .description('AI Coding ROI Analyzer')
  .version('0.1.0');

program.command('scan').description('Scan local AI coding data into SQLite').action(runScanCommand);

program.command('today').description("Show today's AI coding activity summary").action(runTodayCommand);

program
  .command('budget')
  .description('Track current month Codex spend and projected month-end budget')
  .option('-b, --budget <usd>', 'Monthly budget in USD', Number)
  .action(runBudgetCommand);

program
  .command('ui')
  .description('Open the local Agent ROI overview page')
  .option('-p, --port <port>', 'Port for the local UI server', Number)
  .option('--open', 'Open the UI in the default browser')
  .option('-b, --budget <usd>', 'Monthly budget in USD for the budget card', Number)
  .action(runUiCommand);

program
  .command('compare')
  .description('Compare the last 7 days against the previous 7 days')
  .action(runCompareCommand);

program
  .command('report')
  .description('Show ROI report for the current Git repository over the last 7 days')
  .action(runReportCommand);

program.command('insights').description('Show V0.2 Lite task insights for the last 30 days').action(runInsightsCommand);

program.command('leaderboard').description('Show V0.4 Lite task leaderboard for the last 30 days').action(runLeaderboardCommand);

program.command('recommend').description('Show V0.5 Lite recommendations for the last 30 days').action(runRecommendCommand);

program.command('watch').description('Watch the current branch and auto-manage tasks').action(runWatchCommand);

program.command('waste').description('Show V0.3 Lite potential waste tasks for the last 30 days').action(runWasteCommand);

const debugProgram = program.command('debug').description('Inspect local data health and attribution gaps');

debugProgram.command('attribution').description('Explain why task attribution may be thin or missing').action(runDebugAttributionCommand);

const taskProgram = program.command('task').description('Track time-window-based task attribution');

taskProgram.command('start <name>').description('Start a task in the current project').action(runTaskStartCommand);

taskProgram.command('stop').description('Stop the active task in the current project').action(runTaskStopCommand);

taskProgram.command('report').description('Show the 10 most recent tasks').action(runTaskReportCommand);

try {
  await program.parseAsync(process.argv);
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown CLI failure';
  console.error(message);
  process.exitCode = 1;
}
