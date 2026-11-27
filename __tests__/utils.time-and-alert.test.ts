import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatTimeAgo, formatNumber, getAlertText } from '../lib/utils';

type AlertFixture = {
    id: string;
    symbol: string;
    company: string;
    alertName: string;
    currentPrice: number;
    alertType: 'upper' | 'lower';
    threshold: number;
    changePercent?: number;
};

describe('formatTimeAgo', () => {
    const NOW = new Date('2026-01-15T12:00:00Z').getTime();

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(NOW);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns minutes for a timestamp ~5 minutes ago', () => {
        const fiveMinutesAgo = Math.floor((NOW - 5 * 60 * 1000) / 1000);
        expect(formatTimeAgo(fiveMinutesAgo)).toBe('5 minutes ago');
    });

    it("returns singular '1 minute ago'", () => {
        const oneMinuteAgo = Math.floor((NOW - 1 * 60 * 1000) / 1000);
        expect(formatTimeAgo(oneMinuteAgo)).toBe('1 minute ago');
    });

    it("returns plural '2 minutes ago'", () => {
        const twoMinutesAgo = Math.floor((NOW - 2 * 60 * 1000) / 1000);
        expect(formatTimeAgo(twoMinutesAgo)).toBe('2 minutes ago');
    });

    it("returns '1 hour ago'", () => {
        const oneHourAgo = Math.floor((NOW - 1 * 60 * 60 * 1000) / 1000);
        expect(formatTimeAgo(oneHourAgo)).toBe('1 hour ago');
    });

    it("returns '5 hours ago'", () => {
        const fiveHoursAgo = Math.floor((NOW - 5 * 60 * 60 * 1000) / 1000);
        expect(formatTimeAgo(fiveHoursAgo)).toBe('5 hours ago');
    });

    it("returns '1 day ago' for more than 24 hours", () => {
        const twentyFiveHoursAgo = Math.floor((NOW - 25 * 60 * 60 * 1000) / 1000);
        expect(formatTimeAgo(twentyFiveHoursAgo)).toBe('1 day ago');
    });

    it("returns '3 days ago'", () => {
        const threeDaysAgo = Math.floor((NOW - 3 * 24 * 60 * 60 * 1000) / 1000);
        expect(formatTimeAgo(threeDaysAgo)).toBe('3 days ago');
    });

    it('treats exactly 24 hours as hours (uses diffInHours > 24 for days)', () => {
        const exactly24HoursAgo = Math.floor((NOW - 24 * 60 * 60 * 1000) / 1000);
        expect(formatTimeAgo(exactly24HoursAgo)).toBe('24 hours ago');
    });
});

describe('formatNumber', () => {
    it('multiplies input by 1e6 and formats millions', () => {
        // 25 * 1e6 = 25,000,000 => 25.00M
        expect(formatNumber(25)).toBe('25.00M');
    });

    it('formats billions for representative values', () => {
        // 1,500 * 1e6 = 1,500,000,000 => 1.50B
        expect(formatNumber(1500)).toBe('1.50B');
    });

    it('formats trillions for representative values', () => {
        // 2,300,000 * 1e6 = 2.3e12 => 2.30T
        expect(formatNumber(2300000)).toBe('2.30T');
    });

    it('formats thousands at the 1e3 threshold', () => {
        // 0.001 * 1e6 = 1,000 => 1.00K
        expect(formatNumber(0.001)).toBe('1.00K');
    });

    it('formats at the 1e6 threshold', () => {
        // 1 * 1e6 = 1,000,000 => 1.00M
        expect(formatNumber(1)).toBe('1.00M');
    });

    it('returns plain string for small values below 1e3', () => {
        // 0.0005 * 1e6 = 500 => "500"
        expect(formatNumber(0.0005)).toBe('500');
    });
});

describe('getAlertText', () => {
    it("returns 'Price > $150.00' for upper alert type", () => {
        const alert: AlertFixture = {
            id: 'alert-1',
            symbol: 'AAPL',
            company: 'Apple Inc.',
            alertName: 'Upper target',
            currentPrice: 145,
            alertType: 'upper',
            threshold: 150,
        };
        expect(getAlertText(alert)).toBe('Price > $150.00');
    });

    it("returns 'Price < $99.50' for lower alert type", () => {
        const alert: AlertFixture = {
            id: 'alert-2',
            symbol: 'MSFT',
            company: 'Microsoft Corp.',
            alertName: 'Lower target',
            currentPrice: 105,
            alertType: 'lower',
            threshold: 99.5,
        };
        expect(getAlertText(alert)).toBe('Price < $99.50');
    });
});
