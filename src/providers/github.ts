import { findBySectionNames } from "../orchestrator/specIndex";

export interface BacklogItem {
  title: string;
  body: string;
  type: string;
  epic: string;
  priority: string;
  scope: string;
  dependsOn?: string[];
  // queue property for HYBRID/queue case
  queue?: string;
}

export interface ProjectConfig {
  slug: string; // used for project:<slug> label
  repo: string; // "owner/repo"
  token?: string;
  dryRun?: boolean;
}

export interface CreatedIssue {
  title: string;
  number: number;
  body: string;
  labels: string[];
}

function buildRelevantSpec(
  item: BacklogItem,
  project: ProjectConfig,
): string[] {
  const sections: string[] = ["5.4", "5.5", "5.6", "18.F"]; // base sections
  if (item.type === "HYBRID" || item.queue) {
    sections.push("6.2", "6.3");
  }
  // call specIndex for side effects/indexing; result is ignored if section missing
  findBySectionNames(sections, project.slug);

  const bullets: string[] = [];
  if (sections.includes("6.2") && sections.includes("6.3")) {
    bullets.push("/docs/tech_specs.md §6.2–6.3 (Prioritization & Queue)");
  }
  bullets.push("/docs/tech_specs.md §5.4–5.6 (GitHub mapping & validation)");
  bullets.push("/docs/tech_specs.md §18.F (Scope dictionary)");
  return bullets;
}

async function fetchExisting(
  project: ProjectConfig,
): Promise<{ title: string; number: number }[]> {
  if (project.dryRun) return [];
  const res = await fetch(
    `https://api.github.com/repos/${project.repo}/issues?labels=${encodeURIComponent(
      `project:${project.slug}`,
    )}&state=all&per_page=100`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: project.token ? `token ${project.token}` : undefined,
      },
    },
  );
  const json = (await res.json()) as unknown;
  if (!Array.isArray(json)) return [];
  return (json as { title: string; number: number }[]).map((i) => ({
    title: i.title,
    number: i.number,
  }));
}

export async function createIssues(
  backlog: BacklogItem[],
  project: ProjectConfig,
): Promise<CreatedIssue[]> {
  const existing = await fetchExisting(project);
  const titleToNumber = new Map<string, number>();
  existing.forEach((i) => titleToNumber.set(i.title, i.number));

  const created: CreatedIssue[] = [];
  let nextNumber = existing.length + 1;

  for (const item of backlog) {
    if (titleToNumber.has(item.title)) {
      continue; // idempotent skip
    }

    const labels = [
      `type:${item.type}`,
      `epic:${item.epic}`,
      `priority:${item.priority}`,
      `scope:${item.scope}`,
      `project:${project.slug}`,
    ];

    let body = item.body.trim();
    const deps = (item.dependsOn || [])
      .map((t) => titleToNumber.get(t))
      .filter((n): n is number => typeof n === "number")
      .map((n) => `Depends on #${n}`);
    if (deps.length) {
      body += "\n\n" + deps.join("\n");
    }

    const specBullets = buildRelevantSpec(item, project);
    if (specBullets.length) {
      body +=
        "\n\n### Relevant Spec\n" + specBullets.map((b) => `- ${b}`).join("\n");
    }

    const payload = { title: item.title, body, labels };

    if (project.dryRun) {
      console.log("dry-run:createIssue", JSON.stringify(payload, null, 2));
      titleToNumber.set(item.title, nextNumber);
      created.push({ title: item.title, number: nextNumber, body, labels });
      nextNumber++;
      continue;
    }

    const res = await fetch(
      `https://api.github.com/repos/${project.repo}/issues`,
      {
        method: "POST",
        headers: {
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
          Authorization: project.token ? `token ${project.token}` : undefined,
        },
        body: JSON.stringify(payload),
      },
    );
    const json = await res.json();
    const number = json.number as number;
    titleToNumber.set(item.title, number);
    created.push({ title: item.title, number, body, labels });
  }

  return created;
}

export default { createIssues };
