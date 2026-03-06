const BASE_FRAGMENTS = [
  'ich hab das gestern gelsen',
  'und dachte das wier villeicht schon ferig sind',
  'aber irgentwie hat es sich nich gut angefühlt',
  'dann bin ich einfach weiter gegangen',
  'obwohl ich garnich wusste ob das passt',
  'keiner hats mir richtig erklert',
  'vieleicht wolte ich nur kurz warten',
  'trozdem war ich eigendlich ruhig',
  'am ende war alles ferig und ich habs nich gemerkt',
  'wir sind zuende und haben gewessen dass es klappt'
];

function createSeededRandom(seed) {
  let value = seed >>> 0;
  return function next() {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

function createRandomLrsInputs(count = 200, seed = 42) {
  const random = createSeededRandom(seed);
  const inputs = [];

  for (let i = 0; i < count; i += 1) {
    const parts = [];
    const fragmentCount = 3 + Math.floor(random() * 3);

    for (let j = 0; j < fragmentCount; j += 1) {
      const index = Math.floor(random() * BASE_FRAGMENTS.length);
      parts.push(BASE_FRAGMENTS[index]);
    }

    const text = parts.join(' ').replace(/\s+/g, ' ').trim();
    inputs.push({
      key: `random-lrs-${String(i + 1).padStart(3, '0')}`,
      label: `Random LRS ${String(i + 1).padStart(3, '0')}`,
      text,
    });
  }

  return inputs;
}

module.exports = {
  createRandomLrsInputs,
};
