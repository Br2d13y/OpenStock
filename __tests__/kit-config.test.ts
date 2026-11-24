import { describe, it, expect, vi, afterEach } from "vitest";
import { kit } from "@/lib/kit";

describe("kit.addSubscriber", () => {
  const originalKey = process.env.KIT_API_KEY;
  const originalSecret = process.env.KIT_API_SECRET;
  const originalFormId = process.env.KIT_WELCOME_FORM_ID;

  afterEach(() => {
    if (originalKey === undefined) delete process.env.KIT_API_KEY;
    else process.env.KIT_API_KEY = originalKey;
    if (originalSecret === undefined) delete process.env.KIT_API_SECRET;
    else process.env.KIT_API_SECRET = originalSecret;
    if (originalFormId === undefined) delete process.env.KIT_WELCOME_FORM_ID;
    else process.env.KIT_WELCOME_FORM_ID = originalFormId;
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("rejects with documented config error when KIT_API_KEY or KIT_API_SECRET is missing", async () => {
    vi.stubEnv("KIT_API_KEY", "");
    delete process.env.KIT_API_KEY;
    vi.stubEnv("KIT_API_SECRET", "test-secret-123");

    await expect(
      kit.addSubscriber("user@example.com", "Test")
    ).rejects.toThrow(
      "KIT_API_KEY or KIT_API_SECRET is not defined in environment variables."
    );
  });

  it("resolves to undefined without calling fetch when both keys set but no form id", async () => {
    vi.stubEnv("KIT_API_KEY", "test-key-123");
    vi.stubEnv("KIT_API_SECRET", "test-secret-123");
    delete process.env.KIT_WELCOME_FORM_ID;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await kit.addSubscriber("user@example.com", "Test");

    expect(result).toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("calls fetch with URL containing explicit formId and method POST", async () => {
    vi.stubEnv("KIT_API_KEY", "test-key-123");
    vi.stubEnv("KIT_API_SECRET", "test-secret-123");
    delete process.env.KIT_WELCOME_FORM_ID;
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ subscription: { id: 1 } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await kit.addSubscriber("user@example.com", "Test", undefined, "form-456");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("form-456");
    expect(options.method).toBe("POST");
  });

  it("surfaces non-ok response error as a rejection", async () => {
    vi.stubEnv("KIT_API_KEY", "test-key-123");
    vi.stubEnv("KIT_API_SECRET", "test-secret-123");
    vi.stubEnv("KIT_WELCOME_FORM_ID", "form-789");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: "bad request" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      kit.addSubscriber("user@example.com", "Test")
    ).rejects.toThrow(JSON.stringify({ message: "bad request" }));

    errorSpy.mockRestore();
  });
});
