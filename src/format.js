// Small wording helpers shared by the screens. No maths beyond display.

export const hours = (n) => `${n} ${n === 1 ? 'hour' : 'hours'}`;

// "+16", "−24" (a true minus sign, which reads better than a hyphen), or "0".
export const signed = (n) => {
  if (n > 0) return `+${n}`;
  if (n < 0) return `−${Math.abs(n)}`;
  return '0';
};
