# NaFT Blue Carbon MRV Edition 🌊

**Version-aware coastal carbon evidence compiler + targeted re-verification engine.**

An independent research prototype extending NaFT's core principle — versioned evidence dependencies and recomputation — into coastal ecosystem carbon monitoring. The repository was initialized on 2026-10-16 and is now public.

> **Scientific boundary:** This software does not implement approved J-Blue Credit or Verra VM0033 accounting. It produces **illustrative research estimates**, not certified removals or issued carbon credits. All quantities in the built-in demo are explicitly synthetic.

## NaFT Core interoperability (proposed)

This public edition remains an independent research calculator. A [read-only Core integration PR](https://github.com/Takzin1/NaFT/pull/74) accepts its existing CLI JSON export, checks source bindings and illustrative arithmetic, and emits a research-only receipt without issuing credits or posting transactions. See [bridge instructions](docs/NAFT_CORE_BRIDGE.md). Public visibility does not change the existing All rights reserved terms.

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


## v0.2: Coastal GIS and evidence integrity

- **Coastal GIS:** import local RFC7946 GeoJSON Polygon / MultiPolygon (2 MB cap) to inspect coordinates and compute a **non-authoritative area approximation** with a limited local equirectangular projection. The input file is hashed and its digest can be bound as claim boundary evidence; computed area never silently overwrites declared claim area.
- **Evidence recheck:** verify original file bytes against saved SHA-256 manifests without uploading the file. Matching bytes do not establish accurate measurements.
- Evidence IDs now distinguish evidence **roles** even when two files contain identical bytes.
- Modified inputs are flagged until recomputed. Export never silently uses a stale compiled result.
- `src/provenance.mjs` can recompile an exported source project to check research-package consistency.

**Limitations:** No polygon-overlap detection, scientifically validated habitat classification, certified hectares, ecological audit, signed evidence chain, scheme-approved method or credit issuance.


## v0.3 — Carbon-pool and greenhouse-gas observation ledger

- Adds **Carbon Observations** to the browser dashboard and `src/monitoring.mjs` to the deterministic core.
- Import user-supplied `carbonPools[]` and `gasFluxes[]` as a project JSON or use the **explicitly synthetic** in-browser fixture. Export the observation JSON for editing and re-import.
- Biomass stocks: start/end **tC/ha**, change across an explicitly supplied area **ha**, convert mass C → mass CO₂ equivalent by **44/12**. Signed losses are preserved; carbon stock changes do **not** mean verified atmospheric uptake.
- Sediment sensitivity diagnostic: `bulkDensityGcm3 × depthCm × 100 × organicCarbonFraction` in **tC/ha** for a fixed sampling depth, using *explicit measurements only*. No sediment accretion, mineral carbon, erosion, stratification, sample representativeness or permanence method is implemented.
- Gas flux scenario: explicit period-total emitted **kg CH4** or **kg N2O** and **user-supplied GWP100**, returning tCO₂e without implicit factors.
- All observation IDs, evidence links, claim IDs, measured area, input quantities and citations are validated. Each claim's dependency hash includes its own pool and gas records, supporting targeted re-verification on changed observations.
- Output embeds an independent `monitoring` diagnostic for each claim and *never* adds pool or gas diagnostics to existing generic NaFT research estimates or official credit amounts.

**No net credit calculation or external scientific validation.** Observation availability is not evidence of monitoring completeness; missing data must never be read as zero. See [Methodology](docs/METHODOLOGY.md) for units, definitions and boundaries.
