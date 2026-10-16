# NaFT Blue Carbon MRV Edition 🌊

**Version-aware coastal carbon evidence compiler + targeted re-verification engine.**

An independent research prototype extending NaFT's core principle — versioned evidence dependencies and recomputation — into coastal ecosystem carbon monitoring. The private repository was initialized on 2026-10-16.

> **Scientific boundary:** This software does not implement approved J-Blue Credit or Verra VM0033 accounting. It produces **illustrative research estimates**, not certified removals or issued carbon credits. All quantities in the built-in demo are explicitly synthetic.

## Features (v0.1.0)

- Browser dashboard for synthetic seagrass, saltmarsh and tidal-flat monitoring claims.
- Explicit project, baseline, area, time, emissions, leakage and uncertainty assumptions; no preloaded official coefficients.
- JSON full-project dataset and CSV claim-row import with structural validation.
- Local SHA-256 evidence-file manifest generation and per-claim evidence bindings, without uploading source bytes.
- SHA-256 research package fingerprints and dependency-aware claim impact comparison when versions, input factors or linked evidence change.
- Export full JSON research package (inputs + results + comparison), or run a headless CLI.
- Methodology reference pinning (NaFT research / J-Blue Credit Ver.2.6 / VM0033 v2.1) **only**; no certification.
- No dependencies for the research engine/browser app, no API keys, no remote backend, no blockchain signing.
- Automated Node tests plus GitHub Actions.

## Quick start

Static web app, can open via any local server:

~~~bash
python3 -m http.server 3000
# Open http://localhost:3000
~~~

Or run Node 20+ tests / CLI:

~~~bash
npm test
node src/cli.mjs > research-package.json
node src/cli.mjs my-research-project.json > research-package.json
~~~

The browser uses ES modules and crypto.subtle; use a secure context (HTTPS or localhost) instead of opening index.html as a local file.

## Main workflow

1. Start with the labelled synthetic demonstration project.
2. Under **Claims & Data**, import your own JSON dataset or CSV claims (use **CSV Template** for schema), then calculate.
3. Under **Evidence Vault**, hash local files and bind them to specific claims. Save original evidence bytes yourself; the app only retains hashes/metadata in memory.
4. Under **Methodology**, pin the reference ID and version. This is **a reference**, not a compliant executable implementation.
5. Run **Recalculate**, modify an input/evidence/version and run it again.
6. Open **Re-verification** to view new / changed / unchanged / removed claim IDs. Export the research package JSON.

**Data semantics:** areaHa (ha), baselineRate and projectRate (tCO2e/ha/year), projectEmissions and leakage (tCO2e), uncertaintyPct (percentage, not statistically-derived). Period end is exclusive. See [Methodology and limitations](docs/METHODOLOGY.md).

## Repository map

~~~text
index.html                Browser entry point
src/app.mjs               Browser workspace (no server)
src/styles.css            Responsive UI
src/core.mjs              Validation, hash, equation, dependency diff, CSV
src/demo.mjs              Fully synthetic fixture
src/cli.mjs               Offline project compilation
tests/core.test.mjs       Deterministic logic + failure-mode tests
docs/METHODOLOGY.md       Scientific assumptions & scheme boundaries
docs/SECURITY.md          Privacy & production threat model
.github/workflows/ci.yml CI syntax + tests + CLI roundtrip
~~~

## Reference methods and status

- [J-Blue Credit (Japan Blue Economy Association)](https://www.blueeconomy.jp/credit/) — Certification application guidance v2.6 (March 2026).
- [Verra VM0033 v2.1](https://verra.org/methodologies/vm0033-methodology-for-tidal-wetland-and-seagrass-restoration-v2-1/) — Active version (2026-10-16 research snapshot).
- [Verra VM0033 v3.0 draft consultation](https://verra.org/consultation-revision-to-tidal-wetland-and-seagrass-restoration-methodology-vm0033/) — A proposed update, **not automatically applied**.
- [IPCC Wetlands Supplement, Chapter 4](https://www.ipcc-tfi.iges.or.jp/public/wetlands/index.html) — Scientific inventory background, **not a carbon-credit issuance API**.

No official methodology compliance, third-party verification, actual field validation, geographic-sensor pipeline or issued-credit authority is claimed.

## Next research milestones

- Independent scientifically reviewed executable methodology packs with benchmarked reference calculations.
- GIS polygons (GeoJSON), remote-sensing ingestion (Sentinel-2 or suitable imagery), habitat change detection with ground-truth and uncertainty.
- Carbon pool / sediment / CH4/N2O modules, baseline/additionality/leakage/permanence handling.
- Evidence persistence and independent replay & reviewer-signoff system.
- Regression corpus of published real-world coastal studies with permissions and transparent units.

License: **All rights reserved** until the repository owner chooses an explicit open-source license.
