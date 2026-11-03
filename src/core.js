// Core formatting logic for span-duration-string-formatter.
//
// Durations arrive as integer nanoseconds because that is the unit OpenTelemetry
// uses for span start/end timestamps. We convert to the largest unit that keeps
// the value at or above 1, then render with a fixed number of significant digits.
//
// Design decision: we always emit exactly three significant digits (e.g. "1.23s",
// "12.3ms", "123ns"). This matches the OpenTelemetry specification's example
// output and avoids the ambiguity of "how many decimals does 1.5 seconds need".
// Trailing zeros are stripped so "1.00s" becomes "1s", which is what a reader
// expects for round numbers.

/**
 * Ordered list of units from largest to smallest.
 *
 * `threshold` is the smallest integer number of nanoseconds that should be
 * rendered in this unit. Below it we fall through to the next smaller unit.
 * Keeping thresholds explicit (rather than deriving them) makes the boundary
 * behaviour obvious and testable.
 */
export const UNITS = [
  { suffix: 'd', threshold: 86400_000_000_000, scale: 86400_000_000_000 },
  { suffix: 'h', threshold: 3600_000_000_000, scale: 3600_000_000_000 },
  { suffix: 'm', threshold: 60_000_000_000, scale: 60_000_000_000 },
  { suffix: 's', threshold: 1_000_000_000, scale: 1_000_000_000 },
  { suffix: 'ms', threshold: 1_000_000, scale: 1_000_000 },
  { suffix: 'µs', threshold: 1_000, scale: 1_000 },
  { suffix: 'ns', threshold: 1, scale: 1 },
];

/**
 * Formats a value to at most `precision` significant digits, stripping
 * trailing zeros and any dangling decimal point.
 *
 * Why not toFixed? toFixed rounds to a fixed number of *decimal places*, not
 * significant digits, so 1.234s and 123.4ms would need different arguments.
 * Significant digits give consistent visual density across units.
 */
function formatSignificant(value, precision) {
  if (!Number.isFinite(value)) {
    throw new RangeError(`cannot format non-finite value: ${value}`);
  }
  // Determine the exponent (base 10) of the value so we can round at the
  // correct significant position. Math.log10(0) is -Infinity, so handle zero.
  if (value === 0) return '0';
  const exponent = Math.floor(Math.log10(Math.abs(value)));
  const decimals = precision - 1 - exponent;
  // toFixed requires 0 <= decimals <= 100; clamp to keep pathological inputs
  // from throwing. Values that large are already outside realistic durations.
  const clamped = Math.max(0, Math.min(100, decimals));
  const rounded = Number(value.toFixed(clamped));
  // toFixed already produces a string with the right number of decimals; we
  // strip trailing zeros ourselves because toFixed keeps them.
  let text = rounded.toString();
  if (text.includes('.')) {
    text = text.replace(/0+$/, '').replace(/\.$/, '');
  }
  return text;
}

/**
 * Formats a span duration in nanoseconds as a human-readable string.
 *
 * @param {number} nanoseconds - non-negative integer nanoseconds.
 * @param {{ precision?: number }} [options]
 * @returns {string}
 *
 * Interpretation of the brief: durations are rendered as a single unit, never
 * as a compound "1m 30s". OpenTelemetry's own examples use a single unit, and
 * a compound form would make the significant-digit rule ambiguous.
 */
export function formatSpanDuration(nanoseconds, options = {}) {
  if (typeof nanoseconds !== 'number' || !Number.isFinite(nanoseconds)) {
    throw new TypeError('nanoseconds must be a finite number');
  }
  if (nanoseconds < 0) {
    throw new RangeError('nanoseconds must not be negative');
  }
  const precision = options.precision ?? 3;
  if (!Number.isInteger(precision) || precision < 1 || precision > 15) {
    throw new RangeError('precision must be an integer between 1 and 15');
  }

  // Zero is special: there is no largest unit at or above 1, so we report it
  // in the smallest unit to keep the output stable and obviously zero.
  if (nanoseconds === 0) {
    return '0ns';
  }

  for (const unit of UNITS) {
    if (nanoseconds >= unit.threshold) {
      const value = nanoseconds / unit.scale;
      return `${formatSignificant(value, precision)}${unit.suffix}`;
    }
  }

  // Unreachable for any non-negative integer, but keeps the function total.
  return `${nanoseconds}ns`;
}
