const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert');
const { runCorrection, learnException, learnContextRule, resolveRulesPath, resolveLanguage, EMPTY_RULE_HITS } = require('./pipeline');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'flow-rules-'));
const rulesPath = path.join(tempDir, 'flow_rules.json');

learnException('teh', 'the', { rulesPath, language: 'en' });
let result = runCorrection('teh', { rulesPath, language: 'en' });
assert.equal(result.corrected, 'the');
assert.equal(result.applied_learning, 'exception');
assert.equal(result.language, 'en');
assert.deepEqual(result.rule_hits, EMPTY_RULE_HITS);

learnContextRule('hallo welt', 'Hallo, Welt!', { rulesPath, language: 'de' });
result = runCorrection('hallo welt zusammen', { rulesPath, language: 'de' });
assert.equal(result.corrected, 'Hallo, Welt!');
assert.equal(result.applied_learning, 'context');
assert.equal(result.language, 'de');

// language separation
result = runCorrection('teh', { rulesPath, language: 'de' });
assert.notEqual(result.corrected, 'the');

result = runCorrection('i definately dont know', { language: 'en' });
assert.equal(result.corrected, "I definitely don't know");
assert.equal(result.applied_learning, null);

process.env.FLOW_RULES_PATH = rulesPath;
process.env.FLOW_LANGUAGE = 'en';
assert.equal(resolveRulesPath({}), rulesPath);
assert.equal(resolveLanguage({}), 'en');
result = runCorrection('teh');
assert.equal(result.corrected, 'the');
delete process.env.FLOW_RULES_PATH;
delete process.env.FLOW_LANGUAGE;

console.log('Flow learning integration test passed.');
