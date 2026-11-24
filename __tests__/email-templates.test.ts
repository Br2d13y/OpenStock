import { describe, it, expect } from 'vitest';
import {
  WELCOME_EMAIL_TEMPLATE,
  NEWS_SUMMARY_EMAIL_TEMPLATE,
  STOCK_ALERT_UPPER_EMAIL_TEMPLATE,
  STOCK_ALERT_LOWER_EMAIL_TEMPLATE,
  VOLUME_ALERT_EMAIL_TEMPLATE,
  INACTIVE_USER_REMINDER_EMAIL_TEMPLATE,
} from '../lib/nodemailer/templates';

// Placeholder tokens verified from lib/nodemailer/templates.ts and lib/nodemailer/index.ts.
// index.ts currently substitutes: welcome(name,intro), news(date,newsContent).
// Other templates define tokens for alert/reminder senders; we assert only tokens present in each template.
const TEMPLATE_CASES = [
  {
    name: 'WELCOME_EMAIL_TEMPLATE',
    template: WELCOME_EMAIL_TEMPLATE,
    expectedTokens: ['intro', 'name'],
  },
  {
    name: 'NEWS_SUMMARY_EMAIL_TEMPLATE',
    template: NEWS_SUMMARY_EMAIL_TEMPLATE,
    expectedTokens: ['date', 'newsContent'],
  },
  {
    name: 'STOCK_ALERT_UPPER_EMAIL_TEMPLATE',
    template: STOCK_ALERT_UPPER_EMAIL_TEMPLATE,
    expectedTokens: ['company', 'currentPrice', 'symbol', 'targetPrice', 'timestamp'],
  },
  {
    name: 'STOCK_ALERT_LOWER_EMAIL_TEMPLATE',
    template: STOCK_ALERT_LOWER_EMAIL_TEMPLATE,
    expectedTokens: ['company', 'currentPrice', 'symbol', 'targetPrice', 'timestamp'],
  },
  {
    name: 'VOLUME_ALERT_EMAIL_TEMPLATE',
    template: VOLUME_ALERT_EMAIL_TEMPLATE,
    expectedTokens: [
      'alertMessage',
      'averageVolume',
      'changeDirection',
      'changePercent',
      'company',
      'currentPrice',
      'currentVolume',
      'priceColor',
      'symbol',
      'timestamp',
      'volumeSpike',
    ],
  },
  {
    name: 'INACTIVE_USER_REMINDER_EMAIL_TEMPLATE',
    template: INACTIVE_USER_REMINDER_EMAIL_TEMPLATE,
    expectedTokens: ['name'],
  },
] as const;

// Allowlist derived from placeholders present in lib/nodemailer/templates.ts (source of truth)
// and substituted by sending code in lib/nodemailer/index.ts where applicable.
const ALLOWED_TOKENS = new Set([
  'alertMessage',
  'averageVolume',
  'changeDirection',
  'changePercent',
  'company',
  'currentPrice',
  'currentVolume',
  'date',
  'intro',
  'name',
  'newsContent',
  'priceColor',
  'symbol',
  'targetPrice',
  'timestamp',
  'volumeSpike',
]);

const DOUBLE_BRACE_TOKEN_RE = /\{\{(\w+)\}\}/g;
const EMAIL_ADDRESS_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

function collectTokens(template: string): string[] {
  return Array.from(template.matchAll(DOUBLE_BRACE_TOKEN_RE), (m) => m[1]);
}

describe('email templates', () => {
  it('exports all six templates', () => {
    expect(TEMPLATE_CASES).toHaveLength(6);
  });

  for (const { name, template, expectedTokens } of TEMPLATE_CASES) {
    describe(name, () => {
      it('is a non-empty string starting with <!DOCTYPE html>', () => {
        expect(typeof template).toBe('string');
        expect(template.length).toBeGreaterThan(0);
        expect(template.startsWith('<!DOCTYPE html>')).toBe(true);
      });

      it('contains every placeholder token used by this template', () => {
        for (const token of expectedTokens) {
          expect(template).toContain(`{{${token}}}`);
        }
        const collected = new Set(collectTokens(template));
        expect([...collected].sort()).toEqual([...expectedTokens].sort());
      });

      it('contains dark-mode media query prefers-color-scheme: dark', () => {
        expect(template).toContain('prefers-color-scheme: dark');
      });

      it('has only allowlisted double-brace placeholders', () => {
        const tokens = collectTokens(template);
        expect(tokens.length).toBeGreaterThan(0);
        for (const token of tokens) {
          expect(ALLOWED_TOKENS.has(token), `unknown token: ${token}`).toBe(true);
        }
      });

      it('contains no hardcoded recipient email address', () => {
        const matches = template.match(EMAIL_ADDRESS_RE) ?? [];
        // No real recipient addresses are hardcoded in templates; if a future fictional
        // example.invalid address appears, it should be the only allowed exception.
        const disallowed = matches.filter((addr) => !addr.toLowerCase().endsWith('@example.invalid'));
        expect(disallowed).toEqual([]);
      });
    });
  }
});
