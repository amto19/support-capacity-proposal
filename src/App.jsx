import { useEffect, useRef, useState } from 'react';
import PlanScreen from './screens/PlanScreen.jsx';
import SummaryScreen from './screens/SummaryScreen.jsx';
import LoadingScreen from './screens/LoadingScreen.jsx';
import { SAVE_STATE } from './screens/SaveStatus.jsx';
import { evaluatePlan, buildSummary, BASELINE_TRIAGE } from './logic/capacity.js';
import { HOURS_LIMITS } from './data/teamCapacity.js';
import { createSaver, loadDraft } from './storage/draftStorage.js';
import { readDemoSettings, loadingDuration } from './demo/demoSettings.js';

// Open on today's picture with nothing proposed, so every change is the manager's own choice.
const STARTING_ENTRIES = {
  triage: String(BASELINE_TRIAGE),
  exceptions: String(HOURS_LIMITS.min),
  knowledge: String(HOURS_LIMITS.min),
};

const TITLES = {
  plan: 'Support team capacity proposal',
  summary: 'Review summary – Support team capacity proposal',
};

/**
 * Holds everything the manager has entered, and which screen is showing.
 * Both screens only display and edit this, so "Back to edit" never loses anything.
 */
export default function App() {
  // Demo settings come from the page address (?state=loading, ?save=error); read once.
  const [demo] = useState(() => readDemoSettings(window.location.search));
  const [save] = useState(() => createSaver({ failFirstSave: demo.failFirstSave }));
  // Simulated loading. The saved draft below is read straight away, before loading starts,
  // so restoring works exactly as before; loading only delays when the plan appears.
  const [loading, setLoading] = useState(true);
  const [savedDraft] = useState(() => loadDraft());
  const [entries, setEntries] = useState(savedDraft?.entries ?? STARTING_ENTRIES);
  const [rationale, setRationale] = useState(savedDraft?.rationale ?? '');
  const [screen, setScreen] = useState('plan');
  const [saveState, setSaveState] = useState(SAVE_STATE.NONE);
  const [restored, setRestored] = useState(Boolean(savedDraft));
  const firstRender = useRef(true);

  const plan = evaluatePlan(entries);
  // The only route to a summary: null unless the plan is ready.
  const summary = buildSummary(plan);

  // Any change means what's on screen is no longer what was saved or restored.
  // A failed save stays on screen until a save succeeds: the work still isn't saved.
  const markChanged = () => {
    setSaveState((current) => (current === SAVE_STATE.SAVED ? SAVE_STATE.NONE : current));
    setRestored(false);
  };

  const handleEntryChange = (field, text) => {
    markChanged();
    setEntries((current) => ({ ...current, [field]: text }));
  };

  const handleRationaleChange = (text) => {
    markChanged();
    setRationale(text);
  };

  // Saves whatever is typed, even an unfinished plan, so nothing is ever lost.
  // Used by "Save draft" and "Try again" alike. A failure only reads the entries, never changes them.
  const handleSave = () => {
    setSaveState(save({ entries, rationale }) ? SAVE_STATE.SAVED : SAVE_STATE.FAILED);
  };

  const showScreen = (next) => {
    setSaveState((current) => (current === SAVE_STATE.SAVED ? SAVE_STATE.NONE : current));
    setScreen(next);
  };

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), loadingDuration(demo));
    return () => clearTimeout(timer);
  }, [demo]);

  // On switching screens: update the tab title, start at the top, and put focus somewhere sensible.
  useEffect(() => {
    document.title = TITLES[screen];
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo(0, 0);
    const target = document.getElementById(screen === 'summary' ? 'summary-heading' : 'review-summary-button');
    target?.focus({ preventScroll: true });
  }, [screen]);

  if (loading) return <LoadingScreen />;

  if (screen === 'summary' && summary) {
    return (
      <SummaryScreen
        summary={summary}
        rationale={rationale}
        onBack={() => showScreen('plan')}
        onSave={handleSave}
        saveState={saveState}
        onRetrySave={handleSave}
      />
    );
  }

  return (
    <PlanScreen
      entries={entries}
      onEntryChange={handleEntryChange}
      rationale={rationale}
      onRationaleChange={handleRationaleChange}
      plan={plan}
      onOpenSummary={() => showScreen('summary')}
      onSave={handleSave}
      saveState={saveState}
      onRetrySave={handleSave}
      restored={restored}
    />
  );
}
