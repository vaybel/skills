import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const product = process.argv[2] ?? 'vaybel';
if (!['vaybel', 'printgen'].includes(product)) throw new Error('Expected vaybel or printgen');
const source = path.join(root, 'plugins', product);
const destination = path.join(root, 'dist/chatgpt', product);
const manifest = JSON.parse(fs.readFileSync(path.join(source, 'plugin.json'), 'utf8'));
const version = manifest.version;
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Expected a semantic version');
if (product === 'vaybel' && version !== fs.readFileSync(path.join(root, 'VERSION'), 'utf8').trim()) {
  throw new Error('Native plugin version differs from VERSION');
}
if (manifest.name !== product) throw new Error('Native plugin identity differs from directory');

const skillRoot = product === 'vaybel' ? path.join(root, 'skills') : path.join(source, 'skills');
const skills = fs.readdirSync(skillRoot, {withFileTypes: true})
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name)
  .sort();
const documents = skills.map(name => {
  const file = path.join(skillRoot, name, product === 'vaybel' ? 'references/chatgpt.md' : 'SKILL.md');
  const text = fs.readFileSync(file, 'utf8');
  if (!text.startsWith(`---\nname: ${name}\n`) || !/^[a-z0-9-]+$/.test(name)) {
    throw new Error(`Invalid native skill name: ${name}`);
  }
  if (/VAYBEL_PAT|PRINTGEN_PAT|npm |Bash\(|run\.ts|https?:\/\/api\.(vaybel\.com|printgen\.ai)/.test(text)) {
    throw new Error(`Native skill depends on a local runner or private API: ${name}`);
  }
  return {name, text};
});

fs.mkdirSync(path.dirname(destination), {recursive: true});
fs.rmSync(destination, {recursive: true, force: true});
fs.mkdirSync(path.join(destination, 'assets'), {recursive: true});
for (const name of ['plugin.json', 'mcp.json']) {
  fs.copyFileSync(path.join(source, name), path.join(destination, name));
}
const icon = product === 'vaybel' ? 'chatgpt-icon.png' : 'printgen-chatgpt-icon.png';
fs.copyFileSync(path.join(root, 'assets', icon), path.join(destination, 'assets/icon.png'));
for (const {name, text} of documents) {
  const folder = path.join(destination, 'skills', name);
  fs.mkdirSync(folder, {recursive: true});
  fs.writeFileSync(path.join(folder, 'SKILL.md'), text);
}
const archive = path.join(path.dirname(destination), `${product}-${version}.zip`);
fs.rmSync(archive, {force: true});
execFileSync('zip', ['-q', '-r', archive, 'plugin.json', 'mcp.json', 'assets', 'skills'], {cwd: destination});
console.log(`Prepared ${archive} (${documents.length} native MCP skills). Review and live acceptance pending.`);
