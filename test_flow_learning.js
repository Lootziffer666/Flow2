const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert');
const { runCorrection, learnException, learnContextRule } = require('./pipeline');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'flow-rules-'));
const rulesPath = path.join(tempDir, 'flow_rules.json');

learnException('teh', 'the', { rulesPath });
let result = runCorrection('teh', { rulesPath });
assert.equal(result.corrected, 'the');

learnContextRule('hallo welt', 'Hallo, Welt!', { rulesPath });
result = runCorrection('hallo welt zusammen', { rulesPath });
assert.equal(result.corrected, 'Hallo, Welt!');

result = runCorrection('ich hab zeit', { rulesPath });
assert.equal(result.corrected, 'Ich habe zeit');

console.log('Flow learning integration test passed.');
