import test from 'node:test';
import assert from 'node:assert/strict';

import { formatSpanDuration, UNITS } from '../src/index.js';

test('zero renders in nanoseconds', () => {
  assert.equal(formatSpanDuration(0), '0ns');
});

test('sub-microsecond values stay in nanoseconds', () => {
  assert.equal(formatSpanDuration(1), '1ns');
  assert.equal(formatSpanDuration(999), '999ns');
});

test('microsecond boundary', () => {
  assert.equal(formatSpanDuration(1_000), '1\u00b5s');
  assert.equal(formatSpanDuration(1_500), '1.5\u00b5s');
  assert.equal(formatSpanDuration(999_999), '1000\u00b5s');
});

test('millisecond boundary', () => {
  assert.equal(formatSpanDuration(1_000_000), '1ms');
  assert.equal(formatSpanDuration(12_300_000), '12.3ms');
  assert.equal(formatSpanDuration(999_999_999), '1000ms');
});

test('second boundary', () => {
  assert.equal(formatSpanDuration(1_000_000_000), '1s');
  assert.equal(formatSpanDuration(1_234_000_000), '1.23s');
  assert.equal(formatSpanDuration(59_999_999_999), '60s');
});

test('minute boundary', () => {
  assert.equal(formatSpanDuration(60_000_000_000), '1m');
  assert.equal(formatSpanDuration(90_000_000_000), '1.5m');
  assert.equal(formatSpanDuration(3_599_999_999_999), '60m');
});

test('hour boundary', () => {
  assert.equal(formatSpanDuration(3_600_000_000_000), '1h');
  assert.equal(formatSpanDuration(5_400_000_000_000), '1.5h');
  assert.equal(formatSpanDuration(86_399_999_999_999), '24h');
});

test('day boundary', () => {
  assert.equal(formatSpanDuration(86_400_000_000_000), '1d');
  assert.equal(formatSpanDuration(129_600_000_000_000), '1.5d');
});

test('trailing zeros are stripped', () => {
  assert.equal(formatSpanDuration(2_000_000_000), '2s');
  assert.equal(formatSpanDuration(1_500_000_000), '1.5s');
});

test('precision option controls significant digits', () => {
  assert.equal(formatSpanDuration(1_234_567_890, { precision: 1 }), '1s');
  assert.equal(formatSpanDuration(1_234_567_890, { precision: 2 }), '1.2s');
  assert.equal(formatSpanDuration(1_234_567_890, { precision: 5 }), '1.2346s');
});

test('rejects negative durations', () => {
  assert.throws(() => formatSpanDuration(-1), RangeError);
});

test('rejects non-finite durations', () => {
  assert.throws(() => formatSpanDuration(NaN), TypeError);
  assert.throws(() => formatSpanDuration(Infinity), TypeError);
});

test('rejects non-numeric durations', () => {
  assert.throws(() => formatSpanDuration('1000'), TypeError);
});

test('rejects out-of-range precision', () => {
  assert.throws(() => formatSpanDuration(1_000_000_000, { precision: 0 }), RangeError);
  assert.throws(() => formatSpanDuration(1_000_000_000, { precision: 16 }), RangeError);
  assert.throws(() => formatSpanDuration(1_000_000_000, { precision: 1.5 }), RangeError);
});

test('UNITS is ordered largest to smallest', () => {
  for (let i = 1; i < UNITS.length; i += 1) {
    assert.ok(UNITS[i - 1].threshold > UNITS[i].threshold);
  }
  assert.equal(UNITS[UNITS.length - 1].suffix, 'ns');
});
