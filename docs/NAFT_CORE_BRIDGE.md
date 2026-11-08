# Connect this research edition to NaFT Core

This edition is now publicly visible. Its scientific research calculations and observation diagnostics remain independent of the central NaFT agricultural MRV compiler.

The Blue Carbon v0.3.0 CLI already exports the original project and reproducible research calculation:

    node src/cli.mjs > /tmp/bluecarbon-export.json

In a separate checkout of NaFT Core, the proposed read-only adapter consumes that JSON and creates a normalized receipt:

    node scripts/bridge-bluecarbon.mjs /tmp/bluecarbon-export.json > /tmp/naft-bluecarbon-receipt.json

Implementation proposal: [NaFT Core pull request #74](https://github.com/Takzin1/NaFT/pull/74).

The interface checks source-Claim fingerprints, package SHA-256, illustrative arithmetic, carbon stock and CH4/N2O observation arithmetic, and preserves the non-certification flags. It does not copy Blue Carbon source code, move private evidence to an external system, write to Ethereum, or activate any official J-Blue Credit or Verra method.

**Scientific boundary:** the underlying data, model assumptions and human field observations are not authenticated by a hash match. Neither repository issues or certifies carbon credits. Existing All rights reserved license terms remain in effect unless explicitly changed by the owner; public visibility alone does not grant an open-source license.

Public repository hygiene: inspect commit history for secrets, private field/customer data, proprietary materials and externally licensed datasets. The CLI fixtures provided here are labelled synthetic; do not publish real evidence bundles without a separate rights/privacy review.

After Core PR #74 merges, the adapter may be used as an offline interoperability tool. No live system-to-system service, hosted endpoint or UI integration is implied.
