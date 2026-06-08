import { describe, it, expect } from 'vitest';
import { mockClaudeResponse } from './demoResponses.js';
import { normalizeRecruitTest } from './recruitTest.js';
import { normalizeOralQuestions, normalizeEvaluation } from './oralInterview.js';
import { normalizeCoverLetter } from './coverLetter.js';
import { normalizeAISession } from './interviewAI.js';
import { applyOptimization } from './cvOptimize.js';

const text = (res) => (res?.content || []).map((b) => b.text || '').join('');
const json = (res) => JSON.parse(text(res));

describe('demoResponses — mockClaudeResponse', () => {
  it('renvoie la forme d\'une réponse Anthropic', async () => {
    const res = await mockClaudeResponse({ action: 'coach', messages: [], metadata: { feature: 'unknown' } });
    expect(res.demo).toBe(true);
    expect(Array.isArray(res.content)).toBe(true);
    expect(res.content[0].type).toBe('text');
  });

  it('cover_letter : produit une lettre exploitable', async () => {
    const res = await mockClaudeResponse({
      metadata: { feature: 'cover_letter', messageType: 'motivation' },
      messages: [{ role: 'user', content: 'CIBLE DE LA CANDIDATURE :\nEntreprise : Acme\nPoste visé : Vendeur' }],
    });
    const letter = normalizeCoverLetter(json(res));
    expect(letter.text.length).toBeGreaterThan(40);
  });

  it('cover_letter relance/remerciement : email avec objet', async () => {
    for (const messageType of ['relance', 'remerciement']) {
      const res = await mockClaudeResponse({ metadata: { feature: 'cover_letter', messageType }, messages: [] });
      const letter = normalizeCoverLetter(json(res));
      expect(letter.subject.length).toBeGreaterThan(3);
      expect(letter.text.length).toBeGreaterThan(40);
    }
  });

  it('recruit_test : questions normalisables', async () => {
    const res = await mockClaudeResponse({ metadata: { feature: 'recruit_test', count: 10, categories: 'logique,metier' }, messages: [] });
    const qs = normalizeRecruitTest(json(res), 10);
    expect(qs.length).toBe(10);
    qs.forEach((q) => expect(q.options.filter((o) => o.correct)).toHaveLength(1));
  });

  it('oral_interview_gen : questions ouvertes normalisables', async () => {
    const res = await mockClaudeResponse({ metadata: { feature: 'oral_interview_gen', count: 5 }, messages: [] });
    const qs = normalizeOralQuestions(json(res), 5);
    expect(qs.length).toBe(5);
  });

  it('oral_interview_eval : évaluation valide, score selon la longueur', async () => {
    const short = await mockClaudeResponse({ metadata: { feature: 'oral_interview_eval' }, messages: [{ role: 'user', content: 'transcription) :\nOui voilà' }] });
    const long = await mockClaudeResponse({ metadata: { feature: 'oral_interview_eval' }, messages: [{ role: 'user', content: 'transcription) :\n' + Array.from({ length: 50 }, () => 'mot').join(' ') }] });
    expect(normalizeEvaluation(json(short)).score).toBeLessThan(normalizeEvaluation(json(long)).score);
  });

  it('ai_interview : QCM normalisables', async () => {
    const res = await mockClaudeResponse({ metadata: { feature: 'ai_interview', count: 6 }, messages: [] });
    const qs = normalizeAISession(json(res), 6);
    expect(qs.length).toBeGreaterThan(0);
  });

  it('cv_optimize : optimisation applicable au CV', async () => {
    const cv = { accroche: 'Ancienne', experiences: [{ poste: 'Vendeur', missions: ['vente'] }] };
    const res = await mockClaudeResponse({
      metadata: { feature: 'cv_optimize' },
      messages: [{ role: 'user', content: `MOTS-CLÉS MANQUANTS ... : CRM, relation client\n\nCV ACTUEL (JSON) :\n${JSON.stringify(cv)}` }],
    });
    const next = applyOptimization(cv, json(res));
    expect(next.accroche).not.toBe('Ancienne');
    expect(next.experiences).toHaveLength(1);
  });
});
