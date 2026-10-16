import test from "node:test";
import assert from "node:assert/strict";
import {demo} from "../src/demo.mjs";
import {validateProject,computeClaim,compileProject,comparePackages,sha256,parseClaimsCsv,stableStringify} from "../src/core.mjs";
const clone=x=>structuredClone(x);
test("synthetic fixture passes input validation",()=>assert.deepEqual(validateProject(demo),[]));
test("stable JSON ignores object key order",()=>assert.equal(stableStringify({b:1,a:2}),stableStringify({a:2,b:1})));
test("SHA-256 known vector",async()=>assert.equal(await sha256("abc"),"ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"));
test("deterministic compilation and no certificate",async()=>{
  const a=await compileProject(demo),b=await compileProject(clone(demo));
  assert.equal(a.packageHash,b.packageHash);
  assert.equal(a.formalCertification,false);
  assert.equal(a.issuedCredits,null);
  assert.equal(a.records.length,3);
});
test("factor modification impacts only linked claim",async()=>{
  const a=await compileProject(demo); const other=clone(demo);
  other.claims[0].projectRate+=0.2;
  const b=await compileProject(other);const d=comparePackages(a,b);
  assert.deepEqual(d.changed,["SEA-001"]);assert.equal(d.unchanged.length,2);
});
test("shared evidence modification impacts all dependent claims",async()=>{
  const a=await compileProject(demo);const other=clone(demo);
  other.evidence[1].sha256="e".repeat(64);
  const d=comparePackages(a,await compileProject(other));
  assert.equal(d.changed.length,3);
});
test("methodology version modification invalidates all",async()=>{
  const a=await compileProject(demo),b=clone(demo);
  b.methodology.version="0.2.0";
  assert.equal(comparePackages(a,await compileProject(b)).changed.length,3);
});
test("missing evidence is flagged, never certified",()=>{
  const c=clone(demo.claims[0]);c.evidenceIds=[];
  const result=computeClaim(c,demo.evidence);
  assert.equal(result.readiness,"EVIDENCE_GAPS");assert.equal(result.certifiedTco2e,null);
});
test("negative estimated amount is floored at zero",()=>{
  const c=clone(demo.claims[0]);c.projectRate=0;c.baselineRate=100;
  assert.equal(computeClaim(c,demo.evidence).estimateTco2e,0);
});
test("invalid rates and unknown evidence are rejected",()=>{
  const p=clone(demo);p.claims[0].areaHa=-5;p.claims[0].evidenceIds.push("UNKNOWN");
  assert.ok(validateProject(p).length>=2);
});
test("CSV import with explicit factor citation",()=>{
  const csv="id,habitat,periodStart,periodEnd,areaHa,baselineRate,projectRate,projectEmissions,leakage,uncertaintyPct,factorCitation,evidenceIds\nA,seagrass,2025-01-01,2026-01-01,1,0,2,0,0,10,synthetic,EV-BOUND-01|EV-FIELD-01";
  const rows=parseClaimsCsv(csv);
  assert.equal(rows.length,1);assert.equal(rows[0].areaHa,1);assert.equal(rows[0].evidenceIds.length,2);
});
test("CSV fails on missing numeric value",()=>{
  assert.throws(()=>parseClaimsCsv("id,habitat,periodStart,periodEnd,areaHa,baselineRate,projectRate,projectEmissions,leakage,uncertaintyPct,factorCitation,evidenceIds\nA,seagrass,2025-01-01,2026-01-01,,0,2,0,0,10,citation,"),/Missing numeric/);
});
test("toggling unrelated metadata does not change result fingerprint",async()=>{
  const a=await compileProject(demo),b=clone(demo);
  b.name="Renamed demo";
  assert.deepEqual(comparePackages(a,await compileProject(b)).unchanged,["SEA-001","MAR-002","FLAT-003"]);
});

test("invalid calendar dates return validation errors rather than throwing",()=>{
  const p=clone(demo);p.claims[0].periodStart="2025-02-30";
  assert.ok(validateProject(p).some(x=>x.includes("period invalid")));
});
test("changing the annotation of shared evidence triggers re-verification",async()=>{
  const original=await compileProject(demo);const revised=clone(demo);
  revised.evidence[0].note="Updated provenance note";
  assert.equal(comparePackages(original,await compileProject(revised)).changed.length,3);
});
test("malformed methodology and unsupported evidence role fail closed",()=>{
  const p=clone(demo);p.methodology.id="UNKNOWN";p.evidence[0].type="unapproved";
  assert.ok(validateProject(p).length>=2);
});
