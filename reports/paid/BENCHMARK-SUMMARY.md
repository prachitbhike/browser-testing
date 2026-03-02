# Browser Provider Benchmark Report — Paid Tier

**Run ID:** EBWoXXWbM-
**Date:** 2026-03-02
**Duration:** 1172.4s (~19.5 minutes)
**Tier:** Both providers on lowest paid plans

---

## 1. Executive Summary

**Kernel is the overall winner**, taking 32 of 41 metric victories compared to Browserbase's 9 wins (78.0%). Kernel demonstrated faster session startup, superior page load performance, and higher concurrency throughput. Browserbase held its advantage in SPA interaction latency and navigation latency, and won most session teardown comparisons. Notably, both previously-failing scenarios (form-interaction and file-download) now work on paid tiers.

---

## 2. Methodology

### Providers Tested
- **Browserbase** — Cloud browser infrastructure provider (lowest paid plan)
- **Kernel** — Cloud browser infrastructure provider (lowest paid plan)

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

---

## 3. Per-Scenario Results

### 3.1 simple-navigation

| Metric | Browserbase (median) | Kernel (median) | Browserbase (p95) | Kernel (p95) | Winner |
|---|---|---|---|---|---|
| Session Startup | 1128.7 ms | 928.7 ms | 1181.8 ms | 1038.2 ms | **Kernel** |
| Session Teardown | 716.1 ms | 325.9 ms | 746.4 ms | 364.8 ms | **Kernel** |
| Total Iteration | 3649.2 ms | 3150.4 ms | 3765.2 ms | 3333.0 ms | **Kernel** |
| Page Load | 480.6 ms | 291.7 ms | 732.8 ms | 794.9 ms | **Kernel** |
| TTFB | 15.2 ms | 19.7 ms | 58.6 ms | 229.6 ms | **Browserbase** |
| DOM Content Loaded | 279.3 ms | 151.3 ms | 398.4 ms | 288.3 ms | **Kernel** |

**Winner: Kernel (5-1)**

---

### 3.2 form-interaction

| Metric | Browserbase (median) | Kernel (median) | Browserbase (p95) | Kernel (p95) | Winner |
|---|---|---|---|---|---|
| Session Startup | 1243.2 ms | 869.7 ms | 2785.3 ms | 942.7 ms | **Kernel** |
| Session Teardown | 210.0 ms | 259.7 ms | 637.8 ms | 266.5 ms | **Browserbase** |
| Total Iteration | 4095.2 ms | 3911.1 ms | 5314.2 ms | 4118.0 ms | **Kernel** |
| Page Load | 483.7 ms | 271.6 ms | 528.6 ms | 703.9 ms | **Kernel** |
| TTFB | 57.5 ms | 3.7 ms | 58.0 ms | 463.1 ms | **Kernel** |
| DOM Content Loaded | 302.0 ms | 101.8 ms | 306.2 ms | 568.4 ms | **Kernel** |
| Interaction Latency | 1771.8 ms | 2116.8 ms | 1902.5 ms | 2211.7 ms | **Browserbase** |

**Winner: Kernel (5-2)**

**Analysis:** This scenario now works on paid tiers (it failed entirely on free tiers). Browserbase won interaction latency by ~16% (1772 ms vs 2117 ms), consistent with its SPA interaction advantage. Kernel dominated all infrastructure and page load metrics.

---

### 3.3 spa-navigation

| Metric | Browserbase (median) | Kernel (median) | Browserbase (p95) | Kernel (p95) | Winner |
|---|---|---|---|---|---|
| Session Startup | 1141.6 ms | 811.0 ms | 1303.5 ms | 814.2 ms | **Kernel** |
| Session Teardown | 245.5 ms | 286.3 ms | 250.1 ms | 308.8 ms | **Browserbase** |
| Total Iteration | 5014.1 ms | 7266.0 ms | 5125.8 ms | 8233.2 ms | **Browserbase** |
| Page Load | 559.2 ms | 411.0 ms | 577.7 ms | 434.2 ms | **Kernel** |
| TTFB | 8.7 ms | 3.9 ms | 9.5 ms | 4.6 ms | **Kernel** |
| DOM Content Loaded | 306.4 ms | 280.5 ms | 308.5 ms | 286.2 ms | **Kernel** |
| Interaction Latency | 510.2 ms | 1191.9 ms | 744.2 ms | 1504.1 ms | **Browserbase** |
| Navigation Latency | 368.5 ms | 757.4 ms | 453.0 ms | 886.9 ms | **Browserbase** |

**Winner: Browserbase (4-4) — split decision**

**Analysis:** Browserbase's SPA advantage persists on paid tiers. Interaction latency is 2.3x faster (510 ms vs 1192 ms) and navigation latency is 2.1x faster (369 ms vs 757 ms). But Kernel now wins TTFB (3.9 ms vs 8.7 ms), which Browserbase won on free tier. Overall iteration time favors Browserbase due to interaction/navigation dominance.

---

### 3.4 multi-page-crawl

| Metric | Browserbase (median) | Kernel (median) | Browserbase (p95) | Kernel (p95) | Winner |
|---|---|---|---|---|---|
| Session Startup | 1096.1 ms | 801.7 ms | 1197.2 ms | 816.0 ms | **Kernel** |
| Session Teardown | 195.7 ms | 293.5 ms | 208.6 ms | 384.4 ms | **Browserbase** |
| Total Iteration | 4915.2 ms | 2763.3 ms | 11303.5 ms | 2880.0 ms | **Kernel** |
| Page Load | 1057.1 ms | 445.2 ms | 4328.2 ms | 479.4 ms | **Kernel** |
| TTFB | 104.3 ms | 18.1 ms | 170.7 ms | 30.1 ms | **Kernel** |
| DOM Content Loaded | 849.2 ms | 209.6 ms | 1535.4 ms | 380.6 ms | **Kernel** |

**Winner: Kernel (5-1)**

**Analysis:** Kernel dominated crawling. Page loads 2.4x faster, TTFB 5.8x faster, DOM Content Loaded 4.1x faster. Browserbase's p95 total iteration (11.3s) is 3.9x its median (4.9s), showing high variance.

---

### 3.5 file-download

| Metric | Browserbase (median) | Kernel (median) | Browserbase (p95) | Kernel (p95) | Winner |
|---|---|---|---|---|---|
| Session Startup | 1271.0 ms | 782.8 ms | 2049.9 ms | 807.3 ms | **Kernel** |
| Session Teardown | 712.0 ms | 269.7 ms | 768.7 ms | 277.0 ms | **Kernel** |
| Total Iteration | 5618.5 ms | 2756.3 ms | 9826.2 ms | 2938.6 ms | **Kernel** |
| Page Load | 2037.3 ms | 790.3 ms | 6903.5 ms | 982.9 ms | **Kernel** |
| TTFB | 178.6 ms | 19.4 ms | 432.4 ms | 337.7 ms | **Kernel** |
| DOM Content Loaded | 1780.6 ms | 700.5 ms | 2352.6 ms | 889.0 ms | **Kernel** |
| Download Time | 297.1 ms | 168.6 ms | 541.9 ms | 586.7 ms | **Kernel** |

**Winner: Kernel (7-0)**

**Analysis:** This scenario now works on paid tiers (it failed entirely on free tiers). Kernel swept all metrics. Download time was 1.8x faster (169 ms vs 297 ms). Page loads were 2.6x faster. Browserbase showed extreme p95 page load variance (6904 ms, 3.4x its median).

---

### 3.6 concurrent-sessions

| Metric | Browserbase (median) | Kernel (median) | Browserbase (p95) | Kernel (p95) | Winner |
|---|---|---|---|---|---|
| Total Iteration | 2597.0 ms | 1354.8 ms | 2708.7 ms | 1366.4 ms | **Kernel** |
| Session Startup | 2381.2 ms | 1331.4 ms | 2671.0 ms | 1362.1 ms | **Kernel** |
| Throughput | 1.16 sess/s | 2.21 sess/s | 1.31 sess/s | 2.25 sess/s | **Kernel** |

**Winner: Kernel (3-0)**

**Analysis:** Massive improvement from free tier for Browserbase — throughput went from 0.05 sess/s to 1.16 sess/s (23x improvement). The paid tier unlocks actual concurrent session support. However, Kernel is still 1.9x faster at throughput (2.21 vs 1.16 sess/s).

---

### 3.7 long-running-session

| Metric | Browserbase (median) | Kernel (median) | Browserbase (p95) | Kernel (p95) | Winner |
|---|---|---|---|---|---|
| Session Startup | 1125.9 ms | 860.4 ms | 1368.7 ms | 903.4 ms | **Kernel** |
| Session Teardown | 244.9 ms | 345.0 ms | 279.4 ms | 357.4 ms | **Browserbase** |
| Total Iteration | 121412.3 ms | 121222.0 ms | 121598.4 ms | 121238.3 ms | **Kernel** |
| Page Load | 493.2 ms | 270.4 ms | 3171.9 ms | 474.2 ms | **Kernel** |

**Winner: Kernel (3-1)**

**Analysis:** Both providers stable over 120s. Kernel page loads 1.8x faster. Browserbase has notable p95 page load variance (3172 ms vs median 493 ms). Browserbase wins teardown as usual.

---

## 4. Overall Comparison

### Wins by Provider

| Provider | Metric Wins | Percentage |
|---|---|---|
| **Kernel** | 32 | 78.0% |
| Browserbase | 9 | 22.0% |
| **Total** | **41** | 100% |

### Wins by Category

| Category | Browserbase Wins | Kernel Wins |
|---|---|---|
| Session Startup | 0 | 7 |
| Session Teardown | 3 | 2 |
| Total Iteration | 1 | 6 |
| Page Load | 0 | 7 |
| TTFB | 1 | 5 |
| DOM Content Loaded | 0 | 5 |
| Interaction/Navigation Latency | 3 | 0 |
| Throughput | 0 | 1 |
| Download Time | 0 | 1 |

---

## 5. Key Findings

1. **Kernel dominates on paid tiers.** 32 of 41 metric wins (78.0%), up from 72.4% on free tiers. With more scenarios working, Kernel's advantage is even clearer.

2. **Previously broken scenarios now work.** Both form-interaction and file-download completed successfully, adding 14 new metric comparisons.

3. **Browserbase concurrent sessions dramatically improved.** Throughput jumped from 0.05 sess/s (free) to 1.16 sess/s (paid) — a 23x improvement. The free tier's 1-session limit was the bottleneck.

4. **Kernel still faster at concurrency.** Despite Browserbase's improvement, Kernel's 2.21 sess/s is still 1.9x faster.

5. **Browserbase's SPA advantage persists.** Interaction latency (510 ms vs 1192 ms) and navigation latency (369 ms vs 757 ms) remain ~2x faster on Browserbase.

6. **Kernel wins TTFB in most scenarios.** Unlike the free tier where TTFB was mixed, Kernel now wins 5 of 6 TTFB comparisons. Only simple-navigation still favors Browserbase.

7. **Browserbase session startup variance improved but remains higher.** The extreme 22s outlier from the free tier is gone, but p95/median ratios are still wider than Kernel's.

8. **Total benchmark runtime dropped 30%.** 1172s (paid) vs 1667s (free), primarily because Browserbase's concurrent sessions no longer queue for ~60s each.

9. **Page load advantage consistent.** Kernel maintains 1.6-2.6x faster page loads across all scenarios.

10. **Both providers remain stable over long sessions.** No degradation observed in 120-second sessions on either paid tier.
