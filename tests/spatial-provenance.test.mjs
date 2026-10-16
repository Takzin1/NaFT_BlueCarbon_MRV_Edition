import test from "node:test";
import assert from "node:assert/strict";
import {inspectGeoJSON} from "../src/spatial.mjs";
import {verifyEvidenceBytes,createEvidenceManifest,auditPackageIntegrity} from "../src/provenance.mjs";
import {compileProject,validateProject} from "../src/core.mjs";
import {demo} from "../src/demo.mjs";
const square=(lon,lat,w=.01)=>[[lon,lat],[lon+w,lat],[lon+w,lat+w],[lon,lat+w],[lon,lat]];
const feature=(coords,id="coastal-site")=>({type:"Feature",id,properties:{habitat:"seagrass"},geometry:{type:"Polygon",coordinates:coords}});
const doc=coords=>({type:"FeatureCollection",features:[feature(coords)]});
test("GIS polygon area is positive and clearly non-authoritative",()=>{
 const report=inspectGeoJSON(doc([square(139,35)]));
 assert.equal(report.featureCount,1); assert.ok(report.estimatedAreaHa>95&&report.estimatedAreaHa<110);
 assert.equal(report.authoritativeAreaHa,null);assert.equal(report.certificationAccepted,false);
});
test("GIS hole reduces estimated area",()=>{
 const a=inspectGeoJSON(doc([square(139,35)]));
 const b=inspectGeoJSON(doc([square(139,35),square(139.002,35.002,.003)]));
 assert.ok(b.estimatedAreaHa<a.estimatedAreaHa);
});
test("GIS rejects malformed, unclosed and out-of-range polygons",()=>{
 assert.throws(()=>inspectGeoJSON(doc([[[139,35],[139.01,35],[139.01,35.01],[139,35.01]]])),/closed/);
 assert.throws(()=>inspectGeoJSON(doc([square(250,35)])),/range/);
 assert.throws(()=>inspectGeoJSON({type:"Feature",geometry:{type:"Point",coordinates:[139,35]}}),/Polygon/);
});
test("GIS rejects duplicate IDs and invalid non-WGS84 coordinates",()=>{
 const f=feature([square(139,35)]);
 assert.throws(()=>inspectGeoJSON({type:"FeatureCollection",features:[f,f]}),/duplicated/);
 assert.throws(()=>inspectGeoJSON({...doc([square(139,35)]),crs:{type:"name"}}),/CRS/);
});
test("GIS validates MultiPolygon and feature-level bounds",()=>{
 const f={type:"Feature",id:"multi",geometry:{type:"MultiPolygon",coordinates:[[square(139,35)],[square(139.02,35.02)]]}};
 assert.equal(inspectGeoJSON(f).featureCount,1);
 assert.throws(()=>inspectGeoJSON({type:"Feature",geometry:{type:"MultiPolygon",coordinates:[[square(139,35)],[square(145,35)]]}}),/span/);
});
test("distinct evidence roles on same bytes generate distinct IDs",async()=>{
 const bytes=new TextEncoder().encode("field-observation");
 const a=await createEvidenceManifest({type:"monitoring",bytes,filename:"field.csv"});
 const b=await createEvidenceManifest({type:"baseline",bytes,filename:"field.csv"});
 assert.notEqual(a.id,b.id); assert.equal(a.sha256,b.sha256);
 const check=await verifyEvidenceBytes(a,bytes);
 assert.equal(check.status,"MATCH");assert.equal(check.scientificallyVerified,false);
 assert.equal((await verifyEvidenceBytes(a,new TextEncoder().encode("altered"))).status,"MISMATCH");
});
test("exported evidence compiler package can be independently replayed",async()=>{
 const p=await compileProject(demo);
 const good=await auditPackageIntegrity({package:p,sourceProject:demo});
 assert.equal(good.packageHashMatches,true);assert.equal(good.outputMatches,true);
 const bad=await auditPackageIntegrity({package:{...p,packageHash:"0".repeat(64)},sourceProject:demo});
 assert.equal(bad.packageHashMatches,false);assert.equal(bad.outputMatches,false);
});
test("malformed project dates are validation failures, never thrown by toISOString",()=>{
 const p=structuredClone(demo);p.claims[0].periodStart="2026-13-88";
 const issues=validateProject(p);assert.ok(issues.some(x=>x.includes("period")));
});
test("non-string URLs and null evidence digests do not falsely confirm evidence",async()=>{
 const p=structuredClone(demo);p.evidence[0].sha256=null;p.evidence[1].sourceUrl="http://unsafe.example";
 const errors=validateProject(p);
 assert.ok(errors.some(x=>x.includes("sourceUrl")));
});
