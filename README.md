# span-duration-string-formatter

Formats nanosecond span durations into human-readable time units following
OpenTelemetry display conventions.

```js
import { formatSpanDuration } from 'span-duration-string-formatter';

formatSpanDuration(1_234_000_000);      // '1.23s'
formatSpanDuration(12_300_000);         // '12.3ms'
formatSpanDuration(0);                  // '0ns'
formatSpanDuration(1_234_567_890, { precision: 5 }); // '1.2346s'
```

The package is ESM-only and has no runtime dependencies.

## Why this exists

OpenTelemetry records span durations as integer nanoseconds. Rendering those raw
values in a UI means every consumer re-implements the same unit selection and
rounding, and they tend to disagree at the boundaries: one viewer shows `60s`,
another shows `1m`. This library fixes one rule and applies it everywhere.

The trade-off is that a duration is rendered in a **single unit**, never as a
compound `1m 30s`. That keeps the significant-digit rule unambiguous and matches
the examples in the OpenTelemetry specification. If you need a compound clock
format, this is not the library for that.

## API

### `formatSpanDuration(nanoseconds, options?)`

- `nanoseconds` — a finite, non-negative number. Integers are the intended
  input; fractional values are accepted and rounded during formatting.
- `options.precision` — number of significant digits to render, integer from 1
to 15. Defaults to `3`.

Returns a string like `'1.23s'`, `'12.3ms'`, or `'999ns'`. Trailing zeros are
stripped, so round values render without a decimal point.

Throws `TypeError` for non-numeric or non-finite input, and `RangeError` for
negative durations or out-of-range precision.

### `UNITS`

An exported array of `{ suffix, threshold, scale }` objects ordered from the
largest unit (days) to the smallest (nanoseconds). It is exported so callers can
introspect the thresholds; the formatter itself is the only supported way to
render a duration.

## The awkward edge

Rounding happens *after* unit selection. `999_999_999` nanoseconds is below the
one-second threshold, so it renders as `1000ms`, not `1s`. That is intentional:
the unit is chosen by the raw value, and the rendered digits are then rounded.
If you want the rounded value to influence unit selection, round before calling.

## Performance

The window keeps a bounded buffer, so `push` is constant time and memory does not
grow with the length of the stream. `peak` and `trough` are linear in the window
size, which is the trade that keeps `push` cheap.

