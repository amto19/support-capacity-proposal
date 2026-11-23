import { useId, useState } from 'react';
import { readHours } from '../logic/capacity.js';
import Callout from './Callout.jsx';

/**
 * One hours input: a slider and a number box that stay in sync.
 *
 * `value` is the text exactly as typed, owned by the parent. The number box always
 * shows it unchanged (so "12.0" or a typo stays visible); the slider follows it
 * only when it's a usable whole number.
 */
export default function HoursField({ id: inputId, label, hint, value, onChange, min, max, error, note }) {
  const id = useId();
  const ids = {
    label: `${id}-label`,
    // A fixed id lets other parts of the page move focus here (e.g. "Review summary").
    input: inputId ?? `${id}-input`,
    hint: `${id}-hint`,
    error: `${id}-error`,
    note: `${id}-note`,
  };

  const parsed = readHours(value, { min, max });

  // Remember the last usable number, so the slider doesn't jump to 0
  // while someone is mid-way through fixing a typo.
  const [lastUsable, setLastUsable] = useState(parsed.ok ? parsed.value : min);
  const sliderValue = parsed.ok ? parsed.value : lastUsable;

  function handleTyping(event) {
    const text = event.target.value;
    const check = readHours(text, { min, max });
    if (check.ok) setLastUsable(check.value);
    onChange(text);
  }

  function handleSlider(event) {
    const number = Number(event.target.value);
    setLastUsable(number);
    onChange(String(number));
  }

  // Only point to messages that are actually on screen.
  const describedBy = (...parts) => parts.filter(Boolean).join(' ') || undefined;

  return (
    <div className="hours-field">
      <label id={ids.label} htmlFor={ids.input} className="hours-field__label">
        {label}
      </label>
      <p id={ids.hint} className="hours-field__hint">
        {hint}
      </p>

      <div className="hours-field__controls">
        <input
          type="range"
          className="hours-field__slider"
          min={min}
          max={max}
          step={1}
          value={sliderValue}
          onChange={handleSlider}
          aria-labelledby={ids.label}
          aria-describedby={describedBy(ids.hint, note && ids.note)}
          aria-valuetext={`${sliderValue} hours`}
        />
        {/* A plain text box, not type="number": the browser's number box silently
            erases entries like "abc" or "4.5", which would hide errors from the user. */}
        <input
          id={ids.input}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          className="hours-field__number"
          value={value}
          onChange={handleTyping}
          aria-describedby={describedBy(ids.hint, error && ids.error, note && ids.note)}
          aria-invalid={error ? true : undefined}
        />
      </div>

      {/* Linked to the number box through aria-describedby, so it's read with the label. */}
      {error && (
        <div className="hours-field__error">
          <Callout kind="error" size="small" id={ids.error}>
            {error}
          </Callout>
        </div>
      )}
      {note && (
        <p id={ids.note} className="hours-field__note">
          {note}
        </p>
      )}
    </div>
  );
}
