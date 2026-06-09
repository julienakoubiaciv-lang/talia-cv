/**
 * Legal — Pages légales d'Altio CV
 *
 * Trois pages partageant une même mise en page :
 *   - Confidentialite   → /confidentialite   (Politique de confidentialité / RGPD)
 *   - MentionsLegales   → /mentions-legales
 *   - CGU               → /cgu
 *
 * IMPORTANT : les éléments balisés [À COMPLÉTER : …] doivent être renseignés avec
 * les VRAIES informations de l'éditeur avant toute mise en ligne publique.
 * Faits techniques réels intégrés :
 *   - Données stockées dans l'UE (Supabase, région eu-west-3 / Paris).
 *   - Seul transfert hors UE : Anthropic (États-Unis) pour le traitement IA.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';

const C = {
  blue:    '#1539B7',
  blueSoft:'#EEF2FF',
  ink:     '#0B1020',
  ink2:    '#3A4156',
  mute:    '#9AA0AE',
  rule:    '#ECEDF1',
  surface: '#F7F8FA',
  bg:      '#FFFFFF',
  warnBg:  '#FFF7ED',
  warnBd:  '#FED7AA',
  warnInk: '#9A3412',
};
const FONT = "'Manrope', system-ui, sans-serif";

const LAST_UPDATE = '29 mai 2026';

/* Surbrillance des champs à renseigner avant mise en ligne */
function Todo({ children }) {
  return (
    <mark style={{
      background: C.warnBg, color: C.warnInk, border: `1px solid ${C.warnBd}`,
      borderRadius: 5, padding: '1px 6px', fontWeight: 600, fontSize: '0.92em',
    }}>
      [À COMPLÉTER : {children}]
    </mark>
  );
}

function H2({ children }) {
  return <h2 style={{ fontSize: 19, fontWeight: 800, color: C.ink, letterSpacing: '-0.3px', margin: '34px 0 12px' }}>{children}</h2>;
}
function H3({ children }) {
  return <h3 style={{ fontSize: 15, fontWeight: 700, color: C.ink, margin: '20px 0 8px' }}>{children}</h3>;
}
function P({ children }) {
  return <p style={{ fontSize: 14.5, color: C.ink2, lineHeight: 1.7, margin: '0 0 12px' }}>{children}</p>;
}
function Ul({ children }) {
  return <ul style={{ fontSize: 14.5, color: C.ink2, lineHeight: 1.7, margin: '0 0 12px', paddingLeft: 22 }}>{children}</ul>;
}

const thtd = { textAlign: 'left', padding: '10px 12px', fontSize: 13.5, borderBottom: `1px solid ${C.rule}`, verticalAlign: 'top' };

/* ─── Layout partagé ─────────────────────────────────────────────────────── */
function LegalLayout({ title, subtitle, children }) {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', background: C.surface, fontFamily: FONT }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap'); * { box-sizing: border-box; }`}</style>

      {/* Topbar */}
      <header style={{ background: C.bg, borderBottom: `1px solid ${C.rule}`, height: 64, display: 'flex', alignItems: 'center', padding: '0 24px', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT }}>
          <div style={{ width: 30, height: 30, background: C.ink, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <span style={{ fontSize: 16, fontWeight: 800, color: C.ink }}>Altio <span style={{ color: C.blue }}>CV</span></span>
        </button>
      </header>

      {/* Contenu */}
      <main style={{ maxWidth: 820, margin: '0 auto', padding: '40px 24px 80px' }}>
        <button onClick={() => navigate(-1)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: C.mute, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, marginBottom: 20 }}>
          ← Retour
        </button>

        <h1 style={{ fontSize: 34, fontWeight: 800, color: C.ink, letterSpacing: '-1px', marginBottom: 6 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 15, color: C.ink2, marginBottom: 4 }}>{subtitle}</p>}
        <p style={{ fontSize: 12.5, color: C.mute, marginBottom: 8 }}>Dernière mise à jour : {LAST_UPDATE}</p>

        <div style={{ background: C.warnBg, border: `1px solid ${C.warnBd}`, borderRadius: 10, padding: '12px 14px', fontSize: 12.5, color: C.warnInk, marginBottom: 28, lineHeight: 1.6 }}>
          ⚠️ <strong>Document à finaliser</strong> — les éléments surlignés <Todo>exemple</Todo> doivent être remplacés par les informations réelles de l'éditeur avant la mise en ligne publique. Ce modèle ne constitue pas un conseil juridique ; faites-le relire si besoin.
        </div>

        <div style={{ background: C.bg, border: `1px solid ${C.rule}`, borderRadius: 16, padding: '8px 28px 28px', boxShadow: '0 1px 2px rgba(15,20,40,.03)' }}>
          {children}
        </div>

        {/* Liens croisés */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 24, fontSize: 13, fontWeight: 600 }}>
          <a href="/confidentialite" style={{ color: C.blue, textDecoration: 'none' }}>Confidentialité</a>
          <a href="/mentions-legales" style={{ color: C.blue, textDecoration: 'none' }}>Mentions légales</a>
          <a href="/cgu" style={{ color: C.blue, textDecoration: 'none' }}>CGU</a>
        </div>
      </main>
    </div>
  );
}

/* ─── Politique de confidentialité ───────────────────────────────────────── */
export function Confidentialite() {
  return (
    <LegalLayout title="Politique de confidentialité" subtitle="Comment Altio CV traite et protège vos données personnelles.">
      <H2>1. Responsable du traitement</H2>
      <P>
        Le responsable du traitement des données collectées via Altio CV (ci-après « le Service ») est{' '}
        <Todo>identité de l'éditeur — nom / raison sociale</Todo>, joignable à l'adresse{' '}
        <Todo>email de contact RGPD, ex : privacy@altio-wave.com</Todo>.
      </P>

      <H2>2. Données que nous collectons</H2>
      <H3>a) Données de compte</H3>
      <Ul>
        <li>Adresse email et mot de passe (stocké de façon chiffrée/hachée, jamais en clair).</li>
        <li>Date de création du compte, plan d'abonnement.</li>
        <li>Le cas échéant, numéro de téléphone (uniquement si la vérification par SMS est activée).</li>
      </Ul>
      <H3>b) Contenu des CV que vous créez</H3>
      <Ul>
        <li>Identité (nom, prénom), coordonnées (email, téléphone, adresse).</li>
        <li>Photo de profil (facultative).</li>
        <li>Expériences professionnelles, formations, compétences, langues, centres d'intérêt.</li>
      </Ul>
      <H3>c) Données d'usage et techniques</H3>
      <Ul>
        <li>Compteurs d'utilisation des fonctionnalités IA (pour le respect des quotas).</li>
        <li>Données techniques de connexion et journaux de sécurité.</li>
      </Ul>
      <P>
        <strong>Mode sans compte :</strong> si vous utilisez le Service sans vous connecter, vos CV sont
        enregistrés <strong>localement sur votre appareil</strong> (stockage du navigateur) et ne sont pas
        transmis à nos serveurs. Aucune fonctionnalité d'IA n'est alors disponible.
      </P>

      <H2>3. Finalités et bases légales</H2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', margin: '4px 0 12px' }}>
          <thead>
            <tr style={{ background: C.surface }}>
              <th style={{ ...thtd, fontWeight: 700, color: C.ink }}>Finalité</th>
              <th style={{ ...thtd, fontWeight: 700, color: C.ink }}>Base légale (RGPD)</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style={thtd}>Création de compte et fourniture du Service</td><td style={thtd}>Exécution du contrat (art. 6.1.b)</td></tr>
            <tr><td style={thtd}>Génération et amélioration de CV par l'IA</td><td style={thtd}>Exécution du contrat / consentement (art. 6.1.a)</td></tr>
            <tr><td style={thtd}>Sécurité, prévention des abus, quotas</td><td style={thtd}>Intérêt légitime (art. 6.1.f)</td></tr>
            <tr><td style={thtd}>Facturation et abonnements payants</td><td style={thtd}>Obligation légale (art. 6.1.c)</td></tr>
            <tr><td style={thtd}>Vérification du téléphone par SMS (si activée)</td><td style={thtd}>Consentement</td></tr>
          </tbody>
        </table>
      </div>

      <H2>4. Sous-traitants et destinataires</H2>
      <P>Nous faisons appel à des prestataires techniques (sous-traitants au sens du RGPD) :</P>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', margin: '4px 0 12px' }}>
          <thead>
            <tr style={{ background: C.surface }}>
              <th style={{ ...thtd, fontWeight: 700, color: C.ink }}>Prestataire</th>
              <th style={{ ...thtd, fontWeight: 700, color: C.ink }}>Rôle</th>
              <th style={{ ...thtd, fontWeight: 700, color: C.ink }}>Localisation</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style={thtd}>Supabase Inc.</td><td style={thtd}>Base de données, authentification, fonctions serveur</td><td style={thtd}>Union européenne (Paris, eu-west-3)</td></tr>
            <tr><td style={thtd}>Anthropic PBC</td><td style={thtd}>Traitement IA des contenus de CV (modèle Claude)</td><td style={thtd}>États-Unis (hors UE)</td></tr>
            <tr><td style={thtd}>Vercel Inc.</td><td style={thtd}>Hébergement de l'application et génération des PDF</td><td style={thtd}>États-Unis / CDN mondial</td></tr>
            <tr><td style={thtd}>Twilio Inc. <em>(si activé)</em></td><td style={thtd}>Envoi des SMS de vérification</td><td style={thtd}>États-Unis</td></tr>
            <tr><td style={thtd}>Stripe Inc. <em>(si activé)</em></td><td style={thtd}>Traitement des paiements</td><td style={thtd}>États-Unis / UE</td></tr>
          </tbody>
        </table>
      </div>

      <H2>5. Transferts hors Union européenne</H2>
      <P>
        Vos données de compte et de CV sont stockées <strong>dans l'Union européenne</strong> (serveurs Supabase
        situés à Paris). Toutefois, lorsque vous utilisez une fonctionnalité d'IA, le contenu concerné est transmis
        à <strong>Anthropic (États-Unis)</strong> pour traitement. Ce transfert est encadré par des{' '}
        <strong>clauses contractuelles types</strong> de la Commission européenne. En utilisant les fonctions d'IA,
        vous êtes informé(e) de ce transfert.
      </P>

      <H2>6. Durée de conservation</H2>
      <Ul>
        <li>Données de compte et CV : conservées tant que votre compte est actif, puis supprimées sur demande ou après <Todo>durée, ex : 24 mois d'inactivité</Todo>.</li>
        <li>Compteurs d'usage : <Todo>durée, ex : 13 mois</Todo>.</li>
        <li>Données de facturation : durée légale de conservation comptable (généralement 10 ans).</li>
        <li>CV créés sans compte : conservés uniquement sur votre appareil, sous votre contrôle.</li>
      </Ul>

      <H2>7. Vos droits</H2>
      <P>Conformément au RGPD, vous disposez des droits suivants :</P>
      <Ul>
        <li>Droit d'accès, de rectification et d'effacement de vos données.</li>
        <li>Droit à la limitation et à l'opposition au traitement.</li>
        <li>Droit à la portabilité de vos données.</li>
        <li>Droit de retirer votre consentement à tout moment.</li>
      </Ul>
      <P>
        Pour exercer ces droits, contactez-nous à <Todo>email de contact RGPD</Todo>. Vous pouvez également
        introduire une réclamation auprès de la CNIL (<a href="https://www.cnil.fr" target="_blank" rel="noreferrer" style={{ color: C.blue }}>www.cnil.fr</a>).
      </P>

      <H2>8. Cookies</H2>
      <P>
        Le Service utilise uniquement des cookies/stockage <strong>strictement nécessaires</strong> à son
        fonctionnement (maintien de votre session de connexion). Nous n'utilisons pas de cookies publicitaires
        ni de traceurs tiers à des fins de profilage.
      </P>

      <H2>9. Sécurité</H2>
      <P>
        Les mots de passe sont hachés, les communications chiffrées (HTTPS) et l'accès aux fonctions d'IA est
        protégé par authentification. La clé d'accès au service d'IA n'est jamais exposée côté client.
      </P>

      <H2>10. Modifications</H2>
      <P>
        Cette politique peut être mise à jour. La date de dernière mise à jour figure en haut de page. En cas de
        modification substantielle, nous vous en informerons.
      </P>
    </LegalLayout>
  );
}

/* ─── Mentions légales ───────────────────────────────────────────────────── */
export function MentionsLegales() {
  return (
    <LegalLayout title="Mentions légales">
      <H2>Éditeur du site</H2>
      <P>
        Le présent service « Altio CV » est édité par <Todo>nom / raison sociale de l'éditeur</Todo>.
      </P>
      <Ul>
        <li>Forme juridique : <Todo>auto-entrepreneur / SAS / SARL…</Todo></li>
        <li>Adresse : <Todo>adresse du siège ou domicile professionnel</Todo></li>
        <li>Email : <Todo>email de contact</Todo></li>
        <li>Numéro SIREN/SIRET : <Todo>numéro, si applicable</Todo></li>
        <li>Numéro de TVA intracommunautaire : <Todo>si applicable</Todo></li>
        <li>Directeur / responsable de la publication : <Todo>nom</Todo></li>
      </Ul>

      <H2>Hébergement</H2>
      <P>L'application et les données sont hébergées par les prestataires suivants :</P>
      <Ul>
        <li><strong>Vercel Inc.</strong> — hébergement de l'application web. <Todo>adresse de Vercel à vérifier</Todo></li>
        <li><strong>Supabase Inc.</strong> — hébergement de la base de données et de l'authentification, serveurs situés dans l'Union européenne (Paris). <Todo>adresse de Supabase à vérifier</Todo></li>
      </Ul>

      <H2>Propriété intellectuelle</H2>
      <P>
        L'ensemble des éléments du Service (marque « Altio », interface, code, contenus) est protégé par le droit
        de la propriété intellectuelle. Les CV que vous créez restent votre propriété.
      </P>

      <H2>Contact</H2>
      <P>Pour toute question : <Todo>email de contact</Todo>.</P>
    </LegalLayout>
  );
}

/* ─── CGU ────────────────────────────────────────────────────────────────── */
export function CGU() {
  return (
    <LegalLayout title="Conditions générales d'utilisation" subtitle="Les règles d'utilisation du service Altio CV.">
      <H2>1. Objet</H2>
      <P>
        Les présentes conditions régissent l'utilisation du service Altio CV, qui permet de générer, éditer et
        télécharger des CV, avec assistance par intelligence artificielle pour les utilisateurs connectés.
      </P>

      <H2>2. Accès au service</H2>
      <P>
        Le Service est accessible sans compte en mode manuel (édition locale, sans IA). L'accès aux fonctionnalités
        d'intelligence artificielle (génération, amélioration, import PDF) nécessite la création d'un compte et
        peut être soumis à des quotas selon le plan choisi.
      </P>

      <H2>3. Compte utilisateur</H2>
      <P>
        Vous êtes responsable de la confidentialité de vos identifiants et de toute activité réalisée depuis votre
        compte. Vous vous engagez à fournir des informations exactes lors de l'inscription.
      </P>

      <H2>4. Utilisation acceptable</H2>
      <Ul>
        <li>Ne pas utiliser le Service à des fins illégales ou frauduleuses.</li>
        <li>Ne pas tenter de contourner les quotas, la sécurité ou l'authentification.</li>
        <li>Ne pas soumettre de contenus illicites, diffamatoires ou portant atteinte aux droits de tiers.</li>
        <li>Ne pas surcharger ou perturber le fonctionnement du Service.</li>
      </Ul>

      <H2>5. Contenu généré par l'IA</H2>
      <P>
        Les textes proposés par l'IA sont des suggestions. Vous restez seul(e) responsable de la véracité et de
        l'exactitude des informations figurant dans vos CV. Vous devez relire et valider tout contenu généré avant
        utilisation.
      </P>

      <H2>6. Abonnements et paiement</H2>
      <P>
        Certaines fonctionnalités sont proposées dans le cadre d'offres payantes. Les conditions tarifaires et de
        résiliation sont précisées au moment de la souscription. <Todo>détails des offres et conditions de remboursement</Todo>.
      </P>

      <H2>7. Responsabilité</H2>
      <P>
        Le Service est fourni « en l'état ». Dans les limites permises par la loi, l'éditeur ne saurait être tenu
        responsable des conséquences liées à l'utilisation des CV générés ou à une indisponibilité temporaire du
        Service.
      </P>

      <H2>8. Données personnelles</H2>
      <P>
        Le traitement de vos données est décrit dans notre{' '}
        <a href="/confidentialite" style={{ color: C.blue }}>Politique de confidentialité</a>.
      </P>

      <H2>9. Droit applicable</H2>
      <P>
        Les présentes conditions sont soumises au droit français. Tout litige relèvera des tribunaux compétents,
        sous réserve des dispositions protectrices applicables aux consommateurs.
      </P>
    </LegalLayout>
  );
}
