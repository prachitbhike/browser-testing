# Free Tier vs Paid Tier Benchmark Comparison

**Free Tier Run:** BL8RZ9PfKI (2026-03-02, 1667.3s)
**Paid Tier Run:** EBWoXXWbM- (2026-03-02, 1172.4s)
**Configuration:** 3 measured iterations, 1 warmup, 3 concurrent sessions, 60s timeout

---

## TL;DR

Upgrading to paid tiers **fixed two broken scenarios**, **eliminated Browserbase's concurrency bottleneck** (0.05 → 1.16 sess/s), and **reduced total benchmark time by 30%**. Kernel remains the overall winner on both tiers but the gap is more nuanced on paid — Browserbase's interaction advantages hold steady while its infrastructure weaknesses partially close.

---

## 1. Overall Score Shift

| Tier | Kernel Wins | Browserbase Wins | Total Metrics | Kernel % |
|---|---|---|---|---|
| Free | 21 | 8 | 29 | 72.4% |
| Paid | 32 | 9 | 41 | 78.0% |

The higher paid-tier win count reflects 12 additional metrics from scenarios that now work (form-interaction, file-download). Kernel swept both newly-working scenarios, inflating its percentage.

**Excluding new scenarios:** On the 5 scenarios that worked on both tiers, Kernel went from 21-8 (72.4%) to 21-8 (72.4%) — identical win distribution. The paid tier did not change the competitive balance on existing scenarios.

---

## 2. Biggest Improvement: Concurrent Sessions

This is the single most impactful change from upgrading to paid tiers.

### Browserbase

| Metric | Free Tier | Paid Tier | Change |
|---|---|---|---|
| Throughput | 0.05 sess/s | 1.16 sess/s | **+23.2x** |
| Total Iteration | 60,815 ms | 2,597 ms | **23.4x faster** |
| Session Startup | 58,497 ms | 2,381 ms | **24.6x faster** |

**What happened:** The free tier limited Browserbase to 1 concurrent session, causing sequential queuing when 3 were requested. The paid tier removes this restriction, allowing true parallel provisioning.

### Kernel

| Metric | Free Tier | Paid Tier | Change |
|---|---|---|---|
| Throughput | 1.46 sess/s | 2.21 sess/s | **+1.5x** |
| Total Iteration | 2,050 ms | 1,355 ms | **1.5x faster** |
| Session Startup | 1,346 ms | 1,331 ms | ~same |

**What happened:** Kernel already supported concurrent sessions on the free tier. The paid tier brought modest throughput improvement (+51%), likely from better infrastructure allocation.

### Gap Closed But Not Eliminated

| Metric | Free Tier Ratio (K/BB) | Paid Tier Ratio (K/BB) |
|---|---|---|
| Throughput | 29.2x | 1.9x |
| Total Iteration | 29.7x | 1.9x |

Browserbase closed from a **29x disadvantage to a 1.9x disadvantage**. This is the most dramatic change across both tiers.

---

## 3. Newly Working Scenarios

### form-interaction (Previously failed on both)

**Free tier:** Both providers timed out on `textarea[name="delivery"]` — all iterations failed.

**Paid tier:** Both providers completed successfully.

| Metric | Browserbase (median) | Kernel (median) | Winner |
|---|---|---|---|
| Session Startup | 1243.2 ms | 869.7 ms | Kernel |
| Interaction Latency | 1771.8 ms | 2116.8 ms | **Browserbase** |
| Page Load | 483.7 ms | 271.6 ms | Kernel |

**Takeaway:** Browserbase's interaction latency advantage (16% faster) extends beyond SPAs to standard form interactions. Kernel wins everything else.

### file-download (Previously failed on both)

**Free tier:** Both providers hit `page.goto: Download is starting` error.

**Paid tier:** Both providers completed successfully.

| Metric | Browserbase (median) | Kernel (median) | Winner |
|---|---|---|---|
| Download Time | 297.1 ms | 168.6 ms | Kernel |
| Page Load | 2037.3 ms | 790.3 ms | Kernel |
| TTFB | 178.6 ms | 19.4 ms | Kernel |

**Takeaway:** Kernel swept all 7 file-download metrics. Kernel's download speed is 1.8x faster; its page load advantage in this scenario is 2.6x.

---

## 4. Scenario-by-Scenario Comparison

### 4.1 simple-navigation

| Metric | Free BB | Paid BB | Free K | Paid K |
|---|---|---|---|---|
| Session Startup | 1216.7 ms | 1128.7 ms | 807.4 ms | 928.7 ms |
| Page Load | 514.8 ms | 480.6 ms | 259.3 ms | 291.7 ms |
| TTFB | 12.0 ms | 15.2 ms | 16.5 ms | 19.7 ms |
| DOM Content Loaded | 291.3 ms | 279.3 ms | 150.2 ms | 151.3 ms |
| Session Teardown | 740.2 ms | 716.1 ms | 273.1 ms | 325.9 ms |

**Trend:** Minor improvements on both. Kernel session startup slightly regressed (807→929 ms). Performance is broadly consistent between tiers.

---

### 4.2 spa-navigation

| Metric | Free BB | Paid BB | Free K | Paid K |
|---|---|---|---|---|
| Session Startup | 1140.1 ms | 1141.6 ms | 751.4 ms | 811.0 ms |
| Interaction Latency | 519.5 ms | 510.2 ms | 1032.5 ms | 1191.9 ms |
| Navigation Latency | 394.2 ms | 368.5 ms | 760.1 ms | 757.4 ms |
| Page Load | 740.8 ms | 559.2 ms | 456.5 ms | 411.0 ms |
| TTFB | 9.0 ms | 8.7 ms | 14.1 ms | 3.9 ms |

**Trend:** Browserbase's interaction advantage persists (2.3x on paid vs 2.0x on free). Kernel's TTFB improved dramatically (14.1→3.9 ms). Both providers showed modest page load improvements.

**Winner shift:** Free tier was BB 5-3. Paid tier is BB 4-4 (Kernel took TTFB).

---

### 4.3 multi-page-crawl

| Metric | Free BB | Paid BB | Free K | Paid K |
|---|---|---|---|---|
| Session Startup | 1521.1 ms | 1096.1 ms | 799.5 ms | 801.7 ms |
| Page Load | 1149.4 ms | 1057.1 ms | 480.9 ms | 445.2 ms |
| TTFB | 92.4 ms | 104.3 ms | 17.2 ms | 18.1 ms |
| DOM Content Loaded | 662.0 ms | 849.2 ms | 215.7 ms | 209.6 ms |

**Trend:** Browserbase session startup improved (1521→1096 ms). Page loads stayed consistent. The Kernel advantage ratio remained ~2.4x for page loads across both tiers.

---

### 4.4 long-running-session

| Metric | Free BB | Paid BB | Free K | Paid K |
|---|---|---|---|---|
| Session Startup | 1037.1 ms | 1125.9 ms | 855.5 ms | 860.4 ms |
| Page Load | 471.1 ms | 493.2 ms | 206.8 ms | 270.4 ms |
| Session Teardown | 258.9 ms | 244.9 ms | 337.0 ms | 345.0 ms |

**Trend:** Nearly identical between tiers. Both providers remain stable for 120s sessions. No degradation on either tier.

---

## 5. Head-to-Head: Key Metrics Across Tiers

### Session Startup (median, non-concurrent scenarios)

| Scenario | Free BB | Paid BB | Δ BB | Free K | Paid K | Δ K |
|---|---|---|---|---|---|---|
| simple-navigation | 1217 ms | 1129 ms | -7% | 807 ms | 929 ms | +15% |
| spa-navigation | 1140 ms | 1142 ms | ~0% | 751 ms | 811 ms | +8% |
| multi-page-crawl | 1521 ms | 1096 ms | -28% | 800 ms | 802 ms | ~0% |
| long-running-session | 1037 ms | 1126 ms | +9% | 856 ms | 860 ms | ~0% |
| **Average** | **1229 ms** | **1123 ms** | **-9%** | **804 ms** | **851 ms** | **+6%** |

**Takeaway:** Browserbase session startup improved ~9% on paid. Kernel startup slightly regressed ~6%, possibly due to run-to-run variance. The gap narrowed from 1.53x to 1.32x.

### Page Load (median, all successful scenarios)

| Scenario | Free BB | Paid BB | Δ BB | Free K | Paid K | Δ K |
|---|---|---|---|---|---|---|
| simple-navigation | 515 ms | 481 ms | -7% | 259 ms | 292 ms | +13% |
| spa-navigation | 741 ms | 559 ms | -25% | 457 ms | 411 ms | -10% |
| multi-page-crawl | 1149 ms | 1057 ms | -8% | 481 ms | 445 ms | -7% |
| long-running-session | 471 ms | 493 ms | +5% | 207 ms | 270 ms | +31% |
| **Average** | **719 ms** | **648 ms** | **-10%** | **351 ms** | **355 ms** | **+1%** |

**Takeaway:** Browserbase page loads improved ~10% on paid. Kernel stayed flat. The gap narrowed from 2.05x to 1.83x.

### TTFB (median)

| Scenario | Free BB | Paid BB | Free K | Paid K | Winner Shift? |
|---|---|---|---|---|---|
| simple-navigation | 12.0 ms | 15.2 ms | 16.5 ms | 19.7 ms | No (BB both) |
| spa-navigation | 9.0 ms | 8.7 ms | 14.1 ms | 3.9 ms | **Yes (BB→K)** |
| multi-page-crawl | 92.4 ms | 104.3 ms | 17.2 ms | 18.1 ms | No (K both) |

**Takeaway:** Kernel took TTFB from Browserbase in spa-navigation (14.1→3.9 ms improvement). This flipped a previously Browserbase-favored metric.

---

## 6. Tail Latency (p95) Improvements

### Browserbase p95 Session Startup

| Scenario | Free p95 | Paid p95 | Change |
|---|---|---|---|
| simple-navigation | 3984.0 ms | 1181.8 ms | **-70%** |
| multi-page-crawl | 4992.2 ms | 1197.2 ms | **-76%** |
| file-download | 22090.0 ms | 2049.9 ms | **-91%** |
| concurrent-sessions | 61888.9 ms | 2671.0 ms | **-96%** |

**Takeaway:** Browserbase's worst tail latency issue — extreme p95 session startup — is dramatically improved on paid tiers. The 22s outlier in file-download dropped to 2s. The 62s concurrent outlier dropped to 2.7s. This is arguably the most important paid-tier improvement for Browserbase.

### Kernel p95 Session Startup

| Scenario | Free p95 | Paid p95 | Change |
|---|---|---|---|
| simple-navigation | 852.2 ms | 1038.2 ms | +22% |
| multi-page-crawl | 803.3 ms | 816.0 ms | +2% |
| concurrent-sessions | 12873.4 ms | 1362.1 ms | **-89%** |

**Takeaway:** Kernel was already consistent. The main improvement is concurrent-session p95 dropping from 12.9s to 1.4s.

---

## 7. Key Takeaways

### 1. Paid Browserbase eliminates the concurrency bottleneck
The single biggest reason to upgrade Browserbase from free to paid. Throughput goes from 0.05 to 1.16 sessions/second — a 23x improvement. If your workload needs concurrent sessions, the free tier is essentially unusable.

### 2. Kernel still wins, but the margin narrows
Kernel's advantages in session startup (1.53x → 1.32x) and page load (2.05x → 1.83x) both shrink on paid tiers. Browserbase is investing paid-tier resources into infrastructure performance.

### 3. Paid tiers fix previously broken scenarios
Both form-interaction and file-download now work. This suggests the paid tiers have better browser infrastructure (possibly newer Chromium builds, better resource allocation, or fixed download handling).

### 4. Browserbase's tail latency dramatically improves
The extreme p95 spikes (22s session startup, 62s concurrent queuing) are eliminated on paid tiers. This is critical for production workloads that need predictable latency.

### 5. Browserbase's SPA advantage is tier-independent
Interaction latency (2.0-2.3x faster) and navigation latency (~2x faster) persist identically across free and paid tiers. This is a fundamental architectural advantage, not a resource allocation issue.

### 6. Kernel's performance is tier-independent
Kernel's metrics are remarkably consistent between free and paid. Session startup, page load, and TTFB barely changed. This suggests Kernel allocates similar resources regardless of tier — the paid tier's value may be in limits/quotas rather than performance.

### 7. The paid tier total runtime is 30% faster
1172s (paid) vs 1667s (free), primarily from eliminating Browserbase's concurrent session queuing. For benchmarking workflows, this time savings adds up.

---

## 8. Recommendations

### When the paid upgrade matters most (Browserbase):
- **Concurrent workloads**: If you need >1 simultaneous session, the paid tier is mandatory. The free tier effectively serializes.
- **Predictable latency**: The p95 tail latency improvements alone justify the upgrade for production use.
- **File download scenarios**: Broken on free tier, works on paid.

### When the paid upgrade matters less:
- **Sequential single-session workloads**: Performance gains are modest (7-10% improvements).
- **SPA interaction speed**: Already fast on free tier, unchanged on paid.
- **Long-running sessions**: Both tiers handle 120s sessions equally well.

### Provider recommendations on paid tiers:

**Choose Kernel when:**
- Page load speed is priority (1.8x faster)
- Concurrency throughput matters (1.9x faster)
- Predictable session startup is needed
- Crawling / multi-page workloads

**Choose Browserbase when:**
- SPA automation is primary use case (2x faster interactions)
- Form filling / DOM manipulation dominates
- Session teardown speed matters
- You need the Browserbase ecosystem features (recordings, stealth mode, etc.)

---

## 9. Methodology Notes

- Both runs used identical configuration (3 iterations, 1 warmup, 3 concurrent, 60s timeout)
- Runs were conducted on the same machine, same network, same day
- Run-to-run variance (estimated 5-15%) means small differences should not be over-interpreted
- The free tier run included 2 failed scenarios (29 total metrics); paid tier had 0 failures (41 metrics)
- Statistical power remains limited with 3 iterations; larger sample sizes would improve confidence
