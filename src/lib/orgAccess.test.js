import { describe, it, expect, beforeEach } from 'vitest';
import { consumeOrgInviteFromURL, getPendingInvite, clearPendingInvite } from './orgAccess.js';

describe('consumeOrgInviteFromURL', () => {
  beforeEach(() => {
    clearPendingInvite();
    window.history.replaceState({}, '', '/');
  });

  it('capte le token, le mémorise et nettoie l\'URL', () => {
    window.history.replaceState({}, '', '/?org_invite=ABC123&keep=1');
    const token = consumeOrgInviteFromURL();
    expect(token).toBe('ABC123');
    expect(getPendingInvite()).toBe('ABC123');
    // org_invite retiré, les autres params conservés
    expect(window.location.search).toBe('?keep=1');
  });

  it('renvoie null si pas de token', () => {
    window.history.replaceState({}, '', '/?autre=1');
    expect(consumeOrgInviteFromURL()).toBeNull();
    expect(getPendingInvite()).toBeNull();
  });

  it('clearPendingInvite efface le token mémorisé', () => {
    window.history.replaceState({}, '', '/?org_invite=XYZ');
    consumeOrgInviteFromURL();
    expect(getPendingInvite()).toBe('XYZ');
    clearPendingInvite();
    expect(getPendingInvite()).toBeNull();
  });
});
