// Synthetic numbers, not sourced from field campaigns or official emission-factor tables.
export const syntheticObservations={
 carbonPools:[
  {id:"STOCK-SEA-AG",claimId:"SEA-001",pool:"aboveground_biomass",measurementKind:"stocks",areaHa:12.4,
   startStockTcHa:3.1,endStockTcHa:3.6,uncertaintyPct:18,
   factorCitation:"SYNTHETIC stock observations (tC/ha), illustrative only",
   evidenceIds:["EV-FIELD-01","EV-FACTOR-01"]},
  {id:"STOCK-SEA-SED",claimId:"SEA-001",pool:"sediment_organic_carbon",measurementKind:"sediment",areaHa:12.4,
   start:{bulkDensityGcm3:0.82,depthCm:20,organicCarbonFraction:0.028},
   end:{bulkDensityGcm3:0.83,depthCm:20,organicCarbonFraction:0.029},
   uncertaintyPct:24,factorCitation:"SYNTHETIC sediment cores, identical-depth comparison; not a validated sequestration method",
   evidenceIds:["EV-FIELD-01","EV-FACTOR-01"]},
  {id:"STOCK-MAR-BG",claimId:"MAR-002",pool:"belowground_biomass",measurementKind:"stocks",areaHa:7.8,
   startStockTcHa:5.5,endStockTcHa:5.8,uncertaintyPct:20,
   factorCitation:"SYNTHETIC biomass C/ha measurements only",
   evidenceIds:["EV-FIELD-01"]}
 ],
 gasFluxes:[
  {id:"GAS-SEA-CH4",claimId:"SEA-001",gas:"CH4",totalKg:180,gwp100:27,
   factorCitation:"SYNTHETIC scenario GWP100=27, user-supplied; not a scheme-approved coefficient",
   evidenceIds:["EV-FIELD-01","EV-FACTOR-01"]},
  {id:"GAS-MAR-N2O",claimId:"MAR-002",gas:"N2O",totalKg:14,gwp100:273,
   factorCitation:"SYNTHETIC scenario GWP100=273, user-supplied; not a scheme-approved coefficient",
   evidenceIds:["EV-FIELD-01","EV-FACTOR-01"]}
 ]};
