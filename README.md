# Kernel vs Browserbase: Cloud Browser Performance Benchmark

An independent, statistically rigorous comparison of two cloud browser providers — [Kernel](https://onkernel.com) and [Browserbase](https://browserbase.com) — across 12 real-world scenarios with Welch's t-test significance testing.

> **Summary**: Kernel has faster session startup and CDP connection. In-browser execution (JavaScript, screenshots, DOM interaction) is statistically equivalent between the two. They differ in pricing, resource allocation, and built-in features — which trade-offs matter depends on your workload.

```
  Significance-tested wins (teardown excluded):

    Kernel            ██████████████████████████████████████  38 wins
    Browserbase       ██████                                   6 wins
    Statistical ties  ████████████████████████████████████████████████████████  56 ties
```

---

## Quick Decision Guide

| Your primary workload | What the data shows |
|:----------------------|:--------------------|
| **Web scraping / crawling** | Kernel starts sessions ~2x faster; extraction speed is a tie |
| **SPA testing / browser automation** | Interaction latency and SPA navigation are ties |
| **Screenshot / PDF generation** | Screenshot capture is a tie; page loads are a tie in most scenarios |
| **High-throughput session cycling** | Kernel starts sessions ~1,000 ms faster per session |
| **Data extraction pipelines** | Extraction speed and throughput are ties; Kernel starts sessions faster |
| **Long-running sessions** | Both stable over 120s with no degradation; no significant difference |
| **Need session recording / CAPTCHA solving** | Browserbase includes these features natively (disabled in this benchmark for fairness) |

---

## Pricing & Resource Allocation

These providers have different pricing models, resource allocation, and feature sets:

| | Kernel (Start-Up plan) | Browserbase (Startup plan) |
|:--|:-------|:---------------------------|
| **vCPUs per session** | 8 (fixed) | 2 (fixed) |
| **Headless price** | $0.06/hr | $0.10/hr |
| **Included hours** | $5 credit (~83 hrs) | 500 hrs/month |
| **Concurrency limit** | 50 | 100 |
| **Max session duration** | 72 hrs | 6 hrs |
| **Monthly base** | $200 | $99 |
| **Session recording** | No | Yes (built-in) |
| **CAPTCHA solving** | No | Yes (built-in) |
| **Session logging** | No | Yes (built-in) |
| **Stealth mode** | Yes | Yes (advanced) |
| **Proxy support** | Yes | Yes (with geolocation) |
| **GPU acceleration** | Yes (paid plans) | No |

Neither provider exposes vCPU or memory configuration — you get what the plan includes. The 8 vs 2 vCPU difference does not produce a measurable difference in this benchmark's workloads (see [Architecture](#architecture) section for why).

### Cost Per Task (Compute Only)

Because Kernel completes sessions faster (due to session startup speed), session durations are shorter. This affects per-task cost even beyond the per-hour rate difference:

| Workload | Kernel duration | Kernel cost | BB duration | BB cost |
|:---------|:---------------|:-----------|:------------|:--------|
| Web scraping (3 sites) | 2.9s | $0.000048 | 5.1s | $0.000142 |
| Screenshot (3 pages) | 7.9s | $0.000132 | 8.7s | $0.000242 |
| Data extraction (8 pages) | 4.6s | $0.000077 | 6.4s | $0.000178 |
| Form + submit + extract | 6.2s | $0.000104 | 7.0s | $0.000194 |
| Long-running (2 min) | 121.3s | $0.002022 | 122.3s | $0.003397 |

*Cost = session duration x per-second rate. These are compute costs only and do not include the monthly base fee or the value of built-in features (recording, CAPTCHA solving, logging) that Browserbase provides.*

---

## How We Tested

Both providers were configured to minimize overhead unique to each platform:

- **Kernel**: `headless: true` (disables GUI/VNC rendering overhead that Browserbase doesn't have)
- **Browserbase**: `logSession: false`, `recordSession: false`, `solveCaptchas: false` (disables I/O, video encoding, and CAPTCHA-solving overhead that Kernel doesn't have)
- **Region**: Both set to **US-East** (`us-east-1`). Kernel defaults to US-East; Browserbase is explicitly set to `us-east-1` (its default is `us-west-2`)
- **Viewport**: Both forced to 1920x1080 for identical rendering surfaces
- **10 measured iterations** per scenario per provider, **3 warmup** iterations discarded
- **Welch's t-test** (p < 0.05) determines statistical significance; if confidence intervals overlap, the comparison is a tie
- **95% confidence intervals** reported on all metrics
- Session teardown excluded from rankings (architecturally asymmetric: graceful release vs immediate deletion)
- **Paid plans** for both providers, same machine, same network

---

## Detailed Results

### Where Kernel Wins (38 metrics)

Kernel's wins are concentrated in session startup, CDP connection, and total iteration time.

| Metric | Kernel (median) | Browserbase (median) | Difference | Significant? |
|:-------|----------------:|---------------------:|:-----------|:-------------|
| **Session Startup** | | | | |
| simple-navigation | 846 ms | 1,739 ms | 2.1x | p < 0.05 |
| form-interaction | 791 ms | 1,838 ms | 2.3x | p < 0.05 |
| spa-navigation | 809 ms | 1,467 ms | 1.8x | p < 0.05 |
| multi-page-crawl | 849 ms | 1,797 ms | 2.1x | p < 0.05 |
| file-download | 804 ms | 1,876 ms | 2.3x | p < 0.05 |
| long-running-session | 913 ms | 1,848 ms | 2.0x | p < 0.05 |
| web-scraping | 826 ms | 1,923 ms | 2.3x | p < 0.05 |
| authenticated-workflow | 826 ms | 1,860 ms | 2.3x | p < 0.05 |
| screenshot-generation | 841 ms | 1,550 ms | 1.8x | p < 0.05 |
| javascript-heavy-page | 814 ms | 1,645 ms | 2.0x | p < 0.05 |
| data-extraction-pipeline | 835 ms | 1,913 ms | 2.3x | p < 0.05 |
| concurrent-sessions | 1,440 ms | 2,404 ms | 1.7x | p < 0.05 |
| **CDP Connect** | | | | |
| (all scenarios) | ~540-605 ms | ~1,035-1,654 ms | 1.8-3.0x | p < 0.05 |
| **Page Load** | | | | |
| web-scraping | 350 ms | 509 ms | 1.5x | p < 0.05 |
| screenshot-generation | 386 ms | 503 ms | 1.3x | p < 0.05 |
| **Total Iteration** | | | | |
| 9 of 12 scenarios | — | — | varies | p < 0.05 |

### Where Browserbase Wins (6 metrics)

Browserbase wins in context initialization and platform API response time in some scenarios:

| Metric | Browserbase (median) | Kernel (median) | Difference | Significant? |
|:-------|---------------------:|----------------:|:-----------|:-------------|
| **Context Init** | | | | |
| multi-page-crawl | 72 ms | 85 ms | 13 ms | p < 0.05 |
| file-download | 72 ms | 77 ms | 5 ms | p < 0.05 |
| web-scraping | 72 ms | 84 ms | 12 ms | p < 0.05 |
| **Platform API** | | | | |
| spa-navigation | 191 ms | 198 ms | 7 ms | p < 0.05 |
| long-running-session | 194 ms | 217 ms | 23 ms | p < 0.05 |
| authenticated-workflow | 193 ms | 206 ms | 13 ms | p < 0.05 |

### Statistical Ties (56 of 100 metrics)

The majority of comparisons showed no statistically significant difference, including all in-browser execution metrics:

| Metric | Scenario | Kernel | Browserbase | Verdict |
|:-------|:---------|-------:|------------:|:--------|
| **Interaction Latency** | spa-navigation | 1,094 ms | 1,012 ms | Tie |
| **Interaction Latency** | form-interaction | 2,174 ms | 1,960 ms | Tie |
| **Interaction Latency** | authenticated-workflow | 3,105 ms | 2,981 ms | Tie |
| **Navigation Latency** | spa-navigation | 733 ms | 730 ms | Tie |
| **Screenshot Time** | screenshot-generation | 1,068 ms | 930 ms | Tie |
| **Render Complete** | javascript-heavy-page | 292 ms | 236 ms | Tie |
| **Extraction Time** | web-scraping | 81 ms | 72 ms | Tie |
| **Extraction Time** | data-extraction-pipeline | 80 ms | 72 ms | Tie |
| **Extraction Time** | authenticated-workflow | 438 ms | 448 ms | Tie |
| **Download Time** | file-download | 231 ms | 236 ms | Tie |
| **Extract Throughput** | data-extraction-pipeline | 2.33 pg/s | 2.02 pg/s | Tie |
| **Throughput** | concurrent-sessions | 0.70 s/s | 0.58 s/s | Tie |
| **Page Load** | 8 of 12 scenarios | — | — | Tie |
| **Total Iteration** | long-running-session | 121,290 ms | 122,297 ms | Tie |

---

## Session Startup Breakdown

Session startup was decomposed into three phases:

```
Phase               Kernel        Browserbase     Result
───────────────     ─────────     ───────────     ──────────────
Platform API        ~190 ms       ~193 ms         Tie (most scenarios)
CDP Connect         ~560 ms       ~1,250 ms       Kernel 2.2x faster
Context Init        ~80 ms        ~72 ms          Browserbase ~10ms faster
───────────────     ─────────     ───────────     ──────────────
Total Startup       ~830 ms       ~1,750 ms       Kernel 2.1x faster
```

- **Platform API** (provisioning the remote session): Roughly equal. Browserbase is faster by ~10ms in some scenarios.
- **CDP Connect** (WebSocket to the browser): Kernel connects 2.2x faster. This is the dominant factor in the overall startup difference.
- **Context Init** (browser context/page setup + viewport): Browserbase is ~10ms faster on median but has higher variance (p95 up to 670ms vs Kernel's ~90ms).

---

## Architecture

The two providers use fundamentally different infrastructure, which explains the performance profile.

**Kernel** runs browsers on [unikernels](https://kernel.sh/docs/info/unikernels) — Unikraft-based, single-purpose virtual machines containing only the components needed to run Chrome. Key properties:

- Sub-20ms cold starts (per their documentation)
- Lower per-instance overhead, allowing more resource allocation (8 vCPUs) at a lower cost point
- Standby mode: idle browsers snapshot to disk and restore in milliseconds

**Browserbase** runs on more traditional infrastructure with a platform layer that provides built-in session recording, CAPTCHA solving, session logging, and observability tooling. These features add operational overhead but provide capabilities that Kernel does not offer natively.

**Why vCPUs don't affect in-browser results**: Neither provider exposes vCPU configuration — Kernel provides 8, Browserbase provides 2. Despite the 4x difference, all in-browser execution metrics (JavaScript, screenshots, DOM interaction, data extraction) are statistical ties. This is because Chrome's V8 JavaScript engine is primarily single-threaded, and the workloads in this benchmark — `page.evaluate()`, `page.click()`, `page.screenshot()` — do not saturate multiple cores. Both 2 vCPUs and 8 vCPUs are sufficient for typical single-tab automation. Workloads that would differentiate (GPU rendering, multi-tab parallel automation, WebAssembly) were not tested.

---

## Reliability

Both providers achieved **100% success rates** across all 12 scenarios (10/10 iterations each). Neither dropped a session, timed out on a page load, or produced an error during the benchmark.

| Scenario | Kernel | Browserbase |
|:---------|:------:|:-----------:|
| simple-navigation | 100% | 100% |
| form-interaction | 100% | 100% |
| spa-navigation | 100% | 100% |
| multi-page-crawl | 100% | 100% |
| file-download | 100% | 100% |
| concurrent-sessions | 100% | 100% |
| long-running-session | 100% | 100% |
| web-scraping | 100% | 100% |
| screenshot-generation | 100% | 100% |
| javascript-heavy-page | 100% | 100% |
| data-extraction-pipeline | 100% | 100% |
| authenticated-workflow | 100% | 100% |

---

## Tail Latency and Predictability

The p95/median ratio shows how much worse the "bad case" is compared to typical:

| Metric | Kernel p95/median | Browserbase p95/median |
|:-------|:-----------------:|:----------------------:|
| Session startup | ~1.07x | ~1.14x |
| CDP connect | ~1.10x | ~1.40x |
| Page load (simple) | 1.64x | 2.09x |
| Screenshot time | 2.07x | 2.02x |
| Interaction latency (SPA) | 1.38x | 1.39x |

Both providers are reasonably predictable. Kernel has tighter variance on infrastructure metrics (startup, CDP connect). Browserbase has tighter variance on screenshot time. Both are comparable on interaction latency.

---

## What This Benchmark Does NOT Cover

- **Built-in features in action** — Browserbase's session recording, CAPTCHA solving, and logging were disabled for fair raw-performance comparison. If your workflow depends on these, Browserbase provides them out of the box; with Kernel you would need to build or integrate them separately.
- **Volume pricing** — Both providers offer volume discounts and custom enterprise pricing.
- **Geographic variation** — Tests ran from a single US location with both providers in US-East. Results will differ based on proximity to provider data centers.
- **Free tier behavior** — These are paid-plan results. Free tiers have different concurrency and rate limits.
- **Multi-tab / GPU / WebAssembly workloads** — These would likely differentiate the 8 vs 2 vCPU allocation. Not tested.
- **SDK ergonomics, documentation, support** — Not benchmarked.

---

## Running It Yourself

```bash
# Install
npm install

# Configure credentials
cp .env.example .env.local
# Add your keys:
#   KERNEL_API_KEY=...
#   BROWSERBASE_API_KEY=...
#   BROWSERBASE_PROJECT_ID=...

# Full benchmark (both providers, all 12 scenarios, 10 iterations)
npx tsx src/index.ts -p kernel,browserbase -i 10 -w 3

# Quick smoke test (2 scenarios, 3 iterations)
npx tsx src/index.ts -p kernel,browserbase -s simple-navigation,web-scraping -i 3 -w 1

# Single provider
npx tsx src/index.ts -p kernel -i 10 -w 3

# List all scenarios
npx tsx src/index.ts --list-scenarios

# Run tests
npm test
```

### CLI Options

| Flag | Description | Default |
|:-----|:-----------|:--------|
| `-p, --providers <names>` | Comma-separated provider names | `browserbase,kernel` |
| `-s, --scenarios <names>` | Comma-separated scenario names | all |
| `-i, --iterations <count>` | Measured iterations | `10` |
| `-w, --warmup <count>` | Warmup iterations (discarded) | `3` |
| `-c, --concurrency <count>` | Concurrent sessions | `3` |
| `-t, --timeout <ms>` | Timeout per operation | `60000` |
| `-o, --output <dir>` | Report output directory | `reports` |
| `--no-html` | Skip HTML report | |
| `--list-scenarios` | List scenarios and exit | |
| `-v, --verbose` | Debug logging | |

### Scenarios

| Scenario | What it measures |
|:---------|:----------------|
| `simple-navigation` | Load 3 pages, measure TTFB + full load |
| `form-interaction` | Fill form, submit, measure interaction latency |
| `spa-navigation` | Client-side routing on TodoMVC React |
| `multi-page-crawl` | Extract links, visit each sequentially |
| `file-download` | Trigger downloads via in-browser fetch |
| `concurrent-sessions` | Parallel session scaling at 1, 3, 5, N levels |
| `long-running-session` | 120s session stability test |
| `web-scraping` | Extract structured data from HN, Wikipedia, JSON API |
| `screenshot-generation` | Full-page screenshots across 3 page types |
| `javascript-heavy-page` | JS rendering, waitForFunction, heavy computation |
| `data-extraction-pipeline` | 8 pages sequentially, measure extraction throughput |
| `authenticated-workflow` | Form fill, submit, redirect, extract response |

### Metrics

| Metric | Unit | Description |
|:-------|:-----|:-----------|
| `session_startup` | ms | API call to ready Playwright connection |
| `platform_api_time` | ms | Remote session provisioning only |
| `cdp_connect_time` | ms | CDP WebSocket connection only |
| `context_init_time` | ms | Browser context/page setup only |
| `session_teardown` | ms | Close + platform cleanup |
| `page_load` | ms | Full page load (`waitUntil: 'load'`) |
| `dom_content_loaded` | ms | DOMContentLoaded via Performance API |
| `time_to_first_byte` | ms | TTFB via Performance API |
| `navigation_latency` | ms | SPA client-side route change |
| `interaction_latency` | ms | Click/fill to DOM update |
| `download_time` | ms | File download duration |
| `extraction_time` | ms | `page.evaluate()` data extraction |
| `screenshot_time` | ms | `page.screenshot()` capture |
| `render_complete_time` | ms | JS render + waitForFunction |
| `extraction_throughput` | pages/s | Pages processed per second |
| `concurrent_throughput` | sessions/s | Sessions launched per second |
| `total_iteration` | ms | End-to-end including startup and teardown |

---

## Project Structure

```
browser-testing/
├── src/
│   ├── index.ts                  # CLI entry point
│   ├── config.ts                 # Config resolution (CLI > env > defaults)
│   ├── types/                    # TypeScript interfaces
│   ├── providers/                # BrowserProvider implementations
│   │   ├── base-provider.ts      # Shared CDP logic + session timing decomposition
│   │   ├── browserbase-provider.ts
│   │   └── kernel-provider.ts
│   ├── scenarios/                # 12 benchmark scenarios
│   ├── metrics/                  # Collector, statistics (CI, t-test), system monitor
│   ├── runner/                   # Benchmark + iteration orchestration
│   ├── reporting/                # CLI tables (with significance) + HTML report
│   └── utils/                    # Timer, logger, retry
├── test/                         # Unit + integration tests (41 tests)
└── reports/                      # Generated reports + archived results
```

---

## Methodology

- **Statistical testing**: Welch's t-test (two-tailed, alpha = 0.05). If p >= 0.05, the comparison is a tie.
- **Confidence intervals**: 95% CI on all metrics, using t-distribution critical values.
- **Teardown exclusion**: Session teardown uses different mechanisms per provider (graceful vs immediate) and is excluded from winner tallies.
- **Success rate tracking**: Failed iterations are counted, not silently dropped. A flaky provider cannot appear artificially fast.
- **Warmup**: 3 iterations discarded before measurement to eliminate cold-start effects.
- **Configuration parity**: Both providers run headless with overhead features disabled for fair comparison. Both target the same region (`us-east-1`). Viewport forced to 1920x1080 on both for identical rendering surfaces.

---

*Benchmark run `tnfoaxKzXz` | March 3, 2026 | Duration: 78.9 minutes | 10 iterations + 3 warmup | Paid tier, both providers | Region: us-east-1 (both)*
