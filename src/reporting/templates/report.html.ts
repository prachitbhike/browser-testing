import type { SerializableBenchmarkReport } from '../../types/metrics.js';

export function generateReportHtml(report: SerializableBenchmarkReport): string {
  const reportJson = JSON.stringify(report, null, 2);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Benchmark Report — ${report.runId}</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; padding: 2rem; }
  h1 { font-size: 1.5rem; margin-bottom: 0.5rem; color: #f8fafc; }
  h2 { font-size: 1.25rem; margin: 2rem 0 1rem; color: #38bdf8; }
  h3 { font-size: 1rem; margin: 1.5rem 0 0.75rem; color: #a78bfa; }
  .meta { color: #94a3b8; margin-bottom: 2rem; font-size: 0.875rem; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(600px, 1fr)); gap: 1.5rem; }
  .card { background: #1e293b; border-radius: 12px; padding: 1.5rem; border: 1px solid #334155; }
  .chart-container { position: relative; height: 320px; }
  table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.8rem; }
  th, td { padding: 0.5rem 0.75rem; text-align: right; border-bottom: 1px solid #334155; }
  th { color: #94a3b8; font-weight: 600; text-align: right; }
  th:first-child, td:first-child { text-align: left; }
  .winner { color: #4ade80; font-weight: 700; }
  .collapsible { cursor: pointer; user-select: none; }
  .collapsible::before { content: '▸ '; }
  .collapsible.open::before { content: '▾ '; }
  .collapsible-content { display: none; }
  .collapsible-content.open { display: block; }
  pre { background: #0f172a; border-radius: 8px; padding: 1rem; overflow-x: auto; font-size: 0.75rem; color: #94a3b8; max-height: 400px; overflow-y: auto; }
  .provider-colors { display: flex; gap: 1rem; margin-bottom: 1rem; }
  .legend-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; }
  .legend-dot { width: 12px; height: 12px; border-radius: 50%; }
</style>
</head>
<body>
<h1>Browser Benchmark Report</h1>
<p class="meta">Run: ${report.runId} &bull; ${report.timestamp} &bull; Duration: ${(report.duration / 1000).toFixed(1)}s &bull; Iterations: ${report.config.iterations} (warmup: ${report.config.warmupIterations})</p>

<div class="provider-colors" id="legend"></div>

<h2>Per-Scenario Comparison</h2>
<div class="grid" id="scenarioCharts"></div>

<h2>Overall Comparison (Radar)</h2>
<div class="card">
  <div class="chart-container"><canvas id="radarChart"></canvas></div>
</div>

<h2>Long-Running Session Degradation</h2>
<div class="card">
  <div class="chart-container"><canvas id="timeSeriesChart"></canvas></div>
</div>

<h2>System Resources</h2>
<div class="grid">
  <div class="card">
    <h3>CPU Usage</h3>
    <div class="chart-container"><canvas id="cpuChart"></canvas></div>
  </div>
  <div class="card">
    <h3>Memory Usage</h3>
    <div class="chart-container"><canvas id="memoryChart"></canvas></div>
  </div>
</div>

<h2>Detailed Tables</h2>
<div id="detailedTables"></div>

<h2 class="collapsible" onclick="toggleCollapsible(this)">Raw JSON Data</h2>
<div class="collapsible-content">
  <pre>${escapeHtml(reportJson)}</pre>
</div>

<script>
const REPORT = ${reportJson};

const PROVIDER_COLORS = {
  browserbase: { bg: 'rgba(56, 189, 248, 0.7)', border: '#38bdf8' },
  kernel: { bg: 'rgba(167, 139, 250, 0.7)', border: '#a78bfa' },
};

function getColor(provider, type) {
  const c = PROVIDER_COLORS[provider] || { bg: 'rgba(251, 191, 36, 0.7)', border: '#fbbf24' };
  return type === 'bg' ? c.bg : c.border;
}

// Render legend
const legend = document.getElementById('legend');
REPORT.config.providers.forEach(p => {
  const item = document.createElement('div');
  item.className = 'legend-item';
  item.innerHTML = '<div class="legend-dot" style="background:' + getColor(p, 'border') + '"></div>' + p;
  legend.appendChild(item);
});

// Group results by scenario
const scenarios = [...new Set(REPORT.results.map(r => r.scenarioName))];
const providers = REPORT.config.providers;

// Per-scenario bar charts
const grid = document.getElementById('scenarioCharts');
scenarios.forEach(scenario => {
  const results = REPORT.results.filter(r => r.scenarioName === scenario);
  const allMetrics = new Set();
  results.forEach(r => Object.keys(r.metrics).forEach(m => allMetrics.add(m)));
  const displayMetrics = [...allMetrics].filter(m => m !== 'cpu_usage_percent' && m !== 'memory_usage_mb');

  if (displayMetrics.length === 0) return;

  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = '<h3>' + scenario + '</h3><div class="chart-container"><canvas></canvas></div>';
  grid.appendChild(card);
  const canvas = card.querySelector('canvas');

  const datasets = providers.map(provider => {
    const result = results.find(r => r.providerName === provider);
    return {
      label: provider,
      data: displayMetrics.map(m => result && result.metrics[m] ? result.metrics[m].median : 0),
      backgroundColor: getColor(provider, 'bg'),
      borderColor: getColor(provider, 'border'),
      borderWidth: 1,
    };
  });

  new Chart(canvas, {
    type: 'bar',
    data: { labels: displayMetrics, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#94a3b8' } } },
      scales: {
        x: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { color: '#334155' } },
        y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' }, title: { display: true, text: 'ms', color: '#94a3b8' } },
      },
    },
  });
});

// Radar chart — normalize each metric 0–1 and show mean across scenarios
const radarMetrics = ['session_startup', 'page_load', 'time_to_first_byte', 'interaction_latency', 'total_iteration'];
const radarLabels = radarMetrics.map(m => m.replace(/_/g, ' '));
const radarDatasets = providers.map(provider => {
  const values = radarMetrics.map(metric => {
    const allValues = REPORT.results
      .filter(r => r.providerName === provider && r.metrics[metric])
      .map(r => r.metrics[metric].median);
    return allValues.length > 0 ? allValues.reduce((a, b) => a + b, 0) / allValues.length : 0;
  });
  // Normalize: find max across providers for each metric
  return { provider, values };
});
const maxPerMetric = radarMetrics.map((_, i) => Math.max(...radarDatasets.map(d => d.values[i]), 1));
const radarChartDatasets = radarDatasets.map(d => ({
  label: d.provider,
  data: d.values.map((v, i) => 1 - v / maxPerMetric[i]), // Invert: lower = better = closer to 1
  backgroundColor: getColor(d.provider, 'bg').replace('0.7', '0.2'),
  borderColor: getColor(d.provider, 'border'),
  borderWidth: 2,
  pointBackgroundColor: getColor(d.provider, 'border'),
}));
new Chart(document.getElementById('radarChart'), {
  type: 'radar',
  data: { labels: radarLabels, datasets: radarChartDatasets },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#94a3b8' } } },
    scales: { r: { ticks: { display: false }, grid: { color: '#334155' }, pointLabels: { color: '#94a3b8' } } },
  },
});

// Long-running session time series
const lrResults = REPORT.results.filter(r => r.scenarioName === 'long-running-session');
if (lrResults.length > 0) {
  const lrDatasets = lrResults.map(r => {
    const samples = r.rawSamples.filter(s => s.name === 'page_load').map((s, i) => ({ x: i + 1, y: s.value }));
    return {
      label: r.providerName,
      data: samples,
      borderColor: getColor(r.providerName, 'border'),
      backgroundColor: getColor(r.providerName, 'bg'),
      tension: 0.3,
      fill: false,
    };
  });
  new Chart(document.getElementById('timeSeriesChart'), {
    type: 'line',
    data: { datasets: lrDatasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#94a3b8' } } },
      scales: {
        x: { type: 'linear', title: { display: true, text: 'Navigation #', color: '#94a3b8' }, ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
        y: { title: { display: true, text: 'Load Time (ms)', color: '#94a3b8' }, ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
      },
    },
  });
}

// System resource charts
function buildSystemChart(canvasId, field, label, unit) {
  const datasets = [];
  REPORT.results.forEach(r => {
    if (r.systemSnapshots.length === 0) return;
    // Deduplicate by provider — only first result per provider
    if (datasets.find(d => d.label === r.providerName)) return;
    const data = r.systemSnapshots.map((s, i) => ({ x: i, y: s[field] }));
    datasets.push({
      label: r.providerName,
      data,
      borderColor: getColor(r.providerName, 'border'),
      backgroundColor: 'transparent',
      tension: 0.3,
    });
  });
  if (datasets.length > 0) {
    new Chart(document.getElementById(canvasId), {
      type: 'line',
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#94a3b8' } } },
        scales: {
          x: { type: 'linear', title: { display: true, text: 'Sample', color: '#94a3b8' }, ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
          y: { title: { display: true, text: unit, color: '#94a3b8' }, ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
        },
      },
    });
  }
}
buildSystemChart('cpuChart', 'cpuUsagePercent', 'CPU', '%');
buildSystemChart('memoryChart', 'memoryUsageMb', 'Memory', 'MB');

// Detailed tables
const tablesDiv = document.getElementById('detailedTables');
scenarios.forEach(scenario => {
  const results = REPORT.results.filter(r => r.scenarioName === scenario);
  const allMetrics = new Set();
  results.forEach(r => Object.keys(r.metrics).forEach(m => allMetrics.add(m)));
  const displayMetrics = [...allMetrics];

  let html = '<div class="card"><h3>' + scenario + '</h3><table><thead><tr><th>Metric</th>';
  providers.forEach(p => { html += '<th>' + p + ' (median)</th><th>' + p + ' (p95)</th><th>' + p + ' (stdDev)</th>'; });
  html += '<th>Winner</th></tr></thead><tbody>';

  displayMetrics.forEach(metric => {
    html += '<tr><td>' + metric + '</td>';
    const medians = {};
    providers.forEach(p => {
      const r = results.find(r => r.providerName === p);
      const s = r && r.metrics[metric];
      if (s && s.count > 0) {
        medians[p] = s.median;
        html += '<td>' + s.median.toFixed(2) + '</td><td>' + s.p95.toFixed(2) + '</td><td>' + s.stdDev.toFixed(2) + '</td>';
      } else {
        html += '<td>—</td><td>—</td><td>—</td>';
      }
    });
    const isHigherBetter = metric === 'concurrent_throughput';
    const entries = Object.entries(medians).filter(([,v]) => v > 0);
    let winner = '—';
    if (entries.length >= 2) {
      entries.sort((a, b) => isHigherBetter ? b[1] - a[1] : a[1] - b[1]);
      winner = entries[0][0];
    }
    html += '<td class="' + (winner !== '—' ? 'winner' : '') + '">' + winner + '</td></tr>';
  });

  html += '</tbody></table></div>';
  tablesDiv.innerHTML += html;
});

function toggleCollapsible(el) {
  el.classList.toggle('open');
  el.nextElementSibling.classList.toggle('open');
}
</script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
