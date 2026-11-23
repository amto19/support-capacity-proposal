import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import SummaryScreen from './SummaryScreen.jsx';
import { evaluatePlan, buildSummary } from '../logic/capacity.js';
import { SAVE_STATE } from './SaveStatus.jsx';

// Draws the summary as plain HTML, with no browser, so its content can be checked.
const render = (entries, rationale = '') =>
  renderToStaticMarkup(
    <SummaryScreen
      summary={buildSummary(evaluatePlan(entries))}
      rationale={rationale}
      onBack={() => {}}
      onSave={() => {}}
      saveState={SAVE_STATE.NONE}
      onRetrySave={() => {}}
    />
  );

const example = { triage: '48', exceptions: '16', knowledge: '4' };

describe('the review summary', () => {
  it('shows the Today and Proposed bars, with their labels and the dashed legend', () => {
    const html = render(example);
    expect(html).toContain('<h3 class="bar__title">Today</h3>');
    expect(html).toContain('<h3 class="bar__title">Proposed</h3>');
    expect(html).toContain('+16 exceptions');
    expect(html).toContain('Not yet assigned 4');
    expect(html).toContain('Dashed outline: projected hours');
    // A summary is only for a plan that fits, so there's never an overflow or 160 line.
    expect(html).not.toContain('bar__overflow');
    expect(html).not.toContain('bar__limit');
  });

  it('labels the Today column as Baseline and the Proposed column as Estimate, with no Measured tag', () => {
    const html = render(example);
    expect(html).toMatch(/Today<div class="source-tag source-tag--baseline source-tag--compact"><span class="source-tag__kind">Baseline<\/span><\/div>/);
    expect(html).toMatch(/Proposed<div class="source-tag source-tag--estimate source-tag--compact"><span class="source-tag__kind">Estimate<\/span><\/div>/);
    expect(html).not.toContain('source-tag--measured');
  });

  it('says "No reason entered yet." when the reason box is empty or only spaces', () => {
    expect(render(example, '')).toContain('No reason entered yet.');
    expect(render(example, '   ')).toContain('No reason entered yet.');
    expect(render(example, 'Faster answers')).not.toContain('No reason entered yet.');
  });

  it('uses no banned words, apart from the spec\'s own denials', () => {
    let text = render(example).replace(/<[^>]+>/g, ' ');
    for (const denial of ['This has not been approved', 'no savings have been measured', 'Draft, not approved', 'evidence of actual time saved']) {
      text = text.split(denial).join('');
    }
    expect(text).not.toMatch(/\b(will|saved|savings|cuts?|headcount|efficiency|approved|confirmed|submit)\b/i);
  });
});
