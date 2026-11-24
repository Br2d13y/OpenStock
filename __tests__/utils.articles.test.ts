import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    getDateRange,
    getTodayDateRange,
    validateArticle,
    formatArticle,
} from '@/lib/utils';

describe('article/date utils', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-03-15T12:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('getDateRange', () => {
        it('returns to "2026-03-15" and from "2026-03-08" for 7 days', () => {
            const range = getDateRange(7);
            expect(range.to).toBe('2026-03-15');
            expect(range.from).toBe('2026-03-08');
        });

        it('returns the same date for to and from when days is 0', () => {
            const range = getDateRange(0);
            expect(range.to).toBe('2026-03-15');
            expect(range.from).toBe('2026-03-15');
        });

        it('returns plain YYYY-MM-DD strings', () => {
            const range = getDateRange(7);
            expect(range.to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(range.from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });
    });

    describe('getTodayDateRange', () => {
        it('returns to === from === "2026-03-15"', () => {
            const range = getTodayDateRange();
            expect(range.to).toBe('2026-03-15');
            expect(range.from).toBe('2026-03-15');
            expect(range.to).toBe(range.from);
        });

        it('returns plain YYYY-MM-DD strings', () => {
            const range = getTodayDateRange();
            expect(range.to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(range.from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });
    });

    describe('validateArticle', () => {
        const validArticle = {
            id: 1,
            headline: 'Fictional Company Announces Widget Launch',
            summary: 'A fictional company announced a new widget product line.',
            url: 'https://example.com/articles/widget-launch',
            datetime: 1710504000,
        };

        it('returns a truthy value when headline, summary, url and datetime are all present', () => {
            expect(validateArticle(validArticle)).toBeTruthy();
        });

        it('is falsy when headline is missing', () => {
            const { headline, ...rest } = validArticle;
            expect(validateArticle(rest)).toBeFalsy();
        });

        it('is falsy when headline is empty', () => {
            expect(validateArticle({ ...validArticle, headline: '' })).toBeFalsy();
        });

        it('is falsy when summary is missing', () => {
            const { summary, ...rest } = validArticle;
            expect(validateArticle(rest)).toBeFalsy();
        });

        it('is falsy when summary is empty', () => {
            expect(validateArticle({ ...validArticle, summary: '' })).toBeFalsy();
        });

        it('is falsy when url is missing', () => {
            const { url, ...rest } = validArticle;
            expect(validateArticle(rest)).toBeFalsy();
        });

        it('is falsy when url is empty', () => {
            expect(validateArticle({ ...validArticle, url: '' })).toBeFalsy();
        });

        it('is falsy when datetime is missing', () => {
            const { datetime, ...rest } = validArticle;
            expect(validateArticle(rest)).toBeFalsy();
        });
    });

    describe('formatArticle', () => {
        const baseArticle = {
            id: 42,
            headline: '  Fictional Markets Rally on Placeholder Data  ',
            summary: '  Analysts at Example Corp noted fictional gains across sectors.  ',
            url: 'https://example.com/articles/fictional-rally',
            datetime: 1710504000,
            image: 'https://example.com/images/rally.png',
            category: 'markets',
            related: 'FAKE1',
            source: 'Example Wire',
        };

        it('formats company news with category company, related to symbol, and Company News default source', () => {
            const articleWithoutSource = { ...baseArticle, source: undefined };
            const formatted = formatArticle(articleWithoutSource, true, 'ACME');

            expect(formatted.category).toBe('company');
            expect(formatted.related).toBe('ACME');
            expect(formatted.source).toBe('Company News');
        });

        it('truncates company news summary to 200 characters plus "..." and trims headline/summary', () => {
            const longSummary = 'S'.repeat(250);
            const formatted = formatArticle(
                { ...baseArticle, summary: `  ${longSummary}  ` },
                true,
                'ACME'
            );

            expect(formatted.headline).toBe('Fictional Markets Rally on Placeholder Data');
            expect(formatted.summary).toBe('S'.repeat(200) + '...');
            expect(formatted.summary.length).toBe(203);
        });

        it('formats market news with article category or general, related to article.related or empty, and Market News default source', () => {
            const withCategory = formatArticle({ ...baseArticle, source: undefined }, false);
            expect(withCategory.category).toBe('markets');
            expect(withCategory.related).toBe('FAKE1');
            expect(withCategory.source).toBe('Market News');

            const withoutCategoryOrRelated = formatArticle(
                {
                    ...baseArticle,
                    category: undefined,
                    related: undefined,
                    source: undefined,
                },
                false
            );
            expect(withoutCategoryOrRelated.category).toBe('general');
            expect(withoutCategoryOrRelated.related).toBe('');
            expect(withoutCategoryOrRelated.source).toBe('Market News');
        });

        it('truncates market news summary to 150 characters plus "..."', () => {
            const longSummary = 'M'.repeat(180);
            const formatted = formatArticle({ ...baseArticle, summary: longSummary }, false);

            expect(formatted.summary).toBe('M'.repeat(150) + '...');
            expect(formatted.summary.length).toBe(153);
        });

        it('falls back to empty string for image when absent', () => {
            const formatted = formatArticle({ ...baseArticle, image: undefined }, false);
            expect(formatted.image).toBe('');
        });
    });
});
