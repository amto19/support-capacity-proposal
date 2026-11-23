# Support team capacity proposal

A small tool for one Customer Support manager. An internal estimate suggests AI-assisted triage could free up to 24 hours a week across their team of four. The manager wants to propose using that time on complex exceptions and the knowledge base, and to explain the proposal to two audiences: their team, who may worry about their jobs, and their own manager, who may hear "proven results". The tool lets the manager set projected triage hours, decide where the released hours go, see what changes, see what's still unknown, and prepare a review summary that is clearly a draft and clearly a projection.

All data is fictional. Hours are weekly team totals, not hours per person.

## Setup

You need Node.js (the current LTS version; I built it with v26.13.1, which includes npm).

Install the dependencies:

```bash
npm install
```

Start the tool:

```bash
npm run dev
```

Then open http://localhost:5173 in a browser.

Run the tests:

```bash
npm test
```

It should print `Tests 86 passed (86)`.

## Simulated states

Add these to the page address, or open **Demo controls** at the bottom of the plan screen:

- `?state=loading`: the loading placeholder lasts about 4 seconds instead of about 1.5, long enough to screenshot.
- `?save=error`: the first "Save draft" fails, showing the error message and a "Try again" button. Trying again works, and nothing typed is lost or changed.
- `?state=loading&save=error`: both at once.

**The loading delay is pretend.** The data is already in the data file, so nothing is fetched; the delay only exists to show the loading state.

## Key interaction/component decisions

Three reusable pieces, plus one interaction rule:

- **HoursField:** a slider and a number box that always agree, with one visible label, a hint ("Whole hours, 0 to 72"), and room for an error and a note. The box keeps exactly what was typed (for example "12.0" or a typo), so nothing the manager types is silently changed.
- **SourceTag:** says where a number comes from. Baseline has a solid outline, Estimate a dashed one, and Measured results is empty with "None yet". The outline and the words both carry the meaning, never colour alone.
- **Callout:** one consistent box for messages (the draft banner, the conflict, field errors, the save error and the message after a draft is stored), always with an icon and words, so the kind of message never depends on colour.
- **Entries are never changed in a conflict.** The tool shows how many hours too many and keeps exactly what the manager typed.

## Known limitations

1. **Small screens.** At 768 x 1024 the Proposed bar stays in view while dragging when the plan fits. When the conflict message appears, it can be partly out of view, and on a real tablet, which shows less height, it may be out of view in other cases too. I haven't tested on one.
2. **A very large overflow isn't to scale.** Up to 40 hours over is drawn to scale. Beyond that the overflow is squeezed to fit, marked with a break, and the label keeps the exact number. Everything up to 160 hours stays to scale.
3. **No screen-reader testing.** Accessibility was checked by Claude Code with automated tools and the browser's accessibility information, not with a real screen reader.
4. **One draft per browser.** The draft is stored in this browser only. Clearing site data removes it, and it isn't available on another browser or device.

## Not built, or simulated

- Not deployed: it runs on your own computer.
- No backend and no accounts.
- No real sign-off process. Everything is labelled as a draft, and nothing is sent to anyone.
- Drafts are stored only in this browser.
- The loading delay and the `?save=error` failure are simulated.
