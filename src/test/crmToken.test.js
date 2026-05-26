/**
 * crmToken.test.js
 * Tests unitaires pour src/lib/crmToken.js
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

const LS_KEY = 'talia_crm_link';

// ── Helpers ──────────────────────────────────────────────────────────────────

function setURL(search) {
  // jsdom permet de modifier window.location.search via history
  window.history.replaceState({}, '', '/' + (search ? '?' + search : ''));
}

// ── getCRMLink / setCRMLink / removeCRMLink ───────────────────────────────────

describe('getCRMLink', () => {
  it('retourne null quand vide', () => {
    expect(getCRMLink()).toBeNull();
  });

  it('retourne le lien stocké', () => {
    localStorage.setItem(LS_KEY, JSON.stringify({ token: 'tok123', orgId: 'org1', orgName: 'Talia', linkedAt: '2025-01-01T00:00:00Z' }));
    const link = getCRMLink();
    expect(link).not.toBeNull();
    expect(link.token).toBe('tok123');
    expect(link.orgName).toBe('Talia');
  });

  it('retourne null si JSON corrompu', () => {
    localStorage.setItem(LS_KEY, 'invalid{{}}');
    expect(getCRMLink()).toBeNull();
  });
});

describe('setCRMLink', () => {
  it('stocke le lien avec linkedAt', () => {
    const link = setCRMLink('my-token', 'org-42', 'Acme Corp');
    expect(link.token).toBe('my-token');
    expect(link.orgId).toBe('org-42');
    expect(link.orgName).toBe('Acme Corp');
    expect(link.linkedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('utilise "unknown" si orgId vide', () => {
    const link = setCRMLink('tok', '', '');
    expect(link.orgId).toBe('unknown');
  });

  it('utilise "CRM" si orgName vide', () => {
    const link = setCRMLink('tok', 'org', '');
    expect(link.orgName).toBe('CRM');
  });

  it('persiste dans localStorage', () => {
    setCRMLink('persist-tok', 'org-1', 'TestOrg');
    const stored = JSON.parse(localStorage.getItem(LS_KEY));
    expect(stored.token).toBe('persist-tok');
  });
});

describe('removeCRMLink', () => {
  it('supprime le lien', () => {
    setCRMLink('tok', 'org', 'Org');
    removeCRMLink();
    expect(getCRMLink()).toBeNull();
    expect(localStorage.getItem(LS_KEY)).toBeNull();
  });

  it('ne plante pas si déjà vide', () => {
    expect(() => removeCRMLink()).not.toThrow();
  });
});

describe('isCRMLinked', () => {
  it('false quand pas de lien', () => {
    expect(isCRMLinked()).toBe(false);
  });

  it('true quand un token est stocké', () => {
    setCRMLink('tok', 'org', 'Org');
    expect(isCRMLinked()).toBe(true);
  });
});

// ── consumeCRMTokenFromURL ────────────────────────────────────────────────────

describe('consumeCRMTokenFromURL', () => {
  beforeEach(() => setURL(''));

  it('retourne null si pas de crm_token dans l\'URL', () => {
    setURL('foo=bar');
    expect(consumeCRMTokenFromURL()).toBeNull();
  });

  it('retourne le lien et le stocke', () => {
    setURL('crm_token=TOKEN123&org_id=org-42&org_name=Talia');
    const link = consumeCRMTokenFromURL();
    expect(link).not.toBeNull();
    expect(link.token).toBe('TOKEN123');
    expect(link.orgId).toBe('org-42');
    expect(link.orgName).toBe('Talia');
    expect(isCRMLinked()).toBe(true);
  });

  it('nettoie les params CRM de l\'URL', () => {
    setURL('crm_token=TOK&org_id=o1&org_name=N&other=keep');
    consumeCRMTokenFromURL();
    expect(window.location.search).not.toContain('crm_token');
    expect(window.location.search).not.toContain('org_id');
    expect(window.location.search).toContain('other=keep');
  });

  it('fonctionne sans org_id ni org_name', () => {
    setURL('crm_token=MINIMAL');
    const link = consumeCRMTokenFromURL();
    expect(link.token).toBe('MINIMAL');
    expect(link.orgId).toBe('unknown');
    expect(link.orgName).toBe('CRM');
  });
});

// ── pushCVtoCRM ───────────────────────────────────────────────────────────────

describe('pushCVtoCRM', () => {
  it('retourne false si pas de token', async () => {
    const result = await pushCVtoCRM({ name: 'Test', cvData: null, html: '' });
    expect(result).toBe(false);
  });

  it('appelle fetch avec le bon endpoint et Bearer token', async () => {
    setCRMLink('bearer-token', 'org-1', 'Org');

    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = mockFetch;

    const result = await pushCVtoCRM({
      name: 'Jean Dupont',
      cvData: { poste: 'Dev' },
      html: '<html/>',
    });

    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, opts] = mockFetch.mock.calls[0];
    expect(opts.method).toBe('POST');
    expect(opts.headers['Authorization']).toBe('Bearer bearer-token');
    expect(opts.headers['X-Org-Id']).toBe('org-1');

    const body = JSON.parse(opts.body);
    expect(body.name).toBe('Jean Dupont');
    expect(body.cv_data).toEqual({ poste: 'Dev' });
  });

  it('retourne false si fetch échoue (réseau)', async () => {
    setCRMLink('tok', 'org', 'Org');
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await pushCVtoCRM({ name: 'Test', cvData: null, html: '' });
    expect(result).toBe(false);
  });

  it('retourne false si réponse non-ok (ex: 401)', async () => {
    setCRMLink('tok', 'org', 'Org');
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 401 });

    const result = await pushCVtoCRM({ name: 'Test', cvData: null, html: '' });
    expect(result).toBe(false);
  });
});
