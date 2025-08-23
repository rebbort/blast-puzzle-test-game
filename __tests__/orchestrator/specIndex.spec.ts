import * as path from "path";
import {
  buildSpecIndex,
  loadSpecIndex,
  findBySectionNames,
  takeExcerpts,
} from "../../src/orchestrator/specIndex";

describe("specIndex", () => {
  const project = "test-project";
  const specPath = path.join(__dirname, "../../docs/tech_specs.md");

  it("builds stable hashes for sections", () => {
    const first = buildSpecIndex(project, specPath);
    const second = buildSpecIndex(project, specPath);
    const firstHash = first.find((s) => s.id === "6.2")?.sha256;
    const secondHash = second.find((s) => s.id === "6.2")?.sha256;
    expect(firstHash).toBeDefined();
    expect(firstHash).toEqual(secondHash);
  });

  it("finds sections by names", () => {
    const index = loadSpecIndex(project, specPath);
    const sections = findBySectionNames(["6.2", "9.2", "18.F"], project, index);
    expect(sections.map((s) => s.id)).toEqual(["6.2", "9.2", "18.F"]);
  });

  it("takes excerpts of sections", () => {
    const index = loadSpecIndex(project, specPath);
    const [excerpt] = takeExcerpts(
      ["6.2"],
      { project, maxChars: 50, specPath },
      index,
    );
    expect(excerpt.includes("Gameplay line 1")).toBe(true);
    expect(excerpt.includes("Deep line.")).toBe(false);
    expect(excerpt.length).toBeLessThanOrEqual(50);
  });
});
