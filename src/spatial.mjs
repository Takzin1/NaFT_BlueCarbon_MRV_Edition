/**
 * NaFT coastal GIS pre-check v0.2 — research-only.
 * EPSG:4326 lon/lat coordinates are assumed; not independently verified.
 * Equirectangular local projection area is an APPROXIMATION, never scheme-certified area.
 * Overlap, cadastral ownership, topology and remote-sensing validity are NOT assessed.
 */
export const SPATIAL_SCHEMA = "NAFT-SPATIAL-PRECHECK/0.2.0";
const R = 6371008.8;
const deg = Math.PI / 180;
const finite = n => typeof n === "number" && Number.isFinite(n);
function fail(message) { throw new Error("GeoJSON rejected: " + message); }
function coordinatesOfRing(ring, context, tally) {
  if (!Array.isArray(ring) || ring.length < 4 || ring.length > 10000) fail(context + ": ring requires 4–10000 points");
  tally.count += ring.length;
  if (tally.count > 50000) fail("Too many coordinates (max 50000)");
  for (const p of ring) {
    if (!Array.isArray(p) || p.length < 2 || !finite(p[0]) || !finite(p[1])) fail(context + ": coordinates must be finite [longitude,latitude]");
    if (p[0] < -180 || p[0] > 180 || p[1] < -90 || p[1] > 90) fail(context + ": lon/lat out of range");
  }
  const first = ring[0], last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) fail(context + ": ring must be explicitly closed");
  for (let i=1;i<ring.length;i++) {
    if(ring[i][0]===ring[i-1][0]&&ring[i][1]===ring[i-1][1]) fail(context + ": repeated adjacent coordinate");
    if(Math.abs(ring[i][0]-ring[i-1][0])>180) fail(context + ": antimeridian crossing not supported");
  }
  const lons=ring.map(p=>p[0]),lats=ring.map(p=>p[1]);
  if(Math.max(...lons)-Math.min(...lons)>3 || Math.max(...lats)-Math.min(...lats)>3) fail(context + ": area approximation limited to 3° local spans");
  return ring;
}
function approximateRingArea(ring) {
  const midLat=ring.slice(0,-1).reduce((n,p)=>n+p[1],0)/(ring.length-1);
  const scaleLon=R*deg*Math.cos(midLat*deg),scaleLat=R*deg;
  let doubleArea=0;
  for(let i=0;i<ring.length-1;i++){
    const [x,y]=ring[i], [x2,y2]=ring[i+1];
    doubleArea+=(x*scaleLon)*(y2*scaleLat)-(x2*scaleLon)*(y*scaleLat);
  }
  return Math.abs(doubleArea)/2/10000;
}
function pointInRing(pt,ring) {
  const x=pt[0],y=pt[1];
  let inside=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++) {
    const xi=ring[i][0], yi=ring[i][1],xj=ring[j][0],yj=ring[j][1];
    if(((yi>y)!==(yj>y))&&(x<((xj-xi)*(y-yi))/(yj-yi)+xi))inside=!inside;
  }
  return inside;
}
function onePolygon(poly, ctx, tally) {
  if(!Array.isArray(poly) || !poly.length || poly.length>500) fail(ctx + ": invalid polygon rings");
  const rings=poly.map((r,i)=>coordinatesOfRing(r,ctx+"/ring"+i,tally));
  if(rings.slice(1).some(r=>!pointInRing(r[0],rings[0]))) fail(ctx + ": hole outside outer ring");
  const outer=approximateRingArea(rings[0]);
  const holes=rings.slice(1).reduce((n,r)=>n+approximateRingArea(r),0);
  if(!Number.isFinite(outer)||outer <= 0 || holes>=outer)fail(ctx + ": nonpositive area");
  return {areaHa:outer-holes,positions:rings.flat()};
}
export function inspectGeoJSON(input) {
  if(!input||typeof input!=="object"||Array.isArray(input))fail("object required");
  if(Object.hasOwn(input,"crs"))fail("legacy/custom CRS not accepted; supply RFC7946 WGS84 lon/lat");
  let features;
  if(input.type==="FeatureCollection"&&Array.isArray(input.features)) features=input.features;
  else if(input.type==="Feature")features=[input];
  else fail("Feature or FeatureCollection required");
  if(!features.length||features.length>100)fail("1–100 features required");
  const tally={count:0},records=[],ids=new Set();
  let allPositions=[];
  for(let i=0;i<features.length;i++){
    const f=features[i];
    if(!f || f.type!=="Feature" || !f.geometry)fail("feature "+(i+1)+" is invalid");
    const type=f.geometry.type;
    if(type!=="Polygon"&&type!=="MultiPolygon")fail("only Polygon/MultiPolygon accepted, got "+String(type));
    const id=typeof f.id==="string"&&f.id.trim()?f.id.trim():
      typeof f.properties?.id==="string"&&f.properties.id.trim()?f.properties.id.trim():"feature-"+(i+1);
    if(id.length>100||ids.has(id))fail("feature ID invalid or duplicated: "+id);
    ids.add(id);
    const polys=type==="Polygon"?[f.geometry.coordinates]:f.geometry.coordinates;
    if(!Array.isArray(polys)||!polys.length||polys.length>100)fail(id+": invalid multipolygon parts");
    const results=polys.map((p,k)=>onePolygon(p,id+"/polygon"+k,tally));
    const positions=results.flatMap(p=>p.positions);
    const bbox=[Math.min(...positions.map(p=>p[0])),Math.min(...positions.map(p=>p[1])),Math.max(...positions.map(p=>p[0])),Math.max(...positions.map(p=>p[1]))];
    if(bbox[2]-bbox[0]>3||bbox[3]-bbox[1]>3)fail(id+": feature exceeds 3° local area span");
    const areaHa=results.reduce((n,p)=>n+p.areaHa,0);
    records.push({id,geometryType:type,estimatedAreaHa:areaHa,bbox,vertexCount:positions.length});
    allPositions=allPositions.concat(positions);
  }
  const bbox=[Math.min(...allPositions.map(p=>p[0])),Math.min(...allPositions.map(p=>p[1])),Math.max(...allPositions.map(p=>p[0])),Math.max(...allPositions.map(p=>p[1]))];
  return {
    schema:SPATIAL_SCHEMA,coordinateConvention:"RFC7946 [longitude,latitude] (assumed)",
    featureCount:records.length,features:records,
    estimatedAreaHa:records.reduce((n,f)=>n+f.estimatedAreaHa,0),
    bbox,vertexCount:tally.count,
    authoritativeAreaHa:null,certificationAccepted:false,
    reviewWarnings:[
      "APPROXIMATE area using a local equirectangular projection, not a geodesic or official survey.",
      "Overlapping polygons, topology/self-intersections, rights, habitat eligibility and CRS truth are not independently verified.",
      "Never infer net removal, eligible credited area, or scheme approval from this GIS pre-check."
    ]
  };
}
