import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Keep this public-tool contract aligned with the PrintGen backend surface.
const printgenTools = new Set([
  'ping', 'design.generate', 'design.edit', 'design.get', 'design.get_generation', 'design.list',
  'mockup.generate', 'mockup.get', 'mockup.get_generation', 'mockup.show', 'workspace.open',
  'shop.list_products', 'shop.get_product', 'shop.create_checkout', 'shop.get_checkout',
  'shop.list_orders', 'shop.get_order',
]);

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

test('PrintGen package contains only buyer workflows and the public OAuth connection', () => {
  const product = 'printgen';
  execFileSync(process.execPath, ['scripts/package-chatgpt.mjs', product], {cwd: root});
  const source = JSON.parse(fs.readFileSync(path.join(root, 'plugins', product, 'plugin.json'), 'utf8'));
  const archive = path.join(root, 'dist/chatgpt', `${product}-${source.version}.zip`);
  const files = execFileSync('unzip', ['-Z1', archive], {encoding: 'utf8'}).trim().split('\n')
    .filter(entry => !entry.endsWith('/'));
  assert.deepEqual(files.sort(), [
    'plugin.json', 'mcp.json', 'assets/icon.png',
    'skills/create-apparel/SKILL.md', 'skills/prepare-order/SKILL.md', 'skills/track-order/SKILL.md',
  ].sort());
  const read = file => execFileSync('unzip', ['-p', archive, file], {encoding: 'utf8'});
  const plugin = JSON.parse(read('plugin.json'));
  assert.deepEqual(plugin, source);
  assert.deepEqual(JSON.parse(read('mcp.json')).mcpServers, {
    printgen: {type: 'streamable-http', url: 'https://mcp.printgen.ai/mcp/'},
  });
  assert.equal(plugin.name, 'printgen');
  const {interface: listing, review, publication} = plugin.extensions['com.openai'];
  assert.ok(listing.shortDescription.length <= 30);
  assert.ok(listing.longDescription.length <= 4000);
  assert.equal(listing.defaultPrompt.length, 3);
  assert.ok(listing.defaultPrompt.every(prompt => prompt.length <= 128 && !prompt.includes('@')));
  assert.equal(review.commerce, true);
  assert.deepEqual(publication.countries, ['US']);
  assert.ok(publication.release_notes);
  assert.equal(review.test_cases.positive.length, 5);
  assert.equal(review.test_cases.negative.length, 3);
  assert.equal(plugin.extensions['com.openai'].apps, undefined);
  assert.equal(plugin.apps, undefined);
  for (const name of ['websiteURL', 'supportURL', 'privacyPolicyURL', 'termsOfServiceURL']) {
    assert.equal(new URL(listing[name]).hostname, 'printgen.ai');
  }
  for (const name of ['logo', 'composerIcon']) {
    assert.ok(files.includes(listing[name].replace(/^\.\//, '')));
  }
  const icon = execFileSync('unzip', ['-p', archive, 'assets/icon.png']);
  assert.equal(icon.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(icon.readUInt32BE(16), icon.readUInt32BE(20));
  assert.ok(icon.readUInt32BE(16) >= 256 && icon.readUInt32BE(16) <= 4096);
  assert.ok(icon.length <= 5 * 1024 * 1024);
  for (const entry of files.filter(file => file.endsWith('.md'))) {
    const body = read(entry);
    assert.equal(body.match(/^name: (.+)$/m)?.[1], entry.split('/')[1]);
    assert.match(body, /^description: .+$/m);
    assert.doesNotMatch(body, /VAYBEL_PAT|PRINTGEN_PAT|Bash\(|npm |run\.ts|catalog\.list_blanks|listing\.publish|plugin_asdk_app/);
  }
  const publicText = files.filter(file => /\.(json|md)$/.test(file)).map(read).join('\n');
  assert.doesNotMatch(publicText, /demo\+|test_credentials|reviewer_instructions|Authorization.*Bearer/);
  const referenced = publicText.match(/\b(?:design|mockup|shop|workspace|catalog|listing|trend|credits|brand_dna|social_post|insights|drop)\.[a-z_]+\b/g) ?? [];
  for (const tool of referenced) assert.ok(printgenTools.has(tool), `Buyer workflow references unavailable tool: ${tool}`);
  for (const item of review.test_cases.positive) {
    for (const tool of item.tools_triggered.split(',').map(name => name.trim())) {
      assert.ok(printgenTools.has(tool), `Review case references unavailable tool: ${tool}`);
    }
    for (const key of ['description', 'prompt', 'tools_triggered', 'expected_behavior']) {
      assert.ok(item[key]?.trim(), `positive case lacks ${key}`);
    }
  }
});

test('packager rejects unknown products without writing another package', () => {
  assert.throws(() => execFileSync(process.execPath, ['scripts/package-chatgpt.mjs', '../wrong'], {
    cwd: root, stdio: 'pipe',
  }), /Expected vaybel or printgen/);
});
