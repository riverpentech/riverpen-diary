import assert from 'node:assert/strict';
import test from 'node:test';
import moment from 'moment';
import { countEntriesByLocalDate, getDiaryDateRanges, shouldShowReminder } from './homeData.ts';

test('counts month entries by the visitor local calendar date', () => {
    const counts = countEntriesByLocalDate([
        { entryDate: '2026-06-11T09:00:00.000Z' },
        { entryDate: '2026-06-11T15:00:00.000Z' },
        { entryDate: '2026-06-12T09:00:00.000Z' },
    ]);

    assert.deepEqual(counts, { '2026-06-11': 2, '2026-06-12': 1 });
});

test('keeps the selected month range separate from today reminder range', () => {
    const ranges = getDiaryDateRanges(moment('2026-03-15'), moment('2026-06-11T18:00:00'));

    assert.equal(moment(ranges.monthStart).format('YYYY-MM-DD'), '2026-03-01');
    assert.equal(moment(ranges.monthEnd).format('YYYY-MM-DD'), '2026-04-01');
    assert.equal(moment(ranges.todayStart).format('YYYY-MM-DD'), '2026-06-11');
    assert.equal(moment(ranges.todayEnd).format('YYYY-MM-DD'), '2026-06-12');
});

test('shows reminders only after the configured time when there is no entry today', () => {
    assert.equal(shouldShowReminder(true, false, '19:00', moment('2026-06-11T18:59:00')), false);
    assert.equal(shouldShowReminder(true, false, '19:00', moment('2026-06-11T19:00:00')), true);
    assert.equal(shouldShowReminder(true, true, '19:00', moment('2026-06-11T20:00:00')), false);
    assert.equal(shouldShowReminder(true, null, '19:00', moment('2026-06-11T20:00:00')), false);
    assert.equal(shouldShowReminder(true, false, 'not-a-time', moment('2026-06-11T20:00:00')), false);
});
