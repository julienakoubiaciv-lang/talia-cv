/**
 * profileData.test.js
 * Tests unitaires pour src/lib/profileData.js
 *
 * Couvre : CRUD (getProfiles, saveProfile, updateProfile, deleteProfile, getProfile)
 *          et la génération du contexte IA (buildProfileContext).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  getProfiles,
  saveProfile,
  updateProfile,
  deleteProfile,
  getProfile,
  buildProfileContext,
} from '@/lib/profileData';

// ── Helpers ─────────────────────────────────────────────────────────────────

const PROFILE_MINIMAL = {
  nom: 'Dev Startup',
  emoji: '🚀',
  personnalite: { mots: ['Curieux', 'Autonome'], style: 'execution', collegues: '' },
  trajectoire: { contexte: 'premier-emploi', trous: '', fierte: '' },
  cible: { secteur: 'startup', offreType: '', eviter: '' },
  ton: { style: 'percutant', interdits: [] },
};

const PROFILE_FULL = {
  nom: 'Manager RH',
  emoji: '🤝',
  personnalite: {
    mots: ['Empathique', 'Organisé', 'Leader'],
    style: 'lien',
    collegues: "la personne à qui on vient quand on a un problème d'équipe",
  },
  trajectoire: {
    contexte: 'reconversion',
    trous: "Pause pour projet entrepreneurial (2022-2023)",
    fierte: "Avoir réduit le turnover de 30% en 2 ans",
  },
  cible: {
    secteur: 'grand-groupe',
    offreType: 'Responsable RH / DRH adjoint',
    eviter: 'compétences purement techniques, stacks logiciels',
  },
  ton: {
    style: 'professionnel',
    interdits: ['force de proposition', 'dynamique', 'proactif'],
  },
};

// ── CRUD ─────────────────────────────────────────────────────────────────────

describe('getProfiles', () => {
  it('retourne un tableau vide quand localStorage est vide', () => {
    expect(getProfiles()).toEqual([]);
  });

  it('retourne les profils stockés', () => {
    const profiles = [{ id: 1, nom: 'Test' }];
    localStorage.setItem('talia_cv_profiles', JSON.stringify(profiles));
    expect(getProfiles()).toEqual(profiles);
  });

  it('retourne un tableau vide si JSON corrompu', () => {
    localStorage.setItem('talia_cv_profiles', 'invalid-json{{{');
    expect(getProfiles()).toEqual([]);
  });
});

describe('saveProfile', () => {
  it("stocke un profil et retourne son id (timestamp)", () => {
    const before = Date.now();
    const id = saveProfile(PROFILE_MINIMAL);
    const after = Date.now();

    expect(id).toBeGreaterThanOrEqual(before);
    expect(id).toBeLessThanOrEqual(after);
  });

  it("assigne createdAt en ISO", () => {
    saveProfile(PROFILE_MINIMAL);
    const [saved] = getProfiles();
    expect(saved.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("prépose le nouveau profil en tête de liste", () => {
    saveProfile({ ...PROFILE_MINIMAL, nom: 'Premier' });
    saveProfile({ ...PROFILE_MINIMAL, nom: 'Deuxième' });
    const profiles = getProfiles();
    expect(profiles[0].nom).toBe('Deuxième');
    expect(profiles[1].nom).toBe('Premier');
  });

  it("conserve toutes les propriétés du profil source", () => {
    saveProfile(PROFILE_FULL);
    const [saved] = getProfiles();
    expect(saved.nom).toBe('Manager RH');
    expect(saved.personnalite.mots).toEqual(['Empathique', 'Organisé', 'Leader']);
    expect(saved.ton.interdits).toHaveLength(3);
  });
});

describe('updateProfile', () => {
  it("met à jour un profil existant", () => {
    const id = saveProfile(PROFILE_MINIMAL);
    const ok = updateProfile(id, { nom: 'Renommé', emoji: '🎯' });
    expect(ok).toBe(true);
    const updated = getProfile(id);
    expect(updated.nom).toBe('Renommé');
    expect(updated.emoji).toBe('🎯');
  });

  it("ajoute updatedAt sur la mise à jour", () => {
    const id = saveProfile(PROFILE_MINIMAL);
    updateProfile(id, { nom: 'X' });
    const p = getProfile(id);
    expect(p.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("ne modifie pas les autres champs non patchés", () => {
    const id = saveProfile(PROFILE_FULL);
    updateProfile(id, { nom: 'Nouveau nom' });
    const p = getProfile(id);
    expect(p.ton.interdits).toHaveLength(3);
    expect(p.trajectoire.fierte).toBe("Avoir réduit le turnover de 30% en 2 ans");
  });

  it("retourne false pour un id inconnu", () => {
    const ok = updateProfile(999999, { nom: 'Ghost' });
    expect(ok).toBe(false);
  });
});

describe('deleteProfile', () => {
  it("supprime le profil par id", () => {
    const id = saveProfile(PROFILE_MINIMAL);
    expect(getProfiles()).toHaveLength(1);
    deleteProfile(id);
    expect(getProfiles()).toHaveLength(0);
  });

  it("ne supprime que le bon profil", () => {
    // Force des timestamps distincts pour avoir deux ids différents
    vi.spyOn(Date, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(2000);
    const id1 = saveProfile({ ...PROFILE_MINIMAL, nom: 'A' });
    const id2 = saveProfile({ ...PROFILE_MINIMAL, nom: 'B' });
    vi.restoreAllMocks();
    expect(id1).not.toBe(id2); // sanity check
    deleteProfile(id1);
    const remaining = getProfiles();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(id2);
  });

  it("ne plante pas si l'id est inconnu", () => {
    saveProfile(PROFILE_MINIMAL);
    expect(() => deleteProfile(999999)).not.toThrow();
    expect(getProfiles()).toHaveLength(1);
  });
});

describe('getProfile', () => {
  it("retrouve un profil par son id", () => {
    const id = saveProfile({ ...PROFILE_MINIMAL, nom: 'Cherché' });
    const found = getProfile(id);
    expect(found).not.toBeNull();
    expect(found.nom).toBe('Cherché');
  });

  it("retourne null pour un id inconnu", () => {
    expect(getProfile(42)).toBeNull();
  });

  it("fonctionne avec des ids string ou number", () => {
    const id = saveProfile(PROFILE_MINIMAL);
    expect(getProfile(String(id))).not.toBeNull();
    expect(getProfile(Number(id))).not.toBeNull();
  });
});

// ── buildProfileContext ───────────────────────────────────────────────────────

describe('buildProfileContext', () => {
  it("retourne '' pour null", () => {
    expect(buildProfileContext(null)).toBe('');
  });

  it("retourne '' pour un profil vide (aucune donnée renseignée)", () => {
    const empty = {
      personnalite: { mots: [], style: '', collegues: '' },
      trajectoire:  { contexte: '', trous: '', fierte: '' },
      cible:        { secteur: '', offreType: '', eviter: '' },
      ton:          { style: '', interdits: [] },
    };
    expect(buildProfileContext(empty)).toBe('');
  });

  it("inclut le header et footer de section", () => {
    const ctx = buildProfileContext(PROFILE_FULL);
    expect(ctx).toContain('=== PROFIL PERSONNALITÉ DU CANDIDAT ===');
    expect(ctx).toContain('========================================');
  });

  it("inclut les mots de personnalité", () => {
    const ctx = buildProfileContext(PROFILE_FULL);
    expect(ctx).toContain('Empathique, Organisé, Leader');
  });

  it("traduit le style de travail", () => {
    const ctx = buildProfileContext(PROFILE_FULL);
    expect(ctx).toContain('fédérer et animer'); // style: 'lien'
  });

  it("traduit le style 'execution'", () => {
    const ctx = buildProfileContext(PROFILE_MINIMAL);
    expect(ctx).toContain('aime livrer et exécuter');
  });

  it("traduit le style 'reflexion'", () => {
    const p = { ...PROFILE_MINIMAL, personnalite: { ...PROFILE_MINIMAL.personnalite, style: 'reflexion' } };
    const ctx = buildProfileContext(p);
    expect(ctx).toContain('concevoir et analyser');
  });

  it("inclut la citation des collègues entre guillemets", () => {
    const ctx = buildProfileContext(PROFILE_FULL);
    expect(ctx).toContain('"la personne à qui on vient');
  });

  it("traduit le contexte de trajectoire", () => {
    const ctx = buildProfileContext(PROFILE_FULL);
    expect(ctx).toContain('reconversion professionnelle');
  });

  it("inclut les trous / fierté quand renseignés", () => {
    const ctx = buildProfileContext(PROFILE_FULL);
    expect(ctx).toContain('Pause pour projet entrepreneurial');
    expect(ctx).toContain('30% en 2 ans');
  });

  it("traduit le secteur cible", () => {
    const ctx = buildProfileContext(PROFILE_FULL);
    expect(ctx).toContain('grand groupe / corporate');
  });

  it("inclut l'offre visée et les choses à éviter", () => {
    const ctx = buildProfileContext(PROFILE_FULL);
    expect(ctx).toContain('Responsable RH / DRH adjoint');
    expect(ctx).toContain('stacks logiciels');
  });

  it("inclut les expressions interdites entre guillemets", () => {
    const ctx = buildProfileContext(PROFILE_FULL);
    expect(ctx).toContain('"force de proposition"');
    expect(ctx).toContain('"dynamique"');
  });

  it("traduit le ton 'professionnel'", () => {
    const ctx = buildProfileContext(PROFILE_FULL);
    expect(ctx).toContain('professionnel — codes du secteur');
  });

  it("ne génère pas de contexte si un profil partiel n'a aucune valeur", () => {
    const partiel = { personnalite: { mots: [] } };
    expect(buildProfileContext(partiel)).toBe('');
  });

  it("ignore les champs vides (trim)", () => {
    const p = {
      personnalite: { mots: ['Curieux'], style: 'execution', collegues: '   ' },
      trajectoire:  { contexte: '', trous: '   ', fierte: 'Ma fierté' },
      cible:        { secteur: '', offreType: '   ', eviter: '' },
      ton:          { style: '', interdits: [] },
    };
    const ctx = buildProfileContext(p);
    expect(ctx).not.toContain('collegues');
    expect(ctx).not.toContain('trous');
    expect(ctx).toContain('Ma fierté');
  });

  it("inclut la mention de personnalisation en fin de contexte", () => {
    const ctx = buildProfileContext(PROFILE_MINIMAL);
    expect(ctx).toContain('Tiens compte de ce profil');
  });
});
