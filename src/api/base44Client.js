import { PHOTO_PLACEHOLDER } from '@/lib/cvData';

const STORAGE_KEY = 'ALTIO_CV_list';

function getList() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}
function saveList(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

const MOCK_CV_HTML = (name, poste, palette) => `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{width:210mm;min-height:297mm;font-family:'DM Sans',system-ui,sans-serif}
  .cv-wrap{display:flex;width:210mm;min-height:297mm;font-size:10px;color:#1a1a2e}
  .cv-sidebar{width:63mm;min-height:297mm;background:#1B4F8A;color:#fff;padding:24px 16px}
  .cv-logo{margin-bottom:18px}
  .cv-photo{display:flex;justify-content:center;margin-bottom:20px}
  .s-title{font-size:8px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#F4A421;border-bottom:1px solid rgba(255,255,255,0.2);padding-bottom:4px;margin-bottom:8px;margin-top:14px}
  .s-title:first-of-type{margin-top:0}
  .cv-sidebar p,.cv-sidebar li{font-size:9px;color:rgba(255,255,255,0.9);line-height:1.6}
  .cv-sidebar ul{list-style:none;padding:0}
  .cv-sidebar li::before{content:"▸ ";color:#F4A421}
  .cv-main{flex:1;display:flex;flex-direction:column}
  .cv-header{background:#EBF2FA;padding:22px 22px 18px;border-bottom:3px solid #1B4F8A}
  .cv-nom{font-family:Georgia,serif;font-size:22px;font-weight:700;color:#1B4F8A;line-height:1.1}
  .cv-poste{font-size:10px;font-weight:700;color:#F4A421;letter-spacing:2px;text-transform:uppercase;margin-top:4px}
  .cv-accroche{margin-top:10px;font-size:9.5px;line-height:1.6;color:#374151;font-style:italic}
  .cv-body{padding:18px 22px}
  .section-title{font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#1B4F8A;border-left:3px solid #F4A421;padding-left:8px;margin-bottom:10px;margin-top:16px}
  .section-title:first-child{margin-top:0}
  .exp-block{margin-bottom:12px}
  .exp-header{display:flex;justify-content:space-between;margin-bottom:3px}
  .exp-title{font-size:10px;font-weight:700;color:#111827}
  .exp-company{font-size:9px;font-weight:500;color:#1B4F8A}
  .exp-date{font-size:8px;color:#6b7280;margin-left:8px;flex-shrink:0}
  .exp-missions{list-style:none;padding:0;margin:4px 0 0}
  .exp-missions li{font-size:9px;color:#374151;line-height:1.5;padding-left:10px;position:relative;margin-bottom:2px}
  .exp-missions li::before{content:"•";position:absolute;left:0;color:#F4A421;font-weight:700}
  .form-altio{background:#EBF2FA;border-left:3px solid #1B4F8A;padding:8px 12px;border-radius:0 6px 6px 0;margin-bottom:10px}
  .form-altio .form-title{font-size:10px;font-weight:700;color:#1B4F8A}
  .form-other .form-title{font-size:10px;font-weight:600;color:#111827}
  .form-sub{font-size:8.5px;color:#6b7280;margin-top:2px}
  .form-other{margin-bottom:8px}
</style></head>
<body>
<div class="cv-wrap">
  <div class="cv-sidebar">
    <div class="cv-logo">
      <svg width="90" height="28" viewBox="0 0 90 28" xmlns="http://www.w3.org/2000/svg">
        <rect width="90" height="28" rx="4" fill="white" fill-opacity="0.15"/>
        <text x="8" y="20" font-family="Georgia,serif" font-size="18" font-weight="700" fill="white" letter-spacing="3">ALTIO</text>
      </svg>
    </div>
    <div class="cv-photo">${PHOTO_PLACEHOLDER}</div>
    <div class="s-title">Coordonnées</div>
    <p>📧 ${name.toLowerCase().replace(' ', '.')}@email.fr</p>
    <p style="margin-top:4px">📱 06 12 34 56 78</p>
    <p style="margin-top:4px">📍 Paris, Île-de-France</p>
    <div class="s-title">Compétences</div>
    <ul>
      <li>Pack Office avancé</li>
      <li>Communication digitale</li>
      <li>Réseaux sociaux</li>
      <li>Gestion de projet</li>
      <li>Analyse de données</li>
    </ul>
    <div class="s-title">Langues</div>
    <ul>
      <li>Français — Natif</li>
      <li>Anglais — B2</li>
      <li>Espagnol — A2</li>
    </ul>
    <div class="s-title">Centres d'intérêt</div>
    <ul>
      <li>Photographie</li>
      <li>Voyages</li>
      <li>Sport (running)</li>
    </ul>
  </div>
  <div class="cv-main">
    <div class="cv-header">
      <div class="cv-nom">${name}</div>
      <div class="cv-poste">${(poste || 'CANDIDAT(E) EN ALTERNANCE').toUpperCase()}</div>
      <div class="cv-accroche">Motivé(e) et dynamique, je prépare actuellement mon entrée en alternance chez Altio, école spécialisée dans les formations digitales. Fort(e) d'une première expérience en entreprise, je souhaite mettre mes compétences au service d'une structure innovante tout en développant mon expertise dans le domaine visé. Je suis prêt(e) à m'investir pleinement dans ce nouveau challenge professionnel.</div>
    </div>
    <div class="cv-body">
      <div class="section-title">Expériences Professionnelles</div>
      <div class="exp-block">
        <div class="exp-header">
          <div>
            <div class="exp-title">Assistant(e) commercial(e)</div>
            <div class="exp-company">Entreprise XYZ — Paris</div>
          </div>
          <div class="exp-date">Juil. 2024 – Sept. 2024</div>
        </div>
        <ul class="exp-missions">
          <li>Accueil et suivi des clients par téléphone et en présentiel</li>
          <li>Mise à jour de la base de données clients (CRM)</li>
          <li>Participation à la préparation d'événements commerciaux</li>
          <li>Rédaction de comptes-rendus de réunion et supports de présentation</li>
        </ul>
      </div>
      <div class="exp-block">
        <div class="exp-header">
          <div>
            <div class="exp-title">Vendeur(se) conseil</div>
            <div class="exp-company">Boutique ABC — Lyon</div>
          </div>
          <div class="exp-date">Été 2023</div>
        </div>
        <ul class="exp-missions">
          <li>Conseil et accompagnement de la clientèle en point de vente</li>
          <li>Gestion de la caisse et des encaissements</li>
          <li>Mise en rayon et merchandising des produits</li>
        </ul>
      </div>
      <div class="section-title">Formations</div>
      <div class="form-altio">
        <div class="form-title">Formation Altio — Alternance (en cours)</div>
        <div class="form-sub">Altio, École Digitale · Paris · 2025 – en cours</div>
      </div>
      <div class="form-other">
        <div class="form-title">Baccalauréat Général — Mention Bien</div>
        <div class="form-sub">Lycée Jean Moulin · Lyon · 2023</div>
      </div>
    </div>
  </div>
</div>
</body></html>`;

export const base44 = {
  integrations: {
    Core: {
      async InvokeLLM({ prompt, file_urls }) {
        await new Promise(r => setTimeout(r, 1800));
        const nameMatch = prompt.match(/candidat[^\n]*\n([A-ZÉÈÀÙ][a-zéèàùâêîôûäëïöü]+ [A-ZÉÈÀÙ][A-Za-zéèàùâêîôûäëïöü]+)/);
        const name = nameMatch ? nameMatch[1] : 'Marie Dupont';
        const posteMatch = prompt.match(/Poste visé : ([^\n]+)/);
        const poste = posteMatch ? posteMatch[1] : 'CHARGÉ(E) DE MARKETING DIGITAL';
        return MOCK_CV_HTML(name, poste);
      },
      async UploadFile({ file }) {
        await new Promise(r => setTimeout(r, 500));
        return { file_url: `mock://uploads/${file.name}-${Date.now()}` };
      },
    },
  },
  entities: {
    GeneratedCV: {
      async create(data) {
        const list = getList();
        const item = { ...data, id: `cv_${Date.now()}_${Math.random().toString(36).slice(2)}`, created_at: new Date().toISOString() };
        list.unshift(item);
        saveList(list);
        return item;
      },
      async list() {
        return getList();
      },
      async get(id) {
        const list = getList();
        return list.find(cv => cv.id === id) || null;
      },
    },
  },
};
