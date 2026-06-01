/**
 * compare-models.mjs — Compare Haiku 4.5 vs Sonnet 4.5 sur l'extraction CV.
 *
 * Utilise EXACTEMENT le prompt d'extraction de prod (Generate.jsx) sur un CV
 * exemple, lance les deux modèles, et affiche : JSON produit, tokens, coût, temps.
 *
 * Usage (PowerShell) :
 *   $env:ANTHROPIC_API_KEY="sk-ant-..."; node scripts/compare-models.mjs
 * Usage (bash) :
 *   ANTHROPIC_API_KEY="sk-ant-..." node scripts/compare-models.mjs
 *
 * La clé n'est JAMAIS écrite dans le fichier : lue depuis l'environnement.
 */

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) {
  console.error('\n❌ ANTHROPIC_API_KEY manquante dans l\'environnement.\n');
  console.error('   PowerShell : $env:ANTHROPIC_API_KEY="sk-ant-..."; node scripts/compare-models.mjs');
  console.error('   bash       : ANTHROPIC_API_KEY="sk-ant-..." node scripts/compare-models.mjs\n');
  process.exit(1);
}

// ─── Tarifs ($ / million de tokens) ──────────────────────────────────────────
const PRICING = {
  'claude-sonnet-4-5': { in: 3, out: 15 },
  'claude-haiku-4-5':  { in: 1, out: 5 },
};
const USD_EUR = 0.92;

// ─── Prompt d'extraction (copie fidèle de Generate.jsx, sans secteur/annonce) ─
const extractPrompt = `Tu es un extracteur de données CV expert. Extrais TOUTES les informations et retourne UNIQUEMENT un objet JSON valide, sans markdown, sans backticks.

STRUCTURE JSON EXACTE :
{
  "prenom": "string",
  "nom": "string",
  "telephone": "string ou vide",
  "email": "string ou vide",
  "adresse": "string ou vide",
  "dateNaissance": "JJ/MM/AAAA ou vide",
  "poste": "INTITULÉ EN MAJUSCULES",
  "accroche": "4-6 lignes, 1ère personne, parcours réel, formation Talia, poste visé",
  "experiences": [{"poste":"","entreprise":"","lieu":"","periode":"","missions":[]}],
  "formations": [{"titre":"","etablissement":"","periode":"","isTalia":false}],
  "competences": {"techniques":[],"comportementales":[],"outils":[]},
  "langues": [{"langue":"","niveau":""}],
  "centresInteret": [],
  "lettreMotivation": "Si AUCUNE expérience, 3 paragraphes séparés \\n\\n. Sinon vide."
}

RÈGLES :
- CONSERVER coordonnées EXACTES du CV source
- CONSERVER TOUTES les expériences et formations (antéchronologique)
- 3 à 5 missions par expérience avec verbes d'action
- Fusionner compétences du CV avec celles sélectionnées, sans doublons
- Formation Talia EN PREMIER dans formations avec isTalia:true
- Si date de naissance fournie dans les paramètres, l'utiliser
- Le poste doit être adapté au genre si précisé
- Répondre UNIQUEMENT avec le JSON`;

// ─── CV exemple (texte brut typique d'un candidat alternance) ─────────────────
const sampleCV = `Extrais toutes les données de ce CV :
Marie Lefèvre
Née le 14/03/2001 — Lyon
06 12 34 56 78 | marie.lefevre@gmail.com
LinkedIn : linkedin.com/in/marielefevre

OBJECTIF
Recherche une alternance en marketing digital pour valider mon Bachelor à l'école Talia.

EXPÉRIENCES
Stage Assistante Marketing — BoutiqueMode SARL, Lyon (Mars 2023 - Juin 2023)
- Gestion des réseaux sociaux Instagram et TikTok (+25% d'abonnés)
- Création de visuels avec Canva
- Rédaction de newsletters Mailchimp

Vendeuse polyvalente — Zara, Lyon (Été 2022)
- Conseil clientèle et encaissement
- Mise en rayon et gestion des stocks

FORMATION
Bachelor Marketing Digital — École Talia (2023 - en cours)
BTS Communication — Lycée Saint-Exupéry, Lyon (2021 - 2023)

COMPÉTENCES
Réseaux sociaux, SEO, Canva, Photoshop, Mailchimp, Pack Office
Créative, rigoureuse, esprit d'équipe

LANGUES
Français (natif), Anglais (B2), Espagnol (A2)

CENTRES D'INTÉRÊT
Photographie, voyages, danse`;

// ─── Appel modèle ─────────────────────────────────────────────────────────────
async function runModel(model) {
  const t0 = Date.now();
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4000,
      system: extractPrompt,
      messages: [{ role: 'user', content: sampleCV }],
    }),
  });
  const ms = Date.now() - t0;
  const json = await res.json();
  if (!res.ok) {
    return { model, ok: false, ms, error: json.error?.message || JSON.stringify(json) };
  }
  const text = (json.content || []).map((b) => b.text || '').join('');
  const u = json.usage || {};
  const p = PRICING[model];
  const costUsd = (u.input_tokens / 1e6) * p.in + (u.output_tokens / 1e6) * p.out;
  // Validité JSON ?
  let parsed = null, jsonOk = false;
  try {
    const clean = text.replace(/^```json?\s*/, '').replace(/```\s*$/, '').trim();
    parsed = JSON.parse(clean);
    jsonOk = true;
  } catch { /* invalide */ }
  return {
    model, ok: true, ms, text, parsed, jsonOk,
    inTok: u.input_tokens, outTok: u.output_tokens,
    costUsd, costEur: costUsd * USD_EUR,
  };
}

// ─── Évalue la complétude de l'extraction ────────────────────────────────────
function score(p) {
  if (!p) return { pts: 0, max: 8, details: ['JSON invalide'] };
  const checks = [
    ['prénom/nom', p.prenom === 'Marie' && p.nom === 'Lefèvre'],
    ['téléphone', (p.telephone || '').includes('06 12 34 56 78')],
    ['email', (p.email || '').includes('marie.lefevre@gmail.com')],
    ['date naissance', (p.dateNaissance || '').includes('14/03/2001')],
    ['2 expériences', Array.isArray(p.experiences) && p.experiences.length >= 2],
    ['Talia en 1er + isTalia', Array.isArray(p.formations) && p.formations[0]?.isTalia === true],
    ['3 langues', Array.isArray(p.langues) && p.langues.length >= 3],
    ['missions détaillées', Array.isArray(p.experiences) && (p.experiences[0]?.missions?.length >= 3)],
  ];
  const passed = checks.filter(([, ok]) => ok);
  return {
    pts: passed.length, max: checks.length,
    details: checks.map(([n, ok]) => `${ok ? '✅' : '❌'} ${n}`),
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
console.log('\n⏳ Lancement des 2 modèles sur le même CV exemple…\n');
const [haiku, sonnet] = await Promise.all([
  runModel('claude-haiku-4-5'),
  runModel('claude-sonnet-4-5'),
]);

for (const r of [haiku, sonnet]) {
  console.log('━'.repeat(64));
  console.log(`MODÈLE : ${r.model}`);
  console.log('━'.repeat(64));
  if (!r.ok) { console.log(`❌ Erreur : ${r.error}\n`); continue; }
  const s = score(r.parsed);
  console.log(`⏱  Temps      : ${(r.ms / 1000).toFixed(1)}s`);
  console.log(`🔢 Tokens     : ${r.inTok} in / ${r.outTok} out`);
  console.log(`💰 Coût       : $${r.costUsd.toFixed(4)}  (~${r.costEur.toFixed(4)} €)`);
  console.log(`📋 JSON valide: ${r.jsonOk ? 'OUI' : 'NON ❌'}`);
  console.log(`🎯 Qualité    : ${s.pts}/${s.max}`);
  s.details.forEach((d) => console.log(`     ${d}`));
  console.log('');
}

// ─── Verdict ─────────────────────────────────────────────────────────────────
if (haiku.ok && sonnet.ok) {
  const sH = score(haiku.parsed).pts, sS = score(sonnet.parsed).pts;
  const saving = (1 - haiku.costUsd / sonnet.costUsd) * 100;
  console.log('═'.repeat(64));
  console.log('VERDICT');
  console.log('═'.repeat(64));
  console.log(`Qualité  : Haiku ${sH}/8  vs  Sonnet ${sS}/8`);
  console.log(`Coût     : Haiku ~${haiku.costEur.toFixed(4)}€  vs  Sonnet ~${sonnet.costEur.toFixed(4)}€  (−${saving.toFixed(0)}%)`);
  console.log(`Vitesse  : Haiku ${(haiku.ms/1000).toFixed(1)}s  vs  Sonnet ${(sonnet.ms/1000).toFixed(1)}s`);
  console.log('');
  if (sH >= sS) console.log('👉 Haiku égale ou dépasse Sonnet ici → bascule recommandée (gros gain coût).');
  else if (sH >= sS - 1) console.log('👉 Haiku très proche de Sonnet → bascule probablement OK, à confirmer sur + d\'exemples.');
  else console.log('👉 Sonnet nettement meilleur → garder Sonnet pour la génération.');
  console.log('');
  console.log('💡 Pour voir le détail JSON, ajoute --json :');
  console.log('   node scripts/compare-models.mjs --json\n');
  if (process.argv.includes('--json')) {
    console.log('─── JSON HAIKU ───\n' + JSON.stringify(haiku.parsed, null, 2));
    console.log('\n─── JSON SONNET ──\n' + JSON.stringify(sonnet.parsed, null, 2));
  }
}
