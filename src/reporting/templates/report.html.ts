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
  .tie { color: #fbbf24; font-weight: 600; }
  .teardown { color: #94a3b8; font-style: italic; }
  .collapsible { cursor: pointer; user-select: none; }
  .collapsible::before { content: '\\25B8 '; }
  .collapsible.open::before { content: '\\25BE '; }
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
<p class="meta">Run: ${report.runId} &bull; ${report.timestamp} &bull; Duration: ${(report.duration / 1000).toFixed(1)}s &bull; Iterations: ${report.config.iterations} (warmup: ${report.config.warmupIterations}) &bull; Mode: ${report.config.mode === 'default' ? 'Default (out-of-the-box)' : 'Raw (features disabled, region-matched)'}</p>

<div class="provider-colors" id="legend"></div>

<div class="card" id="featureMatrixCard" style="margin-bottom:1.5rem;"></div>

<h2>Per-Scenario Comparison</h2>
<div class="grid" id="scenarioCharts"></div>

<h2>Session Startup Breakdown</h2>
<div class="card">
  <div class="chart-container"><canvas id="startupBreakdownChart"></canvas></div>
</div>

<h2>Provider Reliability</h2>
<div class="card">
  <div class="chart-container"><canvas id="reliabilityChart"></canvas></div>
</div>

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

const HIGHER_IS_BETTER = new Set(['concurrent_throughput', 'extraction_throughput']);
const TEARDOWN_METRICS = new Set(['session_teardown']);

function getColor(provider, type) {
  const c = PROVIDER_COLORS[provider] || { bg: 'rgba(251, 191, 36, 0.7)', border: '#fbbf24' };
  return type === 'bg' ? c.bg : c.border;
}

// Error bar plugin
const errorBarPlugin = {
  id: 'errorBars',
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    chart.data.datasets.forEach((dataset, datasetIndex) => {
      if (!dataset.ciLower || !dataset.ciUpper) return;
      const meta = chart.getDatasetMeta(datasetIndex);
      meta.data.forEach((bar, index) => {
        const ciLow = dataset.ciLower[index];
        const ciHigh = dataset.ciUpper[index];
        if (ciLow == null || ciHigh == null || ciLow === ciHigh) return;

        const x = bar.x;
        const yScale = chart.scales.y;
        const yLow = yScale.getPixelForValue(ciLow);
        const yHigh = yScale.getPixelForValue(ciHigh);
        const capWidth = 6;

        ctx.save();
        ctx.strokeStyle = dataset.borderColor || '#fff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        // Vertical line
        ctx.moveTo(x, yLow);
        ctx.lineTo(x, yHigh);
        // Top cap
        ctx.moveTo(x - capWidth, yHigh);
        ctx.lineTo(x + capWidth, yHigh);
        // Bottom cap
        ctx.moveTo(x - capWidth, yLow);
        ctx.lineTo(x + capWidth, yLow);
        ctx.stroke();
        ctx.restore();
      });
    });
  },
};
Chart.register(errorBarPlugin);

// Render legend
const legend = document.getElementById('legend');
REPORT.config.providers.forEach(p => {
  const item = document.createElement('div');
  item.className = 'legend-item';
  item.innerHTML = '<div class="legend-dot" style="background:' + getColor(p, 'border') + '"></div>' + p;
  legend.appendChild(item);
});

// Feature matrix
(function buildFeatureMatrix() {
  const features = REPORT.providerFeatures;
  if (!features || Object.keys(features).length === 0) {
    document.getElementById('featureMatrixCard').style.display = 'none';
    return;
  }
  const featureLabels = [
    { key: 'sessionRecording', label: 'Session Recording' },
    { key: 'captchaSolving', label: 'CAPTCHA Solving' },
    { key: 'sessionLogging', label: 'Session Logging' },
    { key: 'advancedStealth', label: 'Advanced Stealth' },
    { key: 'adBlocking', label: 'Ad Blocking' },
    { key: 'proxy', label: 'Proxy' },
  ];
  let html = '<h3>Active Features (this run)</h3><table><thead><tr><th>Feature</th>';
  providers.forEach(p => { html += '<th>' + p + '</th>'; });
  html += '</tr></thead><tbody>';
  featureLabels.forEach(f => {
    html += '<tr><td>' + f.label + '</td>';
    providers.forEach(p => {
      const val = features[p] && features[p][f.key];
      html += '<td style="color:' + (val ? '#4ade80' : '#64748b') + '">' + (val ? 'ON' : 'off') + '</td>';
    });
    html += '</tr>';
  });
  html += '</tbody></table>';
  document.getElementById('featureMatrixCard').innerHTML = html;
})();

// Group results by scenario
const scenarios = [...new Set(REPORT.results.map(r => r.scenarioName))];
const providers = REPORT.config.providers;

// Per-scenario bar charts with error bars
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
      ciLower: displayMetrics.map(m => result && result.metrics[m] ? result.metrics[m].ciLower : 0),
      ciUpper: displayMetrics.map(m => result && result.metrics[m] ? result.metrics[m].ciUpper : 0),
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

// Session Startup Breakdown (stacked bar)
const startupMetrics = ['platform_api_time', 'cdp_connect_time', 'context_init_time'];
const startupColors = {
  platform_api_time: { bg: 'rgba(248, 113, 113, 0.7)', border: '#f87171' },
  cdp_connect_time: { bg: 'rgba(96, 165, 250, 0.7)', border: '#60a5fa' },
  context_init_time: { bg: 'rgba(74, 222, 128, 0.7)', border: '#4ade80' },
};
const startupLabels = ['Platform API', 'CDP Connect', 'Context Init'];

(function buildStartupChart() {
  // Find results that have startup sub-metrics
  const resultsWithStartup = REPORT.results.filter(r =>
    startupMetrics.some(m => r.metrics[m] && r.metrics[m].count > 0)
  );
  if (resultsWithStartup.length === 0) return;

  // Group by provider (aggregate across scenarios)
  const providerLabels = [...new Set(resultsWithStartup.map(r => r.providerName))];

  const datasets = startupMetrics.map((metric, i) => ({
    label: startupLabels[i],
    data: providerLabels.map(p => {
      const results = resultsWithStartup.filter(r => r.providerName === p);
      const vals = results.map(r => r.metrics[metric] ? r.metrics[metric].median : 0).filter(v => v > 0);
      return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    }),
    backgroundColor: startupColors[metric].bg,
    borderColor: startupColors[metric].border,
    borderWidth: 1,
  }));

  new Chart(document.getElementById('startupBreakdownChart'), {
    type: 'bar',
    data: { labels: providerLabels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#94a3b8' } } },
      scales: {
        x: { stacked: true, ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
        y: { stacked: true, ticks: { color: '#94a3b8' }, grid: { color: '#334155' }, title: { display: true, text: 'ms', color: '#94a3b8' } },
      },
    },
  });
})();

// Provider Reliability chart
(function buildReliabilityChart() {
  const scenarioLabels = [...new Set(REPORT.results.map(r => r.scenarioName))];

  const datasets = providers.map(provider => ({
    label: provider,
    data: scenarioLabels.map(s => {
      const result = REPORT.results.find(r => r.scenarioName === s && r.providerName === provider);
      return result ? (result.successRate * 100) : 0;
    }),
    backgroundColor: getColor(provider, 'bg'),
    borderColor: getColor(provider, 'border'),
    borderWidth: 1,
  }));

  new Chart(document.getElementById('reliabilityChart'), {
    type: 'bar',
    data: { labels: scenarioLabels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#94a3b8' } } },
      scales: {
        x: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { color: '#334155' } },
        y: { min: 0, max: 100, ticks: { color: '#94a3b8', callback: v => v + '%' }, grid: { color: '#334155' }, title: { display: true, text: 'Success Rate', color: '#94a3b8' } },
      },
    },
  });
})();

// Radar chart
const radarMetrics = ['session_startup', 'page_load', 'time_to_first_byte', 'interaction_latency', 'total_iteration'];
const radarLabels = radarMetrics.map(m => m.replace(/_/g, ' '));
const radarDatasets = providers.map(provider => {
  const values = radarMetrics.map(metric => {
    const allValues = REPORT.results
      .filter(r => r.providerName === provider && r.metrics[metric])
      .map(r => r.metrics[metric].median);
    return allValues.length > 0 ? allValues.reduce((a, b) => a + b, 0) / allValues.length : 0;
  });
  return { provider, values };
});
const maxPerMetric = radarMetrics.map((_, i) => Math.max(...radarDatasets.map(d => d.values[i]), 1));
const radarChartDatasets = radarDatasets.map(d => ({
  label: d.provider,
  data: d.values.map((v, i) => 1 - v / maxPerMetric[i]),
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

// Welch's t-test for significance in HTML tables
function welchTTest(aVals, bVals) {
  if (aVals.length < 2 || bVals.length < 2) return { significant: false, label: 'n/a' };
  const meanA = aVals.reduce((s,v) => s+v, 0) / aVals.length;
  const meanB = bVals.reduce((s,v) => s+v, 0) / bVals.length;
  const varA = aVals.reduce((s,v) => s + (v-meanA)**2, 0) / (aVals.length - 1);
  const varB = bVals.reduce((s,v) => s + (v-meanB)**2, 0) / (bVals.length - 1);
  const seA = varA / aVals.length;
  const seB = varB / bVals.length;
  const se = Math.sqrt(seA + seB);
  if (se === 0) return { significant: false, label: 'n.s.' };
  const t = Math.abs(meanA - meanB) / se;
  const dfNum = (seA + seB) ** 2;
  const dfDen = seA**2 / (aVals.length-1) + seB**2 / (bVals.length-1);
  const df = dfDen > 0 ? dfNum / dfDen : aVals.length + bVals.length - 2;
  // Approximate critical value
  const tCrit = df > 30 ? 1.96 : (df > 10 ? 2.228 : (df > 5 ? 2.571 : 3.182));
  const sig = t > tCrit;
  return { significant: sig, label: sig ? 'p<.05' : 'n.s.' };
}

// Detailed tables with significance column
const tablesDiv = document.getElementById('detailedTables');
scenarios.forEach(scenario => {
  const results = REPORT.results.filter(r => r.scenarioName === scenario);
  const allMetrics = new Set();
  results.forEach(r => Object.keys(r.metrics).forEach(m => allMetrics.add(m)));
  const displayMetrics = [...allMetrics];

  let html = '<div class="card"><h3>' + scenario + '</h3>';

  // Reliability row
  html += '<p style="font-size:0.8rem;color:#94a3b8;margin-bottom:0.5rem;">Reliability: ';
  providers.forEach(p => {
    const r = results.find(r => r.providerName === p);
    const rate = r ? (r.successRate * 100).toFixed(0) : '0';
    const color = r && r.successRate >= 1 ? '#4ade80' : (r && r.successRate >= 0.8 ? '#fbbf24' : '#f87171');
    html += '<span style="color:' + color + '">' + p + ': ' + rate + '%</span> ';
  });
  html += '</p>';

  html += '<table><thead><tr><th>Metric</th>';
  providers.forEach(p => { html += '<th>' + p + ' (median [CI])</th><th>' + p + ' (p95)</th><th>' + p + ' (stdDev)</th>'; });
  html += '<th>Winner</th><th>Sig.</th></tr></thead><tbody>';

  displayMetrics.forEach(metric => {
    const isTeardown = TEARDOWN_METRICS.has(metric);
    html += '<tr><td>' + metric + (isTeardown ? ' *' : '') + '</td>';
    const medians = {};
    const rawVals = {};
    providers.forEach(p => {
      const r = results.find(r => r.providerName === p);
      const s = r && r.metrics[metric];
      if (s && s.count > 0) {
        medians[p] = s.median;
        rawVals[p] = r.rawSamples.filter(x => x.name === metric).map(x => x.value);
        const ciStr = s.ciLower !== s.ciUpper ? ' [' + s.ciLower.toFixed(0) + '-' + s.ciUpper.toFixed(0) + ']' : '';
        html += '<td>' + s.median.toFixed(2) + ciStr + '</td><td>' + s.p95.toFixed(2) + '</td><td>' + s.stdDev.toFixed(2) + '</td>';
      } else {
        html += '<td>\\u2014</td><td>\\u2014</td><td>\\u2014</td>';
      }
    });
    const isHigherBetter = HIGHER_IS_BETTER.has(metric);
    const entries = Object.entries(medians).filter(([,v]) => v > 0);
    let winner = '\\u2014';
    let sigLabel = '\\u2014';
    let winnerClass = '';
    if (entries.length >= 2) {
      entries.sort((a, b) => isHigherBetter ? b[1] - a[1] : a[1] - b[1]);
      const bestP = entries[0][0];
      const secondP = entries[1][0];
      const sigResult = welchTTest(rawVals[bestP] || [], rawVals[secondP] || []);
      if (sigResult.significant) {
        winner = bestP;
        winnerClass = isTeardown ? 'teardown' : 'winner';
        sigLabel = sigResult.label;
      } else {
        winner = 'tie';
        winnerClass = 'tie';
        sigLabel = sigResult.label;
      }
    }
    html += '<td class="' + winnerClass + '">' + winner + '</td>';
    html += '<td>' + sigLabel + '</td></tr>';
  });

  html += '</tbody></table>';
  if (displayMetrics.some(m => TEARDOWN_METRICS.has(m))) {
    html += '<p style="font-size:0.7rem;color:#64748b;">* Teardown is non-comparable (different shutdown mechanisms). Excluded from winner tally.</p>';
  }
  html += '</div>';
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
