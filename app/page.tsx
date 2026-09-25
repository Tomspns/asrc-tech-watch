import data from '../data/veille.json';
import type { WatchData, Horizon } from '../lib/types';

const watch = data as WatchData;

const horizons: Horizon[] = ['H1', 'H2', 'H3'];

const labels = {
  H1: {
    title: 'H1 — Court terme',
    freq: 'Chaque semaine',
    desc: 'Actualités, vulnérabilités et évolutions des systèmes, réseaux et de la cybersécurité.'
  },

  H2: {
    title: 'H2 — Moyen terme',
    freq: 'Chaque mois',
    desc: 'Cloud, automatisation, infrastructures réseau et solutions de cybersécurité.'
  },

  H3: {
    title: 'H3 — Long terme',
    freq: 'Chaque trimestre',
    desc: 'Technologies émergentes : IA, informatique quantique et transformations potentielles.'
  }
};

function pct(a: number, b: number) {
  return b ? Math.round((a / b) * 100) : 0;
}

export default function Home() {
  const total = watch.items.length;

  const verified = watch.items.filter(
    x => x.verified
  ).length;

  return (
    <main className="shell">

      <header className="hero">
        <div>
          <span className="eyebrow">
            BACHELOR ASRC · 2026–2027
          </span>

          <h1>ASRC TECH WATCH</h1>

          <p>
            Veille technologique — Systèmes, Réseaux & Cybersécurité
          </p>
        </div>

        <div className="status">
          <span className="dot" />

          Automatisation active

          <br />

          <small>
            Dernière mesure : {watch.lastUpdated}
          </small>
        </div>
      </header>


      <section className="grid three">

        {horizons.map(h => {

          const m = [...watch.measurements]
            .reverse()
            .find(x => x.horizon === h);

          return (
            <article
              className={`card horizon ${h}`}
              key={`horizon-${h}`}
            >

              <div className="tag">
                {h}
              </div>

              <h2>
                {labels[h].title}
              </h2>

              <strong>
                {labels[h].freq}
              </strong>

              <p>
                {labels[h].desc}
              </p>

              {m && (
                <div className="metric">
                  <b>
                    {m.itemsCollected}
                  </b>

                  <span>
                    élément(s) collecté(s) lors de la dernière mesure
                  </span>
                </div>
              )}

            </article>
          );

        })}

      </section>


      <section className="grid stats">

        <article className="card stat">
          <span>
            Informations suivies
          </span>

          <b>
            {total}
          </b>
        </article>


        <article className="card stat">
          <span>
            Informations vérifiées
          </span>

          <b>
            {pct(verified, total)}%
          </b>
        </article>


        <article className="card stat">
          <span>
            Mesures réalisées
          </span>

          <b>
            {watch.measurements.length}
          </b>
        </article>


        <article className="card stat">
          <span>
            Objectif
          </span>

          <b>
            100%
          </b>

          <small>
            mise à jour automatique
          </small>
        </article>

      </section>


      <section className="card">

        <div className="section-head">

          <div>
            <span className="eyebrow">
              COLLECTE
            </span>

            <h2>
              Dernières informations
            </h2>
          </div>

          <span className="pill">
            Sources vérifiées
          </span>

        </div>


        <div className="items">

          {watch.items.map((item, index) => (

            <article
              className="item"
              key={`${item.id}-${item.horizon}-${index}`}
            >

              <div className="item-top">

                <span
                  className={`hbadge ${item.horizon}`}
                >
                  {item.horizon}
                </span>

                <span>
                  {item.date}
                </span>

              </div>


              <h3>
                {item.title}
              </h3>


              <p>
                {item.summary}
              </p>


              <div className="item-bottom">

                <span>
                  {item.source}
                </span>

                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Lire la source ↗
                </a>

              </div>

            </article>

          ))}

        </div>

      </section>


      <section className="card">

        <div className="section-head">

          <div>
            <span className="eyebrow">
              QMS · KPI
            </span>

            <h2>
              Indicateurs de suivi
            </h2>
          </div>

        </div>


        <div className="kpis">

          {[
            [
              'Taux de pertinence',
              '≥ 70%',
              'Infos pertinentes / infos collectées × 100'
            ],

            [
              'Taux de vérification',
              '≥ 80%',
              'Infos vérifiées / infos nécessitant vérification × 100'
            ],

            [
              'Qualité des sources',
              '≥ 8/10',
              'Autorité + expertise + rigueur éditoriale + fiabilité'
            ],

            [
              'Taux de doublons',
              '≤ 15%',
              'Doublons / infos collectées × 100'
            ],

            [
              'Bonne classification H1/H2/H3',
              '≥ 80%',
              'Classifications correctes / total × 100'
            ],

            [
              'Couverture des domaines',
              '≥ 90%',
              'Domaines couverts / domaines définis × 100'
            ],

            [
              'Temps de détection H1',
              '< 6 h',
              'Temps entre publication et détection d’une information critique'
            ],

            [
              'Taux d’utilisation',
              '≥ 30%',
              'Informations utilisées / informations pertinentes × 100'
            ],

            [
              'Taux de sources non fiables',
              '≤ 5%',
              'Sources écartées pour manque de fiabilité / sources analysées × 100'
            ],

            [
              'Signaux faibles H2/H3',
              '≥ 1 / mesure',
              'Nombre de signaux émergents identifiés lors de la mesure'
            ]

          ].map(([name, target, formula]) => (

            <div
              className="kpi"
              key={name}
            >

              <b>
                {name}
              </b>

              <span>
                {target}
              </span>

              <small>
                {formula}
              </small>

            </div>

          ))}

        </div>

      </section>


      <section className="card">

        <div className="section-head">

          <div>
            <span className="eyebrow">
              MÉTHODE
            </span>

            <h2>
              Sources & critères de vérification
            </h2>
          </div>

        </div>


        <div className="method-grid">

          <div>
            <b>
              Sources prioritaires
            </b>

            <p>
              ANSSI/CERT-FR, Microsoft Security, AWS,
              Google Cloud, Cloudflare, Cisco, NIST/NVD
              et sources spécialisées reconnues.
            </p>
          </div>


          <div>
            <b>
              Vérification
            </b>

            <p>
              Identifier l'auteur et l'organisme, vérifier
              la date, privilégier la source primaire,
              rechercher une seconde source indépendante
              pour les informations importantes.
            </p>
          </div>


          <div>
            <b>
              Anti-doublon
            </b>

            <p>
              Comparer titre, URL et contenu avant
              d'ajouter une information. Une même actualité
              reprise par plusieurs médias reste un seul événement.
            </p>
          </div>


          <div>
            <b>
              Classement
            </b>

            <p>
              H1 = impact proche et opérationnel ;
              H2 = évolution à moyen terme ;
              H3 = technologie émergente et incertaine à long terme.
            </p>
          </div>

        </div>

      </section>


      <section className="card plan">

        <div>
          <span className="eyebrow">
            AUTOMATISATION
          </span>

          <h2>
            Calendrier de collecte
          </h2>
        </div>


        <div className="timeline">

          <div>
            <b>H1</b>
            <span>Chaque vendredi</span>
            <small>
              Actualités, vulnérabilités, systèmes,
              réseaux, cybersécurité.
            </small>
          </div>


          <div>
            <b>H2</b>
            <span>1 fois / mois</span>
            <small>
              Cloud, automatisation, infrastructures réseau, cyber.
            </small>
          </div>


          <div>
            <b>H3</b>
            <span>1 fois / trimestre</span>
            <small>
              IA, informatique quantique, technologies émergentes.
            </small>
          </div>

        </div>


        <p className="note">
          La collecte est exécutée côté GitHub Actions.
          Le fichier de données est ensuite versionné et
          Vercel redéploie automatiquement le site.
          Le poste de l'étudiant n'a donc pas besoin de rester allumé.
        </p>

      </section>


      <footer>
        ASRC TECH WATCH · Projet de veille technologique ·
        Première mesure : 25/09/2026
      </footer>

    </main>
  );
}