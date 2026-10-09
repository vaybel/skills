import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('distributable is self-contained and uses hosted OAuth without local secrets or runners', () => {
  execFileSync(process.execPath, ['scripts/package-chatgpt.mjs'], {cwd: root});
  const version = fs.readFileSync(path.join(root, 'VERSION'), 'utf8').trim();
  const archive = path.join(root, 'dist/chatgpt', `vaybel-${version}.zip`);
  const entries = execFileSync('unzip', ['-Z1', archive], {encoding: 'utf8'}).trim().split('\n');
  const files = entries.filter(entry => !entry.endsWith('/'));
  const allowed = /^(plugin\.json|mcp\.json|assets\/icon\.png|skills\/[a-z0-9-]+\/SKILL\.md)$/;
  assert.ok(files.every(entry => allowed.test(entry)), 'ZIP contains an unexpected file');
  assert.equal(files.filter(entry => entry.endsWith('/SKILL.md')).length, 6);
  const read = file => execFileSync('unzip', ['-p', archive, file], {encoding: 'utf8'});
  const plugin = JSON.parse(read('plugin.json'));
  const mcp = JSON.parse(read('mcp.json'));
  assert.equal(plugin.version, version);
  assert.equal(Object.keys(mcp.mcpServers).length, 1);
  assert.deepEqual(mcp.mcpServers.vaybel, {
    type: 'streamable-http', url: 'https://mcp.vaybel.com/mcp/',
  });
  for (const key of ['composerIcon', 'logo']) {
    assert.ok(files.includes(plugin.extensions['com.openai'].interface[key].replace(/^\.\//, '')));
  }
  const image = execFileSync('unzip', ['-p', archive, 'assets/icon.png']);
  assert.equal(image.readUInt32BE(16), image.readUInt32BE(20));
  assert.ok(image.readUInt32BE(16) >= 48);
  for (const entry of files.filter(entry => entry.endsWith('.md'))) {
    const body = read(entry);
    assert.doesNotMatch(body, /VAYBEL_PAT|Bash\(|npm |run\.ts/);
    assert.equal(body.match(/^name: (.+)$/m)?.[1], entry.split('/')[1]);
  }
});

test('listing and review details fit the directory submission limits', () => {
  const plugin = JSON.parse(fs.readFileSync(path.join(root, 'plugins/vaybel/plugin.json'), 'utf8'));
  const {interface: listing, review} = plugin.extensions['com.openai'];
  const categories = [
    'Productivity', 'Creativity', 'Developer Tools', 'Business & Operations', 'Data & Analytics',
    'Communication', 'Education & Research', 'Security', 'Finance', 'Healthcare', 'Travel',
    'Entertainment', 'Other',
  ];
  assert.ok(categories.includes(listing.category), 'category is not one the directory accepts');
  assert.ok(listing.displayName.length <= 30 && listing.shortDescription.length <= 30);
  assert.ok(listing.capabilities.length <= 20);
  assert.ok(listing.capabilities.every(item => item.trim() && item.length <= 120));
  const prompts = listing.defaultPrompt;
  assert.ok(prompts.length <= 3 && new Set(prompts).size === prompts.length);
  assert.ok(prompts.every(prompt => prompt.length <= 128 && !prompt.includes('@')));
  for (const key of ['websiteURL', 'supportURL', 'privacyPolicyURL', 'termsOfServiceURL']) {
    assert.match(listing[key], /^https:\/\//);
  }
  const {positive, negative} = review.test_cases;
  assert.equal(positive.length, 5);
  assert.equal(negative.length, 3);
  for (const item of positive) {
    for (const key of ['description', 'prompt', 'tools_triggered', 'expected_behavior']) {
      assert.ok(item[key]?.trim(), `positive case lacks ${key}`);
    }
  }
  assert.ok(negative.every(item => item.description?.trim() && item.prompt?.trim()));
  assert.equal(typeof review.commerce, 'boolean');
});
