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

const rawArgs = process.argv.slice(2);
const rulesPath = getOptionValue(rawArgs, '--rules-path');
const language = getOptionValue(rawArgs, '--lang') || 'de';
let args = removeOption(rawArgs, '--rules-path');
args = removeOption(args, '--lang');

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

const result = runCorrection(input, { rulesPath, language });
process.stdout.write((result && result.corrected) || '');
