import { describe, it, expect } from 'vitest';
import { readDemoSettings, loadingDuration } from './demoSettings.js';

describe('demo settings from the page address', () => {
  it('nothing set: normal loading, saving works first time', () => {
    expect(readDemoSettings('')).toEqual({ slowLoading: false, failFirstSave: false });
    expect(loadingDuration(readDemoSettings(''))).toBe(1500);
  });

  it('?state=loading makes loading last about 4 seconds', () => {
    expect(readDemoSettings('?state=loading')).toEqual({ slowLoading: true, failFirstSave: false });
    expect(loadingDuration(readDemoSettings('?state=loading'))).toBe(4000);
  });

  it('?save=error makes the first save fail', () => {
    expect(readDemoSettings('?save=error')).toEqual({ slowLoading: false, failFirstSave: true });
  });

  it('both together, and anything else is ignored', () => {
    expect(readDemoSettings('?state=loading&save=error')).toEqual({ slowLoading: true, failFirstSave: true });
    expect(readDemoSettings('?state=ready&save=ok&x=1')).toEqual({ slowLoading: false, failFirstSave: false });
  });
});
