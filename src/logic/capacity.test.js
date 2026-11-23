import { describe, it, expect } from 'vitest';
import {
  evaluatePlan,
  readHours,
  releasedFromTriage,
  todaySegments,
  proposedSegments,
  barScale,
  teamTotalShare,
  overflowMarks,
  buildSummary,
  PLAN_STATUS,
  INPUT_ERROR,
} from './capacity.js';
import { TASKS, TEAM, HOURS_LIMITS } from '../data/teamCapacity.js';

const plan = (triage, exceptions, knowledge) => evaluatePlan({ triage, exceptions, knowledge });

describe('the data file', () => {
  it('task hours today add up to the team total of 160', () => {
    const sum = TASKS.reduce((total, task) => total + task.hoursToday, 0);
    expect(sum).toBe(TEAM.totalHours);
    expect(sum).toBe(160);
  });

  it('the team total matches people × hours per person', () => {
    const people = TEAM.roles.reduce((total, r) => total + r.people, 0);
    expect(people * TEAM.hoursPerPerson).toBe(TEAM.totalHours);
  });
});

describe('the worked example from the brief', () => {
  it('48 triage, 16 exceptions, 4 knowledge: released 24, allocated 20, unallocated 4, tasks 156, total 160', () => {
    const result = plan('48', '16', '4');
    expect(result.status).toBe(PLAN_STATUS.READY);
    expect(result.released).toBe(24);
    expect(result.allocated).toBe(20);
    expect(result.unallocated).toBe(4);
    expect(result.proposedTaskTotal).toBe(156);
    expect(result.total).toBe(160);
  });

  it('works out each task correctly', () => {
    const byId = Object.fromEntries(plan('48', '16', '4').tasks.map((t) => [t.id, t]));
    expect(byId.triage).toMatchObject({ today: 72, proposed: 48, change: -24 });
    expect(byId.exceptions).toMatchObject({ today: 36, proposed: 52, change: 16 });
    expect(byId.knowledge).toMatchObject({ today: 12, proposed: 16, change: 4 });
    expect(byId.coaching).toMatchObject({ today: 24, proposed: 24, change: 0 });
    expect(byId.quality).toMatchObject({ today: 16, proposed: 16, change: 0 });
  });
});

describe('over-allocation', () => {
  it('60 / 16 / 4 is over-allocated by 8 and the entries are unchanged', () => {
    const inputs = { triage: '60', exceptions: '16', knowledge: '4' };
    const snapshot = { ...inputs };
    const result = evaluatePlan(inputs);

    expect(result.status).toBe(PLAN_STATUS.OVER_ALLOCATED);
    expect(result.released).toBe(12);
    expect(result.allocated).toBe(20);
    expect(result.overBy).toBe(8);
    expect(result.values).toEqual({ triage: 60, exceptions: 16, knowledge: 4 });
    expect(inputs).toEqual(snapshot);
  });

  it('is marked not ready and gives proposed figures for the bar, but no unallocated hours or table rows', () => {
    const result = plan('60', '16', '4');
    expect(result.ready).toBe(false);
    // Proposed task hours run past the team's 160 by exactly the amount over.
    expect(result.proposedTaskTotal).toBe(168);
    expect(result.proposedTaskTotal - TEAM.totalHours).toBe(result.overBy);
    expect(result.unallocated).toBeUndefined();
    expect(result.total).toBeUndefined();
    expect(result.unallocatedRow).toBeUndefined();
    expect(result.totalRow).toBeUndefined();
  });

  it('triage 72 releases 0, so any extra hours are over-allocated', () => {
    expect(plan('72', '0', '0').status).toBe(PLAN_STATUS.READY);
    expect(plan('72', '0', '0').released).toBe(0);
    expect(plan('72', '1', '0')).toMatchObject({ status: PLAN_STATUS.OVER_ALLOCATED, overBy: 1 });
    expect(plan('72', '0', '1')).toMatchObject({ status: PLAN_STATUS.OVER_ALLOCATED, overBy: 1 });
  });

  it('allocating exactly what is released is fine, one more is not', () => {
    expect(plan('48', '20', '4')).toMatchObject({ status: PLAN_STATUS.READY, unallocated: 0 });
    expect(plan('48', '21', '4')).toMatchObject({ status: PLAN_STATUS.OVER_ALLOCATED, overBy: 1 });
  });
});

describe('edges of the range', () => {
  it('triage 0 releases all 72 hours', () => {
    const result = plan('0', '0', '0');
    expect(result.released).toBe(72);
    expect(result.unallocated).toBe(72);
    expect(result.total).toBe(160);
  });

  it('with all extras at 0, unallocated equals released', () => {
    for (let triage = 0; triage <= 72; triage++) {
      const result = plan(String(triage), '0', '0');
      expect(result.unallocated).toBe(result.released);
    }
  });
});

describe('invalid input', () => {
  const cases = [
    ['empty', '', INPUT_ERROR.EMPTY],
    ['only spaces', '   ', INPUT_ERROR.EMPTY],
    ['negative', '-4', INPUT_ERROR.NEGATIVE],
    ['decimal', '4.5', INPUT_ERROR.NOT_WHOLE],
    ['non-numeric', 'abc', INPUT_ERROR.NOT_A_NUMBER],
    ['Infinity (text)', 'Infinity', INPUT_ERROR.NOT_A_NUMBER],
    ['Infinity (number)', Infinity, INPUT_ERROR.NOT_A_NUMBER],
    ['NaN', NaN, INPUT_ERROR.NOT_A_NUMBER],
    ['above 72', '73', INPUT_ERROR.OUT_OF_RANGE],
    ['far above 72', '1000', INPUT_ERROR.OUT_OF_RANGE],
    ['computer notation 1e1', '1e1', INPUT_ERROR.NOT_A_NUMBER],
    ['nothing at all', undefined, INPUT_ERROR.EMPTY],
  ];

  for (const [label, raw, expectedError] of cases) {
    it(`${label} is rejected in every field and no totals are produced`, () => {
      for (const field of ['triage', 'exceptions', 'knowledge']) {
        const inputs = { triage: '48', exceptions: '16', knowledge: '4', [field]: raw };
        const result = evaluatePlan(inputs);

        expect(result.status).toBe(PLAN_STATUS.INVALID);
        expect(result.errors).toEqual({ [field]: expectedError });
        // Nothing that could reach the sentence, bars or summary.
        expect(result.released).toBeUndefined();
        expect(result.allocated).toBeUndefined();
        expect(result.unallocated).toBeUndefined();
        expect(result.tasks).toBeUndefined();
      }
    });
  }

  it('reports every invalid field at once, not only the first', () => {
    expect(plan('abc', '-1', '2.5').errors).toEqual({
      triage: INPUT_ERROR.NOT_A_NUMBER,
      exceptions: INPUT_ERROR.NEGATIVE,
      knowledge: INPUT_ERROR.NOT_WHOLE,
    });
  });

  it('invalid input wins over over-allocation', () => {
    // 72 would release nothing, but the knowledge field is invalid, so we stop there.
    expect(plan('72', '10', 'x').status).toBe(PLAN_STATUS.INVALID);
  });
});

describe('decisions recorded in NOTES.md', () => {
  it('"12.0" counts as 12', () => {
    expect(readHours('12.0')).toEqual({ ok: true, value: 12 });
    expect(plan('48', '12.0', '0').values.exceptions).toBe(12);
  });

  it('spaces before or after a number are ignored', () => {
    expect(readHours(' 12 ')).toEqual({ ok: true, value: 12 });
  });

  it('"1e1" is rejected as not a number', () => {
    expect(readHours('1e1')).toEqual({ ok: false, error: INPUT_ERROR.NOT_A_NUMBER });
  });

  it('the boundaries 0 and 72 are allowed', () => {
    expect(readHours('0')).toEqual({ ok: true, value: HOURS_LIMITS.min });
    expect(readHours('72')).toEqual({ ok: true, value: HOURS_LIMITS.max });
  });
});

describe('released hours for the live sentence', () => {
  it('comes from triage alone: 72 minus the triage entry', () => {
    expect(releasedFromTriage('48')).toBe(24);
    expect(releasedFromTriage('72')).toBe(0);
    expect(releasedFromTriage('0')).toBe(72);
    expect(releasedFromTriage(' 60 ')).toBe(12);
  });

  it('gives nothing when the triage entry is invalid', () => {
    for (const raw of ['', 'abc', '-1', '4.5', '73', 'Infinity', '1e1']) {
      expect(releasedFromTriage(raw)).toBeNull();
    }
  });
});

describe('bars and table', () => {
  const sumShares = (segments) => segments.reduce((total, s) => total + s.share, 0);
  // The bar's fixed scale is 200 hours, so the team's 160 always ends at 0.8 of the width.
  const LINE = 160 / 200;

  it('the Today bar has the five tasks, all solid, ending exactly at the 160 line', () => {
    const segments = todaySegments();
    expect(segments.map((s) => [s.taskId, s.hours])).toEqual([
      ['triage', 72],
      ['exceptions', 36],
      ['knowledge', 12],
      ['coaching', 24],
      ['quality', 16],
    ]);
    expect(segments.every((s) => !s.projected)).toBe(true);
    expect(sumShares(segments)).toBeCloseTo(LINE);
  });

  it('the Proposed bar for 48 / 16 / 4 puts the added hours after the five tasks, then unallocated', () => {
    const segments = proposedSegments(plan('48', '16', '4'));
    expect(segments.map((s) => [s.key, s.hours, s.projected])).toEqual([
      ['triage', 48, false],
      ['exceptions', 36, false],
      ['knowledge', 12, false],
      ['coaching', 24, false],
      ['quality', 16, false],
      ['exceptions-added', 16, true],
      ['knowledge-added', 4, true],
      ['unallocated', 4, true],
    ]);
    // A plan that fits ends exactly at the 160 line, like Today.
    expect(sumShares(segments)).toBeCloseTo(LINE);
  });

  it('leaves zero-hour pieces out of the bar, and a fitting plan always ends at the line', () => {
    const today = proposedSegments(plan('72', '0', '0'));
    expect(today.map((s) => s.key)).toEqual(['triage', 'exceptions', 'knowledge', 'coaching', 'quality']);

    const noTriage = proposedSegments(plan('0', '72', '0'));
    expect(noTriage.map((s) => s.key)).not.toContain('triage');
    expect(noTriage.map((s) => s.key)).not.toContain('unallocated');

    for (const [t, e, k] of [['72', '0', '0'], ['0', '72', '0'], ['30', '20', '15'], ['0', '0', '0']]) {
      expect(sumShares(proposedSegments(plan(t, e, k)))).toBeCloseTo(LINE);
    }
  });

  it('gives no Proposed bar when an entry is invalid', () => {
    expect(proposedSegments(plan('abc', '0', '0'))).toBeNull();
    expect(proposedSegments(plan('60', '16', 'abc'))).toBeNull();
  });

  it('the scale is fixed, so the 160 line never moves', () => {
    expect(barScale()).toBe(200);
    expect(teamTotalShare()).toBeCloseTo(LINE);
    // Same position whether the plan fits, is over, or is wildly over.
    for (const [t, e, k] of [['48', '16', '4'], ['60', '16', '4'], ['72', '72', '72']]) {
      const marks = overflowMarks(plan(t, e, k));
      if (marks) expect(marks.startShare).toBeCloseTo(LINE);
    }
  });

  it('when 8 over, only the 8 hours past the line are marked, and everything is to scale', () => {
    const over = plan('60', '16', '4');
    const segments = proposedSegments(over);
    expect(segments.map((s) => s.key)).not.toContain('unallocated');
    expect(segments.reduce((total, s) => total + s.hours, 0)).toBe(168);
    expect(sumShares(segments)).toBeCloseTo(168 / 200);

    expect(overflowMarks(over)).toMatchObject({ overBy: 8, proposedTotal: 168, capped: false, breakShare: null });
    expect(overflowMarks(over).startShare).toBeCloseTo(160 / 200);
    expect(overflowMarks(over).endShare).toBeCloseTo(168 / 200);
  });

  it('a large overflow is shortened with a break, keeps exact hours for labels, and nothing before the line changes', () => {
    const wild = plan('72', '72', '72');
    const marks = overflowMarks(wild);
    expect(marks).toMatchObject({ overBy: 144, proposedTotal: 304, capped: true });
    expect(marks.endShare).toBeCloseTo(1);
    expect(marks.breakShare).toBeCloseTo(0.9);

    const segments = proposedSegments(wild);
    // The bar never runs past its full width.
    expect(sumShares(segments)).toBeCloseTo(1);
    // Labels keep the exact hours.
    expect(segments.find((s) => s.key === 'exceptions-added').hours).toBe(72);
    expect(segments.find((s) => s.key === 'knowledge-added').hours).toBe(72);
    // The five tasks before the line are still exactly to scale.
    for (const s of segments.filter((x) => x.type === 'task')) {
      expect(s.share).toBeCloseTo(s.hours / 200);
    }
  });

  it('whatever crosses the 160 line is always added hours, never a task the team already does', () => {
    let overPlans = 0;
    for (let triage = 0; triage <= 72; triage++) {
      for (let exceptions = 0; exceptions <= 72; exceptions += 4) {
        for (let knowledge = 0; knowledge <= 72; knowledge += 4) {
          const result = plan(String(triage), String(exceptions), String(knowledge));
          if (result.status !== PLAN_STATUS.OVER_ALLOCATED) continue;
          overPlans++;
          let along = 0;
          for (const s of proposedSegments(result)) {
            along += s.hours;
            if (along > 160) expect(s.type).toBe('added');
          }
        }
      }
    }
    expect(overPlans).toBeGreaterThan(1000);
  });

  it('the table has an Unallocated row and a Total row that balances to 160', () => {
    const result = plan('48', '16', '4');
    expect(result.unallocatedRow).toEqual({ today: 0, proposed: 4, change: 4 });
    expect(result.totalRow).toEqual({ today: 160, proposed: 160, change: 0 });
  });
});

describe('no summary from a conflicted or invalid plan', () => {
  it('a ready plan gives a summary with its table rows', () => {
    const summary = buildSummary(plan('48', '16', '4'));
    expect(summary).not.toBeNull();
    expect(summary.unallocated).toBe(4);
    expect(summary.totalRow).toEqual({ today: 160, proposed: 160, change: 0 });
  });

  it("the summary's bars are exactly the plan screen's bars", () => {
    const ready = plan('48', '16', '4');
    expect(buildSummary(ready).bars).toEqual({ today: todaySegments(), proposed: proposedSegments(ready) });
  });

  it('an over-allocated or invalid plan gives no summary at all', () => {
    expect(buildSummary(plan('60', '16', '4'))).toBeNull();
    expect(buildSummary(plan('72', '1', '0'))).toBeNull();
    for (const bad of ['', 'abc', '-1', '4.5', '73', 'Infinity', '1e1']) {
      expect(buildSummary(plan(bad, '16', '4'))).toBeNull();
      expect(buildSummary(plan('48', bad, '4'))).toBeNull();
      expect(buildSummary(plan('48', '16', bad))).toBeNull();
    }
  });

  it('across thousands of combinations, a summary exists exactly when the plan is ready', () => {
    let summaries = 0;
    let refused = 0;
    for (let triage = 0; triage <= 72; triage++) {
      for (let exceptions = 0; exceptions <= 72; exceptions += 3) {
        for (let knowledge = 0; knowledge <= 72; knowledge += 3) {
          const result = plan(String(triage), String(exceptions), String(knowledge));
          const summary = buildSummary(result);
          if (result.ready) {
            expect(summary).not.toBeNull();
            expect(summary.totalRow.proposed).toBe(160);
            summaries++;
          } else {
            expect(result.status).toBe(PLAN_STATUS.OVER_ALLOCATED);
            expect(summary).toBeNull();
            refused++;
          }
        }
      }
    }
    // Both kinds really occurred.
    expect(summaries).toBeGreaterThan(1000);
    expect(refused).toBeGreaterThan(1000);
  });
});

describe('the 160 check', () => {
  it('proposed task hours plus unallocated always equal 160, for every valid combination', () => {
    let checked = 0;
    for (let triage = 0; triage <= 72; triage++) {
      const released = 72 - triage;
      for (let exceptions = 0; exceptions <= released; exceptions++) {
        for (let knowledge = 0; knowledge + exceptions <= released; knowledge++) {
          const result = plan(String(triage), String(exceptions), String(knowledge));
          expect(result.status).toBe(PLAN_STATUS.READY);
          expect(result.total).toBe(160);
          expect(result.unallocated).toBeGreaterThanOrEqual(0);
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(60000);
  });
});
