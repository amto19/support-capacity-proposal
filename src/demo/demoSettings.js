// Simulated states for reviewers, switched on by the page address:
//   ?state=loading  the loading placeholder lasts about 4 seconds instead of 1.5
//   ?save=error     the first "Save draft" fails, so the error and "Try again" can be seen
// Both can be combined: ?state=loading&save=error

export const LOADING_MS = { normal: 1500, slow: 4000 };

export function readDemoSettings(search = '') {
  const params = new URLSearchParams(search);
  return {
    slowLoading: params.get('state') === 'loading',
    failFirstSave: params.get('save') === 'error',
  };
}

export function loadingDuration(settings) {
  return settings.slowLoading ? LOADING_MS.slow : LOADING_MS.normal;
}
