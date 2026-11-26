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
        vi.setSystemTime(new Date('2026-03-15T12:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns today\'s date as a YYYY-MM-DD string', () => {
        expect(getTodayString()).toBe('2026-03-15');
    });

    it('returns a string matching the YYYY-MM-DD format', () => {
        expect(getTodayString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('handles year boundary dates', () => {
        vi.setSystemTime(new Date('2026-12-31T23:59:59Z'));
        expect(getTodayString()).toBe('2026-12-31');

        vi.setSystemTime(new Date('2027-01-01T00:00:00Z'));
        expect(getTodayString()).toBe('2027-01-01');
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

    it('adds thousands separators to large prices', () => {
        expect(formatPrice(1234567.891)).toBe('$1,234,567.89');
    });

    it('formats zero', () => {
        expect(formatPrice(0)).toBe('$0.00');
    });

    it('formats negative prices', () => {
        expect(formatPrice(-2.5)).toBe('-$2.50');
    });
});

describe('getAlertText', () => {
    it('renders an upper alert with a greater-than condition', () => {
        const alert: Alert = {
            id: 'alert-fake-1',
            symbol: 'AAPL',
            company: 'Fictional Apple Inc.',
            alertName: 'Fictional AAPL Target Alert',
            currentPrice: 150,
            alertType: 'upper',
            threshold: 150,
            changePercent: 1.5,
        };

        expect(getAlertText(alert)).toBe('Price > $150.00');
    });

    it('renders a lower alert with a less-than condition', () => {
        const alert: Alert = {
            id: 'alert-fake-2',
            symbol: 'AAPL',
            company: 'Fictional Apple Inc.',
            alertName: 'Fictional AAPL Target Alert',
            currentPrice: 150,
            alertType: 'lower',
            threshold: 99.5,
            changePercent: -1.5,
        };

        expect(getAlertText(alert)).toBe('Price < $99.50');
    });
});

describe('getFormattedTodayDate', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-03-15T12:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns the fully formatted date for today', () => {
        expect(getFormattedTodayDate()).toBe('Sunday, March 15, 2026');
    });
});
