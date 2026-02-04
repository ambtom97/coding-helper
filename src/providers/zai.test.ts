import { beforeEach, describe, expect, it } from "bun:test";
import { ZAIProvider, zaiProvider } from "./zai";

describe("ZAIProvider", () => {
  let provider: ZAIProvider;

  beforeEach(() => {
    provider = new ZAIProvider();
  });

  describe("name", () => {
    it("should have name 'zai'", () => {
      expect(provider.name).toBe("zai");
    });
  });

  describe("displayName", () => {
    it("should have displayName 'Z.AI (GLM)'", () => {
      expect(provider.displayName).toBe("Z.AI (GLM)");
    });
  });

  describe("getConfig", () => {
    it("should return provider config", () => {
      const config = provider.getConfig();

      expect(config).toHaveProperty("apiKey");
      expect(config).toHaveProperty("baseUrl");
      expect(config).toHaveProperty("defaultModel");
      expect(config).toHaveProperty("models");
    });

    it("should use environment variables if set", () => {
      const originalApiKey = process.env.ZAI_API_KEY;
      const originalBaseUrl = process.env.ZAI_BASE_URL;

      process.env.ZAI_API_KEY = "test-api-key";
      process.env.ZAI_BASE_URL = "https://custom.api.url";

      const config = provider.getConfig();
      expect(config.apiKey).toBe("test-api-key");
      expect(config.baseUrl).toBe("https://custom.api.url");

      // Restore
      if (originalApiKey !== undefined) {
        process.env.ZAI_API_KEY = originalApiKey;
      } else {
        process.env.ZAI_API_KEY = undefined;
      }
      if (originalBaseUrl !== undefined) {
        process.env.ZAI_BASE_URL = originalBaseUrl;
      } else {
        process.env.ZAI_BASE_URL = undefined;
      }
    });

    it("should have default baseUrl", () => {
      const config = provider.getConfig();
      expect(config.baseUrl).toContain("api.z.ai");
    });

    it("should have default model", () => {
      const config = provider.getConfig();
      expect(config.defaultModel).toBe("GLM-4.7");
    });

    it("should include all GLM models", () => {
      const config = provider.getConfig();
      expect(config.models).toContain("GLM-4.7");
      expect(config.models).toContain("GLM-4.5-Air");
    });
  });

  describe("getModels", () => {
    it("should return list of GLM models", () => {
      const models = provider.getModels();
      expect(Array.isArray(models)).toBe(true);
      expect(models).toContain("GLM-4.7");
      expect(models).toContain("GLM-4.5-Air");
    });
  });

  describe("getDefaultModel", () => {
    it("should return GLM-4.7 for opus", () => {
      expect(provider.getDefaultModel("opus")).toBe("GLM-4.7");
    });

    it("should return GLM-4.7 for sonnet", () => {
      expect(provider.getDefaultModel("sonnet")).toBe("GLM-4.7");
    });

    it("should return GLM-4.5-Air for haiku", () => {
      expect(provider.getDefaultModel("haiku")).toBe("GLM-4.5-Air");
    });
  });

  describe("getModelMapping", () => {
    it("should return model mapping", () => {
      const mapping = provider.getModelMapping();

      expect(mapping).toHaveProperty("opus");
      expect(mapping).toHaveProperty("sonnet");
      expect(mapping).toHaveProperty("haiku");
      expect(mapping.opus).toBe("GLM-4.7");
      expect(mapping.sonnet).toBe("GLM-4.7");
      expect(mapping.haiku).toBe("GLM-4.5-Air");
    });
  });

  describe("testConnection", () => {
    it("should return false when api key is not set", async () => {
      process.env.ZAI_API_KEY = undefined;
      const result = await provider.testConnection();
      expect(result).toBe(false);
    });

    it("should handle fetch errors gracefully", async () => {
      process.env.ZAI_API_KEY = "test-key";
      // Mock fetch to throw an error
      const originalFetch = globalThis.fetch;
      globalThis.fetch = (() => {
        throw new Error("Network error");
      }) as unknown as typeof fetch;

      const result = await provider.testConnection();
      expect(result).toBe(false);

      globalThis.fetch = originalFetch;
    });

    it("should return true when Anthropic SDK messages.create succeeds", async () => {
      process.env.ZAI_API_KEY = "test-key";

      const mockMessageResponse = {
        id: "msg_test",
        type: "message",
        role: "assistant" as const,
        content: [{ type: "text" as const, text: "Hi" }],
        model: "GLM-4.7",
        stop_reason: "end_turn" as const,
        usage: { input_tokens: 1, output_tokens: 1 },
      };

      const originalFetch = globalThis.fetch;
      globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
        const u =
          typeof input === "string"
            ? input
            : input instanceof Request
              ? input.url
              : input.toString();
        if (u.includes("v1/messages") || u.includes("/messages")) {
          return Promise.resolve(
            new Response(JSON.stringify(mockMessageResponse), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            })
          );
        }
        return originalFetch(input as RequestInfo, init);
      }) as typeof fetch;

      const result = await provider.testConnection();
      expect(result).toBe(true);

      globalThis.fetch = originalFetch;
    });
  });

  describe("getUsage", () => {
    it("should return zero stats when api key is not set", async () => {
      process.env.ZAI_API_KEY = undefined;
      const usage = await provider.getUsage();

      expect(usage.used).toBe(0);
      expect(usage.limit).toBe(0);
      expect(usage.remaining).toBe(0);
      expect(usage.percentUsed).toBe(0);
    });

    it("should handle non-ok response", async () => {
      process.env.ZAI_API_KEY = "test-key";

      const mockResponse = {
        ok: false,
        status: 500,
      };

      const originalFetch = globalThis.fetch;
      globalThis.fetch = (() =>
        Promise.resolve(
          mockResponse as unknown as Response
        )) as unknown as typeof fetch;

      const usage = await provider.getUsage();

      expect(usage.used).toBe(0);
      expect(usage.limit).toBe(0);

      globalThis.fetch = originalFetch;
    });

    it("should parse usage from Z.AI API response", async () => {
      process.env.ZAI_API_KEY = "test-key";

      const mockResponse = {
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            code: 200,
            msg: "Operation successful",
            data: {
              limits: [
                {
                  type: "TOKENS_LIMIT",
                  unit: 3,
                  number: 5,
                  usage: 40_000_000,
                  currentValue: 1_353_092,
                  remaining: 38_646_908,
                  percentage: 3,
                  nextResetTime: 1_770_016_513_934,
                },
                {
                  type: "TIME_LIMIT",
                  unit: 5,
                  number: 1,
                  usage: 100,
                  currentValue: 15,
                  remaining: 85,
                  percentage: 15,
                },
              ],
            },
            success: true,
          }),
      };

      const originalFetch = globalThis.fetch;
      globalThis.fetch = (() =>
        Promise.resolve(
          mockResponse as unknown as Response
        )) as unknown as typeof fetch;

      const usage = await provider.getUsage();

      expect(usage.used).toBe(1_353_092);
      expect(usage.limit).toBe(40_000_000);
      expect(usage.remaining).toBe(38_646_908);
      expect(usage.percentUsed).toBe(3);

      globalThis.fetch = originalFetch;
    });

    it("should handle missing TOKENS_LIMIT in response", async () => {
      process.env.ZAI_API_KEY = "test-key";

      const mockResponse = {
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            code: 200,
            msg: "Operation successful",
            data: {
              limits: [
                {
                  type: "TIME_LIMIT",
                  unit: 5,
                  number: 1,
                  usage: 100,
                  currentValue: 15,
                  remaining: 85,
                  percentage: 15,
                },
              ],
            },
            success: true,
          }),
      };

      const originalFetch = globalThis.fetch;
      globalThis.fetch = (() =>
        Promise.resolve(
          mockResponse as unknown as Response
        )) as unknown as typeof fetch;

      const usage = await provider.getUsage();

      expect(usage.used).toBe(0);
      expect(usage.limit).toBe(0);
      expect(usage.percentUsed).toBe(0);

      globalThis.fetch = originalFetch;
    });

    it("should handle missing fields in response", async () => {
      process.env.ZAI_API_KEY = "test-key";

      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      };

      const originalFetch = globalThis.fetch;
      globalThis.fetch = (() =>
        Promise.resolve(
          mockResponse as unknown as Response
        )) as unknown as typeof fetch;

      const usage = await provider.getUsage();

      expect(usage.used).toBe(0);
      expect(usage.limit).toBe(0);
      expect(usage.percentUsed).toBe(0);

      globalThis.fetch = originalFetch;
    });
  });

  describe("zaiProvider singleton", () => {
    it("should be exported as singleton instance", () => {
      expect(zaiProvider).toBeInstanceOf(ZAIProvider);
      expect(zaiProvider.name).toBe("zai");
    });
  });
});
