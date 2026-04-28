import { describe, test, expect } from "bun:test";
import { helloWorld } from "./hello";

describe("helloWorld", () => {
  test("returns 'Hello, World!'", () => {
    const result = helloWorld();
    expect(result).toBe("Hello, World!");
  });

  test("function is exported", () => {
    expect(typeof helloWorld).toBe("function");
  });

  test("return type is string", () => {
    const result = helloWorld();
    expect(typeof result).toBe("string");
    expect(result).toBeInstanceOf(String);
  });
});
