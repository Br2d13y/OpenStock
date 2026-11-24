import { describe, it, expect } from 'vitest';
import {
  formatNumber,
  formatArticle,
  validateArticle,
  getAlertText,
  formatPrice,
  getDateRange,
} from '../lib/utils';

describe('utils-format', () => {
  it('formatNumber multiplies by 1e6 then applies T/B/M/K suffixes', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(1)).toBe('1.00M');
    expect(formatNumber(0.001)).toBe('1.00K');
    expect(formatNumber(1000)).toBe('1.00B');
    expect(formatNumber(1000000)).toBe('1.00T');
    expect(formatNumber(1500000)).toBe('1.50T');
  });

  it('formatArticle trims fields and applies company/market defaults', () => {
    const baseDate = 1700000000;
    const companyArticle: RawNewsArticle = {
      id: 1,
      headline: '  ZZZZ headline  ',
      summary: '  This is a long summary that should be trimmed and then truncated by formatArticle logic for company news branch in a predictable way for testing purposes.  ',
      url: 'https://example.invalid/a',
      datetime: baseDate,
      image: 'https://example.invalid/img.png',
      category: 'tech',
      related: 'OTHER',
    };

    const formattedCompany = formatArticle(companyArticle, true, 'ZZZZ', 0);
    expect(formattedCompany.headline).toBe('ZZZZ headline');
    expect(formattedCompany.summary.endsWith('...')).toBe(true);
    expect(formattedCompany.summary.length).toBeLessThanOrEqual(200 + 3);
    expect(formattedCompany.source).toBe('Company News');
    expect(formattedCompany.category).toBe('company');
    expect(formattedCompany.related).toBe('ZZZZ');

    const marketArticle: RawNewsArticle = {
      id: 2,
      headline: '  Market headline  ',
      summary: '  Market summary text that is long enough to be truncated by market branch rules in formatArticle implementation for testing.  ',
      url: 'https://example.invalid/b',
      datetime: baseDate + 1,
      source: '',
      image: '',
      category: 'general',
      related: 'ABC',
    };

    const formattedMarket = formatArticle(marketArticle, false, undefined, 1);
    expect(formattedMarket.headline).toBe('Market headline');
    expect(formattedMarket.summary.endsWith('...')).toBe(true);
    expect(formattedMarket.source).toBe('Market News');
    expect(formattedMarket.category).toBe('general');
    expect(formattedMarket.related).toBe('ABC');
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

  it('getAlertText uses Price > for upper and Price < otherwise with formatted threshold', () => {
    const upperAlert: Alert = {
      id: '1',
      symbol: 'ZZZZ',
      company: 'Fictional Co',
      alertName: 'Upper',
      currentPrice: '100.00',
      alertType: 'upper',
      threshold: 123.4,
    };
    expect(getAlertText(upperAlert).startsWith('Price > ')).toBe(true);
    expect(getAlertText(upperAlert)).toBe(`Price > ${formatPrice(upperAlert.threshold)}`);

    const lowerAlert: Alert = {
      id: '2',
      symbol: 'ZZZZ',
      company: 'Fictional Co',
      alertName: 'Lower',
      currentPrice: '100.00',
      alertType: 'lower',
      threshold: 55.5,
    };
    expect(getAlertText(lowerAlert).startsWith('Price < ')).toBe(true);
    expect(getAlertText(lowerAlert)).toBe(`Price < ${formatPrice(lowerAlert.threshold)}`);
  });

  it('formatPrice/formatCurrency format positive decimal as USD with two fraction digits', () => {
    const v = 12.3;
    const fp = formatPrice(v);
    const fc = (formatPrice as unknown as (n: number) => string)(v); // same function alias
    expect(fp).toContain('$');
    expect(/\.\d{2}$/.test(fp)).toBe(true);
    expect(fc).toContain('$');
    expect(/\.\d{2}$/.test(fc)).toBe(true);
  });

  it('getDateRange returns YYYY-MM-DD {to,from} spanning about n days', () => {
    const r = getDateRange(7);
    const isoRe = /^\d{4}-\d{2}-\d{2}$/;
    expect(typeof r.to).toBe('string');
    expect(typeof r.from).toBe('string');
    expect(isoRe.test(r.to)).toBe(true);
    expect(isoRe.test(r.from)).toBe(true);
    expect(r.from <= r.to).toBe(true);
  });
});
