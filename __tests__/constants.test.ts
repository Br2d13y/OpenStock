import { describe, it, expect } from 'vitest';
import {
    NAV_ITEMS,
    INVESTMENT_GOALS,
    RISK_TOLERANCE_OPTIONS,
    PREFERRED_INDUSTRIES,
    ALERT_TYPE_OPTIONS,
    CONDITION_OPTIONS,
    MARKET_OVERVIEW_WIDGET_CONFIG,
    SYMBOL_INFO_WIDGET_CONFIG,
    CANDLE_CHART_WIDGET_CONFIG,
    BASELINE_WIDGET_CONFIG,
    TECHNICAL_ANALYSIS_WIDGET_CONFIG,
    POPULAR_STOCK_SYMBOLS,
    WATCHLIST_TABLE_HEADER,
    PASSWORD_RULES,
    PASSWORD_VALIDATION,
} from '@/lib/constants';

describe('PASSWORD_RULES', () => {
    const compliantPassword = 'ZetaPass1';

    it('has 4 items in the documented order (length>=8, uppercase, lowercase, digit)', () => {
        expect(PASSWORD_RULES).toHaveLength(4);
        expect(PASSWORD_RULES[0].label).toBe('At least 8 characters');
        expect(PASSWORD_RULES[1].label).toBe('At least 1 uppercase letter');
        expect(PASSWORD_RULES[2].label).toBe('At least 1 lowercase letter');
        expect(PASSWORD_RULES[3].label).toBe('At least 1 number');
    });

    it('a compliant fictional password passes all four rules', () => {
        for (const rule of PASSWORD_RULES) {
            expect(rule.test(compliantPassword)).toBe(true);
        }
    });

    it('fails on missing length (rule 1) only when password is too short', () => {
        const tooShort = 'Zeta1a'; // 6 chars, has upper, lower, digit
        expect(PASSWORD_RULES[0].test(tooShort)).toBe(false);
        expect(PASSWORD_RULES[1].test(tooShort)).toBe(true);
        expect(PASSWORD_RULES[2].test(tooShort)).toBe(true);
        expect(PASSWORD_RULES[3].test(tooShort)).toBe(true);
    });

    it('fails on missing uppercase (rule 2) only', () => {
        const noUpper = 'zetapass1';
        expect(PASSWORD_RULES[0].test(noUpper)).toBe(true);
        expect(PASSWORD_RULES[1].test(noUpper)).toBe(false);
        expect(PASSWORD_RULES[2].test(noUpper)).toBe(true);
        expect(PASSWORD_RULES[3].test(noUpper)).toBe(true);
    });

    it('fails on missing lowercase (rule 3) only', () => {
        const noLower = 'ZETAPASS1';
        expect(PASSWORD_RULES[0].test(noLower)).toBe(true);
        expect(PASSWORD_RULES[1].test(noLower)).toBe(true);
        expect(PASSWORD_RULES[2].test(noLower)).toBe(false);
        expect(PASSWORD_RULES[3].test(noLower)).toBe(true);
    });

    it('fails on missing digit (rule 4) only', () => {
        const noDigit = 'ZetaPassw';
        expect(PASSWORD_RULES[0].test(noDigit)).toBe(true);
        expect(PASSWORD_RULES[1].test(noDigit)).toBe(true);
        expect(PASSWORD_RULES[2].test(noDigit)).toBe(true);
        expect(PASSWORD_RULES[3].test(noDigit)).toBe(false);
    });
});

describe('PASSWORD_VALIDATION', () => {
    const compliantPassword = 'ZetaPass1';

    it('pattern.value accepts the compliant password', () => {
        expect(PASSWORD_VALIDATION.pattern.value.test(compliantPassword)).toBe(true);
    });

    it('pattern.value rejects a 7-character password', () => {
        expect(PASSWORD_VALIDATION.pattern.value.test('Zeta1aB')).toBe(false); // 7 chars
    });

    it('pattern.value rejects a no-uppercase password', () => {
        expect(PASSWORD_VALIDATION.pattern.value.test('zetapass1')).toBe(false);
    });

    it('pattern.value rejects a no-digit password', () => {
        expect(PASSWORD_VALIDATION.pattern.value.test('ZetaPassw')).toBe(false);
    });
});

describe('NAV_ITEMS', () => {
    it('hrefs are unique', () => {
        const hrefs = NAV_ITEMS.map((item) => item.href);
        expect(new Set(hrefs).size).toBe(hrefs.length);
    });

    it('every entry has a non-empty label', () => {
        for (const item of NAV_ITEMS) {
            expect(typeof item.label).toBe('string');
            expect(item.label.trim().length).toBeGreaterThan(0);
        }
    });
});

describe('select option constants', () => {
    it('every INVESTMENT_GOALS entry has value === label', () => {
        for (const item of INVESTMENT_GOALS) {
            expect(item.value).toBe(item.label);
        }
    });

    it('every RISK_TOLERANCE_OPTIONS entry has value === label', () => {
        for (const item of RISK_TOLERANCE_OPTIONS) {
            expect(item.value).toBe(item.label);
        }
    });

    it('every PREFERRED_INDUSTRIES entry has value === label', () => {
        for (const item of PREFERRED_INDUSTRIES) {
            expect(item.value).toBe(item.label);
        }
    });

    it('every ALERT_TYPE_OPTIONS entry has non-empty value and label', () => {
        for (const item of ALERT_TYPE_OPTIONS) {
            expect(typeof item.value).toBe('string');
            expect(item.value.trim().length).toBeGreaterThan(0);
            expect(typeof item.label).toBe('string');
            expect(item.label.trim().length).toBeGreaterThan(0);
        }
    });

    it('every CONDITION_OPTIONS entry has non-empty value and label', () => {
        for (const item of CONDITION_OPTIONS) {
            expect(typeof item.value).toBe('string');
            expect(item.value.trim().length).toBeGreaterThan(0);
            expect(typeof item.label).toBe('string');
            expect(item.label.trim().length).toBeGreaterThan(0);
        }
    });
});

describe('POPULAR_STOCK_SYMBOLS', () => {
    it('has no duplicates', () => {
        expect(new Set(POPULAR_STOCK_SYMBOLS).size).toBe(POPULAR_STOCK_SYMBOLS.length);
    });

    it('every symbol matches /^[A-Z]+$/', () => {
        for (const symbol of POPULAR_STOCK_SYMBOLS) {
            expect(symbol).toMatch(/^[A-Z]+$/);
        }
    });
});

describe('WATCHLIST_TABLE_HEADER', () => {
    it("has 8 entries starting 'Company' and ending 'Action'", () => {
        expect(WATCHLIST_TABLE_HEADER).toHaveLength(8);
        expect(WATCHLIST_TABLE_HEADER[0]).toBe('Company');
        expect(WATCHLIST_TABLE_HEADER[WATCHLIST_TABLE_HEADER.length - 1]).toBe('Action');
    });
});

describe('symbol-config factories', () => {
    const factories = [
        { name: 'SYMBOL_INFO_WIDGET_CONFIG', fn: SYMBOL_INFO_WIDGET_CONFIG },
        { name: 'CANDLE_CHART_WIDGET_CONFIG', fn: CANDLE_CHART_WIDGET_CONFIG },
        { name: 'BASELINE_WIDGET_CONFIG', fn: BASELINE_WIDGET_CONFIG },
        { name: 'TECHNICAL_ANALYSIS_WIDGET_CONFIG', fn: TECHNICAL_ANALYSIS_WIDGET_CONFIG },
    ] as const;

    for (const { name, fn } of factories) {
        it(`${name} uppercases the symbol passed in and leaves the caller's string unchanged`, () => {
            const input = 'zeta';
            const original = input;
            const config = fn(input);

            expect(config.symbol).toBe('ZETA');
            expect(input).toBe(original);
        });
    }
});

describe('MARKET_OVERVIEW_WIDGET_CONFIG', () => {
    it('each tab has at least one symbol of the form EXCHANGE:TICKER', () => {
        expect(MARKET_OVERVIEW_WIDGET_CONFIG.tabs.length).toBeGreaterThan(0);
        for (const tab of MARKET_OVERVIEW_WIDGET_CONFIG.tabs) {
            expect(tab.symbols.length).toBeGreaterThan(0);
            const hasExchangeTicker = tab.symbols.some((sym) =>
                /^[A-Z]+:[A-Z.]+$/.test(sym.s)
            );
            expect(hasExchangeTicker).toBe(true);
        }
    });
});
