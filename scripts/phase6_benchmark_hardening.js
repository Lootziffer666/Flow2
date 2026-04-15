'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = process.cwd();
const PATTERN_DIR = path.join(ROOT, 'database/artifacts/test_patterns_flow_spin');
const BUNDLE_PATH = path.join(ROOT, 'database/artifacts/test_patterns_flow_spin_bundle.md');
const MANIFEST_PATH = path.join(ROOT, 'database/artifacts/benchmark_suite_manifest.json');

function sha256(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function readPatterns() {
  const names = fs
    .readdirSync(PATTERN_DIR)
    .filter((name) => name.endsWith('.md'))
    .sort();

  return names.map((name) => {
    const fullPath = path.join(PATTERN_DIR, name);
    const content = fs.readFileSync(fullPath, 'utf8');
    return {
      name,
      bytes: Buffer.byteLength(content, 'utf8'),
      sha256: sha256(content),
    };
  });
}

function buildManifest() {
  const files = readPatterns();
  const bundleContent = fs.readFileSync(BUNDLE_PATH, 'utf8');

  for (const file of files) {
    if (!bundleContent.includes(file.name)) {
      throw new Error(`Bundle consistency failed: ${file.name} not referenced in ${path.basename(BUNDLE_PATH)}`);
    }
  }

  const suite_hash = sha256(JSON.stringify(files));
  return {
    suite_id: 'flow_spin_patterns',
    suite_version: 1,
    files,
    bundle_sha256: sha256(bundleContent),
    suite_hash,
  };
}

function assertManifestEqual(expected, actual) {
  const e = JSON.stringify(expected);
  const a = JSON.stringify(actual);
  if (e !== a) {
    throw new Error('Benchmark manifest drift detected. Run: node scripts/phase6_benchmark_hardening.js --write');
  }
}

function main() {
  const shouldWrite = process.argv.includes('--write');
  const generated = buildManifest();

  if (shouldWrite) {
    fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(generated, null, 2)}\n`);
    console.log(`Phase 6 manifest written: ${path.relative(ROOT, MANIFEST_PATH)}`);
    return;
  }

  if (!fs.existsSync(MANIFEST_PATH)) {
    throw new Error(`Missing manifest: ${path.relative(ROOT, MANIFEST_PATH)} (run with --write)`);
  }

  const existing = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  assertManifestEqual(existing, generated);
  console.log('Phase 6 benchmark hardening check passed.');
}

main();
