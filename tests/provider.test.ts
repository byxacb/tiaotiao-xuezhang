import { describe, expect, it } from "vitest";
import { mockProvider } from "../server/services/mockProvider";

describe("mockProvider", () => {
  it("keeps quiz answer inside options", async () => {
    const result = await mockProvider.chat({
      mode: "explore",
      message: "世界上最大的海是什么？"
    });

    expect(result.quiz).toBeTruthy();
    expect(result.quiz?.options).toContain(result.quiz?.answer);
    expect(new Set(result.quiz?.options).size).toBe(result.quiz?.options.length);
  });

  it("returns non-scoring vision feedback", async () => {
    const result = await mockProvider.vision({
      imageDataUrl: "data:image/jpeg;base64,abc",
      taskType: "handwriting"
    });

    expect(`${result.praise}${result.improvement}`).not.toMatch(/%|百分|分数|排名/);
    expect(result.observations.length).toBeGreaterThan(0);
  });
});
