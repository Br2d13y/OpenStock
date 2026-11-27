import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    getTodayString,
    formatPrice,
    getAlertText,
    getFormattedTodayDate,
} from '@/lib/utils';

describe('getTodayString', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns today\'s date as a YYYY-MM-DD UTC string', () => {
        vi.setSystemTime(new Date('2026-03-15T12:00:00Z'));
        expect(getTodayString()).toBe('2026-03-15');
    });

    it('handles year boundary dates in UTC', () => {
        vi.setSystemTime(new Date('2026-12-31T23:59:59Z'));
        expect(getTodayString()).toBe('2026-12-31');

        vi.setSystemTime(new Date('2027-01-01T00:00:00Z'));
        expect(getTodayString()).toBe('2027-01-01');
    });

    it('uses UTC date when the instant is near midnight UTC', () => {
        vi.setSystemTime(new Date('2026-03-15T00:30:00Z'));
        expect(getTodayString()).toBe('2026-03-15');
    });
});

describe('formatPrice', () => {
    it('formats a regular price with two decimal places', () => {
        expect(formatPrice(42.5)).toBe('$42.50');
    });

    it('formats whole numbers with two decimal places', () => {
        expect(formatPrice(150)).toBe('$150.00');
    });

    it('formats sub-dollar prices', () => {
        expect(formatPrice(3.1)).toBe('$3.10');
    });

    it('adds thousands separators for large prices', () => {
        expect(formatPrice(1234567.891)).toBe('$1,234,567.89');
    });

    it('formats zero', () => {
        expect(formatPrice(0)).toBe('$0.00');
    });

    it('formats negative prices', () => {
        expect(formatPrice(-2.5)).toBe('-$2.50');
    });

    it('formats NaN as $NaN', () => {
        expect(formatPrice(Number.NaN)).toBe('$NaN');
    });

    it('formats Infinity as $∞', () => {
        expect(formatPrice(Number.POSITIVE_INFINITY)).toBe('$∞');
    });

    it('formats negative Infinity as -$∞', () => {
        expect(formatPrice(Number.NEGATIVE_INFINITY)).toBe('-$∞');
    });
});

describe('getAlertText', () => {
    type AlertArg = Parameters<typeof getAlertText>[0];

    const baseAlert: AlertArg = {
        id: 'alert-fake-1',
        symbol: 'FAKE',
        company: 'Fictional Apple Inc.',
        alertName: 'Fictional FAKE Target Alert',
        currentPrice: 150,
        alertType: 'upper',
        threshold: 150,
        changePercent: 1.5,
    };

    it('renders an upper alert with a greater-than condition', () => {
        expect(getAlertText(baseAlert)).toBe('Price > $150.00');
    });

    it('renders a lower alert with a less-than condition', () => {
        const alert: AlertArg = {
            ...baseAlert,
            id: 'alert-fake-2',
            alertType: 'lower',
            threshold: 99.5,
            changePercent: -1.5,
        };

        expect(getAlertText(alert)).toBe('Price < $99.50');
    });

    it('treats unknown alertType as lower condition (default branch)', () => {
        const alert = {
            ...baseAlert,
            id: 'alert-fake-3',
            alertType: 'unknown',
            threshold: 10,
        } as unknown as AlertArg;

        expect(getAlertText(alert)).toBe('Price < $10.00');
    });
});

describe('getFormattedTodayDate', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns the fully formatted UTC date for today', () => {
        vi.setSystemTime(new Date('2026-03-15T12:00:00Z'));
        expect(getFormattedTodayDate()).toBe('Sunday, March 15, 2026');
    });

    it('formats a UTC day boundary consistently', () => {
        vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
        expect(getFormattedTodayDate()).toBe('Thursday, January 1, 2026');
    });
});
