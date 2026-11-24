import { describe, expect, it } from 'vitest';

import {
    buildStockSentimentInsights,
    getSourceAlignment,
    normalizeSourceInsight,
    type SentimentSourceInsight,
} from '@/lib/actions/adanos.helpers';

describe('getSourceAlignment', () => {
    it("returns 'No sentiment mix' for an empty array", () => {
        expect(getSourceAlignment([])).toBe('No sentiment mix');
    });

    it("returns 'Single-source view' for one value", () => {
        expect(getSourceAlignment([55])).toBe('Single-source view');
    });

    it("returns 'Bullish alignment' when spread<=12 and average>=60", () => {
        expect(getSourceAlignment([60, 66, 72])).toBe('Bullish alignment');
    });

    it("returns 'Bearish alignment' when spread<=12 and average<=40", () => {
        expect(getSourceAlignment([34, 40, 46])).toBe('Bearish alignment');
    });

    it("returns 'Tight alignment' when spread<=12 and average is between 41 and 59", () => {
        expect(getSourceAlignment([44, 50, 56])).toBe('Tight alignment');
    });

    it("returns 'Wide divergence' when spread>=25", () => {
        expect(getSourceAlignment([20, 45])).toBe('Wide divergence');
    });

    it("returns 'Mixed' for anything else", () => {
        expect(getSourceAlignment([40, 60])).toBe('Mixed');
    });
});

describe('normalizeSourceInsight', () => {
    it('returns null for a null row', () => {
        expect(normalizeSourceInsight('reddit', null)).toBeNull();
    });

    it('returns null for an undefined row', () => {
        expect(normalizeSourceInsight('x', undefined)).toBeNull();
    });

    it('returns null for missing buzz_score', () => {
        expect(
            normalizeSourceInsight('news', {
                ticker: 'FAKE',
                mentions: 100,
                bullish_pct: 50,
            }),
        ).toBeNull();
    });

    it('returns null for non-numeric buzz_score', () => {
        expect(
            normalizeSourceInsight('reddit', {
                ticker: 'FAKE',
                buzz_score: 'high',
                mentions: 100,
            }),
        ).toBeNull();
    });

    it('returns null for missing source metric field', () => {
        expect(
            normalizeSourceInsight('x', {
                ticker: 'FAKE',
                buzz_score: 70,
                bullish_pct: 55,
            }),
        ).toBeNull();
    });

    it('returns null for non-numeric source metric field', () => {
        expect(
            normalizeSourceInsight('news', {
                ticker: 'FAKE',
                buzz_score: 70,
                mentions: 'many',
            }),
        ).toBeNull();
    });

    it('rounds buzzScore to 1 decimal and Math.round-s metricValue', () => {
        const insight = normalizeSourceInsight('reddit', {
            ticker: 'ACME',
            company_name: 'Acme Corp',
            buzz_score: 81.26,
            bullish_pct: 44.4,
            trend: 'rising',
            mentions: 647.7,
        });

        expect(insight).toMatchObject({
            source: 'reddit',
            label: 'Reddit',
            companyName: 'Acme Corp',
            buzzScore: 81.3,
            bullishPct: 44.4,
            trend: 'rising',
            metricLabel: 'Mentions',
            metricValue: 648,
        });
    });

    it('reads metric field from SOURCE_CONFIG for polymarket (trade_count)', () => {
        const insight = normalizeSourceInsight('polymarket', {
            ticker: 'FAKE',
            company_name: 'Fake Markets Inc',
            buzz_score: 55.74,
            bullish_pct: 72,
            trend: 'stable',
            trade_count: 3731.2,
            mentions: 9999, // should not be used
        });

        expect(insight).toMatchObject({
            source: 'polymarket',
            label: 'Polymarket',
            metricLabel: 'Trades',
            metricValue: 3731,
            buzzScore: 55.7,
        });
    });

    it('reads metric field from SOURCE_CONFIG for non-polymarket sources (mentions)', () => {
        const reddit = normalizeSourceInsight('reddit', {
            ticker: 'ZZZZ',
            buzz_score: 10,
            mentions: 42,
        });
        const x = normalizeSourceInsight('x', {
            ticker: 'ZZZZ',
            buzz_score: 20,
            mentions: 84,
        });
        const news = normalizeSourceInsight('news', {
            ticker: 'ZZZZ',
            buzz_score: 30,
            mentions: 126,
        });

        expect(reddit).toMatchObject({ metricLabel: 'Mentions', metricValue: 42 });
        expect(x).toMatchObject({ metricLabel: 'Mentions', metricValue: 84 });
        expect(news).toMatchObject({ metricLabel: 'Mentions', metricValue: 126 });
    });
});

describe('buildStockSentimentInsights', () => {
    it('returns null when every source is null', () => {
        expect(buildStockSentimentInsights('FAKE', [null, null, null, null])).toBeNull();
    });

    it('uppercases the symbol, averages buzz to 1 decimal, and counts availableSources', () => {
        const sources: Array<SentimentSourceInsight | null> = [
            {
                source: 'reddit',
                label: 'Reddit',
                companyName: 'Fictional Labs',
                buzzScore: 70.1,
                bullishPct: 60,
                trend: 'rising',
                metricLabel: 'Mentions',
                metricValue: 100,
            },
            null,
            {
                source: 'news',
                label: 'News',
                companyName: 'Fictional Labs',
                buzzScore: 80.2,
                bullishPct: 64,
                trend: 'stable',
                metricLabel: 'Mentions',
                metricValue: 200,
            },
        ];

        const insight = buildStockSentimentInsights('flab', sources);

        expect(insight).not.toBeNull();
        expect(insight?.symbol).toBe('FLAB');
        expect(insight?.averageBuzz).toBe(75.2);
        expect(insight?.availableSources).toBe(2);
        expect(insight?.sources).toHaveLength(2);
    });

    it('excludes null bullishPct from bullishAverage and returns null when none', () => {
        const sources: Array<SentimentSourceInsight | null> = [
            {
                source: 'reddit',
                label: 'Reddit',
                companyName: 'Nullish Co',
                buzzScore: 50,
                bullishPct: null,
                trend: 'stable',
                metricLabel: 'Mentions',
                metricValue: 10,
            },
            {
                source: 'x',
                label: 'X.com',
                companyName: 'Nullish Co',
                buzzScore: 60,
                bullishPct: null,
                trend: 'rising',
                metricLabel: 'Mentions',
                metricValue: 20,
            },
        ];

        const insight = buildStockSentimentInsights('NULL', sources);

        expect(insight).not.toBeNull();
        expect(insight?.bullishAverage).toBeNull();
        // With no bullish values, alignment should be "No sentiment mix"
        expect(insight?.sourceAlignment).toBe('No sentiment mix');
    });

    it('computes bullishAverage from available bullishPct values only', () => {
        const sources: Array<SentimentSourceInsight | null> = [
            {
                source: 'reddit',
                label: 'Reddit',
                companyName: 'Mixed Bull Inc',
                buzzScore: 40,
                bullishPct: 30,
                trend: 'falling',
                metricLabel: 'Mentions',
                metricValue: 10,
            },
            {
                source: 'x',
                label: 'X.com',
                companyName: 'Mixed Bull Inc',
                buzzScore: 50,
                bullishPct: null,
                trend: 'stable',
                metricLabel: 'Mentions',
                metricValue: 20,
            },
            {
                source: 'news',
                label: 'News',
                companyName: 'Mixed Bull Inc',
                buzzScore: 60,
                bullishPct: 50,
                trend: 'rising',
                metricLabel: 'Mentions',
                metricValue: 30,
            },
        ];

        const insight = buildStockSentimentInsights('MBUL', sources);

        expect(insight).not.toBeNull();
        expect(insight?.bullishAverage).toBe(40);
        expect(insight?.availableSources).toBe(3);
    });

    it('takes the first non-null companyName', () => {
        const sources: Array<SentimentSourceInsight | null> = [
            {
                source: 'reddit',
                label: 'Reddit',
                companyName: null,
                buzzScore: 55,
                bullishPct: 50,
                trend: 'stable',
                metricLabel: 'Mentions',
                metricValue: 5,
            },
            {
                source: 'x',
                label: 'X.com',
                companyName: 'Second Name Corp',
                buzzScore: 65,
                bullishPct: 52,
                trend: 'stable',
                metricLabel: 'Mentions',
                metricValue: 15,
            },
            {
                source: 'news',
                label: 'News',
                companyName: 'Third Name Corp',
                buzzScore: 75,
                bullishPct: 54,
                trend: 'stable',
                metricLabel: 'Mentions',
                metricValue: 25,
            },
        ];

        const insight = buildStockSentimentInsights('NAME', sources);

        expect(insight).not.toBeNull();
        expect(insight?.companyName).toBe('Second Name Corp');
    });
});
