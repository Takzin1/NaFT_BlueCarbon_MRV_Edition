// All entities, measurements, hashes and quantities are synthetic demonstration fixtures.
const digest=(hex)=>hex.repeat(64);
export const demo={
  id:"DEMO-BLUE-001",
  name:"Synthetic Coastal Restoration — Demo Bay",
  methodology:{id:"NAFT-RESEARCH",version:"0.1.0"},
  evidence:[
    {id:"EV-BOUND-01",type:"boundary",sha256:digest("a"),note:"SYNTHETIC: polygon boundary manifest"},
    {id:"EV-FIELD-01",type:"monitoring",sha256:digest("b"),note:"SYNTHETIC: field survey manifest"},
    {id:"EV-BASE-01",type:"baseline",sha256:digest("c"),note:"SYNTHETIC: reference baseline manifest"},
    {id:"EV-FACTOR-01",type:"factor",sha256:digest("d"),note:"SYNTHETIC: rate assumption manifest"}
  ],
  claims:[
    {id:"SEA-001",habitat:"seagrass",periodStart:"2025-01-01",periodEnd:"2026-01-01",areaHa:12.4,baselineRate:0.8,projectRate:2.6,projectEmissions:1.2,leakage:0.4,uncertaintyPct:15,factorCitation:"SYNTHETIC illustrative rates; not from an approved factor table",evidenceIds:["EV-BOUND-01","EV-FIELD-01","EV-BASE-01","EV-FACTOR-01"]},
    {id:"MAR-002",habitat:"saltmarsh",periodStart:"2025-01-01",periodEnd:"2026-01-01",areaHa:7.8,baselineRate:1.1,projectRate:3.2,projectEmissions:0.8,leakage:0.3,uncertaintyPct:20,factorCitation:"SYNTHETIC illustrative rates; not from an approved factor table",evidenceIds:["EV-BOUND-01","EV-FIELD-01","EV-BASE-01","EV-FACTOR-01"]},
    {id:"FLAT-003",habitat:"tidal_flat",periodStart:"2025-01-01",periodEnd:"2026-01-01",areaHa:3.5,baselineRate:0.5,projectRate:1.4,projectEmissions:0.2,leakage:0.1,uncertaintyPct:10,factorCitation:"SYNTHETIC illustrative rates; not from an approved factor table",evidenceIds:["EV-BOUND-01","EV-FIELD-01","EV-BASE-01","EV-FACTOR-01"]}
  ]
};
