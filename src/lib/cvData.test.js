import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getHist, setHist, saveToHist, updateHist,
  PALETTES,
} from './cvData.js';
import { TEMPLATES, renderCVFromData } from './cvTemplates.js';

// ─── Données de test minimales ────────────────────────────────────────────────
const MINIMAL_CV = {
  prenom: 'Alice', nom: 'Dupont', poste: 'Développeuse Web',
  accroche: 'Passionnée de code.', email: 'alice@exemple.fr',
  telephone: '06 00 00 00 00', adresse: 'Paris', linkedin: '',
  dateNaissance: '', experiences: [], formations: [],
  competences: { techniques: [], comportementales: [], outils: [] },
  langues: [], centresInteret: [],
};

const FULL_CV = {
  ...MINIMAL_CV,
  experiences: [
    {
      poste: 'Dev Front', entreprise: 'Acme', lieu: 'Paris',
      periode: '2023 - 2024',
      missions: ['Développer des composants React', 'Optimiser les performances'],
    },
  ],
  formations: [{ titre: 'BTS SIO', etablissement: 'Lycée X', periode: '2022', isTalia: false }],
  competences: {
    techniques: ['React', 'TypeScript'],
    comportementales: ['Autonomie'],
    outils: ['VS Code', 'Git'],
  },
  langues: [{ langue: 'Français', niveau: 'Natif' }, { langue: 'Anglais', niveau: 'B2' }],
  centresInteret: ['Lecture', 'Randonnée'],
};

// ─── PALETTES & TEMPLATES ─────────────────────────────────────────────────────
describe('PALETTES', () => {
  it('est un tableau non vide', () => {
    expect(Array.isArray(PALETTES)).toBe(true);
    expect(PALETTES.length).toBeGreaterThan(0);
  });

  it('chaque palette a un id, c et d', () => {
    for (const p of PALETTES) {
      expect(p).toHaveProperty('id');
      expect(p).toHaveProperty('c');
      expect(p).toHaveProperty('d');
    }
  });
});

describe('TEMPLATES', () => {
  it('contient exactement 4 templates', () => {
    expect(TEMPLATES).toHaveLength(4);
  });

  it('les ids attendus sont présents', () => {
    const ids = TEMPLATES.map(t => t.id);
    expect(ids).toContain('classic');
    expect(ids).toContain('minimal');
    expect(ids).toContain('compact');
  });
});

// ─── localStorage : getHist / setHist / saveToHist / updateHist ───────────────
describe('getHist', () => {
  it('retourne [] quand localStorage est vide', () => {
    expect(getHist()).toEqual([]);
  });

  it('retourne [] si la valeur stockée est du JSON invalide', () => {
    localStorage.setItem('talia_cv_hist', 'INVALID_JSON{{{');
    expect(getHist()).toEqual([]);
  });
});

describe('saveToHist', () => {
  it('ajoute une entrée et la place en tête', () => {
    saveToHist('Alice', '<html/>', MINIMAL_CV, 'BTS SIO');
    const hist = getHist();
    expect(hist).toHaveLength(1);
    expect(hist[0].name).toBe('Alice');
    expect(hist[0].formation).toBe('BTS SIO');
  });

  it("retourne l'id (timestamp) de l'entrée créée", () => {
    const id = saveToHist('Bob', '<html/>', MINIMAL_CV, '');
    expect(typeof id).toBe('number');
    expect(id).toBeGreaterThan(0);
  });

  it('le plus récent est toujours en tête', () => {
    saveToHist('Premier', '<html/>', MINIMAL_CV, '');
    saveToHist('Second',  '<html/>', MINIMAL_CV, '');
    expect(getHist()[0].name).toBe('Second');
  });

  it('ne dépasse pas 50 entrées', () => {
    for (let i = 0; i < 55; i++) saveToHist(`CV${i}`, '<html/>', MINIMAL_CV, '');
    expect(getHist().length).toBeLessThanOrEqual(50);
  });
});

describe('updateHist', () => {
  beforeEach(() => {
    // Horloge fictive pour garantir des timestamps uniques entre appels synchrones
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it("met à jour le champ name d'une entrée existante", () => {
    const id = saveToHist('Avant', '<html/>', MINIMAL_CV, '');
    updateHist(id, { name: 'Après' });
    expect(getHist()[0].name).toBe('Après');
  });

  it("retourne false si l'id est introuvable", () => {
    const result = updateHist(999999, { name: 'Ghost' });
    expect(result).toBe(false);
  });

  it("ne touche pas aux autres entrées", () => {
    const id1 = saveToHist('CV1', '<html/>', MINIMAL_CV, '');
    vi.advanceTimersByTime(10); // garantit un timestamp différent
    saveToHist('CV2', '<html/>', MINIMAL_CV, '');
    updateHist(id1, { name: 'CV1-modifié' });
    const hist = getHist();
    // CV2 est en tête (plus récent), CV1 en index 1
    expect(hist[1].name).toBe('CV1-modifié');
    expect(hist[0].name).toBe('CV2');
  });
});

// ─── renderCVFromData ─────────────────────────────────────────────────────────
const palette = PALETTES[0];

describe('renderCVFromData — structure HTML', () => {
  for (const templateId of ['classic', 'minimal', 'compact']) {
    it(`[${templateId}] retourne une chaîne commençant par <!DOCTYPE html>`, () => {
      const html = renderCVFromData(MINIMAL_CV, palette, ['experiences', 'formations'], templateId, [], null);
      expect(typeof html).toBe('string');
      expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    });

    it(`[${templateId}] contient une balise <style> dans <head>`, () => {
      const html = renderCVFromData(MINIMAL_CV, palette, ['experiences', 'formations'], templateId, [], null);
      expect(html).toMatch(/<head[^>]*>[\s\S]*<style>[\s\S]*<\/style>[\s\S]*<\/head>/);
    });

    it(`[${templateId}] affiche le prénom et le nom du candidat`, () => {
      const html = renderCVFromData(FULL_CV, palette, ['experiences', 'formations'], templateId, [], null);
      expect(html).toContain('Alice');
      expect(html).toContain('Dupont');
    });

    it(`[${templateId}] affiche le poste`, () => {
      const html = renderCVFromData(FULL_CV, palette, ['experiences', 'formations'], templateId, [], null);
      expect(html).toContain('Développeuse Web');
    });

    it(`[${templateId}] ne plante pas avec des données vides`, () => {
      expect(() => renderCVFromData({}, palette, [], templateId, [], null)).not.toThrow();
    });
  }
});

describe('renderCVFromData — contenu sections', () => {
  it('[classic] affiche les expériences et missions', () => {
    const html = renderCVFromData(FULL_CV, palette, ['experiences'], 'classic', [], null);
    expect(html).toContain('Dev Front');
    expect(html).toContain('Acme');
    expect(html).toContain('Développer des composants React');
  });

  it('[classic] affiche les formations', () => {
    const html = renderCVFromData(FULL_CV, palette, ['formations'], 'classic', [], null);
    expect(html).toContain('BTS SIO');
  });

  it('[classic] affiche les langues dans la sidebar', () => {
    const html = renderCVFromData(FULL_CV, palette, [], 'classic', ['langues'], null);
    expect(html).toContain('Français');
    expect(html).toContain('Anglais');
  });

  it("[compact] affiche les centres d'intérêt", () => {
    const html = renderCVFromData(FULL_CV, palette, [], 'compact', [], null);
    expect(html).toContain('Lecture');
    expect(html).toContain('Randonnée');
  });

  it("[minimal] affiche l'accroche", () => {
    const html = renderCVFromData(FULL_CV, palette, [], 'minimal', [], null);
    expect(html).toContain('Passionnée de code.');
  });
});

describe('renderCVFromData — palette / couleurs', () => {
  it('injecte la couleur principale dans le CSS', () => {
    const customPalette = { ...PALETTES[0], c: '#FF0000' };
    const html = renderCVFromData(MINIMAL_CV, customPalette, [], 'classic', [], null);
    expect(html).toContain('#FF0000');
  });
});
