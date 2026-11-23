// Sentences for the review summary, built only from a ready summary (see buildSummary).
// Kept apart from the screen so every version can be tested.

import { hours } from '../format.js';
import { TEAM, PROVENANCE } from '../data/teamCapacity.js';

// How each receiving task reads mid-sentence: "16 would go to resolving complex exceptions".
const DESTINATION_PHRASES = {
  exceptions: 'resolving complex exceptions',
  knowledge: 'maintaining the knowledge base',
};

/**
 * One plain sentence (or two) describing the proposal.
 * summary: the result of buildSummary(plan), never null here.
 */
export function proposalSentence(summary) {
  const triage = summary.tasks.find((task) => task.id === 'triage');

  if (summary.released === 0) {
    return `Triage would stay at ${hours(triage.today)} a week, so no hours would be released. Nothing else changes.`;
  }

  // "As a projection" rather than "based on an untested estimate": the estimate is 48, so that
  // clause was wrong for any other triage value. The Estimate tag and unknowns list cover the estimate.
  const first =
    `As a projection, triage could take ${hours(triage.proposed)} a week instead of ${triage.today}, ` +
    `releasing up to ${hours(summary.released)}.`;

  const destinations = summary.tasks
    .filter((task) => task.id in DESTINATION_PHRASES && task.change > 0)
    .map((task, index) =>
      index === 0
        ? `${task.change} would go to ${DESTINATION_PHRASES[task.id]}`
        : `${task.change} to ${DESTINATION_PHRASES[task.id]}`
    );

  if (destinations.length === 0) {
    return `${first} None of them is assigned yet.`;
  }

  // "Not yet assigned" rather than "unallocated", which needs explaining to someone outside the team.
  const ending =
    summary.unallocated > 0
      ? `, and ${summary.unallocated} would not yet be assigned to any task.`
      : ', with every released hour assigned.';

  return `${first} Of those, ${destinations.join(' and ')}${ending}`;
}

// "Weekly hours for the whole team: 3 Support Specialists and 1 Team Lead, 160 hours in total."
export function teamIntro() {
  const people = TEAM.roles.map(({ role, people: count }) => `${count} ${role}${count === 1 ? '' : 's'}`);
  return `Weekly hours for the whole team: ${people.join(' and ')}, ${TEAM.totalHours} hours in total.`;
}

// "Based on baseline-1 (supplied by the manager, 8 January 2027) and an internal planning estimate (11 January 2027). Not measured."
export function provenanceLine() {
  const { baseline, estimate } = PROVENANCE;
  return (
    `Based on ${baseline.revision} (supplied by ${baseline.suppliedBy}, ${baseline.dateLabel}) ` +
    `and an internal planning estimate (${estimate.dateLabel}). Not measured.`
  );
}
