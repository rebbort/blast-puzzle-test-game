import {
  createIssues,
  BacklogItem,
  ProjectConfig,
} from "../../src/providers/github";

describe("github provider", () => {
  it("appends Relevant Spec and dependencies", async () => {
    const backlog: BacklogItem[] = [
      {
        title: "Alpha",
        body: "Body A",
        type: "feat",
        epic: "core",
        priority: "P1",
        scope: "src/core",
      },
      {
        title: "Beta",
        body: "Body B",
        type: "HYBRID",
        epic: "core",
        priority: "P2",
        scope: "src/core",
        dependsOn: ["Alpha"],
      },
    ];
    const project: ProjectConfig = {
      slug: "test",
      repo: "owner/repo",
      dryRun: true,
    };
    const issues = await createIssues(backlog, project);
    expect(issues[1].body).toMatchSnapshot();
  });
});
