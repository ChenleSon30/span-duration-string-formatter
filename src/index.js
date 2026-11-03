// Public entry point for span-duration-string-formatter.
//
// The formatter is deliberately small: one function, one option object. Keeping
// the surface narrow makes it easy to reason about the rounding behaviour, which
// is the only place this library can surprise a caller.

export { formatSpanDuration, UNITS } from './core.js';
