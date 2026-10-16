# Security, privacy and trustworthy accounting

**Prototype scope:** Single-page static app, zero backend, no login, no blockchain or payment network. No external telemetry.

- Uploaded research JSON and CSV are handled in browser memory and limited to 1 MB. Hash input files are limited to 10 MB. A SHA-256 is computed locally; original evidence bytes are not uploaded or retained.
- No localStorage/sessionStorage: navigating away discards workspace state. Export the research package first.
- User-controlled labels, sources, notes and IDs are HTML-escaped before rendering. Source URLs are not injected into DOM links.
- HTTPS-only source URL metadata, finite nonnegative numerical values, bounded records, duplicate-ID and evidence-reference checks protect the research pipeline.
- The exported JSON contains full source project metadata, so treat it as sensitive. Check before sharing or committing any imported data.
- Never attach real personal or commercially sensitive data to the synthetic public demo.
- No attestations, issuance, public registry writes or token issuance. No key custody.
- The package digest protects a serialized **research output**, but does not provide authentication, trustworthy timestamps, non-repudiation, independent verification or immutability by itself.
- Evidence files are **not** bundled with exported reports; archive the original bytes independently to permit later digest re-check.
- Content hashes prove byte identity, not truth, provenance, sensor calibration, correct spatial boundaries or legal rights.
- Review the CSV/JSON and field-data attack surface before adding a backend or shared workspaces.

## Before production

Add authentication + scoped project RBAC, audited immutable server-side evidence storage, secure upload scanning, independent checksums, tamper-evident event log, retention controls, input schema version migration, systematic scientific QA, reproducible spatial pipeline, external reviewer attestation, backup/DR, and threat model. Update libraries and enforce SBOM/code scanning before deployment with real evidence.
