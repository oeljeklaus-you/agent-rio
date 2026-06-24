export const UI_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Agent ROI</title>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <div class="page-shell">
      <header class="hero">
        <div class="hero-main">
          <p class="eyebrow">Agent ROI</p>
          <h1>Track what your AI coding spend actually produced.</h1>
          <p class="subtitle">A local-only workspace for spend, task history, project coverage, waste signals, recommendations, rankings, and trend shifts.</p>
          <div class="scope-pills">
            <span>Local-only</span>
            <span>Codex attribution</span>
            <span>Claude snapshots excluded from task views</span>
          </div>
        </div>
        <aside class="hero-side">
          <div class="hero-kicker">Workspace Snapshot</div>
          <div class="hero-mini-card">
            <strong id="hero-mini-title">Scanning local data</strong>
            <p id="hero-mini-copy">Summarizing recent tasks, project coverage, and AI spend.</p>
          </div>
          <div class="toolbar">
            <button id="refresh-button" type="button">Refresh</button>
            <span id="updated-at" class="updated-at">Loading...</span>
          </div>
        </aside>
      </header>

      <div class="nav-shell">
        <nav id="top-nav" class="top-nav" aria-label="Agent ROI sections"></nav>
      </div>

      <main id="app" class="content-shell">
        <section class="loading-state">
          <p>Loading Agent ROI dashboard...</p>
        </section>
      </main>
    </div>
    <script type="module" src="/app.js"></script>
  </body>
</html>
`;

export const UI_CSS = `:root {
  --bg: #e8dfd1;
  --surface: rgba(252, 248, 241, 0.88);
  --surface-strong: #fffdfa;
  --surface-muted: rgba(245, 238, 227, 0.92);
  --ink: #171412;
  --muted: #6e675c;
  --muted-strong: #4d463d;
  --line: rgba(23, 20, 18, 0.08);
  --line-strong: rgba(23, 20, 18, 0.14);
  --accent: #127c73;
  --accent-soft: rgba(18, 124, 115, 0.14);
  --accent-deep: #0a5d57;
  --warm: #c97922;
  --warm-soft: rgba(201, 121, 34, 0.14);
  --danger: #b42318;
  --danger-soft: rgba(180, 35, 24, 0.12);
  --shadow-xl: 0 30px 70px rgba(45, 36, 25, 0.11);
  --shadow-lg: 0 18px 36px rgba(45, 36, 25, 0.08);
  --radius-2xl: 30px;
  --radius-xl: 22px;
  --radius-lg: 18px;
  --radius-md: 14px;
  --radius-sm: 10px;
}

* { box-sizing: border-box; }

html { scroll-behavior: smooth; }

body {
  margin: 0;
  min-height: 100vh;
  color: var(--ink);
  font-family: "Avenir Next", "Segoe UI", sans-serif;
  background:
    radial-gradient(circle at top left, rgba(18, 124, 115, 0.08), transparent 24%),
    radial-gradient(circle at top right, rgba(201, 121, 34, 0.12), transparent 26%),
    linear-gradient(180deg, #e8dfd1 0%, #e5dccd 46%, #e2d9cb 100%);
}

body::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: 0.26;
  background-image:
    linear-gradient(rgba(23, 20, 18, 0.026) 1px, transparent 1px),
    linear-gradient(90deg, rgba(23, 20, 18, 0.026) 1px, transparent 1px);
  background-size: 28px 28px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.5), transparent 86%);
}

.page-shell {
  position: relative;
  z-index: 1;
  max-width: 1360px;
  margin: 0 auto;
  padding: 22px 22px 56px;
}

.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.65fr);
  gap: 24px;
  align-items: stretch;
  padding: 28px;
  border-radius: var(--radius-2xl);
  border: 1px solid rgba(23, 20, 18, 0.06);
  background:
    linear-gradient(135deg, rgba(255, 252, 246, 0.95), rgba(246, 238, 226, 0.92)),
    radial-gradient(circle at right top, rgba(18, 124, 115, 0.07), transparent 28%);
  box-shadow: var(--shadow-xl);
}

.hero-main {
  display: grid;
  gap: 18px;
  min-width: 0;
}

.eyebrow {
  margin: 0;
  font-size: 0.86rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent);
}

.hero h1 {
  margin: 0;
  max-width: 860px;
  font-family: "Iowan Old Style", "Palatino Linotype", Georgia, serif;
  font-size: clamp(2.65rem, 5vw, 4.9rem);
  line-height: 0.94;
  letter-spacing: -0.045em;
  text-wrap: balance;
}

.subtitle {
  margin: 0;
  max-width: 760px;
  color: var(--muted-strong);
  font-size: 1.1rem;
  line-height: 1.44;
}

.scope-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.scope-pills span,
.source-chip,
.pill-note,
.filter-chip,
.nav-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid rgba(23, 20, 18, 0.08);
  background: rgba(255, 255, 255, 0.72);
  color: var(--muted-strong);
  font-size: 0.92rem;
  text-decoration: none;
  backdrop-filter: blur(8px);
}

.hero-side {
  display: grid;
  align-content: space-between;
  gap: 16px;
  padding: 4px 2px 2px;
}

.hero-kicker {
  color: var(--muted);
  font-size: 0.82rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.hero-mini-card {
  padding: 18px;
  border-radius: var(--radius-xl);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(246, 240, 230, 0.88));
  border: 1px solid rgba(23, 20, 18, 0.07);
}

.hero-mini-card strong {
  display: block;
  font-size: 1.08rem;
  margin-bottom: 6px;
}

.hero-mini-card p {
  margin: 0;
  color: var(--muted);
  line-height: 1.45;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
}

button {
  border: 0;
  border-radius: 999px;
  background: var(--ink);
  color: #fff;
  padding: 12px 18px;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 10px 22px rgba(23, 20, 18, 0.16);
  transition: transform 120ms ease, opacity 120ms ease;
}

button:hover,
.nav-pill:hover,
.filter-chip:hover {
  opacity: 0.96;
}

button:hover {
  transform: translateY(-1px);
}

.updated-at {
  color: var(--muted);
  font-size: 0.96rem;
}

.nav-shell {
  position: sticky;
  top: 0;
  z-index: 5;
  margin-top: 16px;
}

.top-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  width: fit-content;
  padding: 10px;
  border-radius: 999px;
  background: rgba(249, 244, 235, 0.76);
  border: 1px solid rgba(23, 20, 18, 0.07);
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(14px);
}

.nav-pill {
  min-height: 44px;
  padding-inline: 18px;
  background: transparent;
  border-color: transparent;
}

.nav-pill.active {
  background: var(--ink);
  color: #fff;
  border-color: var(--ink);
}

.content-shell {
  margin-top: 20px;
  display: grid;
  gap: 22px;
}

.page-section,
.loading-state,
.empty-state,
.error-state,
.panel,
.metric-card,
.detail-card,
.task-row,
.project-row,
.preview-card {
  border-radius: var(--radius-xl);
  border: 1px solid var(--line);
  background: var(--surface);
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(8px);
}

.page-section {
  padding: 22px;
}

.loading-state,
.empty-state,
.error-state {
  padding: 30px;
}

.empty-state h2,
.error-state h2,
.section-header h2,
.spotlight-title {
  margin: 0;
  font-family: "Iowan Old Style", "Palatino Linotype", Georgia, serif;
  line-height: 0.98;
  letter-spacing: -0.03em;
}

.section-header h2 {
  font-size: clamp(1.8rem, 2.8vw, 2.35rem);
}

.spotlight-title {
  font-size: clamp(2rem, 3.4vw, 3rem);
}

.empty-state p,
.error-state p,
.muted {
  color: var(--muted);
}

.overview-shell {
  display: grid;
  gap: 22px;
}

.overview-lead {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
  gap: 22px;
}

.spotlight {
  position: relative;
  overflow: hidden;
  padding: 28px;
  border-radius: var(--radius-xl);
  border: 1px solid rgba(18, 124, 115, 0.12);
  background:
    linear-gradient(135deg, rgba(14, 121, 111, 0.1), rgba(255, 255, 255, 0.92)),
    radial-gradient(circle at top right, rgba(18, 124, 115, 0.12), transparent 30%);
  box-shadow: var(--shadow-lg);
}

.spotlight::after {
  content: "";
  position: absolute;
  right: -40px;
  bottom: -56px;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(18, 124, 115, 0.18), transparent 68%);
  pointer-events: none;
}

.spotlight-label {
  margin: 0 0 12px;
  font-size: 0.82rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--accent-deep);
}

.spotlight-copy {
  margin: 14px 0 0;
  max-width: 54ch;
  color: var(--muted-strong);
  line-height: 1.5;
}

.spotlight-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.spotlight-pill {
  display: inline-flex;
  align-items: center;
  min-height: 38px;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(18, 124, 115, 0.12);
  color: var(--accent-deep);
  font-size: 0.92rem;
}

.signal-rail {
  display: grid;
  gap: 12px;
}

.rail-card {
  padding: 18px 18px 16px;
  border-radius: var(--radius-lg);
  background: var(--surface-strong);
  border: 1px solid rgba(23, 20, 18, 0.07);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.rail-label {
  color: var(--muted);
  font-size: 0.8rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.rail-value {
  margin-top: 10px;
  font-size: clamp(1.55rem, 2vw, 2.2rem);
  font-weight: 800;
  letter-spacing: -0.04em;
}

.rail-caption {
  margin-top: 8px;
  color: var(--muted);
  line-height: 1.4;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.metrics-grid.compact {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.metric-card {
  padding: 20px;
  min-height: 164px;
  display: grid;
  align-content: space-between;
  background: linear-gradient(180deg, rgba(255, 253, 249, 0.94), rgba(245, 237, 226, 0.88));
}

.metric-card h3 {
  margin: 0;
  font-size: 0.8rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
}

.metric-value {
  margin-top: 12px;
  font-size: clamp(2rem, 3vw, 3rem);
  line-height: 0.95;
  letter-spacing: -0.05em;
  font-weight: 800;
  overflow-wrap: anywhere;
}

.metric-caption {
  margin-top: 12px;
  color: var(--muted);
  line-height: 1.38;
}

.overview-grid,
.detail-grid {
  display: grid;
  gap: 22px;
}

.overview-grid {
  grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
}

.overview-sidebar {
  align-content: start;
}

.detail-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.stack {
  display: grid;
  gap: 22px;
}

.panel {
  padding: 24px;
}

.panel-compact {
  padding: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.section-heading {
  flex: 1 1 320px;
  min-width: 0;
}

.section-subtitle {
  margin: 10px 0 0;
  color: var(--muted-strong);
  line-height: 1.44;
  max-width: 36ch;
}

.source-chip {
  flex: 0 1 auto;
  max-width: 100%;
  white-space: normal;
  line-height: 1.25;
  text-align: left;
}

.panel-compact .section-header {
  margin-bottom: 16px;
}

.panel-compact .section-header h2 {
  font-size: clamp(1.1rem, 1.5vw, 1.45rem);
  line-height: 1.08;
}

.panel-compact .section-subtitle {
  margin-top: 8px;
  font-size: 0.9rem;
  max-width: 32ch;
}

.panel-compact .source-chip {
  min-height: 34px;
  padding: 6px 12px;
  font-size: 0.82rem;
  max-width: 100%;
}

.control-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-bottom: 18px;
}

.control-stack {
  display: grid;
  gap: 14px;
}

.toolbar-card {
  display: grid;
  gap: 14px;
  padding: 16px;
  border-radius: var(--radius-lg);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(246, 239, 229, 0.9));
  border: 1px solid rgba(23, 20, 18, 0.07);
}

.inventory-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.inventory-stat {
  display: grid;
  gap: 6px;
  padding: 14px 16px;
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(23, 20, 18, 0.06);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.48);
}

.inventory-stat strong {
  margin: 0;
  font-size: 1.18rem;
  line-height: 1;
}

.inventory-stat span {
  color: var(--muted);
  font-size: 0.84rem;
  line-height: 1.35;
}

.search-input {
  flex: 1 1 260px;
  min-height: 46px;
  width: min(420px, 100%);
  padding: 0 16px;
  border-radius: 999px;
  border: 1px solid var(--line-strong);
  background: rgba(255, 255, 255, 0.74);
  color: var(--ink);
  font: inherit;
}

.search-input:focus {
  outline: 2px solid rgba(18, 124, 115, 0.16);
  border-color: rgba(18, 124, 115, 0.36);
}

.filter-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-chip {
  cursor: pointer;
  transition: opacity 120ms ease, transform 120ms ease, background 120ms ease;
}

.filter-chip.active {
  background: var(--ink);
  color: #fff;
  border-color: var(--ink);
}

.filter-meta {
  color: var(--muted);
  font-size: 0.92rem;
}

.summary-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.summary-pills span {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(23, 20, 18, 0.07);
  color: var(--muted-strong);
  font-size: 0.86rem;
}

.action-list {
  display: grid;
  gap: 8px;
  margin-top: 14px;
}

.action-list div {
  padding: 12px 14px;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(23, 20, 18, 0.06);
  color: var(--muted-strong);
  line-height: 1.45;
}

.signal-list,
.mini-list,
.recommend-list,
.waste-list,
.line-list,
.task-list,
.preview-list {
  display: grid;
  gap: 14px;
}

.signal-row,
.mini-item,
.recommend-item,
.waste-item,
.detail-card,
.task-row,
.project-row,
.preview-card {
  padding: 18px;
  border-radius: var(--radius-lg);
  background: rgba(255, 253, 248, 0.92);
  border: 1px solid rgba(23, 20, 18, 0.07);
}

.signal-row {
  display: grid;
  grid-template-columns: minmax(110px, 0.8fr) minmax(0, 1.2fr) auto;
  gap: 16px;
  align-items: center;
}

.signal-label {
  font-weight: 700;
}

.signal-values {
  color: var(--muted-strong);
  line-height: 1.44;
}

.delta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 68px;
  min-height: 38px;
  padding: 8px 12px;
  border-radius: 999px;
  font-weight: 800;
  background: rgba(23, 20, 18, 0.05);
}

.delta.good {
  color: var(--accent);
  background: var(--accent-soft);
}

.delta.bad {
  color: var(--danger);
  background: var(--danger-soft);
}

.delta.neutral {
  color: var(--muted);
}

.takeaway,
.budget-banner {
  margin-top: 18px;
  padding: 18px;
  border-radius: var(--radius-lg);
}

.takeaway {
  background: linear-gradient(135deg, rgba(18, 124, 115, 0.12), rgba(255, 255, 255, 0.9));
  border: 1px solid rgba(18, 124, 115, 0.16);
}

.budget-banner {
  background: linear-gradient(135deg, rgba(201, 121, 34, 0.12), rgba(255, 255, 255, 0.9));
  border: 1px solid rgba(201, 121, 34, 0.16);
}

.takeaway h3,
.subsection-title,
.preview-title {
  margin: 0 0 8px;
  font-size: 1.02rem;
}

.subsection-title {
  margin-top: 18px;
}

.footer-note {
  margin-top: 12px;
  color: var(--muted);
  line-height: 1.5;
}

.health-stack {
  display: grid;
  gap: 16px;
}

.recommend-item strong,
.waste-item strong,
.mini-item strong,
.task-row strong,
.project-row strong,
.detail-card strong,
.preview-card strong {
  display: block;
  margin-bottom: 8px;
  font-size: 1.04rem;
}

.recommend-action {
  margin-top: 10px;
  color: var(--accent-deep);
  font-weight: 700;
}

.line-list div {
  padding: 14px 16px;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(23, 20, 18, 0.06);
  line-height: 1.5;
}

.task-row,
.project-row,
.preview-card {
  display: grid;
  gap: 10px;
}

.featured-focus {
  display: grid;
  gap: 14px;
  padding: 22px;
  border-radius: var(--radius-xl);
  border: 1px solid rgba(18, 124, 115, 0.12);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(241, 248, 246, 0.9));
  box-shadow: 0 16px 36px rgba(18, 124, 115, 0.08);
}

.featured-badge {
  width: fit-content;
  min-height: 34px;
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent-deep);
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.featured-summary {
  color: var(--muted-strong);
  line-height: 1.5;
}

.featured-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  color: var(--muted);
  font-size: 0.93rem;
}

.task-topline {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.task-meta,
.project-meta,
.detail-meta,
.preview-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  color: var(--muted-strong);
  font-size: 0.95rem;
  line-height: 1.44;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px;
}

.preview-list {
  gap: 12px;
}

.empty-inline {
  color: var(--muted);
  padding: 8px 0;
}

.empty-callout {
  display: grid;
  gap: 10px;
  padding: 18px;
  border-radius: var(--radius-lg);
  border: 1px solid rgba(23, 20, 18, 0.08);
  background: rgba(255, 255, 255, 0.78);
}

.empty-callout strong {
  font-size: 1rem;
  margin: 0;
}

.empty-callout p {
  margin: 0;
  color: var(--muted);
  line-height: 1.45;
}

.empty-callout.tip {
  border-color: rgba(18, 124, 115, 0.16);
  background: linear-gradient(135deg, rgba(18, 124, 115, 0.08), rgba(255, 255, 255, 0.86));
}

.empty-callout.warn {
  border-color: rgba(201, 121, 34, 0.18);
  background: linear-gradient(135deg, rgba(201, 121, 34, 0.09), rgba(255, 255, 255, 0.86));
}

.empty-callout.neutral {
  background: rgba(255, 255, 255, 0.82);
}

.projects-shell {
  display: grid;
  gap: 14px;
  padding: 6px;
  border-radius: var(--radius-xl);
  background: rgba(244, 237, 226, 0.56);
  border: 1px solid rgba(23, 20, 18, 0.05);
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: minmax(220px, 1.4fr) minmax(90px, 0.6fr) minmax(90px, 0.6fr) minmax(110px, 0.7fr) minmax(110px, 0.7fr) minmax(180px, 1fr);
  gap: 14px;
  align-items: center;
}

.table-header {
  padding: 0 14px;
  color: var(--muted);
  font-size: 0.8rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.table-row {
  padding: 16px 18px;
  border-radius: var(--radius-lg);
  background: rgba(255, 253, 248, 0.92);
  border: 1px solid rgba(23, 20, 18, 0.07);
  box-shadow: 0 8px 20px rgba(45, 36, 25, 0.05);
  position: relative;
}

.table-row::before {
  content: "";
  position: absolute;
  left: 0;
  top: 16px;
  bottom: 16px;
  width: 4px;
  border-radius: 999px;
  background: rgba(23, 20, 18, 0.08);
}

.table-row.status-tracked::before {
  background: rgba(18, 124, 115, 0.72);
}

.table-row.status-untracked::before {
  background: rgba(201, 121, 34, 0.72);
}

.table-row.status-active::before {
  background: rgba(10, 93, 87, 0.9);
}

.table-row-head {
  display: grid;
  gap: 6px;
}

.table-row strong {
  font-size: 1rem;
}

.table-path {
  color: var(--muted);
  font-size: 0.88rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.table-cell {
  color: var(--muted-strong);
  font-size: 0.94rem;
}

.table-note {
  margin-top: 4px;
  color: var(--muted);
  font-size: 0.92rem;
  line-height: 1.4;
}

.tasks-shell {
  display: grid;
  gap: 12px;
  padding: 6px;
  border-radius: var(--radius-xl);
  background: rgba(244, 237, 226, 0.56);
  border: 1px solid rgba(23, 20, 18, 0.05);
}

.task-row {
  grid-template-columns: minmax(180px, 1.1fr) minmax(0, 1.8fr) auto;
  align-items: start;
  box-shadow: 0 8px 20px rgba(45, 36, 25, 0.05);
  position: relative;
  overflow: hidden;
}

.task-row::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 5px;
  background: rgba(23, 20, 18, 0.08);
}

.task-row.tone-matched::before {
  background: rgba(18, 124, 115, 0.82);
}

.task-row.tone-unmatched::before {
  background: rgba(201, 121, 34, 0.82);
}

.task-row.tone-productive::before {
  background: rgba(10, 93, 87, 0.92);
}

.task-row-main {
  display: grid;
  gap: 8px;
}

.task-row-side {
  display: grid;
  justify-items: end;
  gap: 8px;
  min-width: 112px;
}

.task-row-side .pill-note {
  white-space: nowrap;
}

.task-note-inline {
  color: var(--muted);
  font-size: 0.9rem;
  line-height: 1.45;
}

.pill-note.status-good {
  background: rgba(18, 124, 115, 0.12);
  border-color: rgba(18, 124, 115, 0.16);
  color: var(--accent-deep);
}

.pill-note.status-warn {
  background: rgba(201, 121, 34, 0.12);
  border-color: rgba(201, 121, 34, 0.16);
  color: #8b5413;
}

.pill-note.status-neutral {
  background: rgba(23, 20, 18, 0.05);
  border-color: rgba(23, 20, 18, 0.08);
  color: var(--muted-strong);
}

.task-meta,
.preview-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 10px;
}

.task-meta span,
.preview-meta span {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(243, 238, 231, 0.9);
  color: var(--muted-strong);
  font-size: 0.86rem;
}

.preview-card {
  gap: 12px;
  padding: 16px;
  background: linear-gradient(180deg, rgba(255, 254, 251, 0.98), rgba(248, 243, 235, 0.9));
}

.preview-card strong {
  margin-bottom: 0;
  font-size: 0.98rem;
  line-height: 1.15;
  overflow-wrap: anywhere;
}

.preview-card .muted {
  line-height: 1.45;
}

@media (max-width: 1180px) {
  .hero,
  .overview-lead,
  .overview-grid,
  .detail-grid,
  .preview-grid {
    grid-template-columns: 1fr;
  }

  .metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .inventory-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .table-header,
  .table-row {
    grid-template-columns: minmax(180px, 1.2fr) repeat(4, minmax(72px, 0.6fr));
  }

  .table-row .table-cell--last {
    display: none;
  }
}

@media (max-width: 820px) {
  .page-shell {
    padding: 14px 12px 36px;
  }

  .hero {
    padding: 20px;
  }

  .hero h1 {
    font-size: clamp(2rem, 11vw, 3.8rem);
  }

  .top-nav {
    width: 100%;
    overflow-x: auto;
    flex-wrap: nowrap;
    scrollbar-width: none;
  }

  .top-nav::-webkit-scrollbar {
    display: none;
  }

  .nav-pill {
    flex: 0 0 auto;
  }

  .metrics-grid,
  .metrics-grid.compact {
    grid-template-columns: 1fr;
  }

  .inventory-strip {
    grid-template-columns: 1fr;
  }

  .signal-row,
  .section-header,
  .task-topline,
  .toolbar {
    grid-template-columns: 1fr;
    flex-direction: column;
    align-items: flex-start;
  }

  .panel-compact .section-header {
    align-items: flex-start;
  }

  .control-bar {
    align-items: stretch;
  }

  .summary-pills {
    width: 100%;
  }

  .search-input {
    width: 100%;
  }

  .table-header {
    display: none;
  }

  .table-row {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .table-path {
    white-space: normal;
  }

  .task-row {
    grid-template-columns: 1fr;
  }

  .task-row-side {
    justify-items: start;
  }
}
`;

export const UI_JS = `const app = document.getElementById('app');
const nav = document.getElementById('top-nav');
const refreshButton = document.getElementById('refresh-button');
const updatedAt = document.getElementById('updated-at');
const heroMiniTitle = document.getElementById('hero-mini-title');
const heroMiniCopy = document.getElementById('hero-mini-copy');

const SECTIONS = [
  ['overview', 'Overview'],
  ['health', 'Health'],
  ['projects', 'Projects'],
  ['tasks', 'Tasks'],
  ['budget', 'Budget'],
  ['compare', 'Compare'],
  ['insights', 'Insights'],
  ['waste', 'Waste'],
  ['recommend', 'Recommendations'],
  ['leaderboard', 'Leaderboard']
];

const state = {
  projectsQuery: '',
  projectsFilter: 'all',
  tasksQuery: '',
  tasksFilter: 'all'
};

let latestData = null;

refreshButton?.addEventListener('click', () => loadOverview());
window.addEventListener('hashchange', () => renderCurrentView());

loadOverview();

async function loadOverview() {
  if (!app) return;
  app.innerHTML = '<section class="loading-state"><p>Refreshing Agent ROI dashboard...</p></section>';

  try {
    const response = await fetch('/api/overview', { cache: 'no-store' });
    if (!response.ok) throw new Error('Failed to load overview');
    latestData = await response.json();
    renderCurrentView();
  } catch (error) {
    renderError(error);
  }
}

function renderCurrentView() {
  if (!latestData || !app) return;
  updatedAt.textContent = 'Updated ' + formatDateTime(latestData.generatedAt);
  renderHeroMini();
  renderNav();

  if (latestData.emptyState) {
    app.innerHTML = '<section class="empty-state"><h2>' + escapeHtml(latestData.emptyState.title) + '</h2><p>' + escapeHtml(latestData.emptyState.body) + '</p>' + renderActionList(latestData.emptyState.nextSteps) + '</section>';
    return;
  }

  switch (getCurrentSection()) {
    case 'health': renderHealth(); break;
    case 'projects': renderProjects(); break;
    case 'tasks': renderTasks(); break;
    case 'budget': renderBudget(); break;
    case 'compare': renderCompare(); break;
    case 'insights': renderInsights(); break;
    case 'waste': renderWaste(); break;
    case 'recommend': renderRecommend(); break;
    case 'leaderboard': renderLeaderboard(); break;
    default: renderOverview();
  }
}

function renderHeroMini() {
  if (!latestData || !heroMiniTitle || !heroMiniCopy) return;
  const trackedProjects = latestData.projects.items.filter((item) => item.completedTaskCount > 0 || item.activeTaskCount > 0).length;
  const untrackedProjects = latestData.projects.items.filter((item) => item.completedTaskCount === 0 && item.activeTaskCount === 0).length;
  if (trackedProjects > 0) {
    heroMiniTitle.textContent = trackedProjects + ' tracked project' + (trackedProjects === 1 ? '' : 's');
    heroMiniCopy.textContent = untrackedProjects > 0
      ? untrackedProjects + ' scanned project' + (untrackedProjects === 1 ? '' : 's') + ' still have AI usage but no task attribution.'
      : 'Every scanned project already has task coverage.';
    return;
  }

  heroMiniTitle.textContent = 'Coverage needs task data';
  heroMiniCopy.textContent = 'You have scanned usage, but most workflow views only become useful after task attribution exists.';
}

function renderNav() {
  if (!nav) return;
  const current = getCurrentSection();
  nav.innerHTML = SECTIONS.map(([id, label]) => '<a class="nav-pill ' + (current === id ? 'active' : '') + '" href="#/' + id + '">' + escapeHtml(label) + '</a>').join('');
}

function renderOverview() {
  const data = latestData;
  const trackedProjects = data.projects.items.filter((item) => item.completedTaskCount > 0 || item.activeTaskCount > 0);
  const untrackedProjects = data.projects.items.filter((item) => item.completedTaskCount === 0 && item.activeTaskCount === 0);
  const spotlight = buildSpotlight(data, trackedProjects, untrackedProjects);
  const latestTasks = data.tasks.items.slice(0, 4);
  const topProjects = data.projects.items.slice(0, 4);
  const featured = buildFeaturedFocus(data);

  app.innerHTML =
    '<section class="overview-shell">' +
      '<div class="overview-lead">' +
        '<article class="spotlight">' +
          '<p class="spotlight-label">Where To Look First</p>' +
          '<h2 class="spotlight-title">' + escapeHtml(spotlight.title) + '</h2>' +
          '<p class="spotlight-copy">' + escapeHtml(spotlight.copy) + '</p>' +
          '<div class="spotlight-actions">' + spotlight.tags.map((tag) => '<span class="spotlight-pill">' + escapeHtml(tag) + '</span>').join('') + '</div>' +
        '</article>' +
        '<div class="signal-rail">' +
          renderRailCard('This Month Spend', formatUsd(data.budget.spentCostUsd), data.budget.hasIncompleteCostCoverage ? 'Includes incomplete cost coverage.' : 'Current Codex spend this month.') +
          renderRailCard('Tracked Projects', formatInteger(trackedProjects.length), untrackedProjects.length > 0 ? formatInteger(untrackedProjects.length) + ' projects still have usage without tasks.' : 'Every scanned project has task coverage.') +
          renderRailCard('Potential Waste', formatUsd(data.waste.zeroCommitCostUsd), data.waste.summaryLines[0] || 'No strong waste signal in the current window.') +
        '</div>' +
      '</div>' +
      '<div class="metrics-grid">' + buildMetricCards(data, trackedProjects, untrackedProjects) + '</div>' +
        '<div class="overview-grid">' +
        '<div class="stack overview-sidebar">' +
          '<article class="panel">' +
            sectionHeader('Compare + Direction', 'Use this as the main trend signal before digging into detail pages.', 'agent-roi compare') +
            '<div class="signal-list">' + buildCompareRows(data.compare) + '</div>' +
            '<div class="takeaway"><h3>Takeaway</h3><div>' + escapeHtml(data.compare.takeaway || 'Trend signal is mixed.') + '</div></div>' +
            (data.compare.note ? '<p class="footer-note">' + escapeHtml(data.compare.note) + '</p>' : '') +
          '</article>' +
          '<article class="featured-focus">' +
            '<div class="featured-badge">' + escapeHtml(featured.badge) + '</div>' +
            '<h3 class="spotlight-title">' + escapeHtml(featured.title) + '</h3>' +
            '<div class="featured-summary">' + escapeHtml(featured.summary) + '</div>' +
            '<div class="featured-meta">' + featured.meta.map((line) => '<span>' + escapeHtml(line) + '</span>').join('') + '</div>' +
          '</article>' +
          '<div class="preview-grid">' +
            '<article class="panel panel-compact">' +
              sectionHeader('Recent Tasks', 'Newest completed tasks, so you can inspect attribution quality quickly.', 'task report') +
              '<div class="summary-pills"><span>' + escapeHtml(formatInteger(latestTasks.length)) + ' shown</span><span>' + escapeHtml(formatInteger(data.tasks.items.length)) + ' total completed tasks</span></div>' +
              '<div class="preview-list">' + renderOverviewTasks(latestTasks) + '</div>' +
            '</article>' +
            '<article class="panel panel-compact">' +
              sectionHeader('Project Coverage', 'Projects with the most visible AI usage right now.', 'scan + task/watch') +
              '<div class="summary-pills"><span>' + escapeHtml(formatInteger(trackedProjects.length)) + ' tracked</span><span>' + escapeHtml(formatInteger(untrackedProjects.length)) + ' untracked</span></div>' +
              '<div class="preview-list">' + renderOverviewProjects(topProjects) + '</div>' +
            '</article>' +
          '</div>' +
        '</div>' +
        '<div class="stack">' +
          '<article class="panel panel-compact">' +
            sectionHeader('Data Health', 'Check whether your dashboard is powered by enough local attribution coverage.', 'debug attribution') +
            '<div class="summary-pills"><span>' + escapeHtml(formatInteger(data.dataHealth.matchedRecentTaskCount)) + ' matched tasks</span><span>' + escapeHtml(formatInteger(data.dataHealth.unmatchedRecentTaskCount)) + ' unmatched tasks</span><span>' + escapeHtml(formatInteger(data.dataHealth.untrackedProjectCount)) + ' untracked projects</span></div>' +
            renderLineGroup(data.dataHealth.notes, data.dataHealth.codexSessionCount === 0 ? 'No Codex sessions scanned yet.' : 'Coverage signals are available.') +
            renderActionList(data.dataHealth.onboardingSteps.slice(0, 2)) +
          '</article>' +
          '<article class="panel panel-compact">' +
            sectionHeader('Next Recommended Move', 'The most actionable rule-based suggestion from the last 30 days.', 'recommend') +
            '<div class="recommend-list">' + renderRecommendItems(data.recommend.items.slice(0, 2), data.recommend.emptyReason) + '</div>' +
          '</article>' +
          '<article class="panel panel-compact">' +
            sectionHeader('Potential Waste', 'Fast review of suspicious tasks before you drill into the full report.', 'waste') +
            '<div class="waste-list">' + renderWasteItems(data.waste.items.slice(0, 3), data.waste.emptyReason) + '</div>' +
            buildSummaryList(data.waste.summaryLines) +
          '</article>' +
          '<article class="panel panel-compact">' +
            sectionHeader('Leaderboard Snapshot', 'A compact look at cost and efficiency leaders.', 'leaderboard') +
            '<h3 class="subsection-title">Most Expensive</h3><div class="mini-list">' +
            renderMiniItems(data.leaderboard.mostExpensive.map((item) => ({ title: item.name, lines: [formatUsd(item.costUsd)] })), 'No expensive tasks to rank yet.') +
            '</div>' +
            '<h3 class="subsection-title">Most Efficient</h3><div class="mini-list">' +
            renderMiniItems(data.leaderboard.mostEfficient.map((item) => ({ title: item.name, lines: [formatUsd(item.costUsd), item.metricLabel + ': ' + item.metricValue] })), 'No efficient tasks to rank yet.') +
            '</div>' +
          '</article>' +
        '</div>' +
      '</div>' +
    '</section>';
}

function renderHealth() {
  const data = latestData.dataHealth;
  app.innerHTML =
    '<section class="page-section">' +
      '<article class="panel">' +
        sectionHeader('Data Health', 'Understand whether missing insights come from missing scans, missing tasks, project mismatch, or time-window mismatch.', 'debug attribution') +
        '<div class="inventory-strip">' +
          renderInventoryStat(formatInteger(data.codexSessionCount), 'Codex sessions') +
          renderInventoryStat(formatInteger(data.trackedProjectCount), 'tracked projects') +
          renderInventoryStat(formatInteger(data.matchedRecentTaskCount), 'matched recent tasks') +
          renderInventoryStat(formatInteger(data.unmatchedRecentTaskCount), 'unmatched recent tasks') +
        '</div>' +
        '<div class="detail-grid">' +
          '<article class="detail-card"><strong>Coverage Summary</strong><div class="health-stack"><div class="muted">Latest capture: ' + escapeHtml(data.latestSessionCaptureAt || 'N/A') + '</div><div class="muted">Claude snapshots scanned: ' + escapeHtml(formatInteger(data.claudeSessionCount)) + '</div><div class="muted">Unknown-model sessions: ' + escapeHtml(formatInteger(data.unknownCostSessionCount)) + '</div><div class="muted">Active projects: ' + escapeHtml(formatInteger(data.activeProjectCount)) + '</div><div class="muted">Recent completed tasks: ' + escapeHtml(formatInteger(data.recentCompletedTaskCount)) + '</div></div></article>' +
          '<article class="detail-card"><strong>Why Tasks Stay Unmatched</strong><div class="health-stack"><div class="muted">No same-project sessions: ' + escapeHtml(formatInteger(data.unmatchedNoProjectSessionsCount)) + '</div><div class="muted">Project sessions outside task window: ' + escapeHtml(formatInteger(data.unmatchedOutsideWindowCount)) + '</div><div class="muted">Partial cost recent tasks: ' + escapeHtml(formatInteger(data.partialCostRecentTaskCount)) + '</div><div class="muted">Projects with usage but no tasks: ' + escapeHtml(formatInteger(data.untrackedProjectCount)) + '</div></div></article>' +
        '</div>' +
        '<h3 class="subsection-title">Notes</h3>' +
        renderLineGroup(data.notes, 'No data health notes yet.') +
        '<h3 class="subsection-title">Next Steps</h3>' +
        renderActionList(data.onboardingSteps) +
        '<h3 class="subsection-title">Recent Unmatched Tasks</h3>' +
        '<div class="mini-list">' + renderDebugTasks(data.sampleUnmatchedTasks) + '</div>' +
      '</article>' +
    '</section>';
}

function renderProjects() {
  const items = getFilteredProjects();
  const total = latestData.projects.items.length;
  const tracked = latestData.projects.items.filter((item) => item.completedTaskCount > 0 || item.activeTaskCount > 0).length;
  const active = latestData.projects.items.filter((item) => item.activeTaskCount > 0).length;
  const untracked = total - tracked;
  const totalSessions = latestData.projects.items.reduce((sum, item) => sum + item.codexSessionCount, 0);
  const body = items.length
    ? '<div class="projects-shell"><div class="table-header"><span>Project</span><span>Sessions</span><span>Tasks</span><span>Cost</span><span>Tokens</span><span>Last Seen</span></div>' +
      items.map((item) => '<article class="table-row ' + escapeHtml(getProjectRowClass(item)) + '"><div class="table-row-head"><strong>' + escapeHtml(item.projectName) + '</strong><div class="table-path">' + escapeHtml(item.projectPath) + '</div>' + buildProjectBadges(item) + '</div><div class="table-cell">' + escapeHtml(formatInteger(item.codexSessionCount)) + '</div><div class="table-cell">' + escapeHtml(formatInteger(item.completedTaskCount)) + '</div><div class="table-cell">' + escapeHtml(formatNullableUsd(item.aiCostUsd)) + '</div><div class="table-cell">' + escapeHtml(item.tokensLabel) + '</div><div class="table-cell table-cell--last">' + escapeHtml(item.lastSessionAt ? formatDateTime(item.lastSessionAt) : 'N/A') + '</div>' + (item.note ? '<div class="table-note">' + escapeHtml(item.note) + '</div>' : '') + '</article>').join('') + '</div>'
    : renderEmptyCallout('neutral', 'No projects match this search or filter.', 'Try a different search term or reset the current filter.');

  app.innerHTML =
    '<section class="page-section">' +
      '<article class="panel">' +
        sectionHeader('Projects', 'See which scanned projects are already tracked and which still need task attribution.', 'scan + task/watch') +
        '<div class="control-stack">' +
          '<div class="inventory-strip">' +
            renderInventoryStat(formatInteger(total), 'scanned projects') +
            renderInventoryStat(formatInteger(tracked), 'tracked projects') +
            renderInventoryStat(formatInteger(untracked), 'untracked projects') +
            renderInventoryStat(formatInteger(totalSessions), 'Codex sessions') +
          '</div>' +
          '<div class="toolbar-card">' +
            '<div class="summary-pills"><span>' + escapeHtml(formatInteger(active)) + ' active right now</span><span>' + escapeHtml(formatInteger(items.length)) + ' of ' + escapeHtml(formatInteger(total)) + ' shown</span></div>' +
            '<div class="control-bar">' +
              '<input id="projects-search" class="search-input" type="search" placeholder="Search project name or path" value="' + escapeHtml(state.projectsQuery) + '" />' +
              '<div class="filter-group">' +
                renderFilterChip('projects', 'all', 'All') +
                renderFilterChip('projects', 'tracked', 'Tracked') +
                renderFilterChip('projects', 'untracked', 'Untracked') +
                renderFilterChip('projects', 'active', 'Active') +
              '</div>' +
              '<div class="filter-meta">Filter projects by coverage state</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        body +
      '</article>' +
    '</section>';

  bindProjectsControls();
}

function renderTasks() {
  const items = getFilteredTasks();
  const total = latestData.tasks.items.length;
  const matched = latestData.tasks.items.filter((item) => item.hasMatchedAiData).length;
  const productive = latestData.tasks.items.filter((item) => item.commits > 0 || item.filesChanged > 0 || item.locChanged > 0).length;
  const totalCommits = latestData.tasks.items.reduce((sum, item) => sum + item.commits, 0);
  const body = items.length
    ? '<div class="tasks-shell">' + items.map((item) => '<article class="task-row ' + escapeHtml(getTaskRowClass(item)) + '"><div class="task-row-main"><strong>' + escapeHtml(item.name) + '</strong><div class="muted">' + escapeHtml(item.projectName) + ' · Ended ' + escapeHtml(formatDateTime(item.endedAt)) + '</div></div><div><div class="task-meta"><span>Duration: ' + escapeHtml(item.durationLabel) + '</span><span>AI Cost: ' + escapeHtml(item.hasMatchedAiData ? formatNullableUsd(item.aiCostUsd) : 'N/A') + '</span><span>Tokens: ' + escapeHtml(item.tokensLabel) + '</span><span>Commits: ' + escapeHtml(formatInteger(item.commits)) + '</span><span>Files Changed: ' + escapeHtml(formatInteger(item.filesChanged)) + '</span><span>LOC Changed: ' + escapeHtml(formatInteger(item.locChanged)) + '</span></div>' + (item.note ? '<div class="task-note-inline">' + escapeHtml(item.note) + '</div>' : '') + '</div><div class="task-row-side">' + renderTaskBadges(item) + '</div></article>').join('') + '</div>'
    : renderEmptyCallout('neutral', 'No tasks match this search or filter.', 'Try a different task name, project name, or filter.');

  app.innerHTML =
    '<section class="page-section">' +
      '<article class="panel">' +
        sectionHeader('Task History', 'Find recent tasks fast, then check whether attribution is complete or still missing.', 'task report') +
        '<div class="control-stack">' +
          '<div class="inventory-strip">' +
            renderInventoryStat(formatInteger(total), 'completed tasks') +
            renderInventoryStat(formatInteger(matched), 'matched tasks') +
            renderInventoryStat(formatInteger(productive), 'tasks with Git output') +
            renderInventoryStat(formatInteger(totalCommits), 'total commits') +
          '</div>' +
          '<div class="toolbar-card">' +
            '<div class="summary-pills"><span>' + escapeHtml(formatInteger(total - matched)) + ' unmatched</span><span>' + escapeHtml(formatInteger(items.length)) + ' of ' + escapeHtml(formatInteger(total)) + ' shown</span></div>' +
            '<div class="control-bar">' +
              '<input id="tasks-search" class="search-input" type="search" placeholder="Search task name or project" value="' + escapeHtml(state.tasksQuery) + '" />' +
              '<div class="filter-group">' +
                renderFilterChip('tasks', 'all', 'All') +
                renderFilterChip('tasks', 'matched', 'Matched') +
                renderFilterChip('tasks', 'unmatched', 'Unmatched') +
                renderFilterChip('tasks', 'productive', 'Has Git Output') +
              '</div>' +
              '<div class="filter-meta">Filter tasks by attribution or output</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        body +
      '</article>' +
    '</section>';

  bindTasksControls();
}

function renderBudget() {
  const data = latestData;
  app.innerHTML =
    '<section class="page-section">' +
      '<article class="panel">' +
        sectionHeader('Budget', 'Current month Codex spend and projection.', 'agent-roi budget') +
        '<div class="metrics-grid compact">' +
          renderMetricCard('This Month Spend', formatUsd(data.budget.spentCostUsd), 'Codex spend this month') +
          renderMetricCard('Month-End Projection', formatUsd(data.budget.projectedMonthEndCostUsd), 'Projected at current pace') +
          renderMetricCard('Daily Pace', formatUsd(data.budget.averageDailyCostUsd) + '/day', data.budget.daysElapsed + ' of ' + data.budget.daysInMonth + ' days') +
        '</div>' +
        '<div class="budget-banner"><h3>Budget Status</h3><div>' + escapeHtml(data.budget.statusLine) + '</div></div>' +
        (data.budget.hasIncompleteCostCoverage ? '<p class="footer-note">Some spend has incomplete cost coverage.</p>' : '') +
      '</article>' +
    '</section>';
}

function renderCompare() {
  const data = latestData;
  app.innerHTML =
    '<section class="page-section">' +
      '<article class="panel">' +
        sectionHeader('Compare', 'Last 7 days vs previous 7 days.', 'agent-roi compare') +
        '<div class="signal-list">' + buildCompareRows(data.compare) + '</div>' +
        '<div class="takeaway"><h3>Takeaway</h3><div>' + escapeHtml(data.compare.takeaway || 'Trend signal is mixed.') + '</div></div>' +
        (data.compare.note ? '<p class="footer-note">' + escapeHtml(data.compare.note) + '</p>' : '') +
      '</article>' +
    '</section>';
}

function renderInsights() {
  const data = latestData;
  app.innerHTML =
    '<section class="page-section">' +
      '<div class="detail-grid">' +
        '<article class="panel">' + sectionHeader('Cost Insights', 'Concentration and expensive task patterns.', 'agent-roi insights') + renderLineGroup(data.insights.costLines, data.insights.emptyReason) + '</article>' +
        '<article class="panel">' + sectionHeader('Waste Insights', 'Tasks that may have burned budget inefficiently.', 'agent-roi insights') + renderLineGroup(data.insights.wasteLines, data.insights.emptyReason) + '</article>' +
        '<article class="panel">' + sectionHeader('Efficiency Insights', 'Duration and output patterns.', 'agent-roi insights') + renderLineGroup(data.insights.efficiencyLines, data.insights.emptyReason) + '</article>' +
      '</div>' +
    '</section>';
}

function renderWaste() {
  const data = latestData;
  app.innerHTML =
    '<section class="page-section">' +
      '<article class="panel">' +
        sectionHeader('Potential Waste', 'Full waste candidates from recent completed tasks.', 'agent-roi waste') +
        '<div class="waste-list">' + renderWasteItems(data.waste.items, data.waste.emptyReason) + '</div>' +
        buildSummaryList(data.waste.summaryLines) +
      '</article>' +
    '</section>';
}

function renderRecommend() {
  const data = latestData;
  app.innerHTML =
    '<section class="page-section">' +
      '<article class="panel">' +
        sectionHeader('Recommendations', 'Actionable suggestions based on recent task attribution patterns.', 'agent-roi recommend') +
        '<div class="recommend-list">' + renderRecommendItems(data.recommend.items, data.recommend.emptyReason) + '</div>' +
      '</article>' +
    '</section>';
}

function renderLeaderboard() {
  const data = latestData;
  app.innerHTML =
    '<section class="page-section">' +
      '<div class="detail-grid">' +
        '<article class="panel">' + sectionHeader('Most Expensive Tasks', 'Highest cost completed tasks.', 'agent-roi leaderboard') + '<div class="mini-list">' + renderMiniItems(data.leaderboard.mostExpensive.map((item) => ({ title: item.name, lines: [formatUsd(item.costUsd)] })), data.leaderboard.emptyReason || 'No expensive tasks to rank yet.') + '</div></article>' +
        '<article class="panel">' + sectionHeader('Most Efficient Tasks', 'Best output per dollar from recent work.', 'agent-roi leaderboard') + '<div class="mini-list">' + renderMiniItems(data.leaderboard.mostEfficient.map((item) => ({ title: item.name, lines: [formatUsd(item.costUsd), item.metricLabel + ': ' + item.metricValue] })), data.leaderboard.emptyReason || 'No efficient tasks to rank yet.') + '</div></article>' +
        '<article class="panel">' + sectionHeader('Least Efficient Tasks', 'High cost with low visible output.', 'agent-roi leaderboard') + '<div class="mini-list">' + renderMiniItems(data.leaderboard.leastEfficient.map((item) => ({ title: item.name, lines: [formatUsd(item.costUsd), 'Reason: ' + item.reason] })), data.leaderboard.emptyReason || 'No least efficient tasks to rank yet.') + '</div></article>' +
      '</div>' +
    '</section>';
}

function buildSpotlight(data, trackedProjects, untrackedProjects) {
  if (data.recommend.items.length > 0) {
    return {
      title: data.recommend.items[0].title,
      copy: data.recommend.items[0].finding + ' ' + data.recommend.items[0].action,
      tags: ['Recommendation', 'Last 30 days', trackedProjects.length + ' tracked projects']
    };
  }

  if (untrackedProjects.length > 0) {
    return {
      title: 'Scanned usage exists, but attribution coverage is still thin.',
      copy: 'You already have AI session data across multiple projects. The next leverage point is creating task coverage so Insights, Compare, Waste, and Recommendations become meaningful.',
      tags: ['Coverage gap', formatInteger(untrackedProjects.length) + ' untracked projects', 'Use watch/task next']
    };
  }

  return {
    title: data.compare.takeaway || 'Overview is ready, but trend signal is still limited.',
    copy: data.compare.emptyReason || data.budget.statusLine,
    tags: ['Overview', 'Local-only', 'Codex attribution']
  };
}

function buildFeaturedFocus(data) {
  const topProject = data.projects.items[0] || null;
  const recentTask = data.tasks.items.find((item) => item.hasMatchedAiData) || data.tasks.items[0] || null;
  const wasteItem = data.waste.items[0] || null;

  if (wasteItem) {
    return {
      badge: 'Review Now',
      title: wasteItem.name,
      summary: 'This task looks like the strongest waste candidate in the current window. Review why it consumed budget before that pattern repeats.',
      meta: [
        wasteItem.durationLabel,
        formatNullableUsd(wasteItem.costUsd),
        wasteItem.reason
      ]
    };
  }

  if (recentTask) {
    return {
      badge: recentTask.hasMatchedAiData ? 'Recent Task' : 'Attribution Gap',
      title: recentTask.name,
      summary: recentTask.hasMatchedAiData
        ? 'This is the freshest task with visible attribution data. Use it as the quickest way to sanity-check whether task quality and cost are lining up.'
        : 'This recent task has no matched Codex attribution yet. If this keeps happening, your higher-level insights will stay thin even though scan data exists.',
      meta: [
        recentTask.projectName,
        recentTask.durationLabel,
        recentTask.hasMatchedAiData ? formatNullableUsd(recentTask.aiCostUsd) : 'No matched Codex data'
      ]
    };
  }

  if (topProject) {
    return {
      badge: 'Top Project',
      title: topProject.projectName,
      summary: 'This project currently represents the clearest place to improve attribution coverage and validate whether AI spend is producing visible output.',
      meta: [
        formatInteger(topProject.codexSessionCount) + ' sessions',
        topProject.tokensLabel,
        formatNullableUsd(topProject.aiCostUsd)
      ]
    };
  }

  return {
    badge: 'Overview',
    title: 'No recent task activity yet.',
    summary: 'Start with scan, then use watch or task attribution so the rest of the workspace can surface useful patterns.',
    meta: ['Run scan', 'Track tasks', 'Refresh the page']
  };
}

function buildMetricCards(data, trackedProjects, untrackedProjects) {
  const cards = [
    ['Month Spend', formatUsd(data.budget.spentCostUsd), 'Current Codex spend this month'],
    ['Completed Tasks', formatInteger(data.tasks.items.length), 'Completed tasks available for attribution'],
    ['Tracked Projects', formatInteger(trackedProjects.length), 'Projects with active or completed tasks'],
    ['Untracked Usage', formatInteger(untrackedProjects.length), 'Scanned projects that still need task coverage']
  ];

  return cards.map(([title, value, caption]) => renderMetricCard(title, value, caption)).join('');
}

function renderMetricCard(title, value, caption) {
  return '<article class="metric-card"><div><h3>' + escapeHtml(title) + '</h3><div class="metric-value">' + escapeHtml(value) + '</div></div><div class="metric-caption">' + escapeHtml(caption) + '</div></article>';
}

function renderRailCard(label, value, caption) {
  return '<article class="rail-card"><div class="rail-label">' + escapeHtml(label) + '</div><div class="rail-value">' + escapeHtml(value) + '</div><div class="rail-caption">' + escapeHtml(caption) + '</div></article>';
}

function renderOverviewTasks(items) {
  if (!items || items.length === 0) {
    return '<div class="empty-inline">No completed tasks yet.</div>';
  }

  return items.map((item) => '<article class="preview-card"><strong>' + escapeHtml(item.name) + '</strong><div class="preview-meta"><span>' + escapeHtml(item.projectName) + '</span><span>' + escapeHtml(item.durationLabel) + '</span><span>' + escapeHtml(item.hasMatchedAiData ? formatNullableUsd(item.aiCostUsd) : 'No matched AI data') + '</span></div><div class="muted">' + escapeHtml(item.hasMatchedAiData ? 'Attribution matched and ready for deeper review.' : 'Recent task, but attribution is still missing.') + '</div></article>').join('');
}

function renderOverviewProjects(items) {
  if (!items || items.length === 0) {
    return '<div class="empty-inline">No scanned projects yet.</div>';
  }

  return items.map((item) => '<article class="preview-card"><strong>' + escapeHtml(item.projectName) + '</strong><div class="preview-meta"><span>' + escapeHtml(formatInteger(item.codexSessionCount)) + ' sessions</span><span>' + escapeHtml(item.tokensLabel) + '</span><span>' + escapeHtml(formatNullableUsd(item.aiCostUsd)) + '</span></div><div class="muted">' + escapeHtml(item.note || 'Tracked project coverage available') + '</div></article>').join('');
}

function sectionHeader(title, subtitle, source) {
  return '<div class="section-header"><div class="section-heading"><h2>' + escapeHtml(title) + '</h2><p class="section-subtitle">' + escapeHtml(subtitle) + '</p></div><span class="source-chip">Source: ' + escapeHtml(source) + '</span></div>';
}

function buildCompareRows(compare) {
  if (compare.emptyReason) {
    return '<div class="signal-row"><div class="signal-label">Compare</div><div class="signal-values">' + escapeHtml(compare.emptyReason) + '</div><div class="delta neutral">N/A</div></div>';
  }

  const rows = [
    ['AI Cost', compare.aiCost, true],
    ['Tasks', compare.tasks, false],
    ['Commits', compare.commits, false],
    ['Waste Cost', compare.wasteCost, true],
    ['Efficiency', compare.efficiency, false]
  ];

  return rows.filter(([, metric]) => metric).map(([label, metric, isCurrency]) => {
    const values = metric.label
      ? formatMetricValue(metric.previous, metric.label) + ' → ' + formatMetricValue(metric.current, metric.label)
      : formatMetricValue(metric.previous, isCurrency ? 'usd' : 'count') + ' → ' + formatMetricValue(metric.current, isCurrency ? 'usd' : 'count');
    const deltaValue = metric.changePct === null ? 'N/A' : formatSignedPercent(metric.changePct);
    return '<div class="signal-row"><div class="signal-label">' + escapeHtml(label) + '</div><div class="signal-values">' + escapeHtml(values) + '</div><div class="delta ' + classifyDelta(label, metric.changePct) + '">' + escapeHtml(deltaValue) + '</div></div>';
  }).join('');
}

function renderLineGroup(lines, emptyReason) {
  if (!lines || lines.length === 0) {
    return renderEmptyCallout('neutral', emptyReason || 'No lines available.', 'There is not enough matched task attribution in this window to generate insight lines yet.');
  }
  return '<div class="line-list">' + lines.map((line) => '<div>' + escapeHtml(line) + '</div>').join('') + '</div>';
}

function renderWasteItems(items, emptyReason) {
  if (!items || items.length === 0) {
    return renderEmptyCallout('tip', emptyReason || 'No obvious waste patterns found.', 'That usually means recent tasks either had little cost or did not trigger the waste heuristics.');
  }
  return items.map((item) => '<div class="waste-item"><strong>' + escapeHtml(item.name) + '</strong><div>' + escapeHtml(item.durationLabel) + ' · ' + escapeHtml(formatNullableUsd(item.costUsd)) + '</div><div class="muted">' + escapeHtml(item.reason) + '</div></div>').join('');
}

function renderRecommendItems(items, emptyReason) {
  if (!items || items.length === 0) {
    return renderEmptyCallout('warn', emptyReason || 'No recommendations available.', 'Recommendations appear once recent tasks have enough matched attribution and pattern strength.');
  }
  return items.map((item) => '<div class="recommend-item"><strong>' + escapeHtml(item.title) + '</strong><div class="muted">' + escapeHtml(item.finding) + '</div><div class="recommend-action">' + escapeHtml(item.action) + '</div></div>').join('');
}

function renderMiniItems(items, emptyText) {
  if (!items || items.length === 0) {
    return renderEmptyCallout('neutral', emptyText, 'Leaderboard views need matched completed tasks before they can rank cost or efficiency.');
  }
  return items.map((item) => '<div class="mini-item"><strong>' + escapeHtml(item.title) + '</strong>' + item.lines.map((line) => '<div class="muted">' + escapeHtml(line) + '</div>').join('') + '</div>').join('');
}

function renderDebugTasks(items) {
  if (!items || items.length === 0) {
    return renderEmptyCallout('neutral', 'No recent unmatched tasks.', 'Recent completed tasks already have matched Codex attribution in this window.');
  }

  return items.map((item) => '<div class="mini-item"><strong>' + escapeHtml(item.name) + '</strong><div class="muted">' + escapeHtml(item.projectName) + ' · Ended ' + escapeHtml(formatDateTime(item.endedAt)) + '</div><div class="muted">' + escapeHtml(item.reason) + '</div><div class="muted">Project Sessions: ' + escapeHtml(formatInteger(item.projectSessionCount)) + ' · Window Sessions: ' + escapeHtml(formatInteger(item.windowSessionCount)) + '</div></div>').join('');
}

function renderEmptyCallout(kind, title, body) {
  return '<div class="empty-callout ' + escapeHtml(kind) + '"><strong>' + escapeHtml(title) + '</strong><p>' + escapeHtml(body) + '</p></div>';
}

function buildSummaryList(lines) {
  if (!lines || lines.length === 0) return '';
  return '<div class="footer-note">' + lines.map((line) => '<div>• ' + escapeHtml(line) + '</div>').join('') + '</div>';
}

function renderActionList(lines) {
  if (!lines || lines.length === 0) return '';
  return '<div class="action-list">' + lines.map((line) => '<div>' + escapeHtml(line) + '</div>').join('') + '</div>';
}

function renderFilterChip(group, value, label) {
  const currentValue = group === 'projects' ? state.projectsFilter : state.tasksFilter;
  return '<button class="filter-chip ' + (currentValue === value ? 'active' : '') + '" type="button" data-group="' + escapeHtml(group) + '" data-value="' + escapeHtml(value) + '">' + escapeHtml(label) + '</button>';
}

function renderInventoryStat(value, label) {
  return '<div class="inventory-stat"><strong>' + escapeHtml(value) + '</strong><span>' + escapeHtml(label) + '</span></div>';
}

function bindProjectsControls() {
  const input = document.getElementById('projects-search');
  input?.addEventListener('input', (event) => {
    state.projectsQuery = event.target.value;
    renderProjects();
  });

  app.querySelectorAll('[data-group="projects"]').forEach((button) => {
    button.addEventListener('click', () => {
      state.projectsFilter = button.getAttribute('data-value') || 'all';
      renderProjects();
    });
  });
}

function bindTasksControls() {
  const input = document.getElementById('tasks-search');
  input?.addEventListener('input', (event) => {
    state.tasksQuery = event.target.value;
    renderTasks();
  });

  app.querySelectorAll('[data-group="tasks"]').forEach((button) => {
    button.addEventListener('click', () => {
      state.tasksFilter = button.getAttribute('data-value') || 'all';
      renderTasks();
    });
  });
}

function getFilteredProjects() {
  const query = state.projectsQuery.trim().toLowerCase();
  return latestData.projects.items.filter((item) => {
    if (state.projectsFilter === 'tracked' && !(item.completedTaskCount > 0 || item.activeTaskCount > 0)) return false;
    if (state.projectsFilter === 'untracked' && !(item.completedTaskCount === 0 && item.activeTaskCount === 0)) return false;
    if (state.projectsFilter === 'active' && item.activeTaskCount === 0) return false;
    if (!query) return true;
    return item.projectName.toLowerCase().includes(query) || item.projectPath.toLowerCase().includes(query);
  });
}

function getFilteredTasks() {
  const query = state.tasksQuery.trim().toLowerCase();
  return latestData.tasks.items.filter((item) => {
    if (state.tasksFilter === 'matched' && !item.hasMatchedAiData) return false;
    if (state.tasksFilter === 'unmatched' && item.hasMatchedAiData) return false;
    if (state.tasksFilter === 'productive' && !(item.commits > 0 || item.filesChanged > 0 || item.locChanged > 0)) return false;
    if (!query) return true;
    return item.name.toLowerCase().includes(query) || item.projectName.toLowerCase().includes(query);
  });
}

function buildProjectBadges(item) {
  const badges = [];
  if (item.activeTaskCount > 0) badges.push('<span class="pill-note status-good">active task</span>');
  if (item.completedTaskCount > 0) badges.push('<span class="pill-note status-neutral">tracked</span>');
  if (item.completedTaskCount === 0 && item.activeTaskCount === 0) badges.push('<span class="pill-note status-warn">untracked</span>');
  return badges.join('');
}

function getProjectRowClass(item) {
  if (item.activeTaskCount > 0) return 'status-active';
  if (item.completedTaskCount > 0) return 'status-tracked';
  return 'status-untracked';
}

function getTaskRowClass(item) {
  if (item.commits > 0 || item.filesChanged > 0 || item.locChanged > 0) return 'tone-productive';
  if (item.hasMatchedAiData) return 'tone-matched';
  return 'tone-unmatched';
}

function renderTaskBadges(item) {
  const badges = [
    '<span class="pill-note status-neutral">' + escapeHtml(item.status) + '</span>',
    item.hasMatchedAiData
      ? '<span class="pill-note status-good">matched</span>'
      : '<span class="pill-note status-warn">unmatched</span>'
  ];

  if (item.commits > 0 || item.filesChanged > 0 || item.locChanged > 0) {
    badges.push('<span class="pill-note status-good">has Git output</span>');
  }

  return badges.join('');
}

function classifyDelta(label, value) {
  if (value === null) return 'neutral';
  if (label === 'AI Cost' || label === 'Waste Cost') return value <= 0 ? 'good' : 'bad';
  return value >= 0 ? 'good' : 'bad';
}

function formatMetricValue(value, kind) {
  if (value === null || value === undefined) return 'N/A';
  if (kind === 'usd') return formatUsd(value);
  if (kind === 'commits/$') return formatDecimal(value) + ' commits/$';
  if (kind === 'LOC/$1') return Math.round(value).toLocaleString('en-US') + ' LOC/$1';
  return formatInteger(value);
}

function formatUsd(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return 'N/A';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function formatNullableUsd(value) {
  return formatUsd(value);
}

function formatInteger(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return 'N/A';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
}

function formatDecimal(value) {
  return Number(value).toFixed(1).replace(/\\.0$/, '');
}

function formatSignedPercent(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return 'N/A';
  const rounded = Math.round(value);
  return rounded > 0 ? '+' + rounded + '%' : String(rounded) + '%';
}

function formatDateTime(value) {
  try { return new Date(value).toLocaleString(); } catch { return value; }
}

function getCurrentSection() {
  const hash = window.location.hash.replace(/^#\\/?/, '');
  const normalized = hash || 'overview';
  return SECTIONS.some(([id]) => id === normalized) ? normalized : 'overview';
}

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function renderError(error) {
  if (!app) return;
  updatedAt.textContent = 'Unavailable';
  app.innerHTML = '<section class="error-state"><h2>Unable to load Agent ROI data.</h2><p>Try running agent-roi scan first.</p><p class="muted">' + escapeHtml(error?.message || 'Unknown error') + '</p></section>';
}
`;
