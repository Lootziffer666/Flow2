const { runCorrection } = require('../../flow/src/pipeline');

// Minimal UI-Verdrahtung: Input-Text -> runCorrection -> aktualisierter UI-Text.
function applyNormalizationToUi(inputText, setText, setStatus) {
  const result = runCorrection(inputText);
  setText(result.corrected);

  if (typeof setStatus === 'function') {
    setStatus('Text aktualisiert.');
  }

  return result.corrected;
}

module.exports = {
  applyNormalizationToUi,
};
