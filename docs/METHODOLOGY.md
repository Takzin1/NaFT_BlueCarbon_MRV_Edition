# Methodology governance and scientific limitations

**Status: research prototype. No accredited methodology pack is implemented.**
Documentation last reviewed 2026-10-16.

## Source references

1. Japan Blue Economy Association, *J-Blue Credit Certification Application Guidelines*, Japanese version 2.6 (March 2026): https://www.blueeconomy.jp/credit/
2. Verra, *VM0033 Methodology for Tidal Wetland and Seagrass Restoration*, version 2.1: https://verra.org/methodologies/vm0033-methodology-for-tidal-wetland-and-seagrass-restoration-v2-1/
3. Verra, consultation of draft VM0033 version 3.0 (September–October 2026): https://verra.org/consultation-revision-to-tidal-wetland-and-seagrass-restoration-methodology-vm0033/
4. IPCC, *2013 Wetlands Supplement to the 2006 IPCC Guidelines*, Chapter 4, Coastal Wetlands: https://www.ipcc-tfi.iges.or.jp/public/wetlands/index.html

These sources are cited, not embedded or fully digitized. The above methods differ in boundaries, accounting rules, eligible interventions, defaults, uncertainties, permanence, leakage, and verification requirements. Users must not assume their calculations are interchangeable. J-Blue Credit and VM0033 require their own specialist-executed accounting, formal documentation, and independent eligibility assessment. J-Blue Credit is administered externally.

## Executable prototype equation

For each **illustrative claim**, user supplies all rates and assumptions explicitly:

- area A in hectares (ha)
- monitoring duration Y = elapsed days / 365.2425 (years), end date exclusive
- project removal rate P in tCO2e / ha / year
- baseline removal rate B in tCO2e / ha / year
- total project emissions E in tCO2e for monitoring period
- leakage L in tCO2e for monitoring period
- uncertainty deduction U in percent, 0 to 100

Illustrative **gross difference**: G = A × Y × (P - B).

Illustrative **pre-uncertainty net**: N = G - E - L.

Illustrative **deduction**: D = max(0,N) × U / 100.

Displayed **research estimate**: max(0,N - D) tCO2e.

This is a **synthetic, generic sensitivity calculation** and must not be described as J-Blue Credit issuance amount, Verra VCU amount, IPCC national inventory accounting, or registry-eligible removals. Rates must be supplied with supporting sources, units and version. No emission factors or credit prices are auto-populated. Negative research estimates are floored for display, not reconciled to official accounting.

## Boundary and validity problems to resolve before real project use

- Clear spatial polygons, hectare calculation, tidal position, habitat-specific monitoring protocol and remote-sensing uncertainty.
- Temporal baseline and additionality, monitoring period, and avoidable double counting against overlapping registries.
- Carbon pool mapping: biomass vs soil organic carbon vs exported organic carbon, with explicit source/sink semantics.
- Atmospheric fluxes, CH4 and N2O (when applicable), project emissions, leakage, permanence and reversals.
- Factor provenance, uncertainty propagation (rather than the demonstrator's simple haircut), sampling design, stratification and QA.
- Regional and scheme-specific J-Blue Credit application rules; VM0033 applicability and soil modules must be separately implemented and validated.
- External registry API integrations, independent verifier approval, formal credit issuance, financial settlement and wallet minting are entirely **out of scope**.

## Version management

A project.methodology object stores an explicit ID and version. The **source reference** IDs (JBLUE-REFERENCE, VM0033-REFERENCE) are not claimable executable scheme implementations.

The compiler binds each claim to:
1. project identifier;
2. pinned methodology ID + version;
3. complete claim inputs;
4. referenced evidence manifest IDs, roles, digests and source URLs.

All are serialized canonically with sorted keys, then SHA-256 hashed. A change to a shared evidence manifest re-verifies each linked claim. Changes to an unlinked claim do not invalidate unrelated claims. Only exact fingerprint equality is interpreted as *unchanged within the modeled dependency graph*. The graph is currently conservative only for explicitly modeled fields; external facts and unrecorded edits are not detected.

## Decision responsibility

RESEARCH_ESTIMATE only means four classes of evidence manifest with digests and nonempty factor citation exist; **it does not mean scientific verification, independent audit, credit eligibility or approval**. The compiler always emits formalCertification=false, certifiedTco2e=null, issuedCredits=null.

A human domain expert must separately approve all methodology mappings before any implementation can claim conformity.


## Local GIS pre-check (v0.2)

GeoJSON must be RFC7946-style [longitude, latitude] polygons and is treated as WGS84 by *assumption*. The equirectangular hectare estimate is limited to local polygons spanning under 3° and is not an official geodesic area. This pre-check does **not** independently confirm CRS truth, topology/self-intersections, overlapping boundaries, property rights or habitat eligibility. A polygon's content hash can be linked as evidence, but official carbon-credit eligibility and area require qualified external review.
