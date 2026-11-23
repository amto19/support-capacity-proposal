import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PlanScreen from './PlanScreen.jsx';
import { evaluatePlan } from '../logic/capacity.js';
import { SAVE_STATE } from './SaveStatus.jsx';

// Draws the plan screen as plain HTML, with no browser, so its structure can be checked.
const render = (entries) =>
  renderToStaticMarkup(
    <PlanScreen
      entries={entries}
      onEntryChange={() => {}}
      rationale=""
      onRationaleChange={() => {}}
      plan={evaluatePlan(entries)}
      onOpenSummary={() => {}}
      onSave={() => {}}
      saveState={SAVE_STATE.NONE}
      onRetrySave={() => {}}
      restored={false}
    />
  );

describe('the plan screen structure', () => {
  // Guards against the Stage 7 regression, where an edit silently removed the announcer.
  it('always has the polite totals announcer, whether the plan fits, is over or is invalid', () => {
    for (const entries of [
      { triage: '48', exceptions: '16', knowledge: '4' },
      { triage: '60', exceptions: '16', knowledge: '4' },
      { triage: 'abc', exceptions: '16', knowledge: '4' },
    ]) {
      const html = render(entries);
      expect(html).toMatch(/<div class="visually-hidden" role="status" aria-live="polite" data-testid="totals-announcer">/);
    }
  });

  it('"Your plan" is a heading, inside the fieldset\'s legend', () => {
    expect(render({ triage: '48', exceptions: '16', knowledge: '4' })).toContain('<legend><h2 class="legend-heading">Your plan</h2></legend>');
  });

  it("the plan screen's table has no source tags (they're on the summary only)", () => {
    expect(render({ triage: '48', exceptions: '16', knowledge: '4' })).not.toContain('source-tag--compact');
  });
});
