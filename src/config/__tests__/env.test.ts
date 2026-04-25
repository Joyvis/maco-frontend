import { envSchema } from "../env.schema";

describe("env schema validation", () => {
  it("accepts valid env vars", () => {
    const result = envSchema.safeParse({
      NEXT_PUBLIC_API_URL: "http://localhost:8000",
      NEXT_PUBLIC_APP_NAME: "Maco",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.NEXT_PUBLIC_API_URL).toBe("http://localhost:8000");
      expect(result.data.NEXT_PUBLIC_APP_NAME).toBe("Maco");
    }
  });

  it("rejects an invalid API URL", () => {
    const result = envSchema.safeParse({
      NEXT_PUBLIC_API_URL: "not-a-url",
      NEXT_PUBLIC_APP_NAME: "Maco",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.NEXT_PUBLIC_API_URL).toBeDefined();
    }
  });

  it("rejects a missing APP_NAME", () => {
    const result = envSchema.safeParse({
      NEXT_PUBLIC_API_URL: "http://localhost:8000",
      NEXT_PUBLIC_APP_NAME: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.NEXT_PUBLIC_APP_NAME).toBeDefined();
    }
  });

  it("rejects missing required fields", () => {
    const result = envSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.NEXT_PUBLIC_API_URL).toBeDefined();
      expect(errors.NEXT_PUBLIC_APP_NAME).toBeDefined();
    }
  });
});
