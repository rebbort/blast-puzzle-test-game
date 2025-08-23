import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import * as path from "path";
import { createHash } from "crypto";

export interface SpecSection {
  id: string;
  title: string;
  startLine: number;
  endLine: number;
  sha256: string;
}

const DEFAULT_SPEC_PATH = path.join(process.cwd(), "docs", "tech_specs.md");

function parseSections(filePath: string): SpecSection[] {
  const content = readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  const sections: SpecSection[] = [];
  let inCode = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed.startsWith("```")) {
      inCode = !inCode;
      continue;
    }
    if (!inCode) {
      const match = /^#{1,3}\s+(.*)$/.exec(trimmed);
      if (match) {
        const headingText = match[1].trim();
        const [id, ...rest] = headingText.split(/\s+/);
        const title = rest.join(" ").trim();
        const section: SpecSection = {
          id,
          title,
          startLine: i + 1,
          endLine: lines.length,
          sha256: "",
        };
        if (sections.length > 0) {
          sections[sections.length - 1].endLine = i;
        }
        sections.push(section);
      }
    }
  }

  sections.forEach((section) => {
    const slice = lines.slice(section.startLine - 1, section.endLine);
    const hash = createHash("sha256").update(slice.join("\n")).digest("hex");
    section.sha256 = hash;
  });

  return sections;
}

export function buildSpecIndex(
  project: string,
  specPath: string = DEFAULT_SPEC_PATH,
): SpecSection[] {
  const sections = parseSections(specPath);
  const dir = path.join(".orchestrator", project);
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "spec-index.json");
  writeFileSync(file, JSON.stringify(sections, null, 2));
  return sections;
}

export function loadSpecIndex(
  project: string,
  specPath: string = DEFAULT_SPEC_PATH,
): SpecSection[] {
  const file = path.join(".orchestrator", project, "spec-index.json");
  if (!existsSync(file)) {
    return buildSpecIndex(project, specPath);
  }
  const raw = readFileSync(file, "utf8");
  return JSON.parse(raw) as SpecSection[];
}

export function findBySectionNames(
  names: string[],
  project: string,
  index?: SpecSection[],
): SpecSection[] {
  const idx = index ?? loadSpecIndex(project);
  return names
    .map((name) => idx.find((s) => s.id === name))
    .filter((s): s is SpecSection => Boolean(s));
}

export function takeExcerpts(
  names: string[],
  opts: { project: string; maxChars: number; specPath?: string },
  index?: SpecSection[],
): string[] {
  const idx = index ?? loadSpecIndex(opts.project, opts.specPath);
  const specPath = opts.specPath ?? DEFAULT_SPEC_PATH;
  const content = readFileSync(specPath, "utf8");
  const lines = content.split("\n");
  return names.map((name) => {
    const section = idx.find((s) => s.id === name);
    if (!section) return "";
    const text = lines.slice(section.startLine - 1, section.endLine).join("\n");
    return text.slice(0, opts.maxChars);
  });
}
