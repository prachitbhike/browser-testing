# Kernel vs Browserbase: Cloud Browser Performance Benchmark

An independent, statistically rigorous comparison of two cloud browser providers — [Kernel](https://onkernel.com) and [Browserbase](https://browserbase.com) — across 12 real-world scenarios with Welch's t-test significance testing.

This benchmark supports **two modes** to capture different perspectives:

| Mode | What it measures | Use case |
|:-----|:-----------------|:---------|
| **Raw** (`--mode raw`) | Pure infrastructure speed, features disabled, region-matched | "Which provider is faster at the metal?" |
| **Default** (`--mode default`) | Out-of-the-box settings, features enabled | "What will I actually experience as a developer?" |

```
  Raw Mode (infrastructure comparison — features disabled, both us-east-1):
    Kernel            ██████████████████████████████████████  38 wins
    Browserbase       ██████                                   6 wins
    Statistical ties  ████████████████████████████████████████████████████████  56 ties

  Default Mode (out-of-the-box settings — BB features on, default regions):
    Kernel            ███████████████████████████████████████████  43 wins
    Browserbase       ██████████████████████████  26 wins
    Statistical ties  ███████████████████████████████  31 ties
```

---

## Quick Decision Guide

| Your primary workload | What the data shows |
|:----------------------|:--------------------|
| **Web scraping / crawling** | Kernel starts sessions ~2x faster; extraction speed is equivalent in raw mode, Browserbase wins extraction in default mode |
| **SPA testing / browser automation** | Interaction latency is a tie in raw mode; Browserbase wins in default mode (likely due to regional proximity) |
| **Screenshot / PDF generation** | Screenshot capture time: tie in raw mode, Browserbase wins in default mode |
| **High-throughput session cycling** | Kernel starts sessions faster in both modes |
| **Data extraction pipelines** | Both comparable on throughput; Kernel faster on startup |
| **Long-running sessions** | Both stable over 120s with no degradation |
| **Need CAPTCHA solving / session recording** | Browserbase includes these natively; Kernel does not offer them |

---

## Active Features By Mode

In **raw mode**, overhead features are disabled on both providers for an apples-to-apples infrastructure comparison. In **default mode**, each provider runs with its out-of-the-box settings.

| Feature | Browserbase (raw) | Browserbase (default) | Kernel (both modes) |
|:--------|:-----------------:|:---------------------:|:-------------------:|
| Session Recording | off | ON | N/A |
| CAPTCHA Solving | off | ON | N/A |
| Session Logging | off | ON | N/A |
| Region | us-east-1 (forced) | us-west-2 (default) | us-east-1 (default) |
| Headless | Yes | Yes | Yes |

---

## Pricing & Resource Allocation

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

Neither provider exposes vCPU or memory configuration — you get what the plan includes. The 8 vs 2 vCPU difference does not produce a measurable difference in this benchmark's single-tab workloads (see [Architecture](#architecture) section for why).

---

## How We Tested

### Common Configuration (both modes)
- **10 measured iterations** per scenario per provider, **3 warmup** iterations discarded
- **Welch's t-test** (p < 0.05) determines statistical significance; overlapping confidence intervals = tie
- **95% confidence intervals** on all metrics
- Session teardown excluded from rankings (architecturally asymmetric)
- **Paid plans** for both providers, same machine, same network
- **Viewport**: Both forced to 1920x1080

### Raw Mode
- **Kernel**: `headless: true`
- **Browserbase**: `logSession: false`, `recordSession: false`, `solveCaptchas: false`, `region: 'us-east-1'`
- Purpose: Compare pure infrastructure without feature overhead or regional latency differences

### Default Mode
- **Kernel**: `headless: true` (only setting)
- **Browserbase**: No overrides (defaults to session recording ON, CAPTCHA solving ON, logging ON, region `us-west-2`)
- Purpose: Measure what a developer actually gets when they spin up a session with minimal configuration

### Why results differ between modes
- **Region proximity**: The benchmark machine runs from the US West Coast. In default mode, Browserbase sessions land in `us-west-2` (closer), while Kernel sessions land in `us-east-1`. This gives Browserbase lower CDP latency for in-browser operations.
- **Feature overhead**: Browserbase's recording, CAPTCHA, and logging add overhead to session management. In raw mode these are off; in default mode they're on.
- **Combined effect**: In default mode, Browserbase's regional proximity advantage partially offsets its feature overhead, resulting in more competitive in-browser execution times. This flipped several raw-mode ties into Browserbase wins.

---

## Results: Raw Mode (Run `tnfoaxKzXz`)

*Features disabled, both providers in us-east-1*

### Where Kernel Wins (38 metrics)

Kernel's wins are concentrated in session startup, CDP connection, and total iteration time.

| Category | Pattern | Typical difference |
|:---------|:--------|:-------------------|
| Session Startup | Kernel wins in 12/12 scenarios | 1.7x - 2.3x faster |
| CDP Connect | Kernel wins in all scenarios | 1.8x - 3.0x faster |
| Total Iteration | Kernel wins in 9/12 scenarios | Varies by scenario |
| Page Load | Kernel wins in 2/12 scenarios | 1.3x - 1.5x |

### Where Browserbase Wins (6 metrics)

| Category | Pattern | Typical difference |
|:---------|:--------|:-------------------|
| Context Init | Browserbase wins in 3/12 scenarios | ~10ms faster |
| Platform API | Browserbase wins in 3/12 scenarios | ~10-20ms faster |

### Statistical Ties (56 of 100 metrics)

All in-browser execution metrics are ties: interaction latency, screenshot time, render time, extraction time, download time, extraction throughput, concurrent throughput.

---

## Results: Default Mode (Run `EcgZCFu6x4`)

*Out-of-the-box settings — Browserbase features ON, default regions*

### Where Kernel Wins (43 metrics)

| Category | Pattern | Typical difference |
|:---------|:--------|:-------------------|
| Session Startup | Kernel wins in 8/12 scenarios | 1.2x - 1.5x faster |
| CDP Connect | Kernel wins in 6/12 scenarios | 1.3x - 1.7x faster |
| Page Load | Kernel wins in 6/12 scenarios | 1.5x - 2x faster |
| DOM Content Loaded | Kernel wins in 5/12 scenarios | 1.5x - 2.5x faster |
| Total Iteration | Kernel wins in 8/12 scenarios | Varies |

### Where Browserbase Wins (26 metrics)

| Category | Pattern | Typical difference |
|:---------|:--------|:-------------------|
| Interaction Latency | Wins in 2/12 scenarios (spa, authenticated) | 1.4x - 2.3x faster |
| Navigation Latency | Wins in 1 scenario (spa) | 2x faster |
| Extraction Time | Wins in 2/12 scenarios (web-scraping, pipeline) | 2.3x - 2.4x faster |
| Screenshot Time | Wins in 1 scenario | 1.9x faster |
| Render Complete | Wins in 1 scenario (js-heavy) | 2.2x faster |
| Context Init | Wins in all 12 scenarios consistently | ~50ms faster |
| Platform API | Wins in 3 scenarios | 1.1x - 1.2x faster |
| Total Iteration | Wins in 1 scenario (authenticated) | 1.4x faster |

### Statistical Ties (31 of 100 metrics)

Fewer ties than raw mode — regional proximity and feature overhead created more differentiation.

### Mode Comparison

| What changed from Raw to Default | Raw | Default | Why |
|:--------------------------------|:----|:--------|:----|
| Browserbase wins | 6 | 26 | Regional proximity + more variance from feature overhead |
| Kernel wins | 38 | 43 | Some metrics that were ties became Kernel wins |
| Ties | 56 | 31 | Features and region created more statistically significant differences |
| Browserbase in-browser execution | Tied with Kernel | Wins several metrics | Browserbase sessions now in us-west-2 (closer to benchmark machine) |

---

## Session Startup Breakdown

Session startup was decomposed into three phases (raw mode, region-matched):

```
Phase               Kernel        Browserbase     Result
───────────────     ─────────     ───────────     ──────────────
Platform API        ~190 ms       ~193 ms         Tie (most scenarios)
CDP Connect         ~560 ms       ~1,250 ms       Kernel 2.2x faster
Context Init        ~80 ms        ~72 ms          Browserbase ~10ms faster
───────────────     ─────────     ───────────     ──────────────
Total Startup       ~830 ms       ~1,750 ms       Kernel 2.1x faster
```

In default mode, Kernel's CDP connect advantage narrows (because Browserbase sessions are closer to the test machine).

---

## Architecture

The two providers use fundamentally different infrastructure, which explains the performance profile.

**Kernel** runs browsers on [unikernels](https://kernel.sh/docs/info/unikernels) — Unikraft-based, single-purpose virtual machines containing only the components needed to run Chrome. Key properties:

- Sub-20ms cold starts (per their documentation)
- Lower per-instance overhead, allowing more resource allocation (8 vCPUs) at a lower cost point
- Standby mode: idle browsers snapshot to disk and restore in milliseconds

**Browserbase** runs on more traditional infrastructure with a platform layer that provides built-in session recording, CAPTCHA solving, session logging, and observability tooling. These features add operational overhead but provide capabilities that Kernel does not offer natively.

**Why vCPUs don't affect in-browser results**: Neither provider exposes vCPU configuration — Kernel provides 8, Browserbase provides 2. Despite the 4x difference, all in-browser execution metrics in raw mode (JavaScript, screenshots, DOM interaction, data extraction) are statistical ties. This is because Chrome's V8 JavaScript engine is primarily single-threaded, and the workloads in this benchmark — `page.evaluate()`, `page.click()`, `page.screenshot()` — do not saturate multiple cores. Workloads that would differentiate (GPU rendering, multi-tab parallel automation, WebAssembly) were not tested.

---

## Reliability

Both providers achieved **100% success rates** across all 12 scenarios in both modes (10/10 iterations each). Neither dropped a session, timed out on a page load, or produced an error during either benchmark run.

---

## What This Benchmark Does NOT Cover

- **CAPTCHA solving effectiveness** — Browserbase's CAPTCHA solver was enabled in default mode but no scenarios tested actual CAPTCHA encounters. If your workflow hits CAPTCHAs, Browserbase provides this out of the box; with Kernel you would need to integrate a third-party solution.
- **Session recording quality** — Recording was enabled in default mode and its overhead is captured in timing data, but we did not evaluate recording playback quality or debugging utility.
- **Volume pricing** — Both providers offer volume discounts and custom enterprise pricing.
- **Geographic variation** — Tests ran from a single US West Coast location. Results will differ based on proximity to provider data centers.
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

# Raw mode — infrastructure comparison (features disabled, region-matched)
npx tsx src/index.ts --mode raw -p kernel,browserbase -i 10 -w 3

# Default mode — out-of-the-box experience
npx tsx src/index.ts --mode default -p kernel,browserbase -i 10 -w 3

# Quick smoke test
npx tsx src/index.ts --mode default -s simple-navigation,web-scraping -i 3 -w 1

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
| `-m, --mode <mode>` | `raw` or `default` benchmark mode | `raw` |
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
- **Success rate tracking**: Failed iterations are counted, not silently dropped.
- **Warmup**: 3 iterations discarded before measurement to eliminate cold-start effects.
- **Two modes**: Raw mode eliminates feature overhead and regional asymmetry. Default mode captures the actual developer experience.

---

*Raw mode run `tnfoaxKzXz` | March 3, 2026 | 78.9 min | 10 iterations + 3 warmup*
*Default mode run `EcgZCFu6x4` | March 3, 2026 | 78.4 min | 10 iterations + 3 warmup*
*Both runs: Paid tier, same machine (US West Coast), same network*
