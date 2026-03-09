'use strict';

/**
 * FLOW-compatible English normalization rules.
 *
 * Design goal:
 * - conservative and deterministic
 * - orthography first, grammar only in extremely low-risk cases
 * - no forced dialect flattening (US vs GB stays configurable later)
 * - safe to load even if the runtime currently only reads `exceptions`
 *   and `contextRules`
 */

const rulesEn = {
  id: 'rules.en',
  language: 'en',
  locale: 'en',
  version: '0.1.0',
  strategy: 'conservative-deterministic',

  exceptions: {
    teh: 'the',
    adn: 'and',
    recieve: 'receive',
    recieved: 'received',
    recieving: 'receiving',
    seperate: 'separate',
    definately: 'definitely',
    occured: 'occurred',
    untill: 'until',
    tommorow: 'tomorrow',
    tomorow: 'tomorrow',
    enviroment: 'environment',
    goverment: 'government',
    langauge: 'language',
    adress: 'address',
    wierd: 'weird',
    acheive: 'achieve',
    acheived: 'achieved',
    acheivement: 'achievement',
    accomodate: 'accommodate',
    accomodation: 'accommodation',
    arguement: 'argument',
    commited: 'committed',
    publically: 'publicly',
    succesful: 'successful',
    succesfully: 'successfully',
    suprise: 'surprise',
    writting: 'writing',
    embarass: 'embarrass',
    embarassed: 'embarrassed',
    begining: 'beginning',
    neccessary: 'necessary',
    neccessarily: 'necessarily',
    occassion: 'occasion',
    occassional: 'occasional',
    manuever: 'maneuver',
    independant: 'independent',
    interupt: 'interrupt',
    maintainance: 'maintenance',
    resistence: 'resistance',
    restaraunt: 'restaurant',
    remeber: 'remember',
    transfered: 'transferred',
    truely: 'truly',
    unforseen: 'unforeseen',
    usualy: 'usually',
    vehicule: 'vehicle',
    watn: 'want',
    whcih: 'which',
    wether: 'whether',
  },

  contextRules: [
    {
      id: 'en-standalone-i-uppercase',
      kind: 'regex_replace',
      description: 'Normalize standalone lowercase i to uppercase I.',
      pattern: '\\bi\\b',
      replacement: 'I',
      flags: 'g',
      confidence: 0.98,
      risk: 'low',
      scope: 'token',
    },
    {
      id: 'en-space-before-punctuation',
      kind: 'regex_replace',
      description: 'Remove stray spaces before common punctuation.',
      pattern: '\\s+([,.;:!?])',
      replacement: '$1',
      flags: 'g',
      confidence: 0.97,
      risk: 'low',
      scope: 'surface',
    },
    {
      id: 'en-collapse-multiple-spaces',
      kind: 'regex_replace',
      description: 'Collapse repeated spaces to a single space.',
      pattern: '[ \\t]{2,}',
      replacement: ' ',
      flags: 'g',
      confidence: 0.99,
      risk: 'low',
      scope: 'surface',
    },
    {
      id: 'en-sentence-start-capitalization',
      kind: 'regex_replace',
      description: 'Capitalize a lowercase ASCII letter at sentence start.',
      pattern: '(^|[.!?]\\s+)([a-z])',
      replacement: (_, prefix, ch) => `${prefix}${ch.toUpperCase()}`,
      flags: 'g',
      confidence: 0.72,
      risk: 'medium',
      scope: 'surface',
      disabledByDefault: true,
      notes: 'Useful for prose, but risky for fragments, chat logs, stylized text and code-like content.',
    },
    {
      id: 'en-a-to-an-vowel-heuristic',
      kind: 'token_context',
      description: 'Heuristic a -> an before vowel-initial word.',
      previousPattern: '^a$',
      currentPattern: '^[aeiou].*',
      replacementForPrevious: 'an',
      confidence: 0.35,
      risk: 'borderline',
      scope: 'grammar',
      disabledByDefault: true,
      notes: 'Too noisy without phonetics: a university / an hour laughs at naive letter rules.',
    },
  ],

  blockedAmbiguities: [
    "its -> it's",
    "your -> you're",
    "their -> there / they're",
    'then -> than',
    'than -> then',
    'affect -> effect',
    'loose -> lose',
    'to -> too / two',
    "who's -> whose",
    "were -> we're / where",
  ],

  presets: {
    'en-core-safe': {
      description: 'Only high-confidence lexical corrections and very safe surface cleanup.',
      enabledContextRuleIds: [
        'en-standalone-i-uppercase',
        'en-space-before-punctuation',
        'en-collapse-multiple-spaces',
      ],
    },
    'en-prose-plus': {
      description: 'Safe core plus optional prose cleanup.',
      enabledContextRuleIds: [
        'en-standalone-i-uppercase',
        'en-space-before-punctuation',
        'en-collapse-multiple-spaces',
        'en-sentence-start-capitalization',
      ],
    },
  },
};

module.exports = rulesEn;
