import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'plugins/vaybel');
const destination = path.join(root, 'dist/chatgpt/vaybel');
const manifest = JSON.parse(fs.readFileSync(path.join(source, 'plugin.json'), 'utf8'));
const version = fs.readFileSync(path.join(root, 'VERSION'), 'utf8').trim();
if (manifest.version !== version) throw new Error('Native plugin version differs from VERSION');

const skills = fs.readdirSync(path.join(root, 'skills'), {withFileTypes: true})
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name)
  .sort();
const documents = skills.map(name => {
  const file = path.join(root, 'skills', name, 'references/chatgpt.md');
  const text = fs.readFileSync(file, 'utf8');
  if (!text.startsWith(`---\nname: ${name}\n`) || !/^[a-z0-9-]+$/.test(name)) {
    throw new Error(`Invalid native skill name: ${name}`);
  }
  if (/VAYBEL_PAT|npm |Bash\(|run\.ts|https?:\/\/api\.vaybel\.com/.test(text)) {
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
fs.copyFileSync(path.join(root, 'assets/chatgpt-icon.png'), path.join(destination, 'assets/icon.png'));
for (const {name, text} of documents) {
  const folder = path.join(destination, 'skills', name);
  fs.mkdirSync(folder, {recursive: true});
  fs.writeFileSync(path.join(folder, 'SKILL.md'), text);
}
const archive = path.join(path.dirname(destination), `vaybel-${version}.zip`);
fs.rmSync(archive, {force: true});
execFileSync('zip', ['-q', '-r', archive, 'plugin.json', 'mcp.json', 'assets', 'skills'], {cwd: destination});
console.log(`Prepared ${archive} (${documents.length} native MCP skills). Review and live acceptance pending.`);
