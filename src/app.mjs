import {demo} from "./demo.mjs";
import {inspectGeoJSON} from "./spatial.mjs";
import {createEvidenceManifest,verifyEvidenceBytes} from "./provenance.mjs";
import {compileProject,comparePackages,validateProject,parseClaimsCsv,sha256,METHODOLOGIES,HABITATS} from "./core.mjs";
const root=document.getElementById("app");
const deepcopy=x=>structuredClone(x);
let state={project:deepcopy(demo),last:null,previous:null,delta:null,tab:"overview",notice:"",error:"",dirty:false,spatial:null};
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=(n,d=2)=>Number(n||0).toLocaleString("en-US",{maximumFractionDigits:d,minimumFractionDigits:d});
const select=(items,chosen)=>items.map(([v,t])=>'<option value="'+esc(v)+'"'+(chosen===v?" selected":"")+'>'+esc(t)+'</option>').join("");
const habitatName={seagrass:"Seagrass",seaweed:"Seaweed",saltmarsh:"Salt Marsh",mangrove:"Mangrove",tidal_flat:"Tidal Flat",other:"Other"};
const btn=(action,label,kind="outline",extra="")=>'<button type="button" class="btn '+kind+'" data-action="'+esc(action)+'" '+extra+'>'+label+'</button>';
const pill=(ok,t)=>'<span class="tag '+(ok?"":"warn")+'">'+esc(t)+'</span>';
function notice(message,isError=false){state.notice=isError?"":message;state.error=isError?message:"";render();}
function download(name,text,type){const blob=new Blob([text],{type});const url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function header(){return '<div class="top"><div class="crumb">Workspace&nbsp; / &nbsp; <b>'+esc(({overview:"Overview",claims:"Claims & Data",evidence:"Evidence Vault",audit:"Re-verification",methods:"Methodology",spatial:"Coastal GIS"})[state.tab])+'</b></div><div class="topright"><span class="labchip">● RESEARCH ONLY</span>'+(state.dirty?'<span class="labchip">INPUTS MODIFIED</span>':'')+'<div class="avatar">N</div></div></div>';}
function sidebar(){
  const tabs=[["overview","◈","Overview"],["claims","▥","Claims & Data"],["evidence","▣","Evidence Vault"],["spatial","⌖","Coastal GIS"],["audit","⟳","Re-verification"],["methods","▤","Methodology"]];
  return '<aside class="sidebar"><div class="brand"><div class="brandmark">≈</div><div><div class="brandname">NaFT</div><div class="brandsub">BLUE CARBON MRV</div></div></div><div class="navlabel">WORKSPACE</div><div class="navlist">'+tabs.map(([id,ic,title])=>'<button type="button" class="navbtn '+(state.tab===id?"active":"")+'" data-tab="'+id+'"><span class="navicon">'+ic+'</span>'+title+'</button>').join("")+'</div><div class="sidebottom"><strong>● SYNTHETIC / RESEARCH</strong>Not connected to a registry.<div style="margin-top:10px">Evidence Compiler v0.1.0</div><div>Re-verification Engine</div></div></aside>';
}
function cards(){
  const count=state.project.claims.length;
  const e=state.project.evidence.length;
  const all=state.last?.sumResearchEstimateTco2e||0;
  const gaps=state.last?.records.filter(x=>x.result.readiness==="EVIDENCE_GAPS").length||0;
  return '<section class="stats"><div class="stat"><div class="statlabel">RESEARCH ESTIMATE</div><div class="statvalue">'+fmt(all,2)+' <small>tCO₂e</small></div><div class="statfoot">Not certified or issued</div></div><div class="stat"><div class="statlabel">MONITORING CLAIMS</div><div class="statvalue">'+count+'</div><div class="statfoot">Tracked calculation records</div></div><div class="stat"><div class="statlabel">EVIDENCE ENTRIES</div><div class="statvalue">'+e+'</div><div class="statfoot">SHA-256 provenance metadata</div></div><div class="stat"><div class="statlabel">EVIDENCE GAPS</div><div class="statvalue">'+gaps+'</div><div class="statfoot">Records lacking supporting evidence</div></div></section>';
}
function table(){
  const rows=(state.last?.records||[]).map(r=>{
    const c=state.project.claims.find(c=>c.id===r.claimId);
    return '<tr><td><strong>'+esc(r.claimId)+'</strong><br><span class="mini">'+esc(c?.periodStart)+' → '+esc(c?.periodEnd)+'</span></td><td><span class="habitat"><i class="circle '+esc(r.habitat)+'"></i>'+esc(habitatName[r.habitat]||r.habitat)+'</span></td><td>'+fmt(c?.areaHa,2)+' ha</td><td><strong>'+fmt(r.result.estimateTco2e,3)+'</strong></td><td>'+pill(r.result.readiness==="RESEARCH_ESTIMATE",r.result.readiness==="RESEARCH_ESTIMATE"?"RESEARCH READY":"EVIDENCE GAPS")+'</td></tr>';
  }).join("");
  return '<div class="tablewrap"><table class="tbl"><thead><tr><th>Claim ID / Period</th><th>Habitat</th><th>Area</th><th>Estimated tCO₂e</th><th>Evidence</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}
function chart(){
  const records=state.last?.records||[];const max=Math.max(1,...records.map(r=>r.result.estimateTco2e));
  return '<div class="chart">'+records.map(r=>'<div class="barwrap"><div class="barval">'+fmt(r.result.estimateTco2e,1)+'</div><div class="bar" style="height:'+Math.max(3,Math.round(115*r.result.estimateTco2e/max))+'px"></div><div class="barlabel">'+esc(r.claimId)+'</div></div>').join("")+'</div><p class="help">Comparative research estimates only. No certified credits represented.</p>';
}
function overview(){
  return '<section class="hero"><div class="herocontent"><div class="eyebrow">COASTAL CARBON INTELLIGENCE</div><h1>Make ocean carbon<br>evidence auditable.</h1><p>Version-aware monitoring, quantitative research estimates, evidence provenance and targeted re-verification — one transparent workspace.</p><div class="heroactions">'+btn("compile","↻ Recalculate","primary")+btn("export","⇩ Export MRV Package","ghost")+'</div></div></section>'+cards()+
  '<div class="sectop"><div><h2>MRV research pipeline</h2><p>Each claim is bound to a methodology version and supporting evidence.</p></div></div><div class="grid2"><div class="panel"><div class="panelhead"><h3>Project evidence breakdown</h3><span class="chip">tCO₂e / illustration</span></div>'+chart()+'</div><div class="panel focus"><div class="panelhead"><h3>Project integrity</h3></div><div class="kv"><span>Project</span><b>'+esc(state.project.name)+'</b></div><div class="kv"><span>Methodology</span><b>'+esc(state.project.methodology.id)+'</b></div><div class="kv"><span>Version</span><b>'+esc(state.project.methodology.version)+'</b></div><div class="kv"><span>Registry issuance</span><b>DISABLED</b></div><div class="kv"><span>Package integrity</span><b class="mono">'+esc((state.last?.packageHash||"—").slice(0,16))+'…</b></div></div></div>'+
  '<div class="sectop"><div><h2>Monitoring claims</h2><p>Inputs and per-claim research status</p></div>'+btn("claims","Manage Claims →","outline")+'</div><div class="panel">'+table()+'</div>';
}
function claims(){
  return '<div class="sectop"><div><h2>Claims & Dataset Import</h2><p>Upload a research project (.json) or replace claim rows (.csv). Maximum 1 MB.</p></div></div>'+
    '<div class="panel"><div class="panelhead"><h3>Data intake</h3>'+pill(false,"LOCAL SESSION ONLY")+'</div><div class="row wrap"><div class="actions">'+btn("import-json","↑ Import JSON","dark")+btn("import-csv","↑ Import CSV","outline")+btn("download-csv","↓ CSV Template","outline")+btn("reset-demo","↺ Reset Demo","outline")+'</div></div><input id="jsonFile" class="hiddenfile" type="file" accept=".json,application/json"/><input id="csvFile" class="hiddenfile" type="file" accept=".csv,text/csv"/><p class="help">Original files are read in your browser; no server upload. CSV replaces all claims, retaining existing evidence manifests. IDs must match existing evidence IDs.</p></div>'+
    '<div class="panel"><div class="panelhead"><h3>Current claims</h3><span class="chip">'+state.project.claims.length+' records</span></div>'+table()+
    '<div class="actions">'+state.project.claims.map(c=>btn("remove:"+c.id,"✕ Remove "+esc(c.id),"danger small")).join("")+'</div></div>'+
    '<div class="panel"><div class="panelhead"><h3>Create a research claim</h3>'+pill(false,"NON-CERTIFIED")+'</div>'+
    '<form id="claimForm"><div class="fields">'+
    field("Claim ID","id","text","BC-NEW-001")+selectField("Habitat","habitat",HABITATS.map(h=>[h,habitatName[h]]),"seagrass")+
    field("Area (hectares)","areaHa","number","5","0.001")+
    field("Period start","periodStart","date","2025-01-01")+field("Period end (exclusive)","periodEnd","date","2026-01-01")+
    field("Baseline removal rate (tCO₂e/ha/year)","baselineRate","number","0.5","0.01")+
    field("Project removal rate (tCO₂e/ha/year)","projectRate","number","1.5","0.01")+
    field("Project emissions (tCO₂e)","projectEmissions","number","0","0")+
    field("Leakage (tCO₂e)","leakage","number","0","0")+
    field("Uncertainty deduction (%)","uncertaintyPct","number","10","0")+
    '<div class="field full"><label for="factorCitation">Factor source / version / justification (mandatory)</label><input id="factorCitation" name="factorCitation" maxlength="1000" required placeholder="Describe the scientific source and why the rate applies"/></div></div>'+
    '<p class="help">New claims are linked to existing evidence entries for convenience. Review whether every entry genuinely supports this claim before use. There are no implicit official rates.</p><div class="actions"><button type="submit" class="btn primary">+ Add Claim</button></div></form></div>';
}
function field(label,name,type,value,min){
  return '<div class="field"><label for="'+esc(name)+'">'+esc(label)+'</label><input id="'+esc(name)+'" name="'+esc(name)+'" type="'+esc(type)+'" value="'+esc(value)+'"'+(type==="number"?' step="any" min="'+(min??"0")+'"':"")+' required/></div>';
}
function selectField(label,name,options,chosen){
  return '<div class="field"><label for="'+esc(name)+'">'+esc(label)+'</label><select id="'+esc(name)+'" name="'+esc(name)+'">'+select(options,chosen)+'</select></div>';
}
function evidence(){
  const rows=state.project.evidence.map(e=>'<tr><td><strong>'+esc(e.id)+'</strong><br><span class="mini">'+esc(e.note||"—")+'</span></td><td>'+esc(e.type)+'</td><td class="mono">'+esc(e.sha256?e.sha256.slice(0,18)+"…":"MISSING")+'</td><td>'+state.project.claims.filter(c=>c.evidenceIds.includes(e.id)).length+' claims</td></tr>').join("");
  return '<div class="sectop"><div><h2>Evidence Vault</h2><p>Content-addressed manifests establish byte-level provenance, not scientific validity.</p></div></div>'+
    '<div class="panel"><div class="panelhead"><h3>Attach evidence file</h3>'+pill(true,"SHA-256")+'</div><div class="fields">'+
    selectField("Evidence role","evidenceType",[["monitoring","Monitoring"],["boundary","Site boundary"],["baseline","Baseline"],["factor","Factor source"],["other","Other"]],"monitoring")+
    selectField("Bind to claim","evidenceClaim",state.project.claims.map(c=>[c.id,c.id]),state.project.claims[0]?.id)+
    '<div class="field"><label>File (max 10MB)</label><input id="evidenceFile" type="file"/></div></div>'+
    '<div class="note">The browser computes a SHA-256 digest over the source bytes. Only name, type, digest and claim binding are kept in memory. The file itself is not stored or transmitted.</div><div class="fields"><div class="field"><label>Manifest to verify</label><select id="recheckId">'+select(state.project.evidence.map(e=>[e.id,e.id]),state.project.evidence[0]?.id)+'</select></div><div class="field wide"><label>Re-check original source bytes</label><input id="recheckFile" type="file"/></div></div></div>'+
    '<div class="panel"><div class="panelhead"><h3>Registered evidence manifests</h3><span class="chip">'+state.project.evidence.length+' entries</span></div><div class="tablewrap"><table class="tbl"><thead><tr><th>Evidence</th><th>Role</th><th>SHA-256</th><th>Dependencies</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>'+
    '<div class="panel"><h3>Evidence quality rules</h3><div class="feature"><b>01 · Distinct evidence roles</b><p>Boundary, monitoring, baseline and factor-source evidence are required for research readiness.</p></div><div class="feature"><b>02 · Content hash is not verification</b><p>A matching hash proves bytes are unchanged, not that observations or coefficients are scientifically sound.</p></div><div class="feature"><b>03 · Cross-claim dependencies</b><p>Changing shared evidence must invalidate every dependent claim for re-verification.</p></div></div>';
}
function spatial(){
 const source=state.spatial, r=source?.report;
 return '<div class="sectop"><div><h2>Coastal GIS · Boundary Pre-check</h2><p>Local GeoJSON polygon validation and approximate area.</p></div></div>'+
 '<div class="panel"><div class="panelhead"><h3>Inspect GeoJSON</h3>'+pill(false,"NON-AUTHORITATIVE")+'</div><div class="fields">'+
 selectField("Bind to claim","geoClaim",state.project.claims.map(c=>[c.id,c.id]),state.project.claims[0]?.id)+
 '<div class="field wide"><label>GeoJSON source (2 MB max)</label><input id="geoFile" type="file" accept=".json,.geojson,application/geo+json"/></div></div>'+
 '<p class="help">Polygon / MultiPolygon · WGS84 longitude/latitude assumed · restricted local extent · no overlap or topology certification.</p>'+
 (r?'<div class="note">Source: '+esc(source.filename)+' · SHA-256 '+esc(source.digest.slice(0,20))+'…</div>'+
 '<div class="statvalue">'+fmt(r.estimatedAreaHa,3)+' <small>ha (approx.)</small></div><p class="mini">Coordinates: '+r.vertexCount+' · Features: '+r.featureCount+' · Bounding box: '+r.bbox.map(x=>fmt(x,5)).join(", ")+'</p>'+
 '<div class="tablewrap"><table class="tbl"><thead><tr><th>Feature</th><th>Geometry</th><th>Approx. ha</th></tr></thead><tbody>'+
 r.features.map(f=>'<tr><td>'+esc(f.id)+'</td><td>'+esc(f.geometryType)+'</td><td>'+fmt(f.estimatedAreaHa,3)+'</td></tr>').join("")+'</tbody></table></div>'+
 '<div class="actions">'+btn("bind-geo","＋ Bind boundary digest","dark")+btn("export-geo","⇩ Export GIS report","outline")+'</div>'+
 r.reviewWarnings.map(w=>'<p class="help">⚠ '+esc(w)+'</p>').join("") :
 '<div class="note warning">Load coastal GeoJSON to estimate area. No certified survey, net removal or claim area is inferred.</div>')+'</div>';
}

function audit(){
 const d=state.delta||{new:[],changed:[],unchanged:[],removed:[]};
 return '<div class="sectop"><div><h2>Re-verification Engine</h2><p>Only claims whose methodology, parameters, or bound evidence changed are invalidated.</p></div>'+btn("compile","↻ Run new revision","dark")+'</div>'+
  '<div class="panel"><div class="panelhead"><h3>Dependency diff</h3><span class="chip">'+(state.previous?"2 snapshots compared":"Initial compilation")+'</span></div>'+
  '<div class="deltas"><div class="delta"><b>'+d.new.length+'</b><span>NEW CLAIMS</span></div><div class="delta"><b>'+d.changed.length+'</b><span>REVERIFY</span></div><div class="delta"><b>'+d.unchanged.length+'</b><span>UNCHANGED</span></div><div class="delta"><b>'+d.removed.length+'</b><span>REMOVED</span></div></div>'+
  '<div class="note">'+(state.previous?"Changes are detected by comparing cryptographic dependency fingerprints.":"Change the evidence or input parameters, then run a new revision to see impacted claims.")+'</div>'+
  '<div class="kv"><span>Latest package hash</span><b class="mono">'+esc(state.last?.packageHash||"—")+'</b></div>'+
  '<div class="kv"><span>Previous package hash</span><b class="mono">'+esc(state.previous?.packageHash||"—")+'</b></div>'+
  '<div class="actions">'+btn("export","⇩ Export audit JSON","outline")+'</div></div>'+
  '<div class="panel"><div class="panelhead"><h3>Claim dependency fingerprints</h3></div><div class="tablewrap"><table class="tbl"><thead><tr><th>Claim</th><th>Fingerprint (SHA-256)</th><th>Re-verification</th></tr></thead><tbody>'+
  (state.last?.records||[]).map(r=>'<tr><td>'+esc(r.claimId)+'</td><td class="mono">'+esc(r.fingerprint.slice(0,30))+'…</td><td>'+pill(!d.changed.includes(r.claimId),d.changed.includes(r.claimId)?"REVERIFY":d.new.includes(r.claimId)?"NEW":"UNCHANGED")+'</td></tr>').join("")+
  '</tbody></table></div></div>';
}
function methods(){
 return '<div class="sectop"><div><h2>Methodology Governance</h2><p>Version pinning and citation references; no methodology is represented as an approved executable implementation.</p></div></div>'+
 '<div class="panel"><div class="panelhead"><h3>Reference pack</h3>'+pill(false,"REFERENCE ONLY")+'</div>'+
 '<div class="fields">'+selectField("Framework","methodId",Object.entries(METHODOLOGIES).map(([id,m])=>[id,m.label]),state.project.methodology.id)+
 '<div class="field"><label for="methodVersion">Pinned method version</label><input id="methodVersion" maxlength="60" value="'+esc(state.project.methodology.version)+'"/></div></div>'+
 '<p class="help">Switching reference packs never silently supplies rates. It updates the methodology dependency and triggers re-verification on the next run.</p>'+
 '<div class="actions">'+btn("save-method","Save methodology reference","dark")+'</div></div>'+
 '<div class="panel"><div class="panelhead"><h3>Authoritative references</h3></div><div class="refs">'+
 '<a href="https://www.blueeconomy.jp/credit/" target="_blank" rel="noopener noreferrer">↗ Japan Blue Economy Association — J-Blue Credit application guidance (Ver.2.6, March 2026)</a>'+
 '<a href="https://verra.org/methodologies/vm0033-methodology-for-tidal-wetland-and-seagrass-restoration-v2-1/" target="_blank" rel="noopener noreferrer">↗ Verra — VM0033 v2.1</a>'+
 '<a href="https://www.ipcc-tfi.iges.or.jp/public/wetlands/index.html" target="_blank" rel="noopener noreferrer">↗ IPCC — 2013 Wetlands Supplement, Chapter 4 Coastal Wetlands</a></div></div>'+
 '<div class="note warning"><b>Important scientific boundary.</b> The generic rate-difference demonstration is not equivalent to J-Blue Credit calculations, VM0033 net GHG accounting, permanence treatment, leakage rules, uncertainty requirements or registry issuance. Independent expert review is mandatory before use with real credit claims.</div>';
}
function render(){
 root.innerHTML='<div class="shell">'+sidebar()+'<main class="main">'+header()+
 (state.notice?'<div role="status" class="toast">'+esc(state.notice)+'</div>':"")+
 (state.error?'<div role="alert" class="note error">'+esc(state.error)+'</div>':"")+(state.dirty?'<div class="note warning">Changes pending compilation. Displayed estimates may be stale. Exports recalculate first.</div>':"")+
 ({overview,claims,evidence,spatial,audit,methods})[state.tab]()+ 
 '<footer class="footer"><span>NaFT Blue Carbon MRV · Research Prototype v0.1.0</span><span>© NaFT / Independent MRV research · No credit issuance</span></footer></main></div>';
}
async function compile(){const errors=validateProject(state.project);if(errors.length){notice(errors.join("; "),true);return false;}try{const next=await compileProject(state.project);state.previous=state.last;state.last=next;state.delta=comparePackages(state.previous,next);state.dirty=false;notice("Research package compiled. No formal certification or issuance was performed.");return true;}catch(e){notice(e.message,true);return false;}}
async function importFile(file,kind){
 if(!file)return;if(file.size>1024*1024){notice("Dataset must be under 1 MB",true);return;}
 try{
  const content=await file.text();
  if(kind==="json"){const obj=JSON.parse(content);const errors=validateProject(obj);if(errors.length)throw Error(errors.join("; "));state.project=obj;}
  else {const rows=parseClaimsCsv(content);const obj=deepcopy(state.project);obj.claims=rows;const errors=validateProject(obj);if(errors.length)throw Error(errors.join("; "));state.project=obj;}
  state.dirty=true;state.notice="Dataset imported locally. Recalculate to generate a new versioned package.";state.error="";state.tab="claims";render();
 }catch(e){notice("Import rejected: "+e.message,true);}
}
function claimFromForm(form){
 const data=new FormData(form);const c={};
 for(const k of ["id","habitat","periodStart","periodEnd","factorCitation"])c[k]=String(data.get(k)||"").trim();
 for(const k of ["areaHa","baselineRate","projectRate","projectEmissions","leakage","uncertaintyPct"]){
   const value=String(data.get(k)||"").trim();
   if(!value)throw Error(k+" is required");
   c[k]=Number(value);
 }
 c.evidenceIds=state.project.evidence.map(e=>e.id);
 return c;
}
root.addEventListener("click",async event=>{
 const tab=event.target.closest("[data-tab]");if(tab){state.tab=tab.dataset.tab;state.notice="";state.error="";render();return;}
 const node=event.target.closest("[data-action]");if(!node)return;
 const act=node.dataset.action;
 if(act==="compile"){await compile();return;}
 if(act==="claims"){state.tab="claims";render();return;}
 if(act==="export"){if(!state.last||state.dirty){const ok=await compile();if(!ok)return;}if(state.last){download("naft-bluecarbon-mrv-package.json",JSON.stringify({package:state.last,sourceProject:state.project,comparison:state.delta,spatialPrecheck:state.spatial?.report||null,spatialSourceSha256:state.spatial?.digest||null},null,2),"application/json");}return;}
 if(act==="import-json"){$("jsonFile").click();return;}
 if(act==="import-csv"){$("csvFile").click();return;}
 if(act==="download-csv"){
 const keys=["id","habitat","periodStart","periodEnd","areaHa","baselineRate","projectRate","projectEmissions","leakage","uncertaintyPct","factorCitation","evidenceIds"];
 const lines=[keys.join(",")].concat(state.project.claims.map(c=>keys.map(k=>'"'+String(k==="evidenceIds"?c[k].join("|"):c[k]).replace(/"/g,'""')+'"').join(",")));
 download("naft-bluecarbon-claims-template.csv",lines.join("\r\n")+"\r\n","text/csv");return;
 }
 if(act==="reset-demo"){state.project=deepcopy(demo);state.last=null;state.previous=null;state.delta=null;state.spatial=null;state.dirty=true;state.tab="overview";await compile();return;}
 if(act.startsWith("remove:")){
  if(state.project.claims.length<=1){notice("At least one claim is required.",true);return;}
  const id=act.slice(7);state.project.claims=state.project.claims.filter(c=>c.id!==id);
  state.dirty=true;state.notice="Claim removed. Recalculate to update the package.";render();return;
 }
 if(act==="bind-geo"){
  if(!state.spatial){notice("Import GeoJSON first.",true);return;}
  const claim=state.project.claims.find(c=>c.id===$("geoClaim").value);
  if(!claim){notice("Select a claim.",true);return;}
  const {digest,filename,report}=state.spatial,id="EV-BOUNDARY-"+state.spatial.digest.slice(0,20);
  if(!state.project.evidence.some(e=>e.id===id)){
    if(state.project.evidence.length>=500){notice("Too many evidence entries",true);return;}
    state.project.evidence.push({id,type:"boundary",sha256:digest,note:"GeoJSON pre-check / "+filename+" / approx "+report.estimatedAreaHa.toFixed(3)+" ha"});
  }
  if(!claim.evidenceIds.includes(id))claim.evidenceIds.push(id);
  state.dirty=true;
  notice("GeoJSON digest bound to "+claim.id+". Declared claim area has NOT changed.");return;
 }
 if(act==="export-geo"){
  if(!state.spatial){notice("Import GeoJSON first.",true);return;}
  download("naft-gis-precheck.json",JSON.stringify({sourceSha256:state.spatial.digest,filename:state.spatial.filename,report:state.spatial.report},null,2),"application/json");return;
 }
 if(act==="save-method"){
   const id=$("methodId").value,version=$("methodVersion").value.trim();
   if(!version||version.length>60){notice("Invalid methodology version.",true);return;}
   state.project.methodology={id,version};state.dirty=true;notice("Methodology reference saved. Recalculate to record version dependencies.");return;
 }
});
root.addEventListener("submit",event=>{
 if(event.target.id!=="claimForm")return;
 event.preventDefault();
 try{const claim=claimFromForm(event.target);const p=deepcopy(state.project);p.claims.push(claim);
 const errors=validateProject(p);if(errors.length)throw Error(errors.join("; "));
 state.project=p;state.dirty=true;notice("Claim added. Recalculate to update the package.");
 }catch(e){notice("Claim rejected: "+e.message,true);}
});
root.addEventListener("change",async event=>{
 const id=event.target.id;
 if(id==="jsonFile"||id==="csvFile"){await importFile(event.target.files?.[0],id==="jsonFile"?"json":"csv");return;}
 if(id==="recheckFile"){
  const file=event.target.files?.[0];if(!file)return;
  try{
    const entry=state.project.evidence.find(e=>e.id===$("recheckId").value);
    if(!entry)throw Error("Missing evidence manifest");
    if(file.size>10*1024*1024)throw Error("Original source exceeds 10 MB");
    const result=await verifyEvidenceBytes(entry,new Uint8Array(await file.arrayBuffer()));
    notice("Evidence bytes: "+result.status+" · "+entry.id+". This is a byte identity check, not scientific verification.",result.status!=="MATCH");
  }catch(e){notice("Re-check failed: "+e.message,true);}return;
 }
 if(id==="geoFile"){
  const file=event.target.files?.[0];if(!file)return;
  if(file.size>2*1024*1024){notice("GeoJSON exceeds 2 MB",true);return;}
  try{
    const bytes=new Uint8Array(await file.arrayBuffer());
    const json=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(bytes));
    const report=inspectGeoJSON(json),digest=await sha256(bytes);
    state.spatial={report,digest,filename:file.name.slice(0,180)};
    notice("GIS area pre-check calculated. It is not a certified polygon survey.");
  }catch(e){state.spatial=null;notice("GeoJSON rejected: "+e.message,true);}return;
 }
 if(id==="evidenceFile"){
   const file=event.target.files?.[0];if(!file)return;
   if(file.size>10*1024*1024){notice("Evidence must be under 10 MB.",true);return;}
   try{
    const type=$("evidenceType").value,claimId=$("evidenceClaim").value;
    const m=await createEvidenceManifest({type,bytes:new Uint8Array(await file.arrayBuffer()),filename:file.name.slice(0,180),claimId});
    const id=m.id;
    if(!state.project.evidence.some(e=>e.id===id)){
      if(state.project.evidence.length>=500)throw Error("Evidence limit reached");
      state.project.evidence.push({id:m.id,type:m.type,sha256:m.sha256,note:m.note});
    }
    const target=state.project.claims.find(c=>c.id===claimId);
    if(target&&!target.evidenceIds.includes(id))target.evidenceIds.push(id);
    state.dirty=true;notice("Evidence digest recorded for "+claimId+". Original file was not uploaded.");
   }catch(e){notice("Could not hash evidence: "+e.message,true);}
 }
});
compile();
