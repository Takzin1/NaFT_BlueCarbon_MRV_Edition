/*
 * NaFT Blue Carbon MRV — deterministic research computation engine.
 * This is not J-Blue Credit or Verra certified software.
 * No factors are silently supplied. All calculations are illustrative.
 */
export const SCHEMA_VERSION = "0.1.0";
export const HABITATS = ["seagrass", "seaweed", "saltmarsh", "mangrove", "tidal_flat", "other"];
export const REQUIRED_EVIDENCE = ["boundary", "monitoring", "baseline", "factor"];
export const METHODOLOGIES = {
  "NAFT-RESEARCH": { label: "NaFT research model", version: "0.1.0", reference: "local" },
  "JBLUE-REFERENCE": { label: "J-Blue Credit (reference only)", version: "2.6", reference: "https://www.blueeconomy.jp/credit/" },
  "VM0033-REFERENCE": { label: "Verra VM0033 (reference only)", version: "2.1", reference: "https://verra.org/methodologies/vm0033-methodology-for-tidal-wetland-and-seagrass-restoration-v2-1/" }
};
const maxText = (v, n=512) => typeof v === "string" && v.length > 0 && v.length <= n;
const finite = v => typeof v === "number" && Number.isFinite(v);
const unique = arr => new Set(arr).size === arr.length;
const isDate = s => { if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false; const d = new Date(s+"T00:00:00Z"); return Number.isFinite(d.getTime()) && d.toISOString().slice(0,10) === s; };
function validUrl(s) {
  if (!s) return true;
  try { const u = new URL(s); return u.protocol === "https:"; } catch { return false; }
}
export function stableStringify(value) {
  if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";
  if (value && typeof value === "object") {
    return "{" + Object.keys(value).sort().filter(k=>value[k]!==undefined).map(k=>JSON.stringify(k)+":"+stableStringify(value[k])).join(",") + "}";
  }
  return JSON.stringify(value);
}
export async function sha256(data) {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,"0")).join("");
}
export function validateProject(project) {
  const errors=[];
  if (!project || typeof project !== "object" || Array.isArray(project)) return ["project must be an object"];
  if (!maxText(project.id,80)) errors.push("project.id is required (max 80)");
  if (!maxText(project.name,160)) errors.push("project.name is required (max 160)");
  if (!project.methodology || !Object.hasOwn(METHODOLOGIES,project.methodology.id)) errors.push("known methodology reference required");
  if (!maxText(project.methodology?.version,60)) errors.push("methodology.version required");
  if (!Array.isArray(project.evidence) || project.evidence.length>500) errors.push("evidence must be an array (max 500)");
  if (!Array.isArray(project.claims) || project.claims.length>500 || !project.claims.length) errors.push("claims must be a nonempty array (max 500)");
  // Accumulate independent methodology and evidence problems in one report.
  // Only stop here when arrays are malformed or excessive; iterating them would be unsafe.
  if (!Array.isArray(project.evidence) || !Array.isArray(project.claims) || project.evidence.length>500 || project.claims.length>500 || !project.claims.length) return errors;
  const evidenceIds=[];
  for (const [i,e] of project.evidence.entries()) {
    const p="evidence["+i+"]";
    if (!e || !maxText(e.id,80)) {errors.push(p+".id required"); continue;}
    evidenceIds.push(e.id);
    if (!REQUIRED_EVIDENCE.includes(e.type) && e.type!=="other") errors.push(p+".type invalid");
    if (e.sha256!=null && !/^[a-f0-9]{64}$/i.test(e.sha256)) errors.push(p+".sha256 must be 64 hexadecimal characters");
    if (e.sourceUrl && (!maxText(e.sourceUrl,1000) || !validUrl(e.sourceUrl))) errors.push(p+".sourceUrl must be an HTTPS URL");
    if (!maxText(e.note||"",500) && e.note) errors.push(p+".note too long");
  }
  if (!unique(evidenceIds)) errors.push("duplicate evidence IDs");
  const claimIds=[];
  for (const [i,c] of project.claims.entries()) {
    const p="claims["+i+"]";
    if (!c || !maxText(c.id,80)) { errors.push(p+".id required"); continue; }
    claimIds.push(c.id);
    if (!HABITATS.includes(c.habitat)) errors.push(p+".habitat invalid");
    if (!isDate(c.periodStart)||!isDate(c.periodEnd)||c.periodStart>=c.periodEnd) errors.push(p+".period invalid");
    if (!finite(c.areaHa)||c.areaHa<=0||c.areaHa>10000000) errors.push(p+".areaHa invalid");
    for (const k of ["baselineRate","projectRate","projectEmissions","leakage"]) {
      if (!finite(c[k]) || c[k]<0 || c[k]>1000000000) errors.push(p+"."+k+" invalid");
    }
    if (!finite(c.uncertaintyPct)||c.uncertaintyPct<0||c.uncertaintyPct>100) errors.push(p+".uncertaintyPct invalid");
    if (typeof c.factorCitation!=="string"||c.factorCitation.length>1000) errors.push(p+".factorCitation invalid");
    if (!Array.isArray(c.evidenceIds)||c.evidenceIds.length>100||c.evidenceIds.some(x=>typeof x!=="string"||!evidenceIds.includes(x))||!unique(c.evidenceIds)) errors.push(p+".evidenceIds invalid");
  }
  if (!unique(claimIds)) errors.push("duplicate claim IDs");
  return errors;
}
export function computeClaim(claim,evidence) {
  const start=Date.parse(claim.periodStart+"T00:00:00Z");
  const end=Date.parse(claim.periodEnd+"T00:00:00Z");
  const years=(end-start)/86400000/365.2425;
  // Both rates are user-supplied annual net removals. No official crediting calculation.
  const grossDelta=claim.areaHa*years*(claim.projectRate-claim.baselineRate);
  const preUncertainty=grossDelta-claim.projectEmissions-claim.leakage;
  const deduction=Math.max(0,preUncertainty)*claim.uncertaintyPct/100;
  const estimate=Math.max(0,preUncertainty-deduction);
  const linked=evidence.filter(e=>claim.evidenceIds.includes(e.id));
  const missingKinds=REQUIRED_EVIDENCE.filter(kind=>!linked.some(e=>e.type===kind && e.sha256));
  if (!claim.factorCitation?.trim()) missingKinds.push("factor citation");
  return {
    years, grossDelta, projectEmissions:claim.projectEmissions, leakage:claim.leakage,
    uncertaintyDeduction:deduction, estimateTco2e:estimate,
    readiness:missingKinds.length ? "EVIDENCE_GAPS" : "RESEARCH_ESTIMATE",
    missing:missingKinds,
    certifiedTco2e:null, issuedCredits:null
  };
}
export async function compileProject(project) {
  const errors=validateProject(project);
  if (errors.length) throw new Error("Invalid project: "+errors.join("; "));
  const records=[];
  for (const c of project.claims) {
    const evidence=project.evidence.filter(e=>c.evidenceIds.includes(e.id)).sort((a,b)=>a.id.localeCompare(b.id));
    const dependence={
      projectId:project.id, methodology:project.methodology,
      claim:{...c,evidenceIds:[...c.evidenceIds].sort()}, evidence:evidence.map(e=>({id:e.id,type:e.type,sha256:e.sha256||null,sourceUrl:e.sourceUrl||null,note:e.note||null,observedAt:e.observedAt||null}))
    };
    const fingerprint=await sha256(stableStringify(dependence));
    const result=computeClaim(c,project.evidence);
    records.push({claimId:c.id, habitat:c.habitat, fingerprint, evidenceIds:c.evidenceIds, result});
  }
  const packageHash=await sha256(stableStringify({schema:SCHEMA_VERSION,records,projectId:project.id}));
  return {
    schema:SCHEMA_VERSION, researchOnly:true, formalCertification:false, registryConnected:false,
    projectId:project.id, projectName:project.name,
    methodology:{...project.methodology}, claimCount:records.length, records, packageHash,
    sumResearchEstimateTco2e:records.reduce((n,r)=>n+r.result.estimateTco2e,0),
    certifiedTco2e:null, issuedCredits:null,
    disclaimer:"Research estimates only. Method-specific official rules, independent validation and issuance are NOT implemented."
  };
}
export function comparePackages(previous,current) {
  if (!previous) return {new:current.records.map(r=>r.claimId),changed:[],unchanged:[],removed:[]};
  const old=new Map(previous.records.map(r=>[r.claimId,r.fingerprint]));
  const now=new Set(current.records.map(r=>r.claimId));
  const result={new:[],changed:[],unchanged:[],removed:[]};
  for (const r of current.records) {
    const k=!old.has(r.claimId)?"new":old.get(r.claimId)===r.fingerprint?"unchanged":"changed";
    result[k].push(r.claimId);
  }
  for (const id of old.keys()) if (!now.has(id)) result.removed.push(id);
  return result;
}
export function parseClaimsCsv(text) {
  if (typeof text!=="string"||text.length>1024*1024) throw new Error("CSV must be under 1 MB");
  const rows=[];let row=[],cell="",quoted=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(ch==='"' && quoted && text[i+1]==='"'){cell+='"';i++;}
    else if(ch==='"'){quoted=!quoted;}
    else if(ch===','&&!quoted){row.push(cell);cell="";}
    else if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell="";}
    else cell+=ch;
  }
  if(quoted)throw new Error("CSV has unclosed quotes");
  row.push(cell);if(row.some(x=>x.trim()))rows.push(row);
  if(rows.length<2)throw new Error("CSV header and one data row required");
  const header=rows.shift().map(x=>x.trim().replace(/^\uFEFF/,""));
  const keys=["id","habitat","periodStart","periodEnd","areaHa","baselineRate","projectRate","projectEmissions","leakage","uncertaintyPct","factorCitation","evidenceIds"];
  if(keys.some(x=>!header.includes(x)))throw new Error("Missing required CSV columns: "+keys.filter(x=>!header.includes(x)).join(", "));
  if(rows.length>500)throw new Error("Too many claims (max 500)");
  return rows.map((r,i)=>{
    if(r.length!==header.length)throw new Error("CSV column count mismatch at line "+(i+2));
    const obj=Object.fromEntries(header.map((key,j)=>[key,r[j].trim()]));
    for(const n of ["areaHa","baselineRate","projectRate","projectEmissions","leakage","uncertaintyPct"]){
      if(obj[n]==="")throw new Error("Missing numeric value "+n+" on line "+(i+2));
      obj[n]=Number(obj[n]);
    }
    obj.evidenceIds=obj.evidenceIds ? obj.evidenceIds.split("|").map(x=>x.trim()).filter(Boolean):[];
    return Object.fromEntries(keys.map(k=>[k,obj[k]]));
  });
}
