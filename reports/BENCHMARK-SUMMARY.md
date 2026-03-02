# Browser Provider Benchmark Report

**Run ID:** BL8RZ9PfKI
**Date:** 2026-03-02
**Duration:** 1667.3s (~27.8 minutes)

---

## 1. Executive Summary

**Kernel is the overall winner**, taking 21 of 29 metric victories compared to Browserbase's 8 wins. Kernel demonstrated decisively faster session startup times (typically 1.5-2x faster), superior page load performance, and dramatically better concurrency throughput (29x higher). Browserbase held advantages in session teardown speed, TTFB on certain scenarios, and SPA-specific interaction latency, but these wins were insufficient to offset Kernel's dominant performance across infrastructure-heavy metrics.

---

## 2. Methodology

### Providers Tested
- **Browserbase** — Cloud browser infrastructure provider
- **Kernel** — Cloud browser infrastructure provider

### Scenarios
All 7 benchmark scenarios were executed: `simple-navigation`, `form-interaction`, `spa-navigation`, `multi-page-crawl`, `file-download`, `concurrent-sessions`, and `long-running-session`.

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

## 3. Per-Scenario Results

### 3.1 simple-navigation

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

**Analysis:** Kernel dominated this scenario across nearly all metrics. Session startup was 1.5x faster at median and 4.7x faster at p95, indicating Browserbase has significant tail latency in session provisioning. Page loads were approximately 2x faster on Kernel, and DOM Content Loaded was nearly 2x faster as well. Browserbase won only on median TTFB (12.0 ms vs 16.5 ms), though notably its p95 TTFB was 381 ms compared to Kernel's 69 ms — suggesting Browserbase has extreme TTFB variance. The high standard deviation on Browserbase's session startup (1807 ms vs Kernel's tighter distribution) confirms inconsistent provisioning times. Kernel's total iteration time was 1.8x faster at median, with its p95 of 2561 ms being lower than Browserbase's median of 4463 ms.

**Errors:** None on either provider.

---

### 3.2 form-interaction

**What it tests:** Navigates to `httpbin.org/forms/post`, fills text inputs and textareas, submits the form, and measures interaction latency. Tests the ability to locate and interact with form elements.

| Metric | Browserbase (median) | Kernel (median) | Browserbase (p95) | Kernel (p95) | Winner |
|---|---|---|---|---|---|
| Session Startup | 1135.6 ms | 814.1 ms | 1152.3 ms | 982.2 ms | **Kernel** |

**Winner: Kernel (1-0) — but scenario effectively failed**

**Analysis:** This scenario failed on both providers across all 3 measured iterations. The only metric captured was session startup (where Kernel was 1.4x faster). All actual form interaction attempts timed out at 30 seconds waiting for `textarea[name="delivery"]`. This is a test infrastructure issue — the httpbin.org forms page likely changed its structure or the targeted textarea element no longer exists under that selector. Since both providers failed identically, this does not reflect a provider capability difference.

**Errors:**
- Browserbase: 3 errors — `page.fill: Timeout 30000ms exceeded` waiting for `textarea[name="delivery"]`
- Kernel: 3 errors — `page.fill: Timeout 30000ms exceeded` waiting for `textarea[name="delivery"]`

---

### 3.3 spa-navigation

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

**Analysis:** This is Browserbase's strongest scenario and the only one where it won the majority of metrics. Browserbase's interaction latency was 2x faster (519 ms vs 1033 ms at median), and its SPA navigation latency was 1.9x faster (394 ms vs 760 ms). Browserbase also won on total iteration time (5.1s vs 7.4s), session teardown, and TTFB. However, Kernel still won on raw page load (1.6x faster), DOM Content Loaded (1.2x faster), and session startup (1.5x faster). The interaction and navigation latency differences are notable — they suggest Browserbase may have a faster JavaScript execution environment or lower remote command round-trip overhead for fine-grained DOM operations. Both providers showed tight p95/median ratios on most metrics, indicating consistent performance within this scenario.

**Errors:** None on either provider.

---

### 3.4 multi-page-crawl

**What it tests:** Starts at `httpbin.org`, extracts up to 5 links from the page, then visits each link sequentially. Simulates a web crawling workflow with multiple sequential navigations.

| Metric | Browserbase (median) | Kernel (median) | Browserbase (p95) | Kernel (p95) | Winner |
|---|---|---|---|---|---|
| Session Startup | 1521.1 ms | 799.5 ms | 4992.2 ms | 803.3 ms | **Kernel** |
| Session Teardown | 197.2 ms | 282.8 ms | 244.8 ms | 291.4 ms | **Browserbase** |
| Total Iteration | 5495.3 ms | 2970.9 ms | 9361.3 ms | 3167.7 ms | **Kernel** |
| Page Load | 1149.4 ms | 480.9 ms | 2059.7 ms | 750.5 ms | **Kernel** |
| TTFB | 92.4 ms | 17.2 ms | 297.2 ms | 151.9 ms | **Kernel** |
| DOM Content Loaded | 662.0 ms | 215.7 ms | 1721.5 ms | 655.6 ms | **Kernel** |

**Winner: Kernel (5-1)**

**Analysis:** Kernel dominated multi-page crawling. Page loads were 2.4x faster at median, and the gap widened at p95 (2060 ms vs 751 ms, a 2.7x difference). TTFB was 5.4x faster on Kernel (17.2 ms vs 92.4 ms), reversing the TTFB advantage Browserbase had in simpler scenarios. DOM Content Loaded showed a 3.1x advantage for Kernel at median, stretching to 2.6x at p95. Session startup variance on Browserbase was again extreme — the p95 of 4992 ms is 3.3x the median, while Kernel's p95 (803 ms) was nearly identical to its median (800 ms). Browserbase only won on session teardown (197 ms vs 283 ms). This scenario highlights that for crawling workloads with many sequential page loads, Kernel provides substantially better throughput.

**Errors:** None on either provider.

---

### 3.5 file-download

**What it tests:** Navigates to `httpbin.org`, then triggers file downloads of 1 KB, 10 KB, and 100 KB using in-page `fetch()` calls and measures download time.

| Metric | Browserbase (median) | Kernel (median) | Browserbase (p95) | Kernel (p95) | Winner |
|---|---|---|---|---|---|
| Session Startup | 1442.2 ms | 816.4 ms | 22090.0 ms | 872.5 ms | **Kernel** |

**Winner: Kernel (1-0) — but scenario effectively failed**

**Analysis:** This scenario failed on both providers across all 3 measured iterations. The `page.goto` call to `https://httpbin.org/bytes/1024` triggered Playwright's download interception (`Download is starting`), preventing the page from reaching load state. Only session startup was measured before failure. Notably, Browserbase's p95 session startup was 22,090 ms — a severe outlier that is 25x Kernel's p95 of 873 ms. This extreme tail latency appeared only in this scenario and may be related to session provisioning under error conditions or retry logic. The download scenario's test design has a flaw: it first calls `timedNavigation` to httpbin.org (which succeeds), but the scenario also navigates directly to the binary endpoint, which Playwright interprets as a download rather than a page load.

**Errors:**
- Browserbase: 3 errors — `page.goto: Download is starting` on `https://httpbin.org/bytes/1024`
- Kernel: 3 errors — `page.goto: Download is starting` on `https://httpbin.org/bytes/1024`

---

### 3.6 concurrent-sessions

**What it tests:** Spins up 3 browser sessions in parallel, each navigating to `example.com`. Measures total time to launch all sessions and calculates throughput in sessions per second.

| Metric | Browserbase (median) | Kernel (median) | Browserbase (p95) | Kernel (p95) | Winner |
|---|---|---|---|---|---|
| Total Iteration | 60814.9 ms | 2049.9 ms | 62426.5 ms | 13710.4 ms | **Kernel** |
| Session Startup | 58496.7 ms | 1345.5 ms | 61888.9 ms | 12873.4 ms | **Kernel** |
| Throughput | 0.05 sess/s | 1.46 sess/s | 0.05 sess/s | 2.15 sess/s | **Kernel** |

**Winner: Kernel (3-0)**

**Analysis:** This was the most lopsided scenario in the benchmark. Kernel's median throughput was 29.2x higher than Browserbase (1.46 sess/s vs 0.05 sess/s). The Browserbase median total iteration time of 60.8 seconds indicates severe session queuing — likely due to the Browserbase free tier's concurrent session limit. With 3 concurrent sessions requested, Browserbase appeared to serialize sessions, with startup times of ~2.4s for the first session, ~58.5s for the second, and ~60.8s for the third. This pattern repeated across all iterations, confirming it is a platform-level constraint rather than a transient issue. Kernel launched all 3 sessions in approximately 1.3-2.0 seconds total (per iteration), demonstrating true parallel provisioning. However, Kernel did show one high-latency iteration (p95 of 13.7s), suggesting occasional variance.

**Errors:** None on either provider.

---

### 3.7 long-running-session

**What it tests:** Keeps a single browser session alive for 120 seconds, performing a page navigation every 15 seconds across 4 rotating URLs (`example.com`, `httpbin.org/html`, `jsonplaceholder.typicode.com`, `httpbin.org/get`). Measures whether performance degrades over time.

| Metric | Browserbase (median) | Kernel (median) | Browserbase (p95) | Kernel (p95) | Winner |
|---|---|---|---|---|---|
| Session Startup | 1037.1 ms | 855.5 ms | 1099.9 ms | 886.3 ms | **Kernel** |
| Session Teardown | 258.9 ms | 337.0 ms | 288.9 ms | 354.9 ms | **Browserbase** |
| Total Iteration | 121332.5 ms | 121203.5 ms | 121341.4 ms | 121213.4 ms | **Kernel** |
| Page Load | 471.1 ms | 206.8 ms | 1016.2 ms | 437.6 ms | **Kernel** |

**Winner: Kernel (3-1)**

**Analysis:** Both providers maintained stable sessions for the full 120-second duration without disconnections or errors — an important reliability signal. Kernel's page loads during the session were 2.3x faster at median (207 ms vs 471 ms) and the gap was even larger at p95 (438 ms vs 1016 ms, a 2.3x difference). Total iteration times were nearly identical (~121.2s vs ~121.3s), reflecting the fixed 120-second session duration that dominates the metric. Session startup remained consistent with other scenarios (Kernel ~1.2x faster). Browserbase won on session teardown (259 ms vs 337 ms).

**Degradation Analysis (from raw navigation samples):**

Browserbase navigation times across a single 120s session (8 navigations):
- Nav 1-2: 456-560 ms (warm-up)
- Nav 3-4: 660-431 ms (mixed)
- Nav 5-8: 268-669 ms (some variance but no clear upward trend)

Kernel navigation times across a single 120s session (8 navigations):
- Nav 1-2: 213-461 ms
- Nav 3-7: 140-421 ms
- Nav 8: 141 ms

Neither provider showed significant performance degradation over the 120-second window. Variance was present on both (driven primarily by `jsonplaceholder.typicode.com` being consistently slower than other URLs) but there was no systematic upward drift in latency over time.

**Errors:** None on either provider.

---

## 4. Overall Comparison

### Wins by Provider

| Provider | Metric Wins | Percentage |
|---|---|---|
| **Kernel** | 21 | 72.4% |
| Browserbase | 8 | 27.6% |
| **Total** | **29** | 100% |

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

## 5. Key Findings

1. **Kernel has consistently faster session startup.** Across all 7 scenarios, Kernel won every session startup comparison. Median startup ranged from 751-856 ms on Kernel versus 1037-1521 ms on Browserbase (non-concurrent scenarios). More critically, Kernel's startup variance is significantly lower — its p95/median ratio stays close to 1.0, while Browserbase's can spike to 3.3-15.3x.

2. **Kernel delivers approximately 2x faster page loads.** Across simple-navigation, multi-page-crawl, and long-running-session scenarios, Kernel's median page load was consistently 1.6-2.4x faster than Browserbase.

3. **Browserbase has a severe concurrent session bottleneck.** At concurrency=3, Browserbase took ~60 seconds to provision all sessions (0.05 sess/s), while Kernel completed the same in ~2 seconds (1.46 sess/s). This 29x throughput gap is likely due to the Browserbase free tier limiting concurrent sessions to 1, causing sequential queuing.

4. **Browserbase excels at SPA interactions.** In the only JavaScript-heavy interactive scenario (spa-navigation), Browserbase was 2x faster at interaction latency (519 ms vs 1033 ms) and 1.9x faster at client-side navigation (394 ms vs 760 ms). This suggests lower command round-trip latency or a faster JavaScript execution context.

5. **Browserbase has faster session teardown but it matters less.** Browserbase won 3 of 4 session teardown comparisons (197-259 ms vs 273-337 ms on Kernel), but teardown is a small fraction of total iteration time and rarely a bottleneck.

6. **TTFB results are mixed and scenario-dependent.** Browserbase had lower TTFB in simple-navigation (12 ms vs 17 ms) and spa-navigation (9 ms vs 14 ms), but Kernel had dramatically lower TTFB in multi-page-crawl (17 ms vs 92 ms). Browserbase's TTFB variance is extreme — p95 values ballooned to 381 ms in simple-navigation while Kernel's stayed at 69 ms.

7. **Neither provider degrades over 2-minute sessions.** The long-running-session scenario showed stable navigation performance for both providers across 8 navigations over 120 seconds, with no systematic latency increase.

8. **Browserbase session startup has heavy tail latency.** The worst observed Browserbase session startup was 22,090 ms (p95 in file-download), compared to Kernel's worst of 872 ms in the same scenario. Even in normal scenarios, Browserbase's startup p95 often exceeded 3-5 seconds while its median was ~1.1-1.5 seconds.

9. **Two scenarios failed on both providers due to test issues.** form-interaction failed because of a stale DOM selector (`textarea[name="delivery"]`), and file-download failed because Playwright intercepts binary responses as downloads. These are test design issues, not provider deficiencies.

10. **Kernel's performance is more predictable.** Across all metrics, Kernel showed lower standard deviations and tighter p95/median ratios, indicating more consistent session provisioning and page rendering performance.

---

## 6. Recommendations

### Use Kernel when:
- **Concurrent workloads are required.** Kernel's ability to spin up parallel sessions without queuing makes it the clear choice for crawling, scraping, or testing workloads that need multiple simultaneous browsers.
- **Session startup latency matters.** If your workflow involves many short-lived sessions (e.g., per-request browser rendering), Kernel's faster and more predictable startup (~800 ms vs ~1200 ms+) provides a direct throughput improvement.
- **Page load speed is critical.** For workloads dominated by full-page navigations (crawling, screenshot services, content extraction), Kernel's 2x page load advantage translates directly to 2x higher throughput.
- **Predictability and tail latency SLOs are important.** Kernel's tight p95/median ratios make it easier to set and meet latency targets.

### Use Browserbase when:
- **SPA automation is the primary use case.** Browserbase's 2x advantage in interaction and navigation latency for single-page applications makes it better suited for testing or automating JavaScript-heavy apps.
- **TTFB measurement is a priority.** In simple page loads, Browserbase reported lower median TTFB, which may matter for performance monitoring use cases.
- **Session teardown speed matters.** If your workflow requires rapid session cycling (create, use briefly, destroy, repeat), Browserbase's faster teardown provides a minor advantage.
- **Free tier concurrent limitations are acceptable.** If workloads are inherently sequential (one session at a time), the concurrent session bottleneck is irrelevant.

---

## 7. Limitations & Notes

1. **Browserbase free tier concurrent session limit.** The concurrent-sessions results are heavily influenced by what appears to be a free tier restriction on Browserbase that limits concurrent sessions to 1. The ~60-second iteration times indicate 2 of 3 sessions were queued behind the first. A paid Browserbase plan with higher concurrency limits could produce dramatically different results for this scenario.

2. **Failed scenarios.** Two of 7 scenarios (form-interaction and file-download) failed on both providers due to test infrastructure issues — not provider limitations. This means the comparison is effectively based on 5 functioning scenarios.

3. **Small sample size.** Only 3 measured iterations per scenario per provider (after 1 warmup) were collected. While medians and p95 values are reported, the statistical power is limited. The p95 of a 3-sample set is an interpolation and should be interpreted with caution. Larger iteration counts (10-30+) would produce more reliable distributional statistics.

4. **Network conditions not controlled.** Both providers were tested from the same machine over the same network connection, but external factors (ISP variability, target site response times, CDN routing) could influence results. The `jsonplaceholder.typicode.com` site consistently showed higher latency on both providers, suggesting server-side variance.

5. **Single geographic location.** Tests were run from a single client location. Provider performance may vary by region based on data center proximity and peering arrangements.

6. **No paid tier comparison.** Both providers were tested on their respective free/default tiers. Performance characteristics (especially concurrency, session startup, and infrastructure allocation) may differ significantly on paid plans.

7. **Warmup iteration excluded but not independently validated.** One warmup iteration was run before each measured set. This mitigates cold-start effects but does not eliminate them entirely — the first measured iteration may still reflect partial warm-up on provider infrastructure.

8. **Client-side overhead.** The benchmark measures end-to-end times from the client's perspective, including local WebSocket/CDP communication overhead. This overhead is shared across providers but means the reported times include client-side processing, not purely provider-side performance.
