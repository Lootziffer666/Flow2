'use strict';

/**
 * Canonical lexical/POS helper knowledge for LOOM.
 *
 * Shared cross-product language truth (DE/EN):
 * - pronouns
 * - auxiliaries
 * - determiners
 * - prepositions
 * - copula/state verbs
 */

const PRONOUNS_DE_LIST = Object.freeze([
  'ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr',
  'mich', 'dich', 'ihn', 'uns', 'euch',
  'mir', 'dir', 'ihm', 'ihnen',
  'man', 'jemand', 'niemand', 'wer',
  'dieser', 'diese', 'dieses', 'jener', 'jene', 'jenes',
]);

const PRONOUNS_EN_LIST = Object.freeze([
  'i', 'you', 'he', 'she', 'it', 'we', 'they',
  'me', 'him', 'her', 'us', 'them',
  'someone', 'nobody', 'everyone', 'who',
  'this', 'that', 'these', 'those',
]);

const AUXILIARIES_DE_LIST = Object.freeze([
  'bin', 'bist', 'ist', 'sind', 'seid',
  'war', 'warst', 'waren', 'wart',
  'werde', 'wirst', 'wird', 'werden', 'werdet',
  'habe', 'hast', 'hat', 'haben', 'habt',
  'hatte', 'hattest', 'hatten', 'hattet',
  'kann', 'kannst', 'können', 'könnt',
  'soll', 'sollst', 'sollen', 'sollt',
  'will', 'willst', 'wollen', 'wollt',
  'muss', 'musst', 'müssen', 'müsst',
  'darf', 'darfst', 'dürfen', 'dürft',
  'mag', 'magst', 'mögen', 'mögt',
]);

const AUXILIARIES_EN_LIST = Object.freeze([
  'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had',
  'will', 'would', 'shall', 'should',
  'can', 'could', 'may', 'might', 'must',
  'do', 'does', 'did',
]);

const DETERMINERS_DE_LIST = Object.freeze([
  'der', 'die', 'das', 'des', 'dem', 'den',
  'ein', 'eine', 'eines', 'einem', 'einen', 'einer',
  'kein', 'keine', 'keines', 'keinem', 'keinen',
  'mein', 'meine', 'meines', 'meinem', 'meinen',
  'dein', 'deine', 'sein', 'ihre', 'unser', 'euer',
  'jeder', 'jede', 'jedes', 'alle', 'viele', 'einige',
]);

const DETERMINERS_EN_LIST = Object.freeze([
  'the', 'a', 'an',
  'my', 'your', 'his', 'her', 'its', 'our', 'their',
  'this', 'that', 'these', 'those',
  'each', 'every', 'all', 'some', 'any',
  'no',
]);

const PREPOSITIONS_DE_LIST = Object.freeze([
  'in', 'an', 'auf', 'über', 'unter', 'vor', 'hinter', 'neben', 'zwischen',
  'mit', 'ohne', 'durch', 'für', 'gegen', 'um', 'aus', 'bei', 'nach',
  'seit', 'von', 'zu', 'während', 'wegen', 'trotz', 'statt',
  'bis', 'ab', 'als', 'außer',
]);

const PREPOSITIONS_EN_LIST = Object.freeze([
  'in', 'on', 'at', 'by', 'for', 'with', 'about', 'against',
  'between', 'into', 'through', 'during', 'before', 'after',
  'above', 'below', 'from', 'up', 'down', 'out', 'off', 'over',
  'under', 'to', 'of', 'near', 'around', 'along',
]);

const COPULA_DE_LIST = Object.freeze([
  'bin', 'bist', 'ist', 'sind', 'seid',
  'war', 'warst', 'waren', 'wart',
  'werde', 'wird', 'werden', 'wirst',
]);

const COPULA_EN_LIST = Object.freeze([
  'is', 'are', 'was', 'were', 'be', 'been',
  'seem', 'seems', 'seemed',
  'appear', 'appears',
  'become', 'becomes', 'became',
]);

const PRONOUNS_DE = new Set(PRONOUNS_DE_LIST);
const PRONOUNS_EN = new Set(PRONOUNS_EN_LIST);
const AUXILIARIES_DE = new Set(AUXILIARIES_DE_LIST);
const AUXILIARIES_EN = new Set(AUXILIARIES_EN_LIST);
const DETERMINERS_DE = new Set(DETERMINERS_DE_LIST);
const DETERMINERS_EN = new Set(DETERMINERS_EN_LIST);
const PREPOSITIONS_DE = new Set(PREPOSITIONS_DE_LIST);
const PREPOSITIONS_EN = new Set(PREPOSITIONS_EN_LIST);
const COPULA_DE = new Set(COPULA_DE_LIST);
const COPULA_EN = new Set(COPULA_EN_LIST);

module.exports = {
  PRONOUNS_DE_LIST,
  PRONOUNS_EN_LIST,
  AUXILIARIES_DE_LIST,
  AUXILIARIES_EN_LIST,
  DETERMINERS_DE_LIST,
  DETERMINERS_EN_LIST,
  PREPOSITIONS_DE_LIST,
  PREPOSITIONS_EN_LIST,
  COPULA_DE_LIST,
  COPULA_EN_LIST,
  PRONOUNS_DE,
  PRONOUNS_EN,
  AUXILIARIES_DE,
  AUXILIARIES_EN,
  DETERMINERS_DE,
  DETERMINERS_EN,
  PREPOSITIONS_DE,
  PREPOSITIONS_EN,
  COPULA_DE,
  COPULA_EN,
};
