/**
 * Research-only coastal carbon-stock and gas-observation ledger.
 * A carbon-stock change is NOT the same as verified sequestration or issued credit.
 * No default GWP, additionality, methane oxidation or permanence assumptions.
 */
export const OBSERVATION_SCHEMA="NAFT-OBSERVATION-LEDGER/0.3.0";
export const POOLS=["aboveground_biomass","belowground_biomass","sediment_organic_carbon","other"];
export const GASES=["CH4","N2O"];
const validNumber=(n,min,max)=>typeof n==="number"&&Number.isFinite(n)&&n>=min&&n<=max;
const label=(v,n=120)=>typeof v==="string"&&v.trim().length>0&&v.length<=n;
const C_TO_CO2=44/12; // molecular-mass ratio, not an emission factor
export const validateMonitoring=(project)=>{
 const errors=[],claims=Array.isArray(project?.claims)?project.claims:[],evidence=Array.isArray(project?.evidence)?project.evidence:[];
 const claimById=new Map(claims.filter(c=>c && typeof c==="object").map(c=>[c.id,c]));const evidenceById=new Map(evidence.filter(e=>e && typeof e==="object").map(e=>[e.id,e]));
 for(const kind of ["carbonPools","gasFluxes"]){
   const arr=project?.[kind];
   if(arr===undefined)continue;
   if(!Array.isArray(arr)||arr.length>200){errors.push(kind+" must be an array (max 200)");continue;}
   const keys=new Set(),slots=new Set();
   for(let i=0;i<arr.length;i++){
     const row=arr[i],where=kind+"["+i+"]";
     if(!row||typeof row!=="object"||Array.isArray(row)){errors.push(where+" must be an object");continue;}
     if(!label(row.id,80)||keys.has(row.id))errors.push(where+".id required and unique");else keys.add(row.id);
     const claim=claimById.get(row.claimId);
     if(!claim)errors.push(where+".claimId unknown");
     if(!label(row.factorCitation,1000))errors.push(where+".factorCitation required");
     const refs=row.evidenceIds;
     if(!Array.isArray(refs)||refs.length<1||refs.length>50||new Set(refs).size!==refs.length||
        refs.some(id=>typeof id!=="string"||!evidenceById.has(id)||!claim?.evidenceIds?.includes(id))){
        errors.push(where+".evidenceIds must reference claim-linked evidence");
     }
     if(kind==="carbonPools"){
       if(!POOLS.includes(row.pool))errors.push(where+".pool invalid");
       const slot=row.claimId+"|"+row.pool;
       if(slots.has(slot))errors.push(where+" duplicate pool for claim (stratification not yet supported)");
       slots.add(slot);
       if(!validNumber(row.areaHa,0.000001,10000000)||!!claim?.areaHa&&row.areaHa>claim.areaHa)errors.push(where+".areaHa invalid/outside claim area");
       if(!["stocks","sediment"].includes(row.measurementKind))errors.push(where+".measurementKind invalid");
       if(row.measurementKind==="stocks"){
         if(!validNumber(row.startStockTcHa,0,1e8)||!validNumber(row.endStockTcHa,0,1e8))
          errors.push(where+" stocks require start/end tC/ha");
       }
       if(row.measurementKind==="sediment"){
         if(row.pool!=="sediment_organic_carbon")errors.push(where+" sediment measurements require sediment_organic_carbon pool");
         for(const at of ["start","end"]){
           const m=row[at];
           if(!m||!validNumber(m.bulkDensityGcm3,0.000001,3)||!validNumber(m.depthCm,0.000001,300)||!validNumber(m.organicCarbonFraction,0,1)){
             errors.push(where+"."+at+" invalid bulk density/depth/organic carbon fraction");
           }
         }
         if(row.start?.depthCm!==row.end?.depthCm)errors.push(where+" sediment comparison requires equal sampling depths");
       }
       if(!validNumber(row.uncertaintyPct,0,100))errors.push(where+".uncertaintyPct required (0–100)");
     }else{
       if(!GASES.includes(row.gas))errors.push(where+".gas invalid");
       const slot=row.claimId+"|"+row.gas;
       if(slots.has(slot))errors.push(where+" duplicate gas for claim (multiple sources not supported)");
       slots.add(slot);
       if(!validNumber(row.totalKg,0,1e10))errors.push(where+".totalKg invalid");
       if(!validNumber(row.gwp100,0.000001,100000))errors.push(where+".gwp100 is required: supply source-specific factor");
     }
   }
 }
 return errors;
};
export const sedimentCarbonStockTcHa=({bulkDensityGcm3,depthCm,organicCarbonFraction})=>
 bulkDensityGcm3*depthCm*100*organicCarbonFraction;
// 1 g/cm³ × 1 cm × 1 ha = 100 Mg dry soil/ha.
export function compileMonitoringClaim(project,claimId){
 const poolRows=(project.carbonPools||[]).filter(r=>r.claimId===claimId).sort((a,b)=>a.id.localeCompare(b.id));
 const gasRows=(project.gasFluxes||[]).filter(r=>r.claimId===claimId).sort((a,b)=>a.id.localeCompare(b.id));
 const pools=poolRows.map(p=>{
   const startTcHa=p.measurementKind==="sediment"?sedimentCarbonStockTcHa(p.start):p.startStockTcHa;
   const endTcHa=p.measurementKind==="sediment"?sedimentCarbonStockTcHa(p.end):p.endStockTcHa;
   const changeTc=(endTcHa-startTcHa)*p.areaHa;
   const changeTco2e=changeTc*C_TO_CO2;
   const uncertaintyDisplayTco2e=Math.abs(changeTco2e)*p.uncertaintyPct/100;
   return {id:p.id,pool:p.pool,measurementKind:p.measurementKind,areaHa:p.areaHa,startStockTcHa:startTcHa,endStockTcHa:endTcHa,
     changeTc,changeTco2e,uncertaintyDisplayTco2e,evidenceIds:[...p.evidenceIds],factorCitation:p.factorCitation};
 });
 const gases=gasRows.map(g=>({
   id:g.id,gas:g.gas,totalKg:g.totalKg,gwp100:g.gwp100,
   emissionTco2e:g.totalKg*g.gwp100/1000,evidenceIds:[...g.evidenceIds],factorCitation:g.factorCitation
 }));
 const stockChangeTco2e=pools.reduce((sum,x)=>sum+x.changeTco2e,0);
 const gasEmissionTco2e=gases.reduce((sum,x)=>sum+x.emissionTco2e,0);
 return {schema:OBSERVATION_SCHEMA,claimId,hasObservations:pools.length+gases.length>0,
   pools,gases,stockChangeTco2e,gasEmissionTco2e,
   uncertaintyDisplayTco2e:pools.reduce((sum,x)=>sum+x.uncertaintyDisplayTco2e,0),
   netCreditableTco2e:null,netDiagnosticTco2e:null,certifiedTco2e:null,
   warnings:[
     "Stock-change diagnostics are not verified atmospheric sequestration or creditable removals.",
     "Uncertainty display is a scenario percentage, not propagated statistical confidence.",
     "Gas emissions are reported separately and never subtracted from the generic NaFT claim estimate.",
     "Carbon pools, project boundaries, baseline, permanence, displacement and gas inventory completeness have not been established."
   ]};
}
export const linkedMonitoringInputs=(project,claimId)=>({
  carbonPools:(project.carbonPools||[]).filter(r=>r.claimId===claimId).map(r=>({...r,evidenceIds:[...r.evidenceIds].sort()})).sort((a,b)=>a.id.localeCompare(b.id)),
  gasFluxes:(project.gasFluxes||[]).filter(r=>r.claimId===claimId).map(r=>({...r,evidenceIds:[...r.evidenceIds].sort()})).sort((a,b)=>a.id.localeCompare(b.id))
});
