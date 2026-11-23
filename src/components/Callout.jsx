// A box with an icon and words, for the draft banner, conflicts, validation messages and save errors.
// Each kind has its own icon shape and its own wording, so meaning never depends on colour alone.

const ICONS = {
  // Circle with an "i"
  info: (
    <>
      <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="9" y="8.5" width="2" height="6" fill="currentColor" />
      <rect x="9" y="5" width="2" height="2" fill="currentColor" />
    </>
  ),
  // Triangle with "!"
  warning: (
    <>
      <path d="M10 2 L19 18 H1 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <rect x="9" y="7.5" width="2" height="5.5" fill="currentColor" />
      <rect x="9" y="14.5" width="2" height="2" fill="currentColor" />
    </>
  ),
  // Circle with a cross
  error: (
    <>
      <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M7 7 L13 13 M13 7 L7 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
};

// The same icons, for places outside a Callout that need to match it (like the bar's "8 over" label).
export function CalloutIcon({ kind, className = 'callout__icon' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      {ICONS[kind]}
    </svg>
  );
}

export default function Callout({ kind = 'info', title, children, id, size = 'regular', tabIndex }) {
  return (
    <div id={id} className={`callout callout--${kind} callout--${size}`} tabIndex={tabIndex}>
      <CalloutIcon kind={kind} />
      <div className="callout__body">
        {title && <p className="callout__title">{title}</p>}
        <div className="callout__text">{children}</div>
      </div>
    </div>
  );
}
