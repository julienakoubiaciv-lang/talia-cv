/**
 * historySync.test.js
 * Tests unitaires pour src/lib/historySync.js
 *
 * Deux modes testés :
 *   A) Supabase désactivé (supabase = null)  → comportement 100% localStorage
 *   B) Supabase activé (mock)                → upsert/update/delete appelés
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks déclarés AVANT l'import du module testé ───────────────────────────

// Mode A : Supabase désactivé (défaut)
vi.mock('@/lib/supabase', () => ({
  supabase: null,
  supabaseReady: false,
}));

vi.mock('@/lib/deviceId', () => ({
  getDeviceId: () => 'device-test-uuid',
}));

vi.mock('@/lib/currentUser', () => ({
  getCurrentUserId: () => 'device-test-uuid',
  isAuthenticated:  () => false,
}));

import {
  getHistory,
  getHistorySync,
  saveHistory,
  updateHistory,
  deleteHistory,
} from '@/lib/historySync';

// ── Helpers ──────────────────────────────────────────────────────────────────

function snapshotLS() {
  return JSON.parse(localStorage.getItem('ALTIO_CV_hist') || '[]');
}

// ── Mode A : sans Supabase ────────────────────────────────────────────────────

describe('[localStorage only] getHistorySync', () => {
  it('retourne [] quand vide', () => {
    expect(getHistorySync()).toEqual([]);
  });

  it('retourne les données préexistantes', () => {
    localStorage.setItem('ALTIO_CV_hist', JSON.stringify([{ id: '1', name: 'CV Test' }]));
    expect(getHistorySync()).toHaveLength(1);
  });
});

describe('[localStorage only] getHistory', () => {
  it('retourne [] quand vide', async () => {
    const result = await getHistory();
    expect(result).toEqual([]);
  });

  it('retourne les entrées du localStorage', async () => {
    await saveHistory('Alice Martin', '<html/>', { poste: 'Dev' }, 'BTS SIO');
    const history = await getHistory();
    expect(history).toHaveLength(1);
    expect(history[0].name).toBe('Alice Martin');
  });
});

describe('[localStorage only] saveHistory', () => {
  it("sauvegarde une entrée complète avec id et date", async () => {
    const before = Date.now();
    const id = await saveHistory('Jean Dupont', '<p>CV</p>', { poste: 'Designer' }, 'BUT MMI');
    const after = Date.now();

    expect(id).toBeGreaterThanOrEqual(before);
    expect(id).toBeLessThanOrEqual(after);

    const [entry] = snapshotLS();
    expect(entry.name).toBe('Jean Dupont');
    expect(entry.html).toBe('<p>CV</p>');
    expect(entry.formation).toBe('BUT MMI');
    expect(entry.date).toMatch(/\d{2}\/\d{2}\/\d{4}/); // JJ/MM/AAAA
    expect(entry.favorite).toBe(false);
  });

  it("sauvegarde les opts (bulkId, photoUrl, profileId…)", async () => {
    await saveHistory('Camille', '<html/>', null, '', {
      bulkId:      'group-42',
      bulkLabel:   'Promo 2025',
      photoUrl:    'https://cdn.example.com/photo.jpg',
      logoUrl:     'https://cdn.example.com/logo.jpg',
      profileId:   '123',
      profileName: 'Dev Startup',
    });

    const [entry] = snapshotLS();
    expect(entry.bulkId).toBe('group-42');
    expect(entry.bulkLabel).toBe('Promo 2025');
    expect(entry.photoUrl).toBe('https://cdn.example.com/photo.jpg');
    expect(entry.profileId).toBe('123');
    expect(entry.profileName).toBe('Dev Startup');
  });

  it("déduplique si même nom dans la même minute", async () => {
    await saveHistory('Lucia', '<html/>', null, 'Licence');
    await saveHistory('Lucia', '<html updated/>', null, 'Licence');
    expect(snapshotLS()).toHaveLength(1);
    expect(snapshotLS()[0].html).toBe('<html updated/>');
  });

  it("ne déduplique PAS si les noms sont différents", async () => {
    await saveHistory('Alice', '<html/>', null, '');
    await saveHistory('Bob',   '<html/>', null, '');
    expect(snapshotLS()).toHaveLength(2);
  });

  it("met le plus récent en tête de liste", async () => {
    await saveHistory('Premier', '<html/>', null, '');
    await saveHistory('Deuxième', '<html/>', null, '');
    expect(snapshotLS()[0].name).toBe('Deuxième');
  });

  it("respecte la limite de 50 entrées", async () => {
    for (let i = 0; i < 52; i++) {
      // noms différents pour éviter déduplication
      await saveHistory(`CV ${i}`, '<html/>', null, '');
    }
    expect(snapshotLS()).toHaveLength(50);
  });

  it("data null est conservée null (pas de valeur par défaut erronée)", async () => {
    await saveHistory('Test', '<html/>', null, '');
    const [entry] = snapshotLS();
    expect(entry.data).toBeNull();
  });
});

describe('[localStorage only] updateHistory', () => {
  it("met à jour un champ existant", async () => {
    const id = await saveHistory('Marc', '<html/>', null, 'BTS');
    const ok = await updateHistory(id, { name: 'Marc Dubois', favorite: true });
    expect(ok).toBe(true);

    const [entry] = snapshotLS();
    expect(entry.name).toBe('Marc Dubois');
    expect(entry.favorite).toBe(true);
  });

  it("met à jour la date sur modification", async () => {
    const id = await saveHistory('Sophie', '<html/>', null, '');
    await updateHistory(id, { name: 'Sophie L.' });
    const [entry] = snapshotLS();
    expect(entry.date).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it("ne modifie pas les champs non patchés", async () => {
    const id = await saveHistory('Paul', '<p>original</p>', { poste: 'Dev' }, 'BUT');
    await updateHistory(id, { favorite: true });
    const [entry] = snapshotLS();
    expect(entry.html).toBe('<p>original</p>');
    expect(entry.formation).toBe('BUT');
  });

  it("retourne false pour un id inconnu", async () => {
    const ok = await updateHistory('id-fantome-99999', { name: 'Ghost' });
    expect(ok).toBe(false);
  });

  it("fonctionne avec des ids en string ou number", async () => {
    const id = await saveHistory('Test', '<html/>', null, '');
    expect(await updateHistory(String(id), { name: 'Test Str' })).toBe(true);
    expect(await updateHistory(Number(id), { name: 'Test Num' })).toBe(true);
  });
});

describe('[localStorage only] deleteHistory', () => {
  it("supprime l'entrée ciblée", async () => {
    const id = await saveHistory('À supprimer', '<html/>', null, '');
    expect(snapshotLS()).toHaveLength(1);
    await deleteHistory(id);
    expect(snapshotLS()).toHaveLength(0);
  });

  it("ne supprime que l'entrée ciblée", async () => {
    // Force des timestamps distincts pour garantir deux ids différents
    vi.spyOn(Date, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(2000);
    const id1 = await saveHistory('CV 1', '<html/>', null, '');
    const id2 = await saveHistory('CV 2', '<html/>', null, '');
    vi.restoreAllMocks();
    expect(id1).not.toBe(id2); // sanity check
    await deleteHistory(id1);
    const remaining = snapshotLS();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].name).toBe('CV 2');
  });

  it("ne plante pas si l'id est inconnu", async () => {
    await saveHistory('Existant', '<html/>', null, '');
    await expect(deleteHistory('id-inexistant')).resolves.toBeUndefined();
    expect(snapshotLS()).toHaveLength(1);
  });
});

// ── Mode B : avec Supabase mocké ─────────────────────────────────────────────

describe('[Supabase mock] les opérations appellent le client', async () => {
  // Construction du mock de chaîne Supabase fluide
  const mockUpsert = vi.fn().mockResolvedValue({ error: null });
  const mockUpdate = vi.fn().mockResolvedValue({ error: null });
  const mockDelete = vi.fn().mockResolvedValue({ error: null });
  const mockSelect = vi.fn();
  const mockEq     = vi.fn();
  const mockOrder  = vi.fn();
  const mockLimit  = vi.fn();
  const mockIsNull = vi.fn();

  // Chaîne select → eq → order → limit
  mockLimit.mockResolvedValue({ data: [], error: null });
  mockOrder.mockReturnValue({ limit: mockLimit });
  mockEq.mockReturnValue({ order: mockOrder });
  mockSelect.mockReturnValue({ eq: mockEq });

  // Chaîne update → eq
  const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
  mockUpdate.mockReturnValue({ eq: mockUpdateEq });

  // Chaîne delete → eq
  const mockDeleteEq = vi.fn().mockResolvedValue({ error: null });
  mockDelete.mockReturnValue({ eq: mockDeleteEq });

  const supabaseMock = {
    from: vi.fn(() => ({
      select: mockSelect,
      upsert: mockUpsert,
      update: mockUpdate,
      delete: mockDelete,
    })),
  };

  beforeEach(async () => {
    vi.resetModules();
    vi.doMock('@/lib/supabase', () => ({
      supabase: supabaseMock,
      supabaseReady: true,
    }));
    vi.doMock('@/lib/currentUser', () => ({
      getCurrentUserId: () => 'device-test-uuid',
      isAuthenticated:  () => false,
    }));
    vi.doMock('@/lib/deviceId', () => ({
      getDeviceId: () => 'device-test-uuid',
    }));
    vi.clearAllMocks();
    mockLimit.mockResolvedValue({ data: [], error: null });
  });

  it("saveHistory appelle supabase.from().upsert()", async () => {
    const { saveHistory: save } = await import('@/lib/historySync');
    await save('Test Supa', '<html/>', null, '');
    expect(supabaseMock.from).toHaveBeenCalledWith('cv_history');
    expect(mockUpsert).toHaveBeenCalled();
    const row = mockUpsert.mock.calls[0][0];
    expect(row.name).toBe('Test Supa');
    expect(row.device_id).toBe('device-test-uuid');
  });

  it("getHistory appelle supabase.from().select()", async () => {
    const { getHistory: getH } = await import('@/lib/historySync');
    await getH();
    expect(supabaseMock.from).toHaveBeenCalledWith('cv_history');
    expect(mockSelect).toHaveBeenCalledWith('*');
  });
});
