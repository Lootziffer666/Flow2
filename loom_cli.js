// loom_cli.js
// CLI-Wrapper für FLOW-Pipeline + Lernkommandos

const {
  runCorrection,
  learnException,
  learnContextRule,
} = require('./pipeline.js');

function getOptionValue(args, optionName) {
  const idx = args.indexOf(optionName);
  if (idx === -1 || idx + 1 >= args.length) return undefined;
  return args[idx + 1];
}

function removeOption(args, optionName) {
  const idx = args.indexOf(optionName);
  if (idx === -1) return args;
  const next = [...args];
  next.splice(idx, 2);
  return next;
}

function isLanguageToken(value) {
  return value === 'de' || value === 'en';
}

const rawArgs = process.argv.slice(2);
const rulesPath = getOptionValue(rawArgs, '--rules-path');
const optLanguage = getOptionValue(rawArgs, '--lang');
const enPreset = getOptionValue(rawArgs, '--en-preset');
let args = removeOption(rawArgs, '--rules-path');
args = removeOption(args, '--lang');
args = removeOption(args, '--en-preset');

let language = optLanguage || 'de';

if (!optLanguage && args.length > 1 && isLanguageToken(args[args.length - 1])) {
  language = args[args.length - 1];
  args = args.slice(0, -1);
}

if (args[0] === '--learn-exception') {
  const original = args[1] || '';
  const corrected = args[2] || '';
  learnException(original, corrected, { rulesPath, language });
  process.stdout.write('OK');
  process.exit(0);
}

if (args[0] === '--learn-context') {
  const trigger = args[1] || '';
  const replace = args[2] || '';
  learnContextRule(trigger, replace, { rulesPath, language });
  process.stdout.write('OK');
  process.exit(0);
}

const input = args.join(' ').trim();
if (!input) {
  process.stdout.write('');
  process.exit(0);
}

const result = runCorrection(input, { rulesPath, language, enPreset });
process.stdout.write((result && result.corrected) || '');
