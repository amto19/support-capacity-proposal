// The single source of facts for the whole app.
// Components and logic read from here, so a number only ever needs changing in one place.
// Hours are weekly team totals, not hours per person.

export const TEAM = {
  roles: [
    { role: 'Support Specialist', people: 3 },
    { role: 'Team Lead', people: 1 },
  ],
  hoursPerPerson: 40,
  totalHours: 160,
};

// Order here is the order tasks appear in bars and tables.
// shortName is for bar labels, where the full name won't fit.
export const TASKS = [
  { id: 'triage', name: 'Triage incoming requests', shortName: 'Triage', role: 'Support Specialist', hoursToday: 72 },
  { id: 'exceptions', name: 'Resolve complex exceptions', shortName: 'Exceptions', role: 'Support Specialist', hoursToday: 36 },
  { id: 'knowledge', name: 'Maintain the knowledge base', shortName: 'Knowledge base', role: 'Support Specialist', hoursToday: 12 },
  { id: 'coaching', name: 'Coach the team', shortName: 'Coaching', role: 'Team Lead', hoursToday: 24 },
  { id: 'quality', name: 'Review quality and escalations', shortName: 'Quality', role: 'Team Lead', hoursToday: 16 },
];

// Allowed range for every hours field: whole hours, 0 to 72.
export const HOURS_LIMITS = { min: 0, max: 72 };

export const PROVENANCE = {
  baseline: {
    revision: 'baseline-1',
    suppliedBy: 'the manager',
    date: '2027-01-08',
    dateLabel: '8 January 2027',
    description: 'A planning input, not measured telemetry.',
  },
  estimate: {
    date: '2027-01-11',
    dateLabel: '11 January 2027',
    taskId: 'triage',
    fromHours: 72,
    toHours: 48,
    // An internal planning estimate of triage hours with AI assistance.
    description: 'No pilot has validated it.',
  },
  // Deliberately empty: no measured outcomes exist.
  measured: null,
};

// What we don't know yet. Wording from SPEC.md section 4.
export const UNKNOWNS = [
  { id: 'noPilot', text: 'No pilot has tested the 72 to 48 estimate.' },
  { id: 'baselineNotTracked', text: "The baseline is the manager's planning input, not tracked time." },
  { id: 'writingSkills', text: "Writing skills for knowledge-base work haven't been assessed." },
  { id: 'noCostData', text: 'There is no reliable cost data, so no cost figures are shown.' },
  { id: 'noTimeSavedEvidence', text: 'There is no evidence of actual time saved.' },
];
