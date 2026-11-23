// A small label saying where a number comes from.
// The kind is shown by its outline (solid, dashed, empty) and always by its words, never colour alone.

const KIND_LABELS = {
  baseline: 'Baseline',
  estimate: 'Estimate',
  measured: 'Measured results',
};

/**
 * id: lets a link elsewhere on the page jump here (focusable, but not an extra Tab stop).
 * marker: a visual footnote mark after the kind, such as "*". Hidden from screen readers,
 *   because the link that points here already says where it goes in words.
 * compact: just the kind, small, for tight spots like a table header. No description.
 */
export default function SourceTag({ kind, description, id, marker, compact = false }) {
  return (
    <div
      id={id}
      tabIndex={id ? -1 : undefined}
      className={`source-tag source-tag--${kind}${compact ? ' source-tag--compact' : ''}`}
    >
      <span className="source-tag__kind">
        {KIND_LABELS[kind]}
        {marker && <span aria-hidden="true">{marker}</span>}
      </span>
      {description && <span className="source-tag__description">{description}</span>}
    </div>
  );
}
