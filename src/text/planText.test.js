import { describe, it, expect } from 'vitest';
import { releaseSentence, conflictMessage, totalsAnnouncement, NOT_YET_ASSIGNED } from './planText.js';
import { evaluatePlan } from '../logic/capacity.js';

// The spec's banned words, plus "saved" and "confirmed", which the spec also rules out.
const BANNED = /\b(will|saved|savings|cuts?|headcount|efficiency|approved|confirmed|submit)\b/i;

describe('the sentence at the top of the plan screen', () => {
  it('when hours are released', () => {
    expect(releaseSentence(24)).toBe(
      'Up to 24 hours a week could be released from triage. This is a projection, not a measured result.'
    );
  });

  it('says "1 hour", not "1 hours"', () => {
    expect(releaseSentence(1)).toBe(
      'Up to 1 hour a week could be released from triage. This is a projection, not a measured result.'
    );
  });

  it('when nothing is released', () => {
    expect(releaseSentence(0)).toBe('At this setting, no hours would be released from triage.');
  });

  it("when the triage entry can't be used", () => {
    expect(releaseSentence(null)).toBe('Enter whole hours for proposed triage to see what could be released.');
  });

  it('never says "untested estimate" and never uses a banned word, for any amount released', () => {
    for (const released of [null, ...Array.from({ length: 73 }, (_, i) => i)]) {
      const sentence = releaseSentence(released);
      expect(sentence).not.toMatch(/untested estimate/i);
      expect(sentence).not.toMatch(BANNED);
    }
  });
});

describe('the plain-language name for unallocated hours', () => {
  it('is "Not yet assigned", with no banned words', () => {
    expect(NOT_YET_ASSIGNED).toBe('Not yet assigned');
    expect(NOT_YET_ASSIGNED).not.toMatch(BANNED);
  });
});

describe('the conflict message', () => {
  it('says how many too many and what to lower, without "Your entries haven\'t been changed"', () => {
    expect(conflictMessage(8)).toEqual({ title: '8 hours too many', body: 'Lower the extra hours by 8 in total.' });
    expect(conflictMessage(1).title).toBe('1 hour too many');
    expect(JSON.stringify(conflictMessage(8))).not.toMatch(/haven't been changed/i);
  });
});

describe('the screen-reader announcement once changes settle', () => {
  const plan = (triage, exceptions, knowledge) => evaluatePlan({ triage, exceptions, knowledge });

  it('says "assigned" and "not yet assigned" for a plan that fits', () => {
    expect(totalsAnnouncement(plan('48', '16', '4'))).toBe('24 hours released, 20 assigned, 4 not yet assigned.');
  });

  it('says "assigned" and how many over for a conflict', () => {
    expect(totalsAnnouncement(plan('60', '16', '4'))).toBe("12 hours released, 20 assigned. That's 8 more than released.");
  });

  it('leaves invalid plans to the field message', () => {
    expect(totalsAnnouncement(plan('abc', '16', '4'))).toBeNull();
  });

  it('never says "allocated", "haven\'t been changed" or a banned word, across many plans', () => {
    let checked = 0;
    for (let triage = 0; triage <= 72; triage += 4) {
      for (let exceptions = 0; exceptions <= 72; exceptions += 8) {
        for (let knowledge = 0; knowledge <= 72; knowledge += 8) {
          const p = plan(String(triage), String(exceptions), String(knowledge));
          const words = [totalsAnnouncement(p), p.overBy ? Object.values(conflictMessage(p.overBy)).join(' ') : ''].join(' ');
          // "not yet assigned" is fine; "allocated" on its own is not.
          expect(words).not.toMatch(/\ballocated\b|unallocated|haven't been changed/i);
          expect(words).not.toMatch(BANNED);
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(1000);
  });
});
