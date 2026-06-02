/**
 * crmToken.test.js
 * Tests unitaires pour src/lib/crmToken.js (modèle clé de connexion, 2026-06-01)
 *
 * Couvre : getCRMLink, setCRMLink, removeCRMLink, isCRMLinked,
 *          consumeCRMTokenFromURL, pushCVtoCRM (mock fetch)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getCRMLink,
  setCRMLink,
  removeCRMLink,
  isCRMLinked,
  consumeCRMTokenFromURL,
  pushCVtoCRM,
} from '@/lib/crmToken';

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('setCRMLink / getCRMLink', () => {
  it('stocke et relit une clé', () => {
    setCRMLink('altio_abcdef12');
    const link = getCRMLink();
    expect(link.key).toBe('altio_abcdef12');
    expect(link.linkedAt).toBeTruthy();
  });

  it('trim la clé', () => {
    setCRMLink('  altio_xyz  ');
    expect(getCRMLink().key).toBe('altio_xyz');
  });
});

describe('removeCRMLink', () => {
  it('supprime la clé', () => {
    setCRMLink('altio_abc');
    removeCRMLink();
    expect(getCRMLink()).toBeNull();
  });
});

describe('isCRMLinked', () => {
  it('false sans clé', () => {
    expect(isCRMLinked()).toBe(false);
  });
  it('true avec clé', () => {
    setCRMLink('altio_abc');
    expect(isCRMLinked()).toBe(true);
  });
});

describe('consumeCRMTokenFromURL', () => {
  const setURL = (search) => {
    Object.defineProperty(window, 'location', {
      value: { search: '?' + search, pathname: '/', hash: '' },
      writable: true,
    });
  };

  it('retourne null si pas de clé dans l\'URL', () => {
    setURL('');
    expect(consumeCRMTokenFromURL()).toBeNull();
  });

  it('consomme ?altio_key=', () => {
    setURL('altio_key=altio_fromurl');
    const link = consumeCRMTokenFromURL();
    expect(link.key).toBe('altio_fromurl');
    expect(isCRMLinked()).toBe(true);
  });

  it('reste compatible avec l\'ancien ?crm_token=', () => {
    setURL('crm_token=altio_legacy');
    const link = consumeCRMTokenFromURL();
    expect(link.key).toBe('altio_legacy');
  });
});

describe('pushCVtoCRM', () => {
  it('no-op si pas de clé', async () => {
    const res = await pushCVtoCRM({ name: 'Test', cvData: {}, html: '' });
    expect(res.ok).toBe(false);
    expect(res.error).toBe('not_linked');
  });

  it('envoie le header x-altio-key et retourne ok', async () => {
    setCRMLink('altio_key123');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, duplicate: false }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const res = await pushCVtoCRM({ name: 'Jean', cvData: { email: 'a@b.c' }, html: '<p>x</p>' });
    expect(res.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, opts] = fetchMock.mock.calls[0];
    expect(opts.headers['x-altio-key']).toBe('altio_key123');
  });

  it('remonte duplicate=true', async () => {
    setCRMLink('altio_key123');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, json: async () => ({ ok: true, duplicate: true }),
    }));
    const res = await pushCVtoCRM({ name: 'Jean', cvData: {}, html: '' });
    expect(res.duplicate).toBe(true);
  });

  it('retourne ok:false sur erreur HTTP', async () => {
    setCRMLink('altio_key123');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 401, json: async () => ({ error: 'Clé invalide' }),
    }));
    const res = await pushCVtoCRM({ name: 'X', cvData: {}, html: '' });
    expect(res.ok).toBe(false);
    expect(res.error).toBe('Clé invalide');
  });
});
