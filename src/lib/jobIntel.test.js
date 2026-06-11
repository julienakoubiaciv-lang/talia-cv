import { describe, it, expect } from 'vitest';
import { JOB_INTEL, getJob, listJobs, listJobsBySector, listPostesBySector, fixMojibake } from './jobIntel.js';

describe('jobIntel — intégrité des fiches métier', () => {
  it('chaque métier expose assez de compétences (hard + soft, via cvData ou la fiche)', () => {
    for (const v of Object.keys(JOB_INTEL)) {
      const job = getJob(v);
      expect(job, v).toBeTruthy();
      expect(job.hard.length, `hard ${v}`).toBeGreaterThanOrEqual(4);
      expect(job.soft.length, `soft ${v}`).toBeGreaterThanOrEqual(4);
    }
  });

  it('getJob fusionne intel + données cvData', () => {
    const job = getJob('tp-ntc');
    expect(job.label.toLowerCase()).toContain('technico');
    expect(job.sector).toBeTruthy();
    expect(job.postes.length).toBeGreaterThan(0);
    expect(job.hard.length).toBeGreaterThan(0);
    expect(job.soft.length).toBeGreaterThan(0);
    expect(job.keySkills.length).toBeGreaterThanOrEqual(3);
  });

  it('getJob renvoie null pour un parcours non couvert', () => {
    expect(getJob('parcours-inexistant')).toBeNull();
  });

  it('chaque fiche a pitch, recruiterLooksFor, pitfalls et situations cohérentes', () => {
    for (const job of listJobs()) {
      expect(job.pitch.length, job.v).toBeGreaterThan(20);
      expect(job.recruiterLooksFor.length, job.v).toBeGreaterThanOrEqual(3);
      expect(job.pitfalls.length, job.v).toBeGreaterThanOrEqual(3);
      expect(job.situations.length, job.v).toBeGreaterThanOrEqual(3);
      for (const s of job.situations) {
        expect(s.situation.length, `${job.v} situation`).toBeGreaterThan(10);
        expect(s.skill.length, `${job.v} skill`).toBeGreaterThan(2);
      }
    }
  });

  it('les mini-jeux disposent d\'assez de distracteurs (hard+soft ≥ 6 par métier)', () => {
    for (const job of listJobs()) {
      const pool = new Set([...job.hard, ...job.soft]);
      expect(pool.size, job.v).toBeGreaterThanOrEqual(6);
    }
  });

  it('fixMojibake répare le double-encodage CP1252 et laisse le texte propre intact', () => {
    expect(fixMojibake('NÃ©gociateur')).toBe('Négociateur');           // Ã© → é (byte CP1252)
    expect(fixMojibake('Ã‰tiquetage')).toBe('Étiquetage');             // Ã‰ → É (0x89)
    expect(fixMojibake('TP â€“ Manager')).toBe('TP – Manager');         // â€“ → – (tiret demi-cadratin)
    expect(fixMojibake('Texte déjà correct')).toBe('Texte déjà correct'); // déjà propre : inchangé
  });

  it('aucun champ affiché des fiches ne contient de mojibake', () => {
    const bad = /[ÃÂ]|â€/;
    for (const job of listJobs()) {
      for (const s of [job.label, job.sector, ...job.postes, ...job.hard, ...job.soft]) {
        expect(bad.test(s), `mojibake dans « ${s} »`).toBe(false);
      }
    }
  });

  it('listPostesBySector renvoie des postes par secteur, sans mojibake', () => {
    const map = listPostesBySector();
    const sectors = Object.keys(map);
    expect(sectors.length).toBeGreaterThan(0);
    let total = 0;
    for (const s of sectors) {
      expect(Array.isArray(map[s])).toBe(true);
      expect(map[s].length).toBeGreaterThan(0);
      for (const p of map[s]) {
        expect(typeof p).toBe('string');
        expect(/[ÃÂ]|â€/.test(p), `mojibake dans « ${p} »`).toBe(false);
      }
      total += map[s].length;
    }
    expect(total).toBeGreaterThanOrEqual(5);
  });

  it('listJobsBySector regroupe par secteur', () => {
    const bySector = listJobsBySector();
    const total = Object.values(bySector).reduce((n, arr) => n + arr.length, 0);
    expect(total).toBe(listJobs().length);
  });
});
