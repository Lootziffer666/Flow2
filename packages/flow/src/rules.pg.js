// PG = Phonem-Graphem-Korrespondenz / lautnahe Schreibvarianten
const PG_RULES = [
  // Vokalsubstitution / Silbenlesen
  { from: /\bgelsen\b/gi,           to: 'gelesen' },
  { from: /\bferig\b/gi,            to: 'fertig' },

  // ß / ss / s Verwechslung
  { from: /\bweis\b/gi,             to: 'weiß' },

  // sh → sch (Anglizismus-Transfer / phonologische Annäherung)
  // 'shule' ist immer Schule (Substantiv), daher korrekte Großschreibung direkt
  { from: /\bshule\b/gi,            to: 'Schule' },

  // Auslassung von Buchstaben / Reduktion
  { from: /\bnich\b/gi,             to: 'nicht' },
  { from: /\bhab\b/gi,              to: 'habe' },

  // f → v Substitution (Anglizismus-Transfer)
  // 'for' kommt im Deutschen nie regulär vor
  { from: /\bfor\b/gi,              to: 'vor' },

  // Stimmhafte/stimmlose Konsonantenverwechslung
  { from: /\bgesakt\b/gi,           to: 'gesagt' },

  // Vokalverwechslung / lautnahe Varianten
  { from: /\bferge(?:ß|s)en\b/gi,  to: 'vergessen' },
  { from: /\bkucken\b/gi,           to: 'gucken' },

  // Auslassung finaler Konsonant / Doppelkonsonant
  { from: /\bhatt\b/gi,             to: 'hat' },
  { from: /\bknurt\b/gi,            to: 'knurrt' },
  { from: /\bleuft\b/gi,            to: 'läuft' },
  { from: /\bgekipt\b/gi,           to: 'gekippt' },

  // Vokalsubstitution in Diphthong
  { from: /\bgequitscht\b/gi,       to: 'gequietscht' },

  // Vokalkürzung / Reduktion
  { from: /\bfrür\b/gi,             to: 'früher' },

  // Dehnungs-h-Auslassung (fehlende Vokaldehnung durch h)
  { from: /\bfaren\b/gi,            to: 'fahren' },

  // Vokal-/Konsonantensubstitution im Stamm
  { from: /\bfeler\b/gi,            to: 'Fehler' },

  // Doppelkonsonant-Verwechslung in Entlehnung
  { from: /\binterresant\b/gi,      to: 'interessant' },

  // Auslassung finaler Silbe / Reduktion am Partizip-Ende
  { from: /\bgegangn\b/gi,          to: 'gegangen' },
];

module.exports = PG_RULES;
