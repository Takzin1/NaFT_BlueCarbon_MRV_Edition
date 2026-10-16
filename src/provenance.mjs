import {sha256,stableStringify} from "./core.mjs";
const HEX=/^[a-f0-9]{64}$/i;
export async function verifyEvidenceBytes(evidence,bytes) {
  if (!evidence || typeof evidence!=="object" || !HEX.test(evidence.sha256||"")) throw new Error("A valid 64-character evidence SHA-256 is required");
  if (!(bytes instanceof Uint8Array)) throw new Error("Evidence bytes must be Uint8Array");
  if (bytes.byteLength>10*1024*1024) throw new Error("Evidence file exceeds 10 MB");
  const computedSha256=await sha256(bytes);
  return {evidenceId:evidence.id||null,expectedSha256:evidence.sha256.toLowerCase(),computedSha256,
    status:computedSha256===evidence.sha256.toLowerCase()?"MATCH":"MISMATCH",scientificallyVerified:false};
}
export async function createEvidenceManifest({type,bytes,filename,claimId}) {
  if(!["boundary","monitoring","baseline","factor","other"].includes(type))throw new Error("Unknown evidence type");
  if(!(bytes instanceof Uint8Array)||bytes.byteLength>10*1024*1024)throw new Error("Invalid evidence bytes (max 10 MB)");
  if(typeof filename!=="string"||!filename.trim()||filename.length>180)throw new Error("Invalid filename");
  const digest=await sha256(bytes);
  const id="EV-"+type.toUpperCase()+"-"+digest.slice(0,20);
  return {id,type,sha256:digest,note:"Locally hashed source: "+filename,claimId:claimId||null};
}
export async function auditPackageIntegrity(bundle) {
  if (!bundle || typeof bundle!=="object" || !bundle.package || !bundle.sourceProject) throw new Error("Expected an exported package bundle");
  const {compileProject}=await import("./core.mjs");
  const compiled=await compileProject(bundle.sourceProject);
  const supplied=bundle.package;
  return {
    packageHashMatches:compiled.packageHash===supplied.packageHash,
    outputMatches:stableStringify(compiled)===stableStringify(supplied),
    locallyRecomputedHash:compiled.packageHash,
    exportedHash:supplied.packageHash||null,
    certified:false,
    warning:"Only checks local reproducibility; never establishes data truth, identity, scheme compliance or third-party approval."
  };
}
