import test from "node:test";
import assert from "node:assert/strict";
import {demo} from "../src/demo.mjs";
import {syntheticObservations} from "../src/monitoring-demo.mjs";
import {sedimentCarbonStockTcHa,validateMonitoring,compileMonitoringClaim} from "../src/monitoring.mjs";
import {compileProject,comparePackages,validateProject} from "../src/core.mjs";
const copy=x=>structuredClone(x);
const scenario=()=>Object.assign(copy(demo),copy(syntheticObservations));
test("synthetic observations validate and demo without observations remains valid",()=>{
 assert.deepEqual(validateMonitoring(scenario()),[]);
 assert.deepEqual(validateMonitoring(demo),[]);
 assert.deepEqual(validateProject(scenario()),[]);
});
test("soil carbon mass conversion has transparent units",()=>{
 assert.equal(sedimentCarbonStockTcHa({bulkDensityGcm3:1,depthCm:10,organicCarbonFraction:.02}),20);
});
test("stock changes and gas emissions are separate diagnostics, never certifiable",()=>{
 const r=compileMonitoringClaim(scenario(),"SEA-001");
 assert.equal(r.pools.length,2);
 assert.ok(r.stockChangeTco2e>0);
 assert.equal(r.gasEmissionTco2e,180*27/1000);
 assert.equal(r.netCreditableTco2e,null);assert.equal(r.netDiagnosticTco2e,null);
 assert.equal(r.certifiedTco2e,null);
});
test("declining stock yields a negative signed change without floor",()=>{
 const p=scenario();p.carbonPools[0].endStockTcHa=0;
 assert.ok(compileMonitoringClaim(p,"SEA-001").stockChangeTco2e<0);
});
test("GWP is mandatory, no factor defaults are synthesized",()=>{
 const p=scenario();delete p.gasFluxes[0].gwp100;
 assert.ok(validateProject(p).some(x=>x.includes("gwp100")));
});
test("invalid sediment comparison rejects mismatched depths",()=>{
 const p=scenario();p.carbonPools[1].end.depthCm=10;
 assert.ok(validateProject(p).some(x=>x.includes("equal sampling depths")));
});
test("pool area cannot exceed the linked claim boundary",()=>{
 const p=scenario();p.carbonPools[0].areaHa=20;
 assert.ok(validateProject(p).some(x=>x.includes("areaHa")));
});
test("orphan observation cannot be silently accepted",()=>{
 const p=scenario();p.carbonPools[0].claimId="UNKNOWN";
 assert.ok(validateProject(p).some(x=>x.includes("claimId")));
});
test("missing or unbound evidence is rejected",()=>{
 const p=scenario();p.gasFluxes[0].evidenceIds=["UNKNOWN"];
 assert.ok(validateProject(p).some(x=>x.includes("evidenceIds")));
});
test("claim-local pool edits invalidate exactly the dependent claim",async()=>{
 const a=scenario(),before=await compileProject(a),b=scenario();
 b.carbonPools[0].endStockTcHa+=.1;
 const diff=comparePackages(before,await compileProject(b));
 assert.deepEqual(diff.changed,["SEA-001"]);assert.equal(diff.unchanged.length,2);
});
test("claim-local gas edits invalidate exactly the dependent claim",async()=>{
 const a=scenario(),before=await compileProject(a),b=scenario();
 b.gasFluxes[1].totalKg+=3;
 assert.deepEqual(comparePackages(before,await compileProject(b)).changed,["MAR-002"]);
});
test("pool data does not silently modify generic claim estimate",async()=>{
 const original=await compileProject(demo),newer=await compileProject(scenario());
 assert.equal(newer.sumResearchEstimateTco2e,original.sumResearchEstimateTco2e);
 assert.equal(newer.records[0].result.estimateTco2e,original.records[0].result.estimateTco2e);
 assert.ok(newer.records[0].monitoring.hasObservations);
 assert.equal(newer.records[0].monitoring.netCreditableTco2e,null);
});
test("observation record ordering does not change fingerprints",async()=>{
 const a=scenario(),b=scenario();b.carbonPools.reverse();b.gasFluxes.reverse();
 const x=await compileProject(a),y=await compileProject(b);
 assert.deepEqual(comparePackages(x,y).unchanged,["SEA-001","MAR-002","FLAT-003"]);
});
test("duplicate observation IDs and pools are rejected",()=>{
 const p=scenario();p.carbonPools.push({...copy(p.carbonPools[0]),id:"DUP-POOL"});
 assert.ok(validateProject(p).some(x=>x.includes("duplicate pool")));
 p.carbonPools[3].id=p.carbonPools[0].id;
 assert.ok(validateProject(p).some(x=>x.includes("unique")));
});
test("malformed records and nonfinite numbers fail closed",()=>{
 const p=scenario();p.carbonPools[0].areaHa=Infinity;p.gasFluxes[0].totalKg=NaN;
 assert.ok(validateProject(p).length>=2);
});
test("unbound evidence order does not affect monitoring dependency hashes",async()=>{
 const a=scenario(),b=scenario();
 b.carbonPools[0].evidenceIds.reverse();
 const x=await compileProject(a),y=await compileProject(b);
 assert.deepEqual(comparePackages(x,y).changed,[]);
});
test("malformed legacy project with observation rows returns validation errors",()=>{
 const p=scenario();p.claims[1]=null;
 assert.ok(validateProject(p).length>=1);
});
