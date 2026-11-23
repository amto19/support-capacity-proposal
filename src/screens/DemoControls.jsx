// For reviewers: links that switch on the simulated states, without reading the README.
// Uses the browser's own disclosure (<details>), so it opens with the keyboard and is announced
// as expandable by screen readers without any extra code. Collapsed by default.
export default function DemoControls() {
  // Outside a browser (in the tests) there's no address, so fall back to the site root.
  const page = typeof window === 'undefined' ? '/' : window.location.pathname;

  return (
    <details className="demo-controls">
      <summary>Demo controls</summary>
      <p>These links reload the page. Save your draft first to keep your entries.</p>
      <ul>
        <li>
          <a href={`${page}?state=loading`}>Slow loading (about 4 seconds)</a>
        </li>
        <li>
          <a href={`${page}?save=error`}>First save fails</a>
        </li>
        <li>
          <a href={page}>Turn off demo settings</a>
        </li>
      </ul>
    </details>
  );
}
