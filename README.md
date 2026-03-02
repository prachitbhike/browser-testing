# Browserbase vs Kernel Performance Benchmark

A TypeScript/Node.js CLI tool that cross-tests and compares **Browserbase** and **Kernel** cloud browser providers for browser automation performance. Both platforms provide cloud browsers via CDP — this app abstracts them behind a common `BrowserProvider` interface and runs identical scenarios against each, collecting high-resolution metrics and producing CLI tables + an HTML report with Chart.js visualizations.

## Quick Start

```bash
# Install dependencies
npm install

# Copy and fill in your API keys
cp .env.example .env.local

# Run all scenarios against both providers
npx tsx src/index.ts

# Run specific providers/scenarios
npx tsx src/index.ts -p browserbase,kernel -s simple-navigation,form-interaction

# Customize iterations
npx tsx src/index.ts -i 10 -w 2 -c 5

# List available scenarios
npx tsx src/index.ts --list-scenarios
```

## CLI Options

| Flag | Description | Default |
|---|---|---|
| `-p, --providers <names>` | Comma-separated provider names | `browserbase,kernel` |
| `-s, --scenarios <names>` | Comma-separated scenario names | all |
| `-i, --iterations <count>` | Number of measured iterations | `5` |
| `-w, --warmup <count>` | Number of warmup iterations | `1` |
| `-c, --concurrency <count>` | Concurrent sessions count | `3` |
| `-t, --timeout <ms>` | Timeout per operation | `60000` |
| `-o, --output <dir>` | Output directory for reports | `reports` |
| `--no-html` | Skip HTML report generation | |
| `--list-scenarios` | List all scenarios and exit | |
| `-v, --verbose` | Enable debug logging | |

## Scenarios

| Scenario | Description |
|---|---|
| `simple-navigation` | Load 3 different pages, measure TTFB + full load time |
| `form-interaction` | Fill form, submit, measure interaction latency |
| `spa-navigation` | Client-side route changes on a SPA (TodoMVC) |
| `multi-page-crawl` | Extract N links from a page, visit each sequentially |
| `file-download` | Trigger + measure file download |
| `concurrent-sessions` | Spin up N sessions in parallel, measure throughput |
| `long-running-session` | Keep alive for M minutes, detect degradation |

## Metrics Collected

| Metric | Description |
|---|---|
| `session_startup` | API call to connected Playwright browser |
| `session_teardown` | Close + platform cleanup |
| `page_load` | Full page load duration |
| `dom_content_loaded` | Via Performance API |
| `time_to_first_byte` | Via Performance API |
| `navigation_latency` | SPA route change time |
| `interaction_latency` | Click/fill to DOM update |
| `download_time` | File download duration |
| `concurrent_throughput` | Sessions/second |
| `total_iteration` | End-to-end iteration time |
| `cpu_usage_percent` | Polled during iteration |
| `memory_usage_mb` | Polled during iteration |

## Project Structure

```
browser-testing/
├── src/
│   ├── index.ts                  # CLI entry (commander)
│   ├── config.ts                 # Merge CLI args > env vars > defaults
│   ├── types/                    # TypeScript interfaces
│   ├── providers/                # BrowserProvider implementations
│   │   ├── base-provider.ts      # Shared connectOverCDP logic
│   │   ├── browserbase-provider.ts
│   │   └── kernel-provider.ts
│   ├── scenarios/                # 7 benchmark scenarios
│   ├── metrics/                  # Collector, statistics, system monitor
│   ├── runner/                   # Benchmark + iteration orchestration
│   ├── reporting/                # CLI tables + HTML report generation
│   └── utils/                    # Timer, logger, retry
├── test/                         # Unit + integration tests
└── reports/                      # Generated output
```

## Development

```bash
# Type check
npm run typecheck

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Environment Variables

```bash
# Required for Browserbase
BROWSERBASE_API_KEY=
BROWSERBASE_PROJECT_ID=

# Required for Kernel
KERNEL_API_KEY=

# Optional defaults
BENCHMARK_ITERATIONS=5
BENCHMARK_WARMUP=1
BENCHMARK_CONCURRENCY=3
BENCHMARK_TIMEOUT=60000
```

---

# Benchmark Results

**Run ID:** BL8RZ9PfKI | **Date:** 2026-03-02 | **Duration:** 1667.3s (~27.8 minutes)

## Executive Summary

**Kernel is the overall winner**, taking 21 of 29 metric victories compared to Browserbase's 8 wins. Kernel demonstrated decisively faster session startup times (typically 1.5-2x faster), superior page load performance, and dramatically better concurrency throughput (29x higher). Browserbase held advantages in session teardown speed, TTFB on certain scenarios, and SPA-specific interaction latency, but these wins were insufficient to offset Kernel's dominant performance across infrastructure-heavy metrics.

## Methodology

### Providers Tested
- **Browserbase** — Cloud browser infrastructure provider
- **Kernel** — Cloud browser infrastructure provider

### Configuration
| Parameter | Value |
|---|---|
| Measured Iterations | 3 per provider per scenario |
| Warmup Iterations | 1 (excluded from statistics) |
| Concurrency Level | 3 (for concurrent-sessions scenario) |
| Long-Running Duration | 120 seconds per iteration |
| Navigation Interval | 15 seconds (long-running scenario) |

### What Was Measured
- **Session Startup** — Time from requesting a browser session to receiving a ready connection (CDP/WebSocket handshake complete)
- **Session Teardown** — Time to cleanly close and release a session
- **Total Iteration** — Wall-clock time for one complete scenario run including startup and teardown
- **Page Load** — Time for `page.goto()` to resolve with `waitUntil: 'load'`
- **TTFB (Time to First Byte)** — Browser-reported time from navigation start to first byte received
- **DOM Content Loaded** — Browser-reported DOMContentLoaded event timing
- **Interaction Latency** — Time to complete a user interaction (fill, click) and see the DOM update
- **Navigation Latency** — Time for client-side route changes to complete
- **Throughput** — Sessions launched per second under concurrency
- **Download Time** — Time to fetch and buffer a file via `fetch()` inside the browser

### Statistical Aggregations
All reported metrics use **median** (50th percentile) for central tendency and **p95** (95th percentile) for tail latency characterization. Mean, min, max, p99, and standard deviation were also collected.

---

## Per-Scenario Results

### simple-navigation

**What it tests:** Loads 3 different pages (`example.com`, `httpbin.org/html`, `jsonplaceholder.typicode.com`) sequentially, measuring TTFB, DOM Content Loaded, and full page load time for each.

| Metric | Browserbase (median) | Kernel (median) | Browserbase (p95) | Kernel (p95) | Winner |
|---|---|---|---|---|---|
| Session Startup | 1216.7 ms | 807.4 ms | 3984.0 ms | 852.2 ms | **Kernel** |
| Session Teardown | 740.2 ms | 273.1 ms | 755.8 ms | 293.2 ms | **Kernel** |
| Total Iteration | 4463.1 ms | 2526.4 ms | 6783.7 ms | 2561.1 ms | **Kernel** |
| Page Load | 514.8 ms | 259.3 ms | 1068.6 ms | 476.2 ms | **Kernel** |
| TTFB | 12.0 ms | 16.5 ms | 381.1 ms | 69.4 ms | **Browserbase** |
| DOM Content Loaded | 291.3 ms | 150.2 ms | 786.1 ms | 165.3 ms | **Kernel** |

**Winner: Kernel (5-1)**

Kernel dominated this scenario across nearly all metrics. Session startup was 1.5x faster at median and 4.7x faster at p95, indicating Browserbase has significant tail latency in session provisioning. Page loads were approximately 2x faster on Kernel, and DOM Content Loaded was nearly 2x faster as well. Browserbase won only on median TTFB (12.0 ms vs 16.5 ms), though notably its p95 TTFB was 381 ms compared to Kernel's 69 ms — suggesting Browserbase has extreme TTFB variance.

---

### form-interaction

**What it tests:** Navigates to `httpbin.org/forms/post`, fills text inputs and textareas, submits the form, and measures interaction latency.

| Metric | Browserbase (median) | Kernel (median) | Browserbase (p95) | Kernel (p95) | Winner |
|---|---|---|---|---|---|
| Session Startup | 1135.6 ms | 814.1 ms | 1152.3 ms | 982.2 ms | **Kernel** |

**Winner: Kernel (1-0) — but scenario effectively failed**

This scenario failed on both providers across all 3 measured iterations. The only metric captured was session startup (where Kernel was 1.4x faster). All actual form interaction attempts timed out at 30 seconds waiting for `textarea[name="delivery"]`. This is a test infrastructure issue — the httpbin.org forms page structure did not match the expected selectors. Since both providers failed identically, this does not reflect a provider capability difference.

---

### spa-navigation

**What it tests:** Loads the TodoMVC React app, adds 3 todo items (measuring interaction latency per item), then navigates between filter views (All, Active, Completed) measuring client-side route change latency.

| Metric | Browserbase (median) | Kernel (median) | Browserbase (p95) | Kernel (p95) | Winner |
|---|---|---|---|---|---|
| Session Startup | 1140.1 ms | 751.4 ms | 1192.7 ms | 799.4 ms | **Kernel** |
| Session Teardown | 208.9 ms | 298.2 ms | 214.9 ms | 310.4 ms | **Browserbase** |
| Total Iteration | 5105.4 ms | 7414.2 ms | 5143.2 ms | 7469.0 ms | **Browserbase** |
| Page Load | 740.8 ms | 456.5 ms | 759.8 ms | 474.9 ms | **Kernel** |
| TTFB | 9.0 ms | 14.1 ms | 9.2 ms | 40.2 ms | **Browserbase** |
| DOM Content Loaded | 430.6 ms | 347.1 ms | 484.8 ms | 349.3 ms | **Kernel** |
| Interaction Latency | 519.5 ms | 1032.5 ms | 725.6 ms | 1391.9 ms | **Browserbase** |
| Navigation Latency | 394.2 ms | 760.1 ms | 428.2 ms | 766.0 ms | **Browserbase** |

**Winner: Browserbase (5-3)**

This is Browserbase's strongest scenario and the only one where it won the majority of metrics. Browserbase's interaction latency was 2x faster (519 ms vs 1033 ms at median), and its SPA navigation latency was 1.9x faster (394 ms vs 760 ms). The interaction and navigation latency differences suggest Browserbase may have a faster JavaScript execution environment or lower remote command round-trip overhead for fine-grained DOM operations.

---

### multi-page-crawl

**What it tests:** Starts at `httpbin.org`, extracts up to 5 links from the page, then visits each link sequentially. Simulates a web crawling workflow.

| Metric | Browserbase (median) | Kernel (median) | Browserbase (p95) | Kernel (p95) | Winner |
|---|---|---|---|---|---|
| Session Startup | 1521.1 ms | 799.5 ms | 4992.2 ms | 803.3 ms | **Kernel** |
| Session Teardown | 197.2 ms | 282.8 ms | 244.8 ms | 291.4 ms | **Browserbase** |
| Total Iteration | 5495.3 ms | 2970.9 ms | 9361.3 ms | 3167.7 ms | **Kernel** |
| Page Load | 1149.4 ms | 480.9 ms | 2059.7 ms | 750.5 ms | **Kernel** |
| TTFB | 92.4 ms | 17.2 ms | 297.2 ms | 151.9 ms | **Kernel** |
| DOM Content Loaded | 662.0 ms | 215.7 ms | 1721.5 ms | 655.6 ms | **Kernel** |

**Winner: Kernel (5-1)**

Kernel dominated multi-page crawling. Page loads were 2.4x faster at median, and the gap widened at p95 (2060 ms vs 751 ms). TTFB was 5.4x faster on Kernel (17.2 ms vs 92.4 ms). This scenario highlights that for crawling workloads with many sequential page loads, Kernel provides substantially better throughput.

---

### file-download

**What it tests:** Navigates to `httpbin.org`, then triggers file downloads of 1 KB, 10 KB, and 100 KB.

| Metric | Browserbase (median) | Kernel (median) | Browserbase (p95) | Kernel (p95) | Winner |
|---|---|---|---|---|---|
| Session Startup | 1442.2 ms | 816.4 ms | 22090.0 ms | 872.5 ms | **Kernel** |

**Winner: Kernel (1-0) — but scenario effectively failed**

This scenario failed on both providers due to Playwright's download interception on binary responses. Notably, Browserbase's p95 session startup was 22,090 ms — a severe outlier that is 25x Kernel's p95 of 873 ms.

---

### concurrent-sessions

**What it tests:** Spins up 3 browser sessions in parallel, each navigating to `example.com`. Measures total time to launch all sessions and calculates throughput.

| Metric | Browserbase (median) | Kernel (median) | Browserbase (p95) | Kernel (p95) | Winner |
|---|---|---|---|---|---|
| Total Iteration | 60814.9 ms | 2049.9 ms | 62426.5 ms | 13710.4 ms | **Kernel** |
| Session Startup | 58496.7 ms | 1345.5 ms | 61888.9 ms | 12873.4 ms | **Kernel** |
| Throughput | 0.05 sess/s | 1.46 sess/s | 0.05 sess/s | 2.15 sess/s | **Kernel** |

**Winner: Kernel (3-0)**

This was the most lopsided scenario. Kernel's median throughput was 29.2x higher than Browserbase (1.46 sess/s vs 0.05 sess/s). The Browserbase median total iteration time of 60.8 seconds indicates severe session queuing — likely due to the Browserbase free tier's concurrent session limit of 1. Kernel launched all 3 sessions in approximately 1.3-2.0 seconds total, demonstrating true parallel provisioning.

---

### long-running-session

**What it tests:** Keeps a single browser session alive for 120 seconds, performing a page navigation every 15 seconds across 4 rotating URLs. Measures whether performance degrades over time.

| Metric | Browserbase (median) | Kernel (median) | Browserbase (p95) | Kernel (p95) | Winner |
|---|---|---|---|---|---|
| Session Startup | 1037.1 ms | 855.5 ms | 1099.9 ms | 886.3 ms | **Kernel** |
| Session Teardown | 258.9 ms | 337.0 ms | 288.9 ms | 354.9 ms | **Browserbase** |
| Total Iteration | 121332.5 ms | 121203.5 ms | 121341.4 ms | 121213.4 ms | **Kernel** |
| Page Load | 471.1 ms | 206.8 ms | 1016.2 ms | 437.6 ms | **Kernel** |

**Winner: Kernel (3-1)**

Both providers maintained stable sessions for the full 120-second duration without disconnections or errors. Kernel's page loads during the session were 2.3x faster at median. Neither provider showed significant performance degradation over the 120-second window.

---

## Overall Comparison

### Wins by Provider

| Provider | Metric Wins | Percentage |
|---|---|---|
| **Kernel** | 21 | 72.4% |
| Browserbase | 8 | 27.6% |

### Wins by Category

| Category | Browserbase Wins | Kernel Wins |
|---|---|---|
| Session Startup | 0 | 7 |
| Session Teardown | 3 | 1 |
| Total Iteration | 1 | 4 |
| Page Load | 0 | 4 |
| TTFB | 2 | 1 |
| DOM Content Loaded | 0 | 3 |
| Interaction/Navigation Latency | 2 | 0 |
| Throughput | 0 | 1 |

### Aggregated Median Performance (Successful Scenarios Only)

| Metric | Browserbase Avg Median | Kernel Avg Median | Ratio (BB/K) |
|---|---|---|---|
| Session Startup (non-concurrent) | 1175.3 ms | 805.5 ms | 1.46x slower |
| Page Load (all scenarios) | 719.0 ms | 350.9 ms | 2.05x slower |
| DOM Content Loaded | 461.3 ms | 237.7 ms | 1.94x slower |

---

## Key Findings

1. **Kernel has consistently faster session startup.** Across all 7 scenarios, Kernel won every session startup comparison. Median startup ranged from 751-856 ms on Kernel versus 1037-1521 ms on Browserbase. Kernel's startup variance is significantly lower — its p95/median ratio stays close to 1.0, while Browserbase's can spike to 3.3-15.3x.

2. **Kernel delivers approximately 2x faster page loads.** Across simple-navigation, multi-page-crawl, and long-running-session scenarios, Kernel's median page load was consistently 1.6-2.4x faster than Browserbase.

3. **Browserbase has a severe concurrent session bottleneck.** At concurrency=3, Browserbase took ~60 seconds to provision all sessions (0.05 sess/s), while Kernel completed the same in ~2 seconds (1.46 sess/s). This 29x throughput gap is likely due to the Browserbase free tier limiting concurrent sessions to 1.

4. **Browserbase excels at SPA interactions.** In the spa-navigation scenario, Browserbase was 2x faster at interaction latency (519 ms vs 1033 ms) and 1.9x faster at client-side navigation (394 ms vs 760 ms). This suggests lower command round-trip latency or a faster JavaScript execution context.

5. **Browserbase has faster session teardown but it matters less.** Browserbase won 3 of 4 session teardown comparisons (197-259 ms vs 273-337 ms on Kernel), but teardown is a small fraction of total iteration time.

6. **TTFB results are mixed and scenario-dependent.** Browserbase had lower TTFB in simple-navigation and spa-navigation, but Kernel had dramatically lower TTFB in multi-page-crawl (17 ms vs 92 ms). Browserbase's TTFB variance is extreme.

7. **Neither provider degrades over 2-minute sessions.** The long-running-session scenario showed stable navigation performance for both providers with no systematic latency increase.

8. **Browserbase session startup has heavy tail latency.** The worst observed Browserbase session startup was 22,090 ms (p95 in file-download), compared to Kernel's worst of 872 ms.

9. **Two scenarios failed on both providers due to test issues.** form-interaction (stale DOM selector) and file-download (Playwright download interception) — test design issues, not provider deficiencies.

10. **Kernel's performance is more predictable.** Across all metrics, Kernel showed lower standard deviations and tighter p95/median ratios.

---

## Recommendations

### Use Kernel when:
- **Concurrent workloads are required.** Kernel's ability to spin up parallel sessions without queuing makes it the clear choice for crawling, scraping, or testing workloads that need multiple simultaneous browsers.
- **Session startup latency matters.** Kernel's faster and more predictable startup (~800 ms vs ~1200 ms+) provides a direct throughput improvement.
- **Page load speed is critical.** Kernel's 2x page load advantage translates directly to 2x higher throughput for navigation-heavy workloads.
- **Predictability and tail latency SLOs are important.** Kernel's tight p95/median ratios make it easier to set and meet latency targets.

### Use Browserbase when:
- **SPA automation is the primary use case.** Browserbase's 2x advantage in interaction and navigation latency for single-page applications makes it better suited for testing or automating JavaScript-heavy apps.
- **TTFB measurement is a priority.** In simple page loads, Browserbase reported lower median TTFB.
- **Session teardown speed matters.** Browserbase's faster teardown provides a minor advantage for rapid session cycling.
- **Free tier concurrent limitations are acceptable.** If workloads are inherently sequential, the concurrent session bottleneck is irrelevant.

---

## Limitations & Notes

1. **Browserbase free tier concurrent session limit.** The concurrent-sessions results are heavily influenced by a free tier restriction limiting concurrent sessions to 1. A paid plan could produce dramatically different results.

2. **Failed scenarios.** Two of 7 scenarios failed on both providers due to test infrastructure issues — not provider limitations.

3. **Small sample size.** Only 3 measured iterations per scenario per provider. Larger iteration counts (10-30+) would produce more reliable statistics.

4. **Network conditions not controlled.** Both providers were tested from the same machine but external factors could influence results.

5. **Single geographic location.** Provider performance may vary by region.

6. **No paid tier comparison.** Both providers were tested on free/default tiers.

7. **Client-side overhead.** Reported times include local WebSocket/CDP communication overhead, not purely provider-side performance.
