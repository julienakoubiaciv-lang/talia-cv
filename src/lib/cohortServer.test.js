import { describe, it, expect } from 'vitest';
import { rosterToCSV } from './cohortServer.js';

describe('rosterToCSV', () => {
  const nameOf = (id) => ({ karim: 'Karim B.', nadia: 'Nadia M.' }[id] || id);

  it('génère un en-tête + une ligne par élève', () => {
    const csv = rosterToCSV([
      { name: 'Léa Martin', email: 'lea@x.fr', manager: 'karim', employability: 72, xp: 1240, streak: 4, lastActive: "aujourd'hui" },
    ], nameOf);
    const lines = csv.split('\r\n');
    expect(lines[0]).toContain('Nom');
    expect(lines[0]).toContain('Employabilité (%)');
    expect(lines[1]).toContain('Léa Martin');
    expect(lines[1]).toContain('Karim B.');
    expect(lines[1]).toContain('72');
  });

  it('échappe les valeurs contenant séparateur / guillemets', () => {
    const csv = rosterToCSV([
      { name: 'Doe; "Jr"', email: 'a@b.fr', manager: 'nadia', employability: 10, xp: 0, streak: 0, lastActive: '' },
    ], nameOf);
    const row = csv.split('\r\n')[1];
    expect(row).toContain('"Doe; ""Jr"""');
  });

  it('roster vide → en-tête seul', () => {
    expect(rosterToCSV([], nameOf).split('\r\n')).toHaveLength(1);
  });
});
