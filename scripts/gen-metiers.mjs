/**
 * gen-metiers — Génère des pages SEO statiques par métier (post-build).
 *
 * Réutilise les données de l'app (jobIntel) → pour chaque métier, une page HTML
 * autonome, crawlable, qui ranke sur « compétences / CV / entretien [métier] »
 * et renvoie vers les outils. + un hub + le sitemap.
 *
 * Lancé après `vite build` (script npm "postbuild"). Écrit dans dist/.
 */
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listJobs } from '../src/lib/jobIntel.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = resolve(ROOT, 'dist');
const SITE = 'https://www.cv.altio-wave.com';
const APP = 'Altio CV';

const slugify = (s) =>
  String(s).normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function write(rel, html) {
  const file = resolve(DIST, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html, 'utf8');
}

// ── Gabarit commun ────────────────────────────────────────────────────────────
const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Manrope',system-ui,-apple-system,sans-serif;color:#0B1638;background:#F4F6FA;line-height:1.6}
a{color:#1539B7;text-decoration:none}
.wrap{max-width:760px;margin:0 auto;padding:0 20px}
header.top{background:#fff;border-bottom:1px solid #E6EAF1}
.topin{display:flex;align-items:center;justify-content:space-between;height:60px}
.brand{display:flex;align-items:center;gap:9px;font-weight:800;font-size:17px;color:#0B1638}
.mark{width:30px;height:30px;border-radius:8px;background:#1539B7;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800}
.btn{display:inline-block;background:#1539B7;color:#fff;font-weight:700;font-size:14px;padding:10px 18px;border-radius:99px}
.btn.ghost{background:#EEF2FF;color:#1539B7}
.hero{padding:44px 0 8px}
.eyebrow{display:inline-block;font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#1539B7;background:#EEF2FF;padding:5px 11px;border-radius:99px}
h1{font-size:34px;font-weight:800;letter-spacing:-1px;line-height:1.15;margin:14px 0 12px}
.lead{font-size:17px;color:#3A4156;margin-bottom:8px}
h2{font-size:22px;font-weight:800;letter-spacing:-.4px;margin:34px 0 14px}
.card{background:#fff;border:1px solid #E6EAF1;border-radius:14px;padding:16px 18px;margin-bottom:10px}
.card b{color:#0B1638}
.card p{color:#3A4156;font-size:14.5px;margin-top:3px}
ul.clean{list-style:none}
ul.clean li{background:#fff;border:1px solid #E6EAF1;border-radius:12px;padding:12px 16px;margin-bottom:8px;font-size:14.5px;color:#3A4156;position:relative;padding-left:40px}
ul.clean li:before{content:'✓';position:absolute;left:16px;color:#0CA678;font-weight:800}
ul.warn li:before{content:'!';color:#E03131}
.tags{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}
.tag{background:#fff;border:1px solid #E6EAF1;border-radius:99px;padding:6px 13px;font-size:13px;font-weight:600;color:#3A4156}
.cta{background:linear-gradient(135deg,#1539B7,#0B1638);color:#fff;border-radius:18px;padding:26px;margin:34px 0;text-align:center}
.cta h3{font-size:21px;font-weight:800;margin-bottom:8px}
.cta p{color:#C8D3F5;font-size:14.5px;margin-bottom:16px}
.cta .row{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
.cta .btn{background:#fff;color:#1539B7}
.cta .btn.ghost{background:rgba(255,255,255,.16);color:#fff}
footer{border-top:1px solid #E6EAF1;margin-top:40px;padding:24px 0;color:#8390A6;font-size:13px;text-align:center}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;margin-top:8px}
.mcard{display:block;background:#fff;border:1px solid #E6EAF1;border-radius:14px;padding:18px}
.mcard .e{font-size:26px}
.mcard .n{font-weight:800;color:#0B1638;margin-top:8px}
.mcard .s{font-size:13px;color:#8390A6;margin-top:2px}
@media(max-width:600px){h1{font-size:27px}}
`;

function shell({ title, description, canonical, body, jsonld }) {
  return `<!DOCTYPE html><html lang="fr"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<meta name="theme-color" content="#1539B7">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%231539B7'/%3E%3Ctext x='16' y='23' font-family='Arial' font-size='20' font-weight='bold' fill='white' text-anchor='middle'%3EA%3C/text%3E%3C/svg%3E">
<meta property="og:type" content="article"><meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}">
<meta property="og:image" content="${SITE}/og.png"><meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet">
<style>${CSS}</style>
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ''}
</head><body>
<header class="top"><div class="wrap topin">
  <a class="brand" href="${SITE}/"><span class="mark">A</span> Altio <span style="color:#1539B7">CV</span></a>
  <a class="btn" href="${SITE}/generate">Créer mon CV</a>
</div></header>
${body}
<footer><div class="wrap">© ${new Date().getFullYear()} ${APP} — Générateur de CV gratuit & préparation à l'emploi · <a href="${SITE}/">Accueil</a> · <a href="${SITE}/guides-metiers">Tous les métiers</a></div></footer>
</body></html>`;
}

// ── Page métier ───────────────────────────────────────────────────────────────
function metierPage(job, slug) {
  const url = `${SITE}/metier/${slug}`;
  const title = `${job.label} : compétences, CV et entretien — ${APP}`;
  const description = `Tout pour décrocher un poste de ${job.label} : compétences clés, ce que recherchent les recruteurs, questions d'entretien type et modèle de CV. Crée ton CV gratuitement avec ${APP}.`;

  const li = (arr) => arr.map((x) => `<li>${esc(x)}</li>`).join('');
  const skills = (job.keySkills || []).map((s) => `<div class="card"><b>${esc(s.name)}</b><p>${esc(s.why)}</p></div>`).join('');
  const situations = (job.situations || []).map((s) => `<div class="card"><b>${esc(s.situation)}</b><p>Compétence mobilisée : ${esc(s.skill)}</p></div>`).join('');
  const hard = (job.hard || []).slice(0, 12).map((x) => `<span class="tag">${esc(x)}</span>`).join('');
  const soft = (job.soft || []).slice(0, 12).map((x) => `<span class="tag">${esc(x)}</span>`).join('');

  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Article', headline: title, description, inLanguage: 'fr-FR', mainEntityOfPage: url, image: `${SITE}/og.png`, author: { '@type': 'Organization', name: 'Altio' } },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Métiers', item: `${SITE}/guides-metiers` },
        { '@type': 'ListItem', position: 3, name: job.label, item: url },
      ] },
    ],
  };

  const body = `<main class="wrap">
  <div class="hero">
    <span class="eyebrow">${esc(job.sector || 'Métier')}</span>
    <h1>${esc(job.label)} : compétences clés, CV et entretien</h1>
    <p class="lead">${esc(job.pitch || '')}</p>
  </div>

  <h2>Les compétences clés pour ce poste</h2>
  ${skills || '<p>—</p>'}

  ${(job.recruiterLooksFor || []).length ? `<h2>Ce que recherche le recruteur</h2><ul class="clean">${li(job.recruiterLooksFor)}</ul>` : ''}

  ${(job.pitfalls || []).length ? `<h2>Les pièges à éviter</h2><ul class="clean warn">${li(job.pitfalls)}</ul>` : ''}

  ${situations ? `<h2>Mises en situation typiques</h2>${situations}` : ''}

  ${hard ? `<h2>Compétences techniques attendues</h2><div class="tags">${hard}</div>` : ''}
  ${soft ? `<h2>Qualités &amp; savoir-être</h2><div class="tags">${soft}</div>` : ''}

  <div class="cta">
    <h3>Prêt à décrocher ce poste ?</h3>
    <p>Crée un CV adapté à ce métier et entraîne-toi à l'entretien — gratuitement.</p>
    <div class="row">
      <a class="btn" href="${SITE}/generate">Créer mon CV</a>
      <a class="btn ghost" href="${SITE}/entretien">M'entraîner à l'entretien</a>
      <a class="btn ghost" href="${SITE}/lettre">Générer ma lettre</a>
    </div>
  </div>

  <p><a href="${SITE}/guides-metiers">← Voir tous les métiers</a></p>
</main>`;

  return shell({ title, description, canonical: url, body, jsonld });
}

// ── Hub ───────────────────────────────────────────────────────────────────────
function hubPage(jobs) {
  const url = `${SITE}/guides-metiers`;
  const title = `Fiches métiers : compétences, CV & entretien — ${APP}`;
  const description = `Découvre les compétences clés, les attentes des recruteurs et les questions d'entretien pour chaque métier. Crée ton CV et prépare-toi gratuitement.`;
  const cards = jobs.map((j) => `<a class="mcard" href="${SITE}/metier/${j.slug}">
    <span class="e">${esc(j.emoji || '💼')}</span>
    <div class="n">${esc(j.label)}</div>
    <div class="s">${esc(j.sector || '')}</div>
  </a>`).join('');

  const body = `<main class="wrap">
  <div class="hero">
    <span class="eyebrow">Fiches métiers</span>
    <h1>Compétences, CV et entretien par métier</h1>
    <p class="lead">Pour chaque métier : les compétences clés attendues, ce que cherchent les recruteurs, les questions d'entretien types — et de quoi créer ton CV en quelques minutes.</p>
  </div>
  <div class="grid">${cards}</div>
  <div class="cta">
    <h3>Crée ton CV gratuitement</h3>
    <p>Choisis ton métier, l'app t'aide à le mettre en valeur.</p>
    <div class="row"><a class="btn" href="${SITE}/generate">Commencer</a></div>
  </div>
</main>`;

  return shell({ title, description, canonical: url, body });
}

// ── Sitemap ───────────────────────────────────────────────────────────────────
function sitemap(jobs) {
  const urls = [
    { loc: `${SITE}/`, p: '1.0', f: 'weekly' },
    { loc: `${SITE}/pricing`, p: '0.8', f: 'monthly' },
    { loc: `${SITE}/guides-metiers`, p: '0.8', f: 'weekly' },
    ...jobs.map((j) => ({ loc: `${SITE}/metier/${j.slug}`, p: '0.7', f: 'monthly' })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${u.loc}</loc><changefreq>${u.f}</changefreq><priority>${u.p}</priority></url>`).join('\n') +
    `\n</urlset>\n`;
}

// ── Run ───────────────────────────────────────────────────────────────────────
if (!existsSync(DIST)) {
  console.error('[gen-metiers] dist/ introuvable — lance `vite build` d\'abord.');
  process.exit(0);
}
const jobs = listJobs().map((j) => ({ ...j, slug: slugify(j.label) }));
for (const j of jobs) write(`metier/${j.slug}/index.html`, metierPage(j, j.slug));
write('guides-metiers/index.html', hubPage(jobs));
writeFileSync(resolve(DIST, 'sitemap.xml'), sitemap(jobs), 'utf8');
console.log(`[gen-metiers] ${jobs.length} pages métier + hub + sitemap générés.`);
