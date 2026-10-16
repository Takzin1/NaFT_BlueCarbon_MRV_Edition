#!/usr/bin/env node
// Usage: node src/cli.mjs [research-project.json] > audit-package.json
// Writes JSON to stdout, errors to stderr. Never issues carbon credits.
import {readFile} from "node:fs/promises";
import {demo} from "./demo.mjs";
import {compileProject} from "./core.mjs";
async function run() {
 const input=process.argv[2] ? JSON.parse(await readFile(process.argv[2],"utf8")) : demo;
 const report=await compileProject(input);
 process.stdout.write(JSON.stringify({package:report,sourceProject:input},null,2)+"\n");
}
run().catch(e=>{console.error(e.message);process.exitCode=1;});
