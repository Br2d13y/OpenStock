import { describe, it, expect } from 'vitest';
import {
  formatNumber,
  formatArticle,
  validateArticle,
  getAlertText,
  formatPrice,
  formatCurrency,
  getDateRange,
} from '../lib/utils';

type RawNewsArticle = {
  id: number;
  headline?: string;
  summary?: string;
  source?: string;
  url?: string;
  datetime?: number;
  image?: string;
  category?: string;
  related?: string;
};

type Alert = {
  id: string;
  symbol: string;
  company: string;
  alertName: string;
  currentPrice: number | string;
  alertType: 'upper' | 'lower';
  threshold: number;
  changePercent?: number;
};

describe('utils-format', () => {
  it('formatNumber multiplies by 1e6 then applies T/B/M/K suffixes', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(1)).toBe('1.00M');
    expect(formatNumber(0.001)).toBe('1.00K');
    expect(formatNumber(1000)).toBe('1.00B');
    expect(formatNumber(1000000)).toBe('1.00T');
    expect(formatNumber(1500000)).toBe('1.50T');
  });

  it('formatArticle trims fields, truncates summaries, and applies company/market defaults', () => {
    const baseDate = 1700000000;
    const longCompanySummary = '  ' + 'C'.repeat(220) + '  ';
    const companyArticle: RawNewsArticle = {
      id: 1,
      headline: '  ZZZZ headline  ',
      summary: longCompanySummary,
      url: 'https://example.invalid/a',
      datetime: baseDate,
      image: 'https://example.invalid/img.png',
      category: 'tech',
      related: 'OTHER',
      source: '',
    };

    const formattedCompany = formatArticle(companyArticle, true, 'ZZZZ', 0);
    expect(formattedCompany.headline).toBe('ZZZZ headline');
    // company branch truncates to 200 chars of trimmed summary, then appends '...'
    expect(formattedCompany.summary).toBe('C'.repeat(200) + '...');
    expect(formattedCompany.source).toBe('Company News');
    expect(formattedCompany.category).toBe('company');
    expect(formattedCompany.related).toBe('ZZZZ');
    expect(formattedCompany.url).toBe('https://example.invalid/a');
    expect(formattedCompany.datetime).toBe(baseDate);
    expect(formattedCompany.image).toBe('https://example.invalid/img.png');

    const longMarketSummary = '  ' + 'M'.repeat(170) + '  ';
    const marketArticle: RawNewsArticle = {
      id: 2,
      headline: '  Market headline  ',
      summary: longMarketSummary,
      url: 'https://example.invalid/b',
      datetime: baseDate + 1,
      source: '',
      image: '',
      category: 'general',
      related: 'ZZZZ',
    };

    const formattedMarket = formatArticle(marketArticle, false, undefined, 1);
    expect(formattedMarket.headline).toBe('Market headline');
    // market branch truncates to 150 chars of trimmed summary, then appends '...'
    expect(formattedMarket.summary).toBe('M'.repeat(150) + '...');
    expect(formattedMarket.source).toBe('Market News');
    expect(formattedMarket.category).toBe('general');
    expect(formattedMarket.related).toBe('ZZZZ');
  });

  it('validateArticle returns falsy when required fields missing and truthy when present', () => {
    const valid: RawNewsArticle = {
      id: 3,
      headline: 'h',
      summary: 's',
      url: 'https://example.invalid/c',
      datetime: 1700000002,
    };
    expect(validateArticle(valid)).toBeTruthy();

    expect(validateArticle({ ...valid, headline: '' } as RawNewsArticle)).toBeFalsy();
    expect(validateArticle({ ...valid, summary: '' } as RawNewsArticle)).toBeFalsy();
    expect(validateArticle({ ...valid, url: '' } as RawNewsArticle)).toBeFalsy();
    expect(validateArticle({ ...valid, datetime: 0 } as RawNewsArticle)).toBeFalsy();
  });

  it('getAlertText uses Price > for upper and Price < for lower with formatted USD threshold', () => {
    const upperAlert: Alert = {
      id: '1',
      symbol: 'ZZZZ',
      company: 'Fictional Co',
      alertName: 'Upper',
      currentPrice: 100,
      alertType: 'upper',
      threshold: 123.4,
    };
    expect(getAlertText(upperAlert as any)).toBe('Price > $123.40');

    const lowerAlert: Alert = {
      id: '2',
      symbol: 'ZZZZ',
      company: 'Fictional Co',
      alertName: 'Lower',
      currentPrice: 100,
      alertType: 'lower',
      threshold: 55.5,
    };
    expect(getAlertText(lowerAlert as any)).toBe('Price < $55.50');
  });

  it('formatPrice formats as USD currency with two fraction digits', () => {
    expect(formatPrice(12.3)).toBe('$12.30');
    expect(formatPrice(0)).toBe('$0.00');
    expect(formatPrice(1234.5)).toBe('$1,234.50');
  });

  it('formatCurrency formats as USD currency with two fraction digits', () => {
    expect(formatCurrency(12.3)).toBe('$12.30');
    expect(formatCurrency(0)).toBe('$0.00');
    expect(formatCurrency(1234.5)).toBe('$1,234.50');
  });

  it('getDateRange returns YYYY-MM-DD {to,from} spanning n days', () => {
    const n = 7;
    const r = getDateRange(n);
    const isoRe = /^\d{4}-\d{2}-\d{2}$/;
    expect(isoRe.test(r.to)).toBe(true);
    expect(isoRe.test(r.from)).toBe(true);

    const to = new Date(r.to);
    const from = new Date(r.from);
    const diffMs = to.getTime() - from.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(n);
    expect(from.getTime()).toBeLessThanOrEqual(to.getTime());
  });
});
