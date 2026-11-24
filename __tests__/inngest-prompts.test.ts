import { describe, expect, it } from "vitest";
import {
  NEWS_SUMMARY_EMAIL_PROMPT,
  PERSONALIZED_WELCOME_EMAIL_PROMPT,
  TRADINGVIEW_SYMBOL_MAPPING_PROMPT,
} from "@/lib/inngest/prompts";

const PROMPTS = [
  {
    name: "PERSONALIZED_WELCOME_EMAIL_PROMPT",
    value: PERSONALIZED_WELCOME_EMAIL_PROMPT,
    placeholders: ["{{intro}}", "{{userProfile}}"],
    instruction: /write exactly two sentences/i,
    noMarkdown: true,
  },
  {
    name: "NEWS_SUMMARY_EMAIL_PROMPT",
    value: NEWS_SUMMARY_EMAIL_PROMPT,
    placeholders: ["{{newsContent}}", "{{newsData}}"],
    instruction: /minimum 3 concise bullet points/i,
    noMarkdown: true,
  },
  {
    name: "TRADINGVIEW_SYMBOL_MAPPING_PROMPT",
    value: TRADINGVIEW_SYMBOL_MAPPING_PROMPT,
    placeholders: [
      "{{symbol}}",
      "{{company}}",
      "{{exchange}}",
      "{{currency}}",
      "{{country}}",
    ],
    instruction: /your response must be valid json only/i,
    noMarkdown: false,
  },
] as const;

describe("inngest prompt exports", () => {
  for (const prompt of PROMPTS) {
    describe(prompt.name, () => {
      it("is a non-empty string", () => {
        expect(typeof prompt.value).toBe("string");
        expect(prompt.value.trim().length).toBeGreaterThan(0);
      });

      it("contains every required placeholder token", () => {
        for (const token of prompt.placeholders) {
          expect(prompt.value).toContain(token);
        }
      });

      it("has no triple-backtick fences and enforces no-markdown format", () => {
        expect(prompt.value).not.toContain("```");
        if (prompt.noMarkdown) {
          expect(prompt.value).toMatch(/no markdown, no code blocks, no backticks/i);
        }
      });

      it("contains a required instruction", () => {
        expect(prompt.value).toMatch(prompt.instruction);
      });
    });
  }
});
