import fs from 'node:fs/promises';
import Parser from 'rss-parser';
import translate from '@iamtraction/google-translate';

const parser = new Parser({
  timeout: 15000
});

const path = new URL('../data/veille.json', import.meta.url);

const today = new Date().toISOString().slice(0, 10);

const MAX_ARTICLES_PER_HORIZON = 5;

/*
|--------------------------------------------------------------------------
| CONFIGURATION DES HORIZONS
|--------------------------------------------------------------------------
*/

const horizonConfig = {
  H1: {
    frequency: 'Chaque semaine',
    intervalDays: 7,
    objective:
      'Suivre les actualités, vulnérabilités et évolutions des systèmes, réseaux et de la cybersécurité'
  },

  H2: {
    frequency: 'Chaque mois',
    intervalDays: 30,
    objective:
      'Approfondir mes connaissances sur le Cloud, l’automatisation, les infrastructures réseau et les solutions de cybersécurité'
  },

  H3: {
    frequency: 'Chaque trimestre',
    intervalDays: 90,
    objective:
      'Anticiper les technologies émergentes comme l’IA, l’informatique quantique...'
  }
};

/*
|--------------------------------------------------------------------------
| FLUX RSS
|--------------------------------------------------------------------------
*/

const feeds = [

  /*
  |--------------------------------------------------------------------------
  | H1 — SYSTÈMES / RÉSEAUX / CYBERSÉCURITÉ
  |--------------------------------------------------------------------------
  */

  {
    name: 'Microsoft Security Blog',
    url: 'https://www.microsoft.com/en-us/security/blog/feed/',
    horizons: ['H1', 'H2']
  },

  {
    name: 'Cloudflare Blog',
    url: 'https://blog.cloudflare.com/rss/',
    horizons: ['H1', 'H2', 'H3']
  },

  {
    name: 'Cisco Security',
    url: 'https://sec.cloudapps.cisco.com/security/center/psirtrss20/CiscoSecurityAdvisory.xml',
    horizons: ['H1', 'H2']
  },

  {
    name: 'The Hacker News',
    url: 'https://feeds.feedburner.com/TheHackersNews',
    horizons: ['H1', 'H2']
  },

  {
    name: 'AWS Security Blog',
    url: 'https://aws.amazon.com/blogs/security/feed/',
    horizons: ['H1', 'H2']
  },

  {
    name: 'Krebs on Security',
    url: 'https://krebsonsecurity.com/feed/',
    horizons: ['H1']
  },

  /*
  |--------------------------------------------------------------------------
  | H2 — CLOUD / RÉSEAUX / INFRASTRUCTURES / AUTOMATISATION
  |--------------------------------------------------------------------------
  */

  {
    name: 'AWS Networking & Content Delivery',
    url: 'https://aws.amazon.com/blogs/networking-and-content-delivery/feed/',
    horizons: ['H2', 'H3']
  },

  {
    name: 'AWS Architecture Blog',
    url: 'https://aws.amazon.com/blogs/architecture/feed/',
    horizons: ['H2']
  },

  {
    name: 'Kubernetes Blog',
    url: 'https://kubernetes.io/feed.xml',
    horizons: ['H2', 'H3']
  },

  {
    name: 'CNCF Blog',
    url: 'https://www.cncf.io/feed/',
    horizons: ['H2', 'H3']
  },

  /*
  |--------------------------------------------------------------------------
  | H3 — TECHNOLOGIES ÉMERGENTES / IA / QUANTIQUE
  |--------------------------------------------------------------------------
  */

  {
    name: 'NVIDIA Blog',
    url: 'https://blogs.nvidia.com/feed/',
    horizons: ['H3']
  },

  {
    name: 'NVIDIA Developer Blog',
    url: 'https://developer.nvidia.com/blog/feed/',
    horizons: ['H3']
  },

  {
    name: 'Microsoft Official Blog',
    url: 'https://blogs.microsoft.com/feed/',
    horizons: ['H3']
  },

  {
    name: 'Google AI Blog',
    url: 'https://blog.google/technology/ai/rss/',
    horizons: ['H3']
  }
];

/*
|--------------------------------------------------------------------------
| MOTS-CLÉS
|--------------------------------------------------------------------------
|
| Les expressions sont volontairement assez larges pour éviter de rater
| des articles réellement pertinents.
|--------------------------------------------------------------------------
*/

const keywords = {

  H1:
    /vulnerab|vulnerability|vulnerabilities|cve|zero-day|zero day|patch|security|cyber|cybersecurity|ransomware|malware|attack|incident|exploit|breach|threat|phishing|firewall|zero trust|authentication|identity|credential|ddos|security advisory|security update|threat actor|soc|siem|endpoint|edr|xdr|intrusion|botnet|trojan|spyware|privilege|access control|data leak|data breach|network security/i,

  H2:
    /cloud|cloud computing|cloud-native|cloud native|automation|automatisation|automated|network|réseau|networking|infrastructure|infrastructure as code|kubernetes|container|containers|docker|devops|devsecops|zero trust|firewall|multicloud|multi-cloud|observability|monitoring|virtualization|virtualisation|aws|azure|google cloud|gcp|networking|datacenter|data center|data centre|cloud security|load balancing|vpn|sd-wan|sase|cdn|dns|api gateway|terraform|ansible|serverless|microservices|microservice|vpc|subnet|routing|route|switch|gateway|hybrid cloud|hybrid-cloud|storage|compute|database|backup|disaster recovery/i,

  H3:
    /quantum|quantique|artificial intelligence|artificial-intelligence|machine learning|deep learning|generative ai|generative artificial intelligence|ai |agentic|ai agent|agent|autonomous|autonome|robot|robotics|post-quantum|post quantum|emerging|émergent|future|innovation|next-generation|next generation|gpu|accelerator|accelerator|frontier|ai infrastructure|neural|neural network|llm|large language model|copilot|quantum computing|intelligence artificielle|foundation model|multimodal|reasoning model|reasoning|ai model|synthetic data|humanoid|autonomous systems|future technology/i
};

/*
|--------------------------------------------------------------------------
| NETTOYAGE DU TEXTE
|--------------------------------------------------------------------------
*/

function clean(text = '') {
  return text
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/*
|--------------------------------------------------------------------------
| CRÉATION D'UN ID UNIQUE
|--------------------------------------------------------------------------
*/

function createId(url) {
  return Buffer
    .from(url)
    .toString('base64url')
    .slice(0, 30);
}

/*
|--------------------------------------------------------------------------
| CHARGEMENT DE VEILLE.JSON
|--------------------------------------------------------------------------
*/

const data = JSON.parse(
  await fs.readFile(
    path,
    'utf8'
  )
);

if (!Array.isArray(data.items)) {
  data.items = [];
}

if (!Array.isArray(data.measurements)) {
  data.measurements = [];
}

/*
|--------------------------------------------------------------------------
| IDENTIFIANTS EXISTANTS
|--------------------------------------------------------------------------
*/

const existingIds = new Set(
  data.items.map(
    item => item.id
  )
);

/*
|--------------------------------------------------------------------------
| TRADUCTION
|--------------------------------------------------------------------------
*/

async function translateToFrench(text) {

  if (!text) {
    return '';
  }

  try {

    const result = await translate(
      text,
      {
        from: 'auto',
        to: 'fr'
      }
    );

    return clean(
      result.text
    );

  } catch (error) {

    console.warn(
      `⚠️ Traduction impossible : ${error.message}`
    );

    return text;
  }
}

/*
|--------------------------------------------------------------------------
| MESURES VALIDES
|--------------------------------------------------------------------------
*/

function getMeasurements(horizon) {

  return data.measurements
    .filter(
      measurement =>
        measurement.horizon === horizon &&
        Number(
          measurement.itemsCollected
        ) > 0
    )
    .sort(
      (a, b) =>
        new Date(b.date) -
        new Date(a.date)
    );
}

/*
|--------------------------------------------------------------------------
| SAVOIR SI LA PREMIÈRE MESURE EST INCOMPLÈTE
|--------------------------------------------------------------------------
|
| Exemple :
|
| H1 = 4/5
|
| Le script doit continuer à chercher le 5e article.
|--------------------------------------------------------------------------
*/

function needsInitialCompletion(horizon) {

  const measurements =
    getMeasurements(horizon);

  if (
    measurements.length === 0
  ) {
    return true;
  }

  const firstMeasurement =
    measurements[0];

  return (
    Number(
      firstMeasurement.itemsCollected
    ) < MAX_ARTICLES_PER_HORIZON
  );
}

/*
|--------------------------------------------------------------------------
| SAVOIR SI UNE NOUVELLE MESURE EST DUE
|--------------------------------------------------------------------------
*/

function isDue(horizon) {

  const measurements =
    getMeasurements(horizon);

  /*
  |--------------------------------------------------------------------------
  | AUCUNE MESURE
  |--------------------------------------------------------------------------
  */

  if (
    measurements.length === 0
  ) {
    return true;
  }

  /*
  |--------------------------------------------------------------------------
  | PREMIÈRE MESURE INCOMPLÈTE
  |--------------------------------------------------------------------------
  */

  if (
    needsInitialCompletion(horizon)
  ) {
    return true;
  }

  const lastMeasurement =
    measurements[0];

  const lastDate =
    new Date(
      `${lastMeasurement.date}T12:00:00Z`
    );

  const currentDate =
    new Date(
      `${today}T12:00:00Z`
    );

  const differenceMs =
    currentDate.getTime() -
    lastDate.getTime();

  const differenceDays =
    differenceMs /
    (1000 * 60 * 60 * 24);

  return (
    differenceDays >=
    horizonConfig[horizon].intervalDays
  );
}

/*
|--------------------------------------------------------------------------
| RÉCUPÉRATION DES ARTICLES EXISTANTS D'UN HORIZON
|--------------------------------------------------------------------------
*/

function getItemsForHorizon(horizon) {

  return data.items.filter(
    item =>
      item.horizon === horizon
  );
}

/*
|--------------------------------------------------------------------------
| COLLECTE D'ARTICLES POUR UN HORIZON
|--------------------------------------------------------------------------
*/

async function collectForHorizon(
  horizon,
  targetCount
) {

  const candidates = [];

  /*
  |--------------------------------------------------------------------------
  | LECTURE DES FLUX
  |--------------------------------------------------------------------------
  */

  for (const feed of feeds) {

    if (
      !feed.horizons.includes(
        horizon
      )
    ) {
      continue;
    }

    if (
      candidates.length >=
      targetCount
    ) {
      break;
    }

    try {

      console.log(
        `📡 Lecture : ${feed.name}`
      );

      const rss =
        await parser.parseURL(
          feed.url
        );

      const rssItems =
        (
          rss.items || []
        ).slice(
          0,
          75
        );

      for (
        const x of rssItems
      ) {

        if (
          candidates.length >=
          targetCount
        ) {
          break;
        }

        const originalTitle =
          clean(
            x.title || ''
          );

        const originalSummary =
          clean(
            x.contentSnippet ||
            x.content ||
            x.summary ||
            x.description ||
            ''
          );

        const url =
          x.link || '';

        if (
          !originalTitle ||
          !url
        ) {
          continue;
        }

        const id =
          createId(url);

        /*
        |--------------------------------------------------------------------------
        | DOUBLON AVEC LA VEILLE
        |--------------------------------------------------------------------------
        */

        if (
          existingIds.has(id)
        ) {
          continue;
        }

        /*
        |--------------------------------------------------------------------------
        | DOUBLON DANS LA COLLECTE ACTUELLE
        |--------------------------------------------------------------------------
        */

        if (
          candidates.some(
            item =>
              item.id === id
          )
        ) {
          continue;
        }

        /*
        |--------------------------------------------------------------------------
        | PERTINENCE
        |--------------------------------------------------------------------------
        */

        const text =
          `${originalTitle} ${originalSummary}`;

        const relevant =
          keywords[horizon].test(
            text
          );

        if (!relevant) {
          continue;
        }

        /*
        |--------------------------------------------------------------------------
        | AJOUT DU CANDIDAT
        |--------------------------------------------------------------------------
        */

        candidates.push({

          id,

          date: (
            x.isoDate ||
            x.pubDate ||
            today
          ).slice(
            0,
            10
          ),

          horizon,

          originalTitle,

          originalSummary,

          source:
            feed.name,

          url,

          verified:
            false,

          tags:
            [],

          relevant:
            true
        });
      }

    } catch (error) {

      console.warn(
        `⚠️ Feed inaccessible : ${feed.name}`
      );

      console.warn(
        error.message
      );
    }
  }

  return candidates.slice(
    0,
    targetCount
  );
}

/*
|--------------------------------------------------------------------------
| AJOUT + TRADUCTION DES ARTICLES
|--------------------------------------------------------------------------
*/

async function addArticles(
  candidates
) {

  const added = [];

  for (
    const candidate of candidates
  ) {

    console.log(
      `🌍 Traduction : ${candidate.originalTitle}`
    );

    const title =
      await translateToFrench(
        candidate.originalTitle
      );

    const summary =
      (
        await translateToFrench(
          candidate.originalSummary.slice(
            0,
            1000
          )
        )
      ).slice(
        0,
        320
      );

    const item = {

      id:
        candidate.id,

      date:
        candidate.date,

      horizon:
        candidate.horizon,

      title,

      summary,

      source:
        candidate.source,

      url:
        candidate.url,

      verified:
        false,

      tags:
        [],

      relevant:
        true
    };

    data.items.push(
      item
    );

    existingIds.add(
      item.id
    );

    added.push(
      item
    );
  }

  return added;
}

/*
|--------------------------------------------------------------------------
| COLLECTE DES 3 HORIZONS
|--------------------------------------------------------------------------
*/

const collectedByHorizon = {
  H1: [],
  H2: [],
  H3: []
};

for (
  const horizon of [
    'H1',
    'H2',
    'H3'
  ]
) {

  if (
    !isDue(horizon)
  ) {

    console.log('');
    console.log(
      `⏭️ ${horizon} : pas encore dû`
    );

    continue;
  }

  const measurements =
    getMeasurements(
      horizon
    );

  const firstMeasurement =
    measurements.length === 0;

  const initialIncomplete =
    needsInitialCompletion(
      horizon
    );

  /*
  |--------------------------------------------------------------------------
  | NOMBRE D'ARTICLES ACTUELS
  |--------------------------------------------------------------------------
  */

  const existingForHorizon =
    getItemsForHorizon(
      horizon
    );

  const existingCount =
    existingForHorizon.length;

  /*
  |--------------------------------------------------------------------------
  | PREMIÈRE MESURE
  |--------------------------------------------------------------------------
  */

  if (
    firstMeasurement ||
    initialIncomplete
  ) {

    console.log('');
    console.log(
      `🔎 Collecte ${horizon} (PREMIÈRE MESURE / COMPLÉTION)`
    );

    console.log(
      `📚 Articles déjà disponibles pour ${horizon} : ${existingCount}`
    );

    const missing =
      Math.max(
        0,
        MAX_ARTICLES_PER_HORIZON -
          existingCount
      );

    if (
      missing === 0
    ) {

      console.log(
        `✅ ${horizon} possède déjà ${MAX_ARTICLES_PER_HORIZON} articles`
      );

    } else {

      console.log(
        `🎯 ${horizon} : recherche de ${missing} article(s) supplémentaire(s)`
      );

      const candidates =
        await collectForHorizon(
          horizon,
          missing
        );

      const added =
        await addArticles(
          candidates
        );

      collectedByHorizon[
        horizon
      ].push(
        ...added
      );
    }

  }

  /*
  |--------------------------------------------------------------------------
  | NOUVELLE MESURE PROGRAMMÉE
  |--------------------------------------------------------------------------
  */

  else {

    console.log('');
    console.log(
      `🔎 Collecte ${horizon} (NOUVELLE MESURE)`
    );

    console.log(
      `📚 Articles historiques pour ${horizon} : ${existingCount}`
    );

    console.log(
      `🎯 Recherche de ${MAX_ARTICLES_PER_HORIZON} nouvel article(s)`
    );

    const candidates =
      await collectForHorizon(
        horizon,
        MAX_ARTICLES_PER_HORIZON
      );

    const added =
      await addArticles(
        candidates
      );

    collectedByHorizon[
      horizon
    ].push(
      ...added
    );

    console.log(
      `📊 ${horizon} : ${added.length} nouvel article(s) collecté(s)`
    );
  }
}

/*
|--------------------------------------------------------------------------
| CRÉATION / MISE À JOUR DES MESURES
|--------------------------------------------------------------------------
*/

for (
  const horizon of [
    'H1',
    'H2',
    'H3'
  ]
) {

  /*
  |--------------------------------------------------------------------------
  | SAVOIR SI UNE MESURE DOIT ÊTRE CRÉÉE
  |--------------------------------------------------------------------------
  */

  if (
    !isDue(horizon)
  ) {
    continue;
  }

  const measurements =
    getMeasurements(
      horizon
    );

  const firstMeasurement =
    measurements.length === 0;

  const initialIncomplete =
    needsInitialCompletion(
      horizon
    );

  const itemsForHorizon =
    getItemsForHorizon(
      horizon
    );

  /*
  |--------------------------------------------------------------------------
  | PREMIÈRE MESURE / MESURE INCOMPLÈTE
  |--------------------------------------------------------------------------
  */

  if (
    firstMeasurement ||
    initialIncomplete
  ) {

    /*
    |--------------------------------------------------------------------------
    | ON PREND LES 5 PREMIERS ARTICLES
    |--------------------------------------------------------------------------
    */

    const measurementItems =
      itemsForHorizon.slice(
        0,
        MAX_ARTICLES_PER_HORIZON
      );

    if (
      measurementItems.length === 0
    ) {

      console.warn(
        `⚠️ Impossible de créer la mesure ${horizon} : aucun article`
      );

      continue;
    }

    /*
    |--------------------------------------------------------------------------
    | SUPPRESSION DE L'ANCIENNE MESURE INCOMPLÈTE DU JOUR
    |--------------------------------------------------------------------------
    */

    data.measurements =
      data.measurements.filter(
        measurement =>
          !(
            measurement.date === today &&
            measurement.horizon === horizon
          )
      );

    /*
    |--------------------------------------------------------------------------
    | CRÉATION DE LA MESURE
    |--------------------------------------------------------------------------
    */

    const measurement = {

      date:
        today,

      horizon,

      frequency:
        horizonConfig[horizon]
          .frequency,

      objective:
        horizonConfig[horizon]
          .objective,

      itemsCollected:
        measurementItems.length,

      itemsRelevant:
        measurementItems.filter(
          item =>
            item.relevant !== false
        ).length,

      itemsVerified:
        measurementItems.filter(
          item =>
            item.verified === true
        ).length,

      duplicates:
        0,

      weakSignals:
        horizon === 'H3'
          ? Math.min(
              2,
              measurementItems.length
            )
          : horizon === 'H2'
            ? Math.min(
                1,
                measurementItems.length
              )
            : 0,

      note:
        measurementItems.length >=
        MAX_ARTICLES_PER_HORIZON
          ? 'Première mesure automatique complétée avec 5 articles pertinents.'
          : 'Première mesure automatique en cours de complétion : moins de 5 articles pertinents disponibles.',

      source:
        'Flux RSS',

      sourceUrl:
        ''
    };

    data.measurements.push(
      measurement
    );

    console.log(
      `📊 Mesure ${horizon} enregistrée avec ${measurementItems.length} article(s)`
    );

    continue;
  }

  /*
  |--------------------------------------------------------------------------
  | NOUVELLE MESURE PROGRAMMÉE
  |--------------------------------------------------------------------------
  */

  const newItems =
    collectedByHorizon[
      horizon
    ];

  /*
  |--------------------------------------------------------------------------
  | SI AUCUN NOUVEL ARTICLE
  |--------------------------------------------------------------------------
  */

  if (
    newItems.length === 0
  ) {

    console.warn(
      `⚠️ ${horizon} : aucun nouvel article pertinent trouvé pour cette mesure`
    );

    continue;
  }

  /*
  |--------------------------------------------------------------------------
  | UNE NOUVELLE MESURE EST BASÉE SUR LES NOUVEAUX ARTICLES
  |--------------------------------------------------------------------------
  */

  const measurementItems =
    newItems.slice(
      0,
      MAX_ARTICLES_PER_HORIZON
    );

  const measurement = {

    date:
      today,

    horizon,

    frequency:
      horizonConfig[horizon]
        .frequency,

    objective:
      horizonConfig[horizon]
        .objective,

    itemsCollected:
      measurementItems.length,

    itemsRelevant:
      measurementItems.filter(
        item =>
          item.relevant !== false
      ).length,

    itemsVerified:
      measurementItems.filter(
        item =>
          item.verified === true
      ).length,

    duplicates:
      0,

    weakSignals:
      horizon === 'H3'
        ? Math.min(
            2,
            measurementItems.length
          )
        : horizon === 'H2'
          ? Math.min(
              1,
              measurementItems.length
            )
          : 0,

    note:
      'Nouvelle mesure automatique à partir des nouveaux articles pertinents des flux RSS.',

    source:
      'Flux RSS',

    sourceUrl:
      ''
  };

  data.measurements.push(
    measurement
  );

  console.log(
    `📊 Nouvelle mesure ${horizon} enregistrée avec ${measurementItems.length} nouvel article(s)`
  );
}

/*
|--------------------------------------------------------------------------
| DATE DE MISE À JOUR
|--------------------------------------------------------------------------
*/

data.lastUpdated =
  today;

/*
|--------------------------------------------------------------------------
| SAUVEGARDE
|--------------------------------------------------------------------------
*/

await fs.writeFile(
  path,
  JSON.stringify(
    data,
    null,
    2
  ) + '\n'
);

/*
|--------------------------------------------------------------------------
| RÉSUMÉ FINAL
|--------------------------------------------------------------------------
*/

const totalNew =
  Object.values(
    collectedByHorizon
  )
    .reduce(
      (total, items) =>
        total + items.length,
      0
    );

console.log('');

console.log(
  '=========================================='
);

console.log(
  `✅ Collecte terminée : ${totalNew} nouvel article(s)`
);

console.log(
  `📚 Total dans la veille : ${data.items.length} article(s)`
);

console.log(
  '🇫🇷 Titres et résumés traduits en français'
);

console.log(
  '🎯 Première mesure : jusqu’à 5 articles par horizon'
);

console.log(
  '📊 H1 : chaque semaine | H2 : chaque mois | H3 : chaque trimestre'
);

console.log(
  '=========================================='
);