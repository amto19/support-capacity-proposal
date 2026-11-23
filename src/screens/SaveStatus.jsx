import Callout from '../components/Callout.jsx';
import { SAVED_MESSAGE, SAVE_FAILED_MESSAGE } from '../text/planText.js';

export const SAVE_STATE = { NONE: 'none', SAVED: 'saved', FAILED: 'failed' };

/**
 * The message under the buttons after "Save draft", on both screens.
 * Both regions are always on the page (empty until needed), so screen readers announce what appears:
 * the saved message politely, the error straight away (role="alert"), because a failed save matters more.
 */
export default function SaveStatus({ saveState, onRetry }) {
  return (
    <div className="save-status">
      <div role="status">
        {saveState === SAVE_STATE.SAVED && (
          <Callout kind="info" size="small">
            {SAVED_MESSAGE}
          </Callout>
        )}
      </div>
      <div role="alert">
        {saveState === SAVE_STATE.FAILED && (
          <Callout kind="error" size="small">
            <p>{SAVE_FAILED_MESSAGE}</p>
            <button type="button" className="button button--secondary button--small" onClick={onRetry}>
              Try again
            </button>
          </Callout>
        )}
      </div>
    </div>
  );
}
