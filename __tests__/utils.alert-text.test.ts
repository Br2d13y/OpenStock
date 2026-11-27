import { describe, it, expect } from 'vitest';
import { getAlertText } from '@/lib/utils';

describe('getAlertText', () => {
    it('returns price-above text for upper alert type', () => {
        const alert: Alert = {
            id: 'alert-1',
            symbol: 'ACME',
            company: 'Acme Corp',
            alertName: 'ACME above target',
            currentPrice: 150.25,
            alertType: 'upper',
            threshold: 145.5,
        };

        expect(getAlertText(alert)).toBe('Price > $145.50');
    });

    it('returns price-below text for lower alert type', () => {
        const alert: Alert = {
            id: 'alert-2',
            symbol: 'ACME',
            company: 'Acme Corp',
            alertName: 'ACME below target',
            currentPrice: 98.75,
            alertType: 'lower',
            threshold: 100,
        };

        expect(getAlertText(alert)).toBe('Price < $100.00');
    });

    it('formats threshold with currency formatting for large values', () => {
        const alert: Alert = {
            id: 'alert-3',
            symbol: 'WAYNE',
            company: 'Wayne Enterprises',
            alertName: 'WAYNE high threshold',
            currentPrice: 2500,
            alertType: 'upper',
            threshold: 1234.5,
        };

        expect(getAlertText(alert)).toBe('Price > $1,234.50');
    });

    it('uses the lower-condition branch for non-upper alert types as implemented', () => {
        const alert = {
            id: 'alert-4',
            symbol: 'STARK',
            company: 'Stark Industries',
            alertName: 'STARK unknown condition',
            currentPrice: 75,
            alertType: 'unknown' as Alert['alertType'],
            threshold: 80.1,
        } as Alert;

        expect(getAlertText(alert)).toBe('Price < $80.10');
    });
});
