import {execFileSync} from 'node:child_process';
import {build,transform} from 'esbuild';
import {rm,mkdir,cp,readFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
// Windows ships "python" (python3 is only a Store alias); UTF-8 mode keeps the
// scripts' read_text()/write_text() off the cp1252 locale codec.
const python=process.env.PYTHON||(process.platform==='win32'?'python':'python3');
const pyEnv={...process.env,PYTHONUTF8:'1'};
for(const script of ['scripts/package-companion.py','scripts/build-reference.py','scripts/reference-fields.py'])execFileSync(python,[script],{stdio:'inherit',env:pyEnv});
for(const file of ['public/reference/runtime.js','public/reference/current-components.js'])await transform(await readFile(file,'utf8'),{loader:'js',target:'es2022',sourcefile:file});
await import('./scripts/build-source.mjs');
await rm('dist',{recursive:true,force:true});
await mkdir('dist/server',{recursive:true});
await cp('public','dist/client',{recursive:true});
await build({entryPoints:['public/planner.js'],bundle:true,format:'esm',target:'es2022',outfile:'dist/client/planner.js',minify:true});
await build({entryPoints:['public/invitation-motion.js'],bundle:true,format:'esm',target:'es2022',outfile:'dist/client/invitation-motion.js',minify:true});
await build({entryPoints:['server/worker.js'],bundle:true,format:'esm',target:'es2022',platform:'browser',outfile:'dist/server/index.js',minify:true});
await mkdir('dist/.openai',{recursive:true});
// hosting.json is local deploy config (gitignored); a fresh clone builds without it.
if(existsSync('.openai/hosting.json'))await cp('.openai/hosting.json','dist/.openai/hosting.json');
await cp('drizzle','dist/.openai/drizzle',{recursive:true});
console.log('Built wedding workspace, API and preserved invitation studio.');
