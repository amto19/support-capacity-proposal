import { describe, it, expect } from 'vitest';
import { proposalSentence, teamIntro, provenanceLine } from './summaryText.js';
import { evaluatePlan, buildSummary } from '../logic/capacity.js';

const sentenceFor = (triage, exceptions, knowledge) =>
  proposalSentence(buildSummary(evaluatePlan({ triage, exceptions, knowledge })));

describe('the proposal sentence', () => {
  it('the brief example: released, two destinations, some unallocated', () => {
    expect(sentenceFor('48', '16', '4')).toBe(
      'As a projection, triage could take 48 hours a week instead of 72, releasing up to 24 hours. ' +
        'Of those, 16 would go to resolving complex exceptions and 4 to maintaining the knowledge base, ' +
        'and 4 would not yet be assigned to any task.'
    );
  });

  it('all released hours allocated', () => {
    expect(sentenceFor('48', '20', '4')).toMatch(
      /and 4 to maintaining the knowledge base, with every released hour assigned\.$/
    );
  });

  it('only one destination', () => {
    expect(sentenceFor('48', '20', '0')).toMatch(
      /Of those, 20 would go to resolving complex exceptions, and 4 would not yet be assigned to any task\.$/
    );
    expect(sentenceFor('48', '0', '4')).toMatch(
      /Of those, 4 would go to maintaining the knowledge base, and 20 would not yet be assigned to any task\.$/
    );
  });

  it('released but nothing allocated', () => {
    expect(sentenceFor('48', '0', '0')).toBe(
      'As a projection, triage could take 48 hours a week instead of 72, releasing up to 24 hours. ' +
        'None of them is assigned yet.'
    );
  });

  it('nothing released', () => {
    expect(sentenceFor('72', '0', '0')).toBe(
      'Triage would stay at 72 hours a week, so no hours would be released. Nothing else changes.'
    );
  });

  it('says "1 hour", not "1 hours"', () => {
    expect(sentenceFor('71', '0', '0')).toContain('releasing up to 1 hour.');
    expect(sentenceFor('1', '0', '0')).toContain('triage could take 1 hour a week');
    // One hour left over reads "and 1 would not yet be assigned".
    expect(sentenceFor('71', '0', '0')).toBe(
      'As a projection, triage could take 71 hours a week instead of 72, releasing up to 1 hour. None of them is assigned yet.'
    );
    expect(sentenceFor('70', '1', '0')).toMatch(/and 1 would not yet be assigned to any task\.$/);
  });

  it('no longer says "untested estimate", "unallocated" or "allocated", for any plan that can become a summary', () => {
    for (let triage = 0; triage <= 72; triage += 4) {
      for (const [e, k] of [['0', '0'], ['4', '0'], ['0', '4'], ['2', '2']]) {
        const summary = buildSummary(evaluatePlan({ triage: String(triage), exceptions: e, knowledge: k }));
        if (!summary) continue;
        expect(proposalSentence(summary)).not.toMatch(/untested estimate|allocated/i);
      }
    }
  });

  it('never uses the banned words, for any plan that can become a summary', () => {
    const banned = /\b(will|saved|savings|cuts?|headcount|efficiency|approved|confirmed|submit)\b/i;
    let checked = 0;
    for (let triage = 0; triage <= 72; triage += 3) {
      for (let exceptions = 0; exceptions <= 72; exceptions += 6) {
        for (let knowledge = 0; knowledge <= 72; knowledge += 6) {
          const summary = buildSummary(evaluatePlan({ triage: String(triage), exceptions: String(exceptions), knowledge: String(knowledge) }));
          if (!summary) continue;
          expect(proposalSentence(summary)).not.toMatch(banned);
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(100);
  });
});

describe('other summary lines', () => {
  it('the team intro comes from the data file', () => {
    expect(teamIntro()).toBe(
      'Weekly hours for the whole team: 3 Support Specialists and 1 Team Lead, 160 hours in total.'
    );
  });

  it('the provenance line matches the spec', () => {
    expect(provenanceLine()).toBe(
      'Based on baseline-1 (supplied by the manager, 8 January 2027) and an internal planning estimate (11 January 2027). Not measured.'
    );
  });
});
